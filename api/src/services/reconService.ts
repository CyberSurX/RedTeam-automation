// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
import { exec } from 'child_process';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';
import { addJob } from './jobQueue';
import { logger } from '../utils/logger';
import fs from 'fs';

const execAsync = promisify(exec);

export interface ReconConfig {
  target: string;
  domain: string;
  tools: string[];
  depth: number;
  timeout: number;
  threads: number;
  outputFormat: 'json' | 'txt' | 'xml';
  userId: string;
}

export interface ReconResult {
  subdomains: string[];
  openPorts: Array<{
    host: string;
    port: number;
    service: string;
    version: string;
  }>;
  technologies: Array<{
    name: string;
    version: string;
    confidence: number;
  }>;
  endpoints: Array<{
    url: string;
    method: string;
    status: number;
    title: string;
  }>;
  screenshots: string[];
  dnsRecords: Array<{
    type: string;
    name: string;
    value: string;
    ttl: number;
  }>;
}

class ReconService {
  private tools = {
    amass: process.env.AMASS_PATH || 'amass',
    subfinder: process.env.SUBFINDER_PATH || 'subfinder',
    httpx: process.env.HTTPX_PATH || 'httpx',
    naabu: process.env.NAABU_PATH || 'naabu',
    wappalyzer: process.env.WAPPALYZER_PATH || 'wappalyzer'
  };

  async startRecon(programId: string, config: ReconConfig): Promise<string> {
    const jobId = uuidv4();

    try {
      // Create job in database
      await query(
        `INSERT INTO jobs (id, user_id, program_id, job_type, status, parameters) 
         VALUES ($1, $2, $3, 'recon', 'pending', $4)`,
        [jobId, config.userId, programId, JSON.stringify(config)]
      );

      // Add to job queue
      await addJob('recon', {
        jobId,
        programId,
        config
      });

      logger.info(`Recon job ${jobId} queued for program ${programId}`);
      return jobId;
    } catch (error) {
      logger.error(`Failed to start recon job: ${error}`);
      throw error;
    }
  }

  async executeRecon(jobId: string, config: ReconConfig): Promise<ReconResult> {
    const results: ReconResult = {
      subdomains: [],
      openPorts: [],
      technologies: [],
      endpoints: [],
      screenshots: [],
      dnsRecords: []
    };

    try {
      await this.updateJobStatus(jobId, 'running');

      // Run subdomain enumeration
      if (config.tools.includes('subfinder')) {
        const subdomains = await this.runSubfinder(config.domain, config.threads);
        results.subdomains = [...new Set([...results.subdomains, ...subdomains])];
      }

      if (config.tools.includes('amass')) {
        const subdomains = await this.runAmass(config.domain, config.depth, config.timeout);
        results.subdomains = [...new Set([...results.subdomains, ...subdomains])];
      }

      // Run port scanning on discovered subdomains
      if (config.tools.includes('naabu') && results.subdomains.length > 0) {
        const ports = await this.runNaabu(results.subdomains.slice(0, 10), config.threads);
        results.openPorts = ports;
      }

      // Run HTTP probing
      if (config.tools.includes('httpx') && results.subdomains.length > 0) {
        const endpoints = await this.runHttpx(results.subdomains, config.threads);
        results.endpoints = endpoints;
      }

      // Run technology detection
      if (config.tools.includes('wappalyzer') && results.endpoints.length > 0) {
        const technologies = await this.runWappalyzer(results.endpoints.slice(0, 5));
        results.technologies = technologies;
      }

      // Save results
      await this.saveReconResults(jobId, results);
      await this.updateJobStatus(jobId, 'completed');

      logger.info(`Recon job ${jobId} completed successfully`);
      return results;
    } catch (error) {
      await this.updateJobStatus(jobId, 'failed');
      logger.error(`Recon job ${jobId} failed: ${error}`);
      throw error;
    }
  }

  private async runSubfinder(domain: string, threads: number): Promise<string[]> {
    try {
      const command = `${this.tools.subfinder} -d ${domain} -t ${threads} -silent`;
      const { stdout } = await execAsync(command, { timeout: 300000 }); // 5 minutes

      return stdout.split('\n')
        .map(line => line.trim())
        .filter(line => line && line.includes('.'));
    } catch (error) {
      logger.error(`Subfinder error: ${error}`);
      return [];
    }
  }

  private async runAmass(domain: string, depth: number, timeout: number): Promise<string[]> {
    try {
      const command = `${this.tools.amass} enum -d ${domain} -max-depth ${depth} -timeout ${timeout} -silent`;
      const { stdout } = await execAsync(command, { timeout: (timeout + 60) * 1000 });

      return stdout.split('\n')
        .map(line => line.trim())
        .filter(line => line && line.includes('.'));
    } catch (error) {
      logger.error(`Amass error: ${error}`);
      return [];
    }
  }

