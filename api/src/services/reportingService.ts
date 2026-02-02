/* eslint-disable @typescript-eslint/no-explicit-any */
import { query } from '../config/database';
import { logger } from '../utils/logger';
import axios from 'axios';

export interface ReportConfig {
  platform: 'hackerone' | 'bugcrowd' | 'yeswehack' | 'intigriti' | 'custom';
  template: string;
  findings: string[];
  autoSubmit: boolean;
  draftMode: boolean;
  includeProofOfConcept: boolean;
  includeTechnicalDetails: boolean;
  severityFilter: string[];
  customFields: Record<string, string | number | boolean | null>;
}

export interface ReportResult {
  reports: Array<{
    id: string;
    platform: string;
    title: string;
    severity: string;
    status: 'draft' | 'submitted' | 'published' | 'rejected' | 'resolved';
    platformReportId?: string;
    url?: string;
    submittedAt?: string;
    response?: string;
    bountyAmount?: number;
    currency?: string;
  }>;
  statistics: {
    total: number;
    submitted: number;
    drafts: number;
    resolved: number;
    totalBounty: number;
  };
  errors: Array<{
    findingId: string;
    error: string;
  }>;
}

class ReportingService {
  private platformConfigs = {
    hackerone: {
      apiUrl: 'https://api.hackerone.com/v1',
      requiresApiKey: true,
      supportsAutoSubmit: true
    },
    bugcrowd: {
      apiUrl: 'https://api.bugcrowd.com',
      requiresApiKey: true,
      supportsAutoSubmit: true
    },
    yeswehack: {
      apiUrl: 'https://api.yeswehack.com',
      requiresApiKey: true,
      supportsAutoSubmit: true
    },
    intigriti: {
      apiUrl: 'https://api.intigriti.com',
      requiresApiKey: true,
      supportsAutoSubmit: true
    },
    custom: {
      apiUrl: '',
      requiresApiKey: false,
      supportsAutoSubmit: false
    }
  };

  private reportTemplates = {
    sql_injection: {
      title: 'SQL Injection in {parameter} parameter',
      description: `A SQL injection vulnerability was discovered in the {parameter} parameter of the {endpoint} endpoint.

**Vulnerability Details:**
- Type: SQL Injection
- Severity: {severity}
- Affected Parameter: {parameter}
- Endpoint: {endpoint}

**Proof of Concept:**
{proof_of_concept}

**Technical Details:**
{technical_details}

**Impact:**
This vulnerability could allow an attacker to:
- Extract sensitive data from the database
- Modify or delete database contents
- Execute administrative operations on the database
- In some cases, execute commands on the operating system

**Recommendation:**
Use parameterized queries (prepared statements) instead of string concatenation to build SQL queries. Validate and sanitize all user input.`,
      severity: 'critical'
    },
    xss: {
      title: 'Cross-Site Scripting (XSS) in {parameter} parameter',
      description: `A cross-site scripting vulnerability was discovered in the {parameter} parameter.

**Vulnerability Details:**
- Type: Cross-Site Scripting (XSS)
- Severity: {severity}
- Affected Parameter: {parameter}

**Proof of Concept:**
{proof_of_concept}

**Impact:**
This vulnerability could allow an attacker to:
- Execute arbitrary JavaScript code in the victim's browser
- Steal session cookies and authentication tokens
- Perform actions on behalf of the victim
- Deface the website or redirect users to malicious sites

**Recommendation:**
Encode all user input before rendering it in the browser. Implement Content Security Policy (CSP) headers. Use context-aware output encoding.`,
      severity: 'high'
    },
    idor: {
      title: 'Insecure Direct Object Reference (IDOR) in {parameter} parameter',
      description: `An insecure direct object reference vulnerability was discovered in the {parameter} parameter.

**Vulnerability Details:**
- Type: Insecure Direct Object Reference (IDOR)
- Severity: {severity}
- Affected Parameter: {parameter}

**Proof of Concept:**
{proof_of_concept}

**Impact:**
This vulnerability could allow an attacker to:
- Access unauthorized resources
- View or modify other users' data
- Bypass access controls
- Escalate privileges

**Recommendation:**
Implement proper authorization checks for all resource access. Use indirect object references instead of direct ones. Validate that users have permission to access requested resources.`,
      severity: 'high'
    },
    default: {
      title: '{vulnerability_type} in {affected_asset}',
      description: `A security vulnerability was discovered in {affected_asset}.

**Vulnerability Details:**
- Type: {vulnerability_type}
- Severity: {severity}
- Affected Asset: {affected_asset}

**Description:**
{description}

**Proof of Concept:**
{proof_of_concept}

**Recommendation:**
{recommendation}`,
      severity: 'medium'
    }
  };

