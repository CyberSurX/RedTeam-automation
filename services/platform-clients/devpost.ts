export interface DevPostProject {
  id: string;
  title: string;
  url: string;
  submission_deadline: string;
  prizes: Array<{
    place: string;
    amount: number;
    currency: string;
  }>;
}

export interface DevPostSubmission {
  id: string;
  project_title: string;
  status: string;
  prize_won: number;
  submitted_at: string;
}

export class DevPostClient {
  private apiKey: string;
  private baseURL = 'https://api.devpost.com';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getHackathons(): Promise<DevPostProject[]> {
    console.log('DevPost API not configured, using mock data');
    return this.getMockHackathons();
  }

  async getSubmissions(): Promise<DevPostSubmission[]> {
    console.log('DevPost API not configured, using mock data');
    return this.getMockSubmissions();
  }

  async submitProject(hackathonId: string, projectData: Record<string, unknown>): Promise<string> {
    console.log('DevPost submit mock - hackathon:', hackathonId);
    return 'DEVPOST-MOCK-' + Math.random().toString(36).substr(2, 9);
  }

  private getMockHackathons(): DevPostProject[] {
    return [
      {
        id: 'dp-1',
        title: 'Security Bug Bounty Hackathon',
        url: 'https://devpost.com/hackathons/security-bug-bounty',
        submission_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        prizes: [
          { place: '1st', amount: 5000, currency: 'USD' },
          { place: '2nd', amount: 3000, currency: 'USD' }
        ]
      }
    ];
  }

  private getMockSubmissions(): DevPostSubmission[] {
    return [
      {
        id: 'dp-sub-1',
        project_title: 'Automated Security Scanner',
        status: 'submitted',
        prize_won: 0,
        submitted_at: new Date().toISOString()
      }
    ];
  }
}