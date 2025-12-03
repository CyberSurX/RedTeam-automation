import type { Vulnerability } from '../scanning/safe-scanner';

export interface ReportData {
  platform: 'hackerone' | 'bugcrowd' | 'devpost';
  programId: string;
  vulnerability: Vulnerability;
  evidence: string[];
  reporter: {
    name: string;
    email: string;
    username: string;
  };
}

export class ReportGenerator {
  private templates = {
    hackerone: this.getHackerOneTemplate(),
    bugcrowd: this.getBugcrowdTemplate(),
    devpost: this.getDevpostTemplate()
  };

  async generateReport(data: ReportData): Promise<string> {
    const template = this.templates[data.platform] || this.templates.hackerone;
    
    return template
      .replace('{{TITLE}}', data.vulnerability.title)
      .replace('{{DESCRIPTION}}', data.vulnerability.description)
      .replace('{{IMPACT}}', data.vulnerability.impact)
      .replace('{{SEVERITY}}', data.vulnerability.severity)
      .replace('{{CVSS_SCORE}}', data.vulnerability.cvss_score.toString())
      .replace('{{REPRODUCTION_STEPS}}', data.vulnerability.reproduction_steps.map((step: string) => `- ${step}`).join('\n'))
      .replace('{{REMEDIATION}}', data.vulnerability.remediation)
      .replace('{{EVIDENCE}}', data.evidence.map((ev: string) => `- ${ev}`).join('\n'))
      .replace('{{REPORTER_NAME}}', data.reporter.name)
      .replace('{{REPORTER_EMAIL}}', data.reporter.email)
      .replace('{{REPORTER_USERNAME}}', data.reporter.username)
      .replace('{{TIMESTAMP}}', new Date().toISOString());
  }

  private getHackerOneTemplate(): string {
    return `# Vulnerability Report

## Summary
**Title:** {{TITLE}}
**Severity:** {{SEVERITY}} (CVSS: {{CVSS_SCORE}})
**Platform:** HackerOne

## Description
{{DESCRIPTION}}

## Impact
{{IMPACT}}

## Steps to Reproduce
{{REPRODUCTION_STEPS}}

## Evidence
{{EVIDENCE}}

## Remediation
{{REMEDIATION}}

## Reporter Information
- **Name:** {{REPORTER_NAME}}
- **Email:** {{REPORTER_EMAIL}}
- **HackerOne Username:** {{REPORTER_USERNAME}}

---
*Report generated on {{TIMESTAMP}}*
`;
  }

  private getBugcrowdTemplate(): string {
    return `# Bug Bounty Submission

## Vulnerability Details
- **Title:** {{TITLE}}
- **Severity:** {{SEVERITY}}
- **CVSS Score:** {{CVSS_SCORE}}

## Description
{{DESCRIPTION}}

## Impact Assessment
{{IMPACT}}

## Reproduction Steps
{{REPRODUCTION_STEPS}}

## Supporting Evidence
{{EVIDENCE}}

## Fix Recommendation
{{REMEDIATION}}

## Researcher Information
- Researcher: {{REPORTER_NAME}}
- Contact: {{REPORTER_EMAIL}}

---
*Submission date: {{TIMESTAMP}}*
`;
  }

  private getDevpostTemplate(): string {
    return `# Security Hackathon Submission

## Project Details
- **Vulnerability Found:** {{TITLE}}
- **Severity Level:** {{SEVERITY}}
- **CVSS Score:** {{CVSS_SCORE}}

## Technical Description
{{DESCRIPTION}}

## Security Impact
{{IMPACT}}

## How to Reproduce
{{REPRODUCTION_STEPS}}

## Evidence & Screenshots
{{EVIDENCE}}

## Proposed Solution
{{REMEDIATION}}

## Participant Information
- **Name:** {{REPORTER_NAME}}
- **Email:** {{REPORTER_EMAIL}}
- **DevPost Profile:** {{REPORTER_USERNAME}}

---
*Hackathon submission: {{TIMESTAMP}}*
`;
  }

  generateRevenueReport(revenueData: {
    hackerone?: number;
    bugcrowd?: number;
    devpost?: number;
    byType?: Record<string, number>;
    monthlyProjection?: number;
  }): string {
    return `
# Bug Bounty Revenue Report

## Executive Summary
This report summarizes the revenue potential from automated vulnerability discovery across multiple platforms.

## Platform Performance
- **HackerOne:** $${revenueData.hackerone || 0}
- **Bugcrowd:** $${revenueData.bugcrowd || 0}
- **DevPost:** $${revenueData.devpost || 0}

## Vulnerability Categories
${revenueData.byType ? Object.entries(revenueData.byType).map(([type, amount]) => 
  `- **${type}:** $${amount}`
).join('\n') : 'No vulnerability data available'}

## Monthly Projection
Based on current findings, estimated monthly revenue potential: **$${revenueData.monthlyProjection || 0}**

## Recommendations
1. Focus on high-impact vulnerabilities
2. Target programs with higher reward ranges
3. Automate submission process for efficiency
4. Track successful submissions for optimization

---
*Report generated: ${new Date().toISOString()}*
`;
  }
}