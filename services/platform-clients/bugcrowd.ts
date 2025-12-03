export interface BugCrowdProgram {
  id: string;
  name: string;
  currency: string;
  reward_range: {
    min: number;
    max: number;
  };
}

export interface BugCrowdSubmission {
  id: string;
  title: string;
  status: string;
  reward: number;
  currency: string;
  submitted_at: string;
}

export class BugCrowdClient {
  private apiKey: string;
  private baseURL = 'https://api.bugcrowd.com';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getPrograms(): Promise<BugCrowdProgram[]> {
    console.log('BugCrowd API not configured, using mock data');
    return this.getMockPrograms();
  }

  async getSubmissions(): Promise<BugCrowdSubmission[]> {
    console.log('BugCrowd API not configured, using mock data');
    return this.getMockSubmissions();
  }

  async submitVulnerability(
    programId: string,
    title: string,
    description: string,
    severity: string
  ): Promise<string> {
    console.log('BugCrowd submit mock', { programId, title, severity, descLen: description.length });
    return 'BUGCROWD-MOCK-' + Math.random().toString(36).substr(2, 9);
  }

  private getMockPrograms(): BugCrowdProgram[] {
    return [
      {
        id: 'bc-1',
        name: 'BugCrowd Test Program',
        currency: 'USD',
        reward_range: { min: 100, max: 1000 }
      }
    ];
  }

  private getMockSubmissions(): BugCrowdSubmission[] {
    return [
      {
        id: 'bc-sub-1',
        title: 'SQL Injection Found',
        status: 'new',
        reward: 0,
        currency: 'USD',
        submitted_at: new Date().toISOString()
      }
    ];
  }
}