  async generateReports(jobId: string, findings: string[], config: ReportConfig): Promise<ReportResult> {
    const result: ReportResult = {
      reports: [],
      statistics: {
        total: 0,
        submitted: 0,
        drafts: 0,
        resolved: 0,
        totalBounty: 0
      },
      errors: []
    };

    try {
      // Get findings details
      const findingsResult = await query(
        `SELECT f.*, p.name as program_name, p.platform as program_platform
         FROM findings f
         JOIN programs p ON f.program_id = p.id
         WHERE f.id = ANY($1) AND f.status = 'confirmed'
         AND f.severity = ANY($2)`,
        [findings, config.severityFilter]
      );

      const findingsData = findingsResult.rows as Array<{
        id: string;
        program_id: string;
        vulnerability_type: string;
        severity: string;
        title: string;
        description: string;
        proof_of_concept?: string;
        technical_details?: string;
        affected_asset: string;
        cvss_score?: number;
        cwe_id?: string;
        program_name: string;
        program_platform: string;
        [key: string]: unknown;
      }>;
      result.statistics.total = findingsData.length;

      // Process each finding
      for (const finding of findingsData) {
        try {
          const report = await this.generateSingleReport(finding, config);

          if (config.autoSubmit && config.platform !== 'custom') {
            const submittedReport = await this.submitToPlatform(report, config);
            result.reports.push(submittedReport);
            result.statistics.submitted++;

            if ((submittedReport as { status: string }).status === 'resolved') {
              result.statistics.resolved++;
              const bountyAmount = (submittedReport as { bountyAmount?: number }).bountyAmount;
              if (bountyAmount) {
                result.statistics.totalBounty += bountyAmount;
              }
            }
          } else {
            // Save as draft
            const draftReport = await this.saveDraftReport(report, config);
            result.reports.push(draftReport);
            result.statistics.drafts++;
          }
        } catch (error) {
          result.errors.push({
            findingId: finding.id,
            error: error instanceof Error ? error.message : String(error)
          });
          logger.error(`Failed to generate report for finding ${finding.id}:`, error);
        }
      }

      // Log reporting completion
      logger.info(`Report generation completed for job ${jobId}`, {
        total: result.statistics.total,
        submitted: result.statistics.submitted,
        drafts: result.statistics.drafts,
        totalBounty: result.statistics.totalBounty
      });

      return result;
    } catch (error) {
      logger.error(`Report generation failed for job ${jobId}:`, error);
      throw error;
    }
  }

  private async generateSingleReport(finding: any, config: ReportConfig): Promise<any> {
    const template = this.getReportTemplate(finding.vulnerability_type);

    // Fill template with finding data
    const title = this.fillTemplate(template.title, finding);
    const description = this.fillTemplate(template.description, finding);

    const report = {
      id: finding.id,
      platform: config.platform,
      title,
      severity: template.severity,
      description,
      affectedAsset: finding.affected_asset,
      vulnerabilityType: finding.vulnerability_type,
      proofOfConcept: config.includeProofOfConcept ? finding.proof_of_concept : null,
      technicalDetails: config.includeTechnicalDetails ? finding.technical_details : null,
      cvssScore: finding.cvss_score,
      cweId: finding.cwe_id,
      customFields: config.customFields,
      status: 'draft' as const,
      createdAt: new Date().toISOString()
    };

    return report;
  }

  private getReportTemplate(vulnerabilityType: string): { title: string; description: string; severity: string } {
    const templates = this.reportTemplates as Record<string, { title: string; description: string; severity: string }>;
    return templates[vulnerabilityType] || templates.default;
  }

