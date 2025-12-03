import { exec } from 'child_process';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';
import { logger } from '../utils/logger';

const execAsync = promisify(exec);

export interface ScanConfig {
  target: string;
  scanType: 'port' | 'web' | 'vulnerability' | 'full';
  ports: string;
  intensity: 'light' | 'medium' | 'aggressive';
  tools: string[];
  timeout: number;
  threads: number;
  userId: string;
}

export interface ScanResult {
  openPorts: Array<{
    port: number;
    protocol: string;
    service: string;
    version: string;
    vulnerability?: string;
  }>;
  vulnerabilities: Array<{
    id: string;
    name: string;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    description: string;
    affectedAsset: string;
    proofOfConcept?: string;
    cve?: string;
    cvssScore?: number;
  }>;
  webIssues: Array<{
    url: string;
    risk: string;
    confidence: string;
    description: string;
    solution: string;
  }>;
  sslInfo: Array<{
    host: string;
    port: number;
    protocol: string;
    cipher: string;
    certificate: string;
    vulnerabilities: string[];
  }>;
}

class ScanningService {
  private tools = {
    nmap: process.env.NMAP_PATH || 'nmap',
    zap: process.env.ZAP_PATH || 'zap-cli',
    nuclei: process.env.NUCLEI_PATH || 'nuclei',
    testssl: process.env.TESTSSL_PATH || 'testssl.sh'
  };

  async startScan(programId: string, config: ScanConfig): Promise<string> {
    const jobId = uuidv4();

    try {
      // Create job in database
      await query(
        `INSERT INTO jobs (id, user_id, program_id, job_type, status, parameters) 
         VALUES ($1, $2, $3, 'scanning', 'pending', $4)`,
        [jobId, config.userId, programId, JSON.stringify(config)]
      );

      // Add to job queue
      const { addJob } = await import('./jobQueue');
      await addJob('scanning', {
        jobId,
        programId,
        config
      });

      logger.info(`Scanning job ${jobId} queued for program ${programId}`);
      return jobId;
    } catch (error) {
      logger.error(`Failed to start scanning job: ${error}`);
      throw error;
    }
  }

  async executeScanning(jobId: string, config: ScanConfig): Promise<ScanResult> {
    const results: ScanResult = {
      openPorts: [],
      vulnerabilities: [],
      webIssues: [],
      sslInfo: []
    };

    try {
      await this.updateJobStatus(jobId, 'running');

      // Port scanning with nmap
      if (config.tools.includes('nmap') && (config.scanType === 'port' || config.scanType === 'full')) {
        const portResults = await this.runNmap(config.target, config.ports, config.intensity);
        results.openPorts = portResults;
      }

      // Vulnerability scanning with nuclei
      if (config.tools.includes('nuclei') && (config.scanType === 'vulnerability' || config.scanType === 'full')) {
        const vulnResults = await this.runNuclei(config.target, config.intensity);
        results.vulnerabilities = vulnResults as any;
      }

      // Web application scanning with OWASP ZAP
      if (config.tools.includes('zap') && (config.scanType === 'web' || config.scanType === 'full')) {
        const webResults = await this.runZap(config.target);
        results.webIssues = webResults;
      }

      // SSL/TLS testing
      if (config.tools.includes('testssl') && results.openPorts.some(p => p.port === 443)) {
        const sslResults = await this.runTestSSL(config.target);
        results.sslInfo = sslResults;
      }

      // Save results
      await this.saveScanResults(jobId, results);
      await this.updateJobStatus(jobId, 'completed');

      logger.info(`Scanning job ${jobId} completed successfully`);
      return results;
    } catch (error) {
      await this.updateJobStatus(jobId, 'failed');
      logger.error(`Scanning job ${jobId} failed:`, error);
      throw error;
    }
  }

