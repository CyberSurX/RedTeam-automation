import { query } from '../config/database';
import { logger } from '../utils/logger';

export interface TriageConfig {
  autoTriage: boolean;
  severityThreshold: 'critical' | 'high' | 'medium' | 'low';
  falsePositiveRules: Array<{
    type: string;
    pattern: string;
    description: string;
  }>;
  duplicateDetection: boolean;
  confidenceThreshold: number;
  notifyOnCritical: boolean;
}

export interface TriageResult {
  processedFindings: Array<{
    id: string;
    originalSeverity: string;
    triagedSeverity: string;
    confidence: number;
    isFalsePositive: boolean;
    isDuplicate: boolean;
    triageReason: string;
    recommendedAction: string;
  }>;
  statistics: {
    total: number;
    confirmed: number;
    falsePositives: number;
    duplicates: number;
    severityDistribution: {
      critical: number;
      high: number;
      medium: number;
      low: number;
      info: number;
    };
  };
  recommendations: Array<{
    type: string;
    priority: 'high' | 'medium' | 'low';
    description: string;
    affectedFindings: string[];
  }>;
}

class TriageService {
  // Common false positive patterns
  private falsePositivePatterns = [
    {
      type: 'header_disclosure',
      pattern: /server.*apache|x-powered-by.*php/i,
      description: 'Standard server headers are not vulnerabilities'
    },
    {
      type: 'informational_port',
      pattern: /port.*80|port.*443/i,
      description: 'Standard web ports are not vulnerabilities'
    },
    {
      type: 'safe_technology',
      pattern: /jquery|bootstrap|react|vue/i,
      description: 'Common JavaScript frameworks are not vulnerabilities'
    },
    {
      type: 'localhost_reference',
      pattern: /localhost|127\.0\.0\.1|::1/i,
      description: 'Localhost references are usually not exploitable'
    },
    {
      type: 'test_endpoint',
      pattern: /test|demo|example|sample/i,
      description: 'Test endpoints are often not real vulnerabilities'
    }
  ];

  // Severity mapping based on vulnerability types
  private severityMapping = {
    'sql_injection': 'critical',
    'command_injection': 'critical',
    'remote_code_execution': 'critical',
    'authentication_bypass': 'critical',
    'authorization_bypass': 'high',
    'xss': 'high',
    'csrf': 'medium',
    'directory_traversal': 'high',
    'lfi': 'high',
    'rfi': 'critical',
    'idor': 'medium',
    'information_disclosure': 'low',
    'open_port': 'info',
    'technology_detection': 'info'
  };

  async processFindings(jobId: string, config: TriageConfig): Promise<TriageResult> {
    const result: TriageResult = {
      processedFindings: [],
      statistics: {
        total: 0,
        confirmed: 0,
        falsePositives: 0,
        duplicates: 0,
        severityDistribution: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          info: 0
        }
      },
      recommendations: []
    };