  private fillTemplate(template: string, finding: any): string {
    return template
      .replace(/\{vulnerability_type\}/g, finding.vulnerability_type || 'Unknown')
      .replace(/\{severity\}/g, finding.severity || 'medium')
      .replace(/\{title\}/g, finding.title || 'Untitled')
      .replace(/\{description\}/g, finding.description || 'No description available')
      .replace(/\{proof_of_concept\}/g, finding.proof_of_concept || 'No proof of concept available')
      .replace(/\{technical_details\}/g, finding.technical_details || 'No technical details available')
      .replace(/\{affected_asset\}/g, finding.affected_asset || 'Unknown')
      .replace(/\{parameter\}/g, finding.affected_asset || 'unknown')
      .replace(/\{endpoint\}/g, finding.affected_asset || 'unknown')
      .replace(/\{recommendation\}/g, 'Please consult with security team for remediation advice');
  }

  private async submitToPlatform(report: any, config: ReportConfig): Promise<any> {
    if (!this.platformConfigs[config.platform].supportsAutoSubmit) {
      return { ...report, status: 'draft' as const };
    }

    try {
      // Get API credentials from database
      const apiKeyResult = await query(
        'SELECT key_preview, permissions FROM api_keys WHERE user_id = $1 AND name LIKE $2 AND is_active = true',
        [report.userId, `%${config.platform}%`]
      );

      if (apiKeyResult.rows.length === 0) {
        throw new Error(`No API key configured for ${config.platform}`);
      }

      const apiKey = apiKeyResult.rows[0];
      // platformConfig is kept for reference to valid platforms
      void this.platformConfigs[config.platform];

      let response;
      switch (config.platform) {
        case 'hackerone':
          response = await this.submitToHackerOne(report, apiKey, config);
          break;
        case 'bugcrowd':
          response = await this.submitToBugcrowd(report, apiKey, config);
          break;
        case 'yeswehack':
          response = await this.submitToYesWeHack(report, apiKey, config);
          break;
        case 'intigriti':
          response = await this.submitToIntigriti(report, apiKey, config);
          break;
        default:
          throw new Error(`Unsupported platform: ${config.platform}`);
      }

      return response;
    } catch (error) {
      logger.error(`Failed to submit report to ${config.platform}:`, error);
      throw error;
    }
  }

