import { Finding } from '../entities/Finding.js';

export class ExportService {
  /**
   * Generates a CSV string from an array of findings
   */
  static toCSV(findings: Finding[]): string {
    if (findings.length === 0) return '';

    const headers = [
      'ID',
      'Title',
      'Severity',
      'Status',
      'Type',
      'Program',
      'Affected Asset',
      'CVSS Score',
      'Created At',
      'CWE ID'
    ];

    const rows = findings.map(f => [
      f.id,
      `"${f.title.replace(/"/g, '""')}"`,
      f.severity,
      f.status,
      f.type,
      `"${f.program?.name?.replace(/"/g, '""') || 'N/A'}"`,
      `"${String(f.affected_endpoints?.[0] || f.metadata?.target || 'N/A').replace(/"/g, '""')}"`,
      f.getCvssScore() || 'N/A',
      f.created_at.toISOString(),
      f.metadata?.cwe_id || 'N/A'
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }

  /**
   * Generates a JSON string from an array of findings
   */
  static toJSON(findings: Finding[]): string {
    return JSON.stringify(findings, null, 2);
  }
}