  private async runNaabu(hosts: string[], threads: number): Promise<Array<{ host: string, port: number, service: string, version: string }>> {
    try {
      const hostsFile = `/tmp/hosts_${Date.now()}.txt`;
      fs.writeFileSync(hostsFile, hosts.join('\n'));

      const command = `${this.tools.naabu} -list ${hostsFile} -t ${threads} -silent -json`;
      const { stdout } = await execAsync(command, { timeout: 600000 }); // 10 minutes

      // Clean up temp file
      fs.unlinkSync(hostsFile);

      const results = stdout.split('\n')
        .filter(line => line.trim())
        .map(line => {
          try {
            const data = JSON.parse(line);
            return {
              host: data.ip || data.host,
              port: parseInt(data.port),
              service: data.service || 'unknown',
              version: data.version || 'unknown'
            };
          } catch {
            return null;
          }
        })
        .filter(result => result !== null);

      return results;
    } catch (error) {
      logger.error(`Naabu error: ${error}`);
      return [];
    }
  }

  private async runHttpx(hosts: string[], threads: number): Promise<Array<{ url: string, method: string, status: number, title: string }>> {
    try {
      const hostsFile = `/tmp/hosts_${Date.now()}.txt`;
      fs.writeFileSync(hostsFile, hosts.join('\n'));

      const command = `${this.tools.httpx} -list ${hostsFile} -t ${threads} -silent -json -title`;
      const { stdout } = await execAsync(command, { timeout: 600000 }); // 10 minutes

      // Clean up temp file
      fs.unlinkSync(hostsFile);

      const results = stdout.split('\n')
        .filter(line => line.trim())
        .map(line => {
          try {
            const data = JSON.parse(line);
            return {
              url: data.url,
              method: data.method || 'GET',
              status: data.status_code || 0,
              title: data.title || ''
            };
          } catch {
            return null;
          }
        })
        .filter(result => result !== null);

      return results;
    } catch (error) {
      logger.error(`Httpx error: ${error}`);
      return [];
    }
  }

  private async runWappalyzer(urls: Array<{ url: string }>): Promise<Array<{ name: string, version: string, confidence: number }>> {
    try {
      const technologies: Array<{ name: string, version: string, confidence: number }> = [];

      for (const url of urls.slice(0, 3)) { // Limit to 3 URLs to avoid timeout
        try {
          const command = `${this.tools.wappalyzer} ${url.url} --json`;
          const { stdout } = await execAsync(command, { timeout: 60000 }); // 1 minute per URL

          const data = JSON.parse(stdout);
          if (data.technologies) {
            technologies.push(...data.technologies.map((tech: any) => ({
              name: tech.name,
              version: tech.version || 'unknown',
              confidence: tech.confidence || 0
            })));
          }
        } catch (error) {
          logger.error(`Wappalyzer error for ${url.url}: ${error}`);
        }
      }

      return technologies;
    } catch (error) {
      logger.error(`Wappalyzer error: ${error}`);
      return [];
    }
  }

  private async saveReconResults(jobId: string, results: ReconResult): Promise<void> {
    try {
      // Save subdomains as findings
      for (const subdomain of results.subdomains) {
        await query(
          `INSERT INTO findings (program_id, job_id, vulnerability_type, severity, title, description, affected_asset, discovered_at)
           SELECT program_id, $1, 'information_disclosure', 'info', 'Discovered Subdomain', $2, $3, NOW()
           FROM jobs WHERE id = $1`,
          [jobId, `Subdomain discovered: ${subdomain}`, subdomain]
        );
      }

      // Save open ports as findings
      for (const port of results.openPorts) {
        await query(
          `INSERT INTO findings (program_id, job_id, vulnerability_type, severity, title, description, affected_asset, discovered_at)
           SELECT program_id, $1, 'open_port', 'info', 'Open Port Discovered', $2, $3, NOW()
           FROM jobs WHERE id = $1`,
          [jobId, `Port ${port.port} is open on ${port.host} (${port.service})`, `${port.host}:${port.port}`]
        );
      }

      // Save technologies as findings
      for (const tech of results.technologies) {
        await query(
          `INSERT INTO findings (program_id, job_id, vulnerability_type, severity, title, description, affected_asset, discovered_at)
           SELECT program_id, $1, 'technology_detection', 'info', 'Technology Identified', $2, $3, NOW()
           FROM jobs WHERE id = $1`,
          [jobId, `Technology detected: ${tech.name} ${tech.version} (confidence: ${tech.confidence}%)`, 'Web Application']
        );
      }

      logger.info(`Recon results saved for job ${jobId}`);
    } catch (error) {
      logger.error(`Failed to save recon results: ${error}`);
      throw error;
    }
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

  async getReconResults(jobId: string): Promise<ReconResult | null> {
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
      logger.error(`Failed to get recon results: ${error}`);
      return null;
    }
  }
}

export const reconService = new ReconService();