  private async runNmap(target: string, ports: string, intensity: string): Promise<Array<{ port: number, protocol: string, service: string, version: string }>> {
    try {
      const intensityFlags = {
        light: '-sS',
        medium: '-sS -sV',
        aggressive: '-sS -sV -sC --script vuln'
      };

      const command = `${this.tools.nmap} ${(intensityFlags as any)[intensity]} -p ${ports} ${target} -oX -`;
      const { stdout } = await execAsync(command, { timeout: 600000 }); // 10 minutes

      // Parse XML output
      const results = this.parseNmapXML(stdout);
      return results;
    } catch (error) {
      logger.error(`Nmap error: ${error}`);
      return [];
    }
  }

  private parseNmapXML(xmlOutput: string): Array<{ port: number, protocol: string, service: string, version: string }> {
    const results: Array<{ port: number, protocol: string, service: string, version: string }> = [];

    try {
      // Simple XML parsing for port information
      const portMatches = xmlOutput.match(/<port[^>]*>/g);
      if (portMatches) {
        for (const match of portMatches) {
          const portMatch = match.match(/portid="(\d+)"/);
          const protocolMatch = match.match(/protocol="(\w+)"/);

          if (portMatch && protocolMatch) {
            const port = parseInt(portMatch[1]);
            const protocol = protocolMatch[1];

            // Extract service information
            const serviceMatch = xmlOutput.match(new RegExp(`<service[^>]*name="([^"]*)"[^>]*version="([^"]*)"`));
            const service = serviceMatch ? serviceMatch[1] : 'unknown';
            const version = serviceMatch ? serviceMatch[2] : 'unknown';

            results.push({ port, protocol, service, version });
          }
        }
      }
    } catch (error) {
      logger.error(`Error parsing Nmap XML: ${error}`);
    }

    return results;
  }

  private async runNuclei(target: string, intensity: string): Promise<Array<{ id: string, name: string, severity: string, description: string, affectedAsset: string, cve?: string, cvssScore?: number }>> {
    try {
      const intensityFlags = {
        light: '-severity info,low',
        medium: '-severity low,medium',
        aggressive: '-severity medium,high,critical'
      };

      const command = `${this.tools.nuclei} -u ${target} ${(intensityFlags as any)[intensity]} -json -silent`;
      const { stdout } = await execAsync(command, { timeout: 900000 }); // 15 minutes

      const results: Array<{ id: string, name: string, severity: string, description: string, affectedAsset: string, cve?: string, cvssScore?: number }> = [];

      // Parse JSON output
      const lines = stdout.split('\n').filter(line => line.trim());
      for (const line of lines) {
        try {
          const vuln = JSON.parse(line);
          results.push({
            id: vuln.templateID || vuln.info?.name?.toLowerCase().replace(/\s+/g, '_') || 'unknown',
            name: vuln.info?.name || 'Unknown Vulnerability',
            severity: this.mapSeverity(vuln.info?.severity || 'info'),
            description: vuln.info?.description || vuln.matched || 'No description available',
            affectedAsset: vuln.host || target,
            cve: vuln.info?.classification?.cve_id,
            cvssScore: vuln.info?.classification?.cvss_score
          });
        } catch (error) {
          logger.error(`Error parsing nuclei output: ${error}`);
        }
      }

      return results;
    } catch (error) {
      logger.error(`Nuclei error: ${error}`);
      return [];
    }
  }

  private async runZap(target: string): Promise<Array<{ url: string, risk: string, confidence: string, description: string, solution: string }>> {
    try {
      // Start ZAP scan
      const startCommand = `${this.tools.zap} quick-scan --self-contained ${target}`;
      await execAsync(startCommand, { timeout: 1800000 }); // 30 minutes

      // Get scan results
      const resultsCommand = `${this.tools.zap} alerts`;
      const { stdout } = await execAsync(resultsCommand, { timeout: 60000 });

      const results: Array<{ url: string, risk: string, confidence: string, description: string, solution: string }> = [];

      // Parse alerts output (simplified parsing)
      const lines = stdout.split('\n');
      for (const line of lines) {
        if (line.includes('Risk:')) {
          const parts = line.split('\\t'); // ZAP uses tab separation
          if (parts.length >= 4) {
            results.push({
              url: target,
              risk: parts[0].replace('Risk:', '').trim(),
              confidence: parts[1].replace('Confidence:', '').trim(),
              description: parts[2].trim(),
              solution: parts[3].trim()
            });
          }
        }
      }

      return results;
    } catch (error) {
      logger.error(`ZAP error: ${error}`);
      return [];
    }
  }