    try {
      // Get findings for the job
      const findingsResult = await query(
        `SELECT f.*, p.user_id 
         FROM findings f 
         JOIN jobs j ON f.job_id = j.id 
         JOIN programs p ON j.program_id = p.id 
         WHERE f.job_id = $1 AND f.status = 'new' 
         ORDER BY f.discovered_at DESC`,
        [jobId]
      );

      const findings = findingsResult.rows as any[];
      result.statistics.total = findings.length;

      // Process each finding
      for (const finding of findings) {
        const processedFinding = await this.analyzeFinding(finding, config);
        result.processedFindings.push(processedFinding);

        // Update finding in database
        await this.updateFinding(finding.id, processedFinding);

        // Update statistics
        if (processedFinding.isFalsePositive) {
          result.statistics.falsePositives++;
        } else if (processedFinding.isDuplicate) {
          result.statistics.duplicates++;
        } else {
          result.statistics.confirmed++;
          (result.statistics.severityDistribution as Record<string, number>)[processedFinding.triagedSeverity]++;
        }
      }

      // Generate recommendations
      result.recommendations = this.generateRecommendations(result.processedFindings) as any;

      // Log triage completion
      logger.info(`Triage completed for job ${jobId}`, {
        total: result.statistics.total,
        confirmed: result.statistics.confirmed,
        falsePositives: result.statistics.falsePositives,
        duplicates: result.statistics.duplicates
      });

      return result;
    } catch (error) {
      logger.error(`Triage processing failed for job ${jobId}:`, error);
      throw error;
    }
  }

  private async analyzeFinding(finding: any, config: TriageConfig): Promise<any> {
    const analysis = {
      id: finding.id,
      originalSeverity: finding.severity,
      triagedSeverity: finding.severity,
      confidence: finding.confidence_level || 50,
      isFalsePositive: false,
      isDuplicate: false,
      triageReason: '',
      recommendedAction: '',
      aiAssessment: null as any
    };

    // Step 1: AI Analysis (New)
    try {
      const { aiService } = await import('./aiService');
      const aiResult = await aiService.analyzeFinding(finding);
      analysis.aiAssessment = aiResult;
      analysis.confidence = aiResult.confidence;
      
      if (aiResult.isFalsePositive) {
        analysis.isFalsePositive = true;
        analysis.triagedSeverity = 'informational';
        analysis.triageReason = `AI Triage: ${aiResult.explanation}`;
        analysis.recommendedAction = 'Marked as false positive by Gemini.';
        return analysis;
      }

      if (aiResult.isDuplicate) {
        analysis.isDuplicate = true;
        analysis.triageReason = `AI Triage: Potential duplicate. ${aiResult.explanation}`;
        analysis.recommendedAction = 'Verify and merge with existing finding.';
        return analysis;
      }

      analysis.triagedSeverity = aiResult.recommendedSeverity;
    } catch (err) {
      logger.error('AI Analysis failed, falling back to rule-based triage:', err);
    }

    // Step 2: Rule-based checks (Fallback/Additional)
    if (!analysis.isFalsePositive) {
      const falsePositiveCheck = this.checkFalsePositive(finding, config);
      if (falsePositiveCheck.isFalsePositive) {
        analysis.isFalsePositive = true;
        analysis.triagedSeverity = 'informational';
        analysis.triageReason = analysis.triageReason || falsePositiveCheck.reason;
        analysis.recommendedAction = 'Mark as informational only';
        return analysis;
      }
    }

    // Step 2: Check for duplicates
    if (config.duplicateDetection) {
      const duplicateCheck = await this.checkDuplicate(finding);
      if (duplicateCheck.isDuplicate) {
        analysis.isDuplicate = true;
        analysis.triageReason = duplicateCheck.reason;
        analysis.recommendedAction = 'Link to existing finding';
        return analysis;
      }
    }

    // Step 3: Adjust severity based on context
    const severityAdjustment = this.adjustSeverity(finding);
    if (severityAdjustment.adjusted) {
      analysis.triagedSeverity = severityAdjustment.newSeverity;
      analysis.triageReason = severityAdjustment.reason;
    }

    // Step 4: Validate confidence level
    if (analysis.confidence < config.confidenceThreshold) {
      analysis.triagedSeverity = 'low';
      analysis.triageReason = 'Low confidence level';
      analysis.recommendedAction = 'Requires manual validation';
    }

    // Step 5: Apply severity threshold
    const severityOrder = { 'info': 0, 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
    const thresholdOrder = severityOrder[config.severityThreshold];
    const findingOrder = severityOrder[analysis.triagedSeverity];

    if (findingOrder < thresholdOrder) {
      analysis.triagedSeverity = 'info';
      analysis.triageReason = 'Below severity threshold';
      analysis.recommendedAction = 'Informational only';
    }

    if (!analysis.triageReason) {
      analysis.triageReason = 'Confirmed as legitimate finding';
      analysis.recommendedAction = 'Proceed with standard remediation process';
    }

    return analysis;
  }

  private checkFalsePositive(finding: any, config: TriageConfig): { isFalsePositive: boolean, reason: string } {
    // Check against configured false positive rules
    for (const rule of config.falsePositiveRules) {
      if (finding.vulnerability_type === rule.type || finding.title.includes(rule.pattern)) {
        return {
          isFalsePositive: true,
          reason: rule.description
        };
      }
    }

    // Check against built-in patterns
    for (const pattern of this.falsePositivePatterns) {
      if (finding.title.match(pattern.pattern) || finding.description.match(pattern.pattern)) {
        return {
          isFalsePositive: true,
          reason: pattern.description
        };
      }
    }

    // Check for common false positive indicators
    if (finding.affected_asset && finding.affected_asset.includes('localhost')) {
      return {
        isFalsePositive: true,
        reason: 'Localhost references are usually not exploitable'
      };
    }

    if (finding.vulnerability_type === 'technology_detection' && finding.severity !== 'info') {
      return {
        isFalsePositive: true,
        reason: 'Technology detection should be informational only'
      };
    }

    return { isFalsePositive: false, reason: '' };
  }

  private async checkDuplicate(finding: any): Promise<{ isDuplicate: boolean, reason: string, duplicateId?: string }> {
    try {
      // Look for similar findings in the same program
      const similarResult = await query(
        `SELECT id, title, description, affected_asset, discovered_at 
         FROM findings 
         WHERE program_id = $1 
         AND vulnerability_type = $2 
         AND id != $3 
         AND status != 'duplicate'
         AND discovered_at > NOW() - INTERVAL '90 days'
         ORDER BY discovered_at DESC
         LIMIT 5`,
        [finding.program_id, finding.vulnerability_type, finding.id]
      );

      for (const similar of similarResult.rows as any[]) {
        const similarity = this.calculateSimilarity(finding, similar);
        if (similarity > 0.8) { // 80% similarity threshold
          return {
            isDuplicate: true,
            reason: `Similar to finding ${similar.id} (similarity: ${Math.round(similarity * 100)}%)`,
            duplicateId: similar.id
          };
        }
      }

      return { isDuplicate: false, reason: '' };
    } catch (error) {
      logger.error(`Duplicate check failed for finding ${finding.id}:`, error);
      return { isDuplicate: false, reason: '' };
    }
  }

  private calculateSimilarity(finding1: any, finding2: any): number {
    let similarity = 0;
    let factors = 0;

    // Compare titles
    if (finding1.title === finding2.title) {
      similarity += 1;
    } else {
      const titleSimilarity = this.stringSimilarity(finding1.title, finding2.title);
      similarity += titleSimilarity;
    }
    factors++;

    // Compare affected assets
    if (finding1.affected_asset === finding2.affected_asset) {
      similarity += 1;
    } else if (finding1.affected_asset && finding2.affected_asset) {
      const assetSimilarity = this.stringSimilarity(finding1.affected_asset, finding2.affected_asset);
      similarity += assetSimilarity;
    }
    factors++;

    // Compare descriptions (first 200 characters)
    const desc1 = finding1.description.substring(0, 200);
    const desc2 = finding2.description.substring(0, 200);
    const descSimilarity = this.stringSimilarity(desc1, desc2);
    similarity += descSimilarity;
    factors++;

    return similarity / factors;
  }

  private stringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  private adjustSeverity(finding: any): { adjusted: boolean, newSeverity: string, reason: string } {
    // Map vulnerability type to standard severity
    const mappedSeverity = (this.severityMapping as any)[finding.vulnerability_type] || finding.severity;

    if (mappedSeverity !== finding.severity) {
      return {
        adjusted: true,
        newSeverity: mappedSeverity,
        reason: `Severity adjusted based on vulnerability type: ${finding.vulnerability_type}`
      };
    }

    // Check for contextual factors that might increase severity
    if (finding.affected_asset && finding.affected_asset.includes('admin')) {
      return {
        adjusted: true,
        newSeverity: this.increaseSeverity(finding.severity),
        reason: 'Administrative functionality affected'
      };
    }

    // Check for proof of concept quality
    if (finding.proof_of_concept && finding.proof_of_concept.length > 500) {
      return {
        adjusted: true,
        newSeverity: finding.severity,
        reason: 'Detailed proof of concept provided'
      };
    }

    return { adjusted: false, newSeverity: finding.severity, reason: '' };
  }

  private increaseSeverity(currentSeverity: string): string {
    const severityOrder = ['info', 'low', 'medium', 'high', 'critical'];
    const currentIndex = severityOrder.indexOf(currentSeverity);

    if (currentIndex < severityOrder.length - 1) {
      return severityOrder[currentIndex + 1];
    }

    return currentSeverity;
  }

  private async updateFinding(findingId: string, analysis: any): Promise<void> {
    try {
      await query(
        `UPDATE findings 
         SET severity = $1, 
             status = CASE 
               WHEN $2 = true THEN 'false_positive'
               WHEN $3 = true THEN 'duplicate'
               ELSE 'confirmed'
             END,
             is_false_positive = $2,
             updated_at = NOW()
         WHERE id = $4`,
        [analysis.triagedSeverity, analysis.isFalsePositive, analysis.isDuplicate, findingId]
      );

      // Add triage note
      await query(
        `INSERT INTO job_logs (job_id, log_level, message, metadata)
         SELECT job_id, 'info', $1, $2
         FROM findings WHERE id = $3`,
        [
          `Finding triaged: ${analysis.triageReason}`,
          JSON.stringify({
            findingId,
            originalSeverity: analysis.originalSeverity,
            triagedSeverity: analysis.triagedSeverity,
            confidence: analysis.confidence,
            isFalsePositive: analysis.isFalsePositive,
            isDuplicate: analysis.isDuplicate
          }),
          findingId
        ]
      );
    } catch (error) {
      logger.error(`Failed to update finding ${findingId}:`, error);
      throw error;
    }
  }

  private generateRecommendations(processedFindings: any[]): Array<{ type: string, priority: string, description: string, affectedFindings: string[] }> {
    const recommendations = [];

    // Group findings by type
    const findingsByType = processedFindings.reduce((acc, finding) => {
      if (!finding.isFalsePositive && !finding.isDuplicate) {
        (acc as any)[finding.triagedSeverity] = ((acc as any)[finding.triagedSeverity] || 0) + 1;
      }
      return acc;
    }, {});

    // Generate recommendations based on severity distribution
    if (findingsByType['critical'] > 0) {
      recommendations.push({
        type: 'critical_vulnerabilities',
        priority: 'high',
        description: `${findingsByType['critical']} critical vulnerabilities require immediate attention`,
        affectedFindings: processedFindings.filter(f => f.triagedSeverity === 'critical' && !f.isFalsePositive).map(f => f.id)
      });
    }

    if (findingsByType['high'] > 5) {
      recommendations.push({
        type: 'high_volume_high_severity',
        priority: 'high',
        description: 'High volume of high-severity findings suggests systematic issues',
        affectedFindings: processedFindings.filter(f => f.triagedSeverity === 'high' && !f.isFalsePositive).map(f => f.id)
      });
    }

    const falsePositiveRate = processedFindings.filter(f => f.isFalsePositive).length / processedFindings.length;
    if (falsePositiveRate > 0.3) {
      recommendations.push({
        type: 'high_false_positive_rate',
        priority: 'medium',
        description: 'High false positive rate suggests need for tool configuration tuning',
        affectedFindings: processedFindings.filter(f => f.isFalsePositive).map(f => f.id)
      });
    }

    return recommendations;
  }

  async getTriageHistory(programId: string): Promise<any[]> {
    try {
      const result = await query(
        `SELECT f.id, f.title, f.vulnerability_type, f.severity, f.status, 
                f.discovered_at, f.updated_at, 
                jl.message as triage_note, jl.metadata as triage_details
         FROM findings f
         LEFT JOIN job_logs jl ON jl.job_id = f.job_id AND jl.log_level = 'info' AND jl.message LIKE 'Finding triaged:%'
         WHERE f.program_id = $1 
         AND f.status IN ('confirmed', 'false_positive', 'duplicate')
         ORDER BY f.updated_at DESC
         LIMIT 100`,
        [programId]
      );

      return result.rows;
    } catch (error) {
      logger.error(`Failed to get triage history for program ${programId}:`, error);
      return [];
    }
  }
}

export const triageService = new TriageService();