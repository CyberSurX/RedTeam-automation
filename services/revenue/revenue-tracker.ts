export interface RevenueEvent {
  platform: 'hackerone' | 'bugcrowd' | 'devpost';
  programId: string;
  vulnerabilityType: string;
  severity: 'low' | 'medium' | 'high' | 'critical' | 'awarded' | 'rejected';
  estimatedReward: number;
  currency: string;
  timestamp: string;
  status: 'potential' | 'submitted' | 'awarded' | 'rejected';
}

export class RevenueTracker {
  private events: RevenueEvent[] = [];
  private readonly rewardEstimates = {
    'XSS': { low: 50, high: 500, avg: 200 },
    'SQL Injection': { low: 200, high: 2000, avg: 800 },
    'Open Redirect': { low: 25, high: 200, avg: 75 },
    'Information Disclosure': { low: 20, high: 150, avg: 60 },
    'CSRF': { low: 30, high: 300, avg: 120 },
    'RCE': { low: 500, high: 10000, avg: 2500 },
    'LFI': { low: 100, high: 1000, avg: 400 },
    'SSRF': { low: 200, high: 1500, avg: 600 }
  };

  async trackDiscovery(
    platform: 'hackerone' | 'bugcrowd' | 'devpost',
    programId: string,
    vulnerability: { type: string; severity: 'low' | 'medium' | 'high' | 'critical' }
  ): Promise<void> {
    const estimatedReward = this.estimateReward(vulnerability.type, vulnerability.severity);
    
    const event: RevenueEvent = {
      platform,
      programId,
      vulnerabilityType: vulnerability.type,
      severity: vulnerability.severity,
      estimatedReward,
      currency: 'USD',
      timestamp: new Date().toISOString(),
      status: 'potential'
    };

    this.events.push(event);
    
    console.log(`[REVENUE] Tracked ${vulnerability.type} vulnerability: $${estimatedReward} USD`);
  }

  async trackSubmission(
    platform: 'hackerone' | 'bugcrowd' | 'devpost',
    programId: string,
    vulnerability: { type: string },
    reportId: string
  ): Promise<void> {
    const event = this.events.find(e => 
      e.platform === platform && 
      e.programId === programId && 
      e.vulnerabilityType === vulnerability.type &&
      e.status === 'potential'
    );

    if (event) {
      event.status = 'submitted';
      console.log(`[REVENUE] Submitted report ${reportId}: ${vulnerability.type} to ${platform}`);
    }
  }

  async trackAward(platform: 'hackerone' | 'bugcrowd' | 'devpost', programId: string, amount: number, currency: string = 'USD'): Promise<void> {
    const event: RevenueEvent = {
      platform,
      programId,
      vulnerabilityType: 'Awarded',
      severity: 'awarded',
      estimatedReward: amount,
      currency,
      timestamp: new Date().toISOString(),
      status: 'awarded'
    };

    this.events.push(event);
    console.log(`[REVENUE] Awarded bounty: ${amount} ${currency}`);
  }

  getRevenueStats(): {
    totalPotential: number;
    totalSubmitted: number;
    totalAwarded: number;
    byPlatform: Record<string, number>;
    byVulnerabilityType: Record<string, number>;
  } {
    const stats = {
      totalPotential: 0,
      totalSubmitted: 0,
      totalAwarded: 0,
      byPlatform: {} as Record<string, number>,
      byVulnerabilityType: {} as Record<string, number>
    };

    for (const event of this.events) {
      if (event.status === 'potential') {
        stats.totalPotential += event.estimatedReward;
      } else if (event.status === 'submitted') {
        stats.totalSubmitted += event.estimatedReward;
      } else if (event.status === 'awarded') {
        stats.totalAwarded += event.estimatedReward;
      }

      // By platform
      if (!stats.byPlatform[event.platform]) {
        stats.byPlatform[event.platform] = 0;
      }
      stats.byPlatform[event.platform] += event.estimatedReward;

      // By vulnerability type
      if (!stats.byVulnerabilityType[event.vulnerabilityType]) {
        stats.byVulnerabilityType[event.vulnerabilityType] = 0;
      }
      stats.byVulnerabilityType[event.vulnerabilityType] += event.estimatedReward;
    }

    return stats;
  }

  private estimateReward(vulnerabilityType: string, severity: string): number {
    const estimates = this.rewardEstimates[vulnerabilityType] || this.rewardEstimates['Information Disclosure'];
    
    switch (severity) {
      case 'critical':
        return estimates.high;
      case 'high':
        return Math.floor(estimates.avg * 1.5);
      case 'medium':
        return estimates.avg;
      case 'low':
        return estimates.low;
      default:
        return estimates.avg;
    }
  }

  getEvents(): RevenueEvent[] {
    return [...this.events];
  }

  exportReport(): string {
    const stats = this.getRevenueStats();
    
    return `
BUG BOUNTY REVENUE REPORT
========================

TOTAL REVENUE POTENTIAL:
- Potential: $${stats.totalPotential} USD
- Submitted: $${stats.totalSubmitted} USD  
- Awarded: $${stats.totalAwarded} USD

BY PLATFORM:
${Object.entries(stats.byPlatform).map(([platform, amount]) => 
  `- ${platform.toUpperCase()}: $${amount} USD`
).join('\n')}

BY VULNERABILITY TYPE:
${Object.entries(stats.byVulnerabilityType).map(([type, amount]) => 
  `- ${type}: $${amount} USD`
).join('\n')}

RECENT EVENTS:
${this.events.slice(-10).map(event => 
  `- ${event.vulnerabilityType} on ${event.platform}: $${event.estimatedReward} (${event.status})`
).join('\n')}

Generated: ${new Date().toISOString()}
`;
  }

  clearData(): void {
    this.events = [];
  }
}