  private async runTestSSL(target: string): Promise<Array<{ host: string, port: number, protocol: string, cipher: string, certificate: string, vulnerabilities: string[] }>> {
    try {
      const command = `${this.tools.testssl} --jsonfile /tmp/ssl_results.json ${target}:443`;
      await execAsync(command, { timeout: 600000 }); // 10 minutes

      // Read results from JSON file
      const fs = require('fs');
      const sslResults = JSON.parse(fs.readFileSync('/tmp/ssl_results.json', 'utf8'));

      // Clean up temp file
      fs.unlinkSync('/tmp/ssl_results.json');

      const results: Array<{ host: string, port: number, protocol: string, cipher: string, certificate: string, vulnerabilities: string[] }> = [];

      if (sslResults && sslResults.length > 0) {
        for (const finding of sslResults) {
          results.push({
            host: target,
            port: 443,
            protocol: finding.protocol || 'TLS',
            cipher: finding.cipher || 'unknown',
            certificate: finding.certificate || 'unknown',
            vulnerabilities: finding.vulnerabilities || []
          });
        }
      }

      return results;
    } catch (error) {
      logger.error(`TestSSL error: ${error}`);
      return [];
    }
  }

  private mapSeverity(severity: string): 'critical' | 'high' | 'medium' | 'low' | 'info' {
    const severityMap = {
      'critical': 'critical' as const,
      'high': 'high' as const,
      'medium': 'medium' as const,
      'low': 'low' as const,
      'info': 'info' as const
    };

    return (severityMap as any)[severity.toLowerCase()] || 'info';
  }

  private async saveScanResults(jobId: string, results: ScanResult): Promise<void> {
    try {
      // Save vulnerabilities as findings
      for (const vuln of results.vulnerabilities) {
        await query(
          `INSERT INTO findings (program_id, job_id, vulnerability_type, severity, title, description, proof_of_concept, affected_asset, cvss_score, cve_id, discovered_at)
           SELECT program_id, $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()
           FROM jobs WHERE id = $1`,
          [jobId, vuln.id, vuln.severity, vuln.name, vuln.description, vuln.proofOfConcept, vuln.affectedAsset, vuln.cvssScore, vuln.cve]
        );
      }

      // Save web issues as findings
      for (const issue of results.webIssues) {
        await query(
          `INSERT INTO findings (program_id, job_id, vulnerability_type, severity, title, description, proof_of_concept, affected_asset, discovered_at)
           SELECT program_id, $1, 'web_vulnerability', $2, $3, $4, $5, $6, NOW()
           FROM jobs WHERE id = $1`,
          [jobId, this.mapWebRisk(issue.risk), issue.description, issue.solution, issue.url, issue.url]
        );
      }

      logger.info(`Scan results saved for job ${jobId}`);
    } catch (error) {
      logger.error(`Failed to save scan results: ${error}`);
      throw error;
    }
  }

  private mapWebRisk(risk: string): 'critical' | 'high' | 'medium' | 'low' | 'info' {
    const riskMap = {
      'high': 'high' as const,
      'medium': 'medium' as const,
      'low': 'low' as const,
      'informational': 'info' as const
    };

    return (riskMap as any)[risk.toLowerCase()] || 'info';
  }

  private async updateJobStatus(jobId: string, status: string): Promise<void> {
    try {
      await query(
        'UPDATE jobs SET status = $1, updated_at = NOW() WHERE id = $2',
        [status, jobId]
      );
    } catch (error) {
      logger.error(`Failed to update job status: ${error}`);
    }
  }

  async getScanResults(jobId: string): Promise<ScanResult | null> {
    try {
      const result = await query(
        'SELECT results FROM jobs WHERE id = $1',
        [jobId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return (result.rows[0] as any).results;
    } catch (error) {
      logger.error(`Failed to get scan results: ${error}`);
      return null;
    }
  }
}

export const scanningService = new ScanningService();