  private async submitToHackerOne(report: any, apiKey: any): Promise<any> {
    try {
      const response = await axios.post(
        `${this.platformConfigs.hackerone.apiUrl}/reports`,
        {
          data: {
            type: 'report',
            attributes: {
              title: report.title,
              vulnerability_information: report.description,
              severity_rating: report.severity,
              source: 'api'
            }
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey.key_preview}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        ...report,
        status: 'submitted' as const,
        platformReportId: response.data.data.id,
        url: `https://hackerone.com/reports/${response.data.data.id}`,
        submittedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('HackerOne submission error:', error);
      throw new Error(`HackerOne submission failed: ${error.message}`);
    }
  }

  private async submitToBugcrowd(report: any, apiKey: any): Promise<any> {
    try {
      const response = await axios.post(
        `${this.platformConfigs.bugcrowd.apiUrl}/submissions`,
        {
          title: report.title,
          description: report.description,
          severity: report.severity,
          vulnerability_type: report.vulnerabilityType,
          affected_target: report.affectedAsset
        },
        {
          headers: {
            'Authorization': `Token ${apiKey.key_preview}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        ...report,
        status: 'submitted' as const,
        platformReportId: response.data.uuid,
        url: `https://bugcrowd.com/submissions/${response.data.uuid}`,
        submittedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Bugcrowd submission error:', error);
      throw new Error(`Bugcrowd submission failed: ${error.message}`);
    }
  }

  private async submitToYesWeHack(report: any, apiKey: any): Promise<any> {
    try {
      const response = await axios.post(
        `${this.platformConfigs.yeswehack.apiUrl}/reports`,
        {
          title: report.title,
          description: report.description,
          severity: report.severity,
          bug_type: report.vulnerabilityType,
          scope: report.affectedAsset
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey.key_preview}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        ...report,
        status: 'submitted' as const,
        platformReportId: response.data.id,
        url: `https://yeswehack.com/reports/${response.data.id}`,
        submittedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('YesWeHack submission error:', error);
      throw new Error(`YesWeHack submission failed: ${error.message}`);
    }
  }

  private async submitToIntigriti(report: any, apiKey: any): Promise<any> {
    try {
      const response = await axios.post(
        `${this.platformConfigs.intigriti.apiUrl}/submissions`,
        {
          title: report.title,
          description: report.description,
          severity: report.severity,
          type: report.vulnerabilityType,
          endpoint: report.affectedAsset
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey.key_preview}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        ...report,
        status: 'submitted' as const,
        platformReportId: response.data.id,
        url: `https://intigriti.com/submissions/${response.data.id}`,
        submittedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Intigriti submission error:', error);
      throw new Error(`Intigriti submission failed: ${error.message}`);
    }
  }

  private async saveDraftReport(report: any): Promise<any> {
    try {
      // Save to database as draft
      const result = await query(
        `INSERT INTO reports (finding_id, platform, title, description, severity, status, custom_fields)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          report.id,
          report.platform,
          report.title,
          report.description,
          report.severity,
          'draft',
          JSON.stringify(report.customFields)
        ]
      );

      return {
        ...report,
        id: (result.rows[0] as any).id,
        status: 'draft' as const,
        createdAt: (result.rows[0] as any).created_at
      };
    } catch (error) {
      logger.error('Failed to save draft report:', error);
      throw error;
    }
  }

  async getReportStatus(reportId: string): Promise<any> {
    try {
      const result = await query(
        `SELECT r.*, f.title as finding_title, f.affected_asset
         FROM reports r
         JOIN findings f ON r.finding_id = f.id
         WHERE r.id = $1`,
        [reportId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      logger.error(`Failed to get report status for ${reportId}:`, error);
      return null;
    }
  }

  async updateReportStatus(reportId: string, status: string, response?: string, bountyAmount?: number): Promise<void> {
    try {
      await query(
        `UPDATE reports 
         SET status = $1, platform_response = $2, bounty_amount = $3, resolved_at = CASE WHEN $1 = 'resolved' THEN NOW() ELSE resolved_at END
         WHERE id = $4`,
        [status, response, bountyAmount, reportId]
      );

      logger.info(`Report ${reportId} status updated to ${status}`);
    } catch (error) {
      logger.error(`Failed to update report status for ${reportId}:`, error);
      throw error;
    }
  }

  async getReportingAnalytics(userId: string, programId?: string): Promise<any> {
    try {
      const programFilter = programId ? 'AND p.id = $2' : '';
      const params = programId ? [userId, programId] : [userId];

      const result = await query(
        `SELECT 
           r.platform,
           r.status,
           COUNT(*) as count,
           SUM(r.bounty_amount) as total_bounty,
           AVG(r.bounty_amount) as avg_bounty,
           MIN(r.created_at) as first_report,
           MAX(r.created_at) as last_report
         FROM reports r
         JOIN findings f ON r.finding_id = f.id
         JOIN jobs j ON f.job_id = j.id
         JOIN programs p ON j.program_id = p.id
         WHERE p.user_id = $1 ${programFilter}
         GROUP BY r.platform, r.status
         ORDER BY count DESC`,
        params
      );

      const platformStats = await query(
        `SELECT 
           r.platform,
           COUNT(*) as total_reports,
           COUNT(CASE WHEN r.status = 'resolved' THEN 1 END) as resolved_reports,
           SUM(r.bounty_amount) as total_bounty,
           AVG(CASE WHEN r.status = 'resolved' THEN r.bounty_amount END) as avg_bounty
         FROM reports r
         JOIN findings f ON r.finding_id = f.id
         JOIN jobs j ON f.job_id = j.id
         JOIN programs p ON j.program_id = p.id
         WHERE p.user_id = $1 ${programFilter}
         GROUP BY r.platform`,
        params
      );

      return {
        summary: result.rows,
        platformStats: platformStats.rows,
        totalReports: result.rows.reduce((sum: number, row: any) => sum + parseInt(row.count), 0),
        totalBounty: result.rows.reduce((sum: number, row: any) => sum + (parseFloat(row.total_bounty) || 0), 0),
        resolutionRate: this.calculateResolutionRate(result.rows)
      };
    } catch (error) {
      logger.error(`Failed to get reporting analytics:`, error);
      throw error;
    }
  }

  private calculateResolutionRate(rows: any[]): number {
    const resolved = rows.filter(row => row.status === 'resolved').reduce((sum, row) => sum + parseInt(row.count), 0);
    const total = rows.reduce((sum, row) => sum + parseInt(row.count), 0);
    return total > 0 ? (resolved / total) * 100 : 0;
  }
}

export const reportingService = new ReportingService();
