typescript
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

export interface DevPostConfig {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
}

export class DevPostClient {
  private readonly apiKey: string;
  private readonly baseURL: string;
  private readonly timeout: number;

  constructor(config: DevPostConfig) {
    if (!config.apiKey || typeof config.apiKey !== 'string') {
      throw new Error('Valid API key is required');
    }

    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL || 'https://api.devpost.com';
    this.timeout = config.timeout || 10000;
  }

  private validateHackathonsResponse(data: any): DevPostProject[] {
    if (!Array.isArray(data)) {
      throw new Error('Response is not an array');
    }

    return data.map(item => {
      if (typeof item.id !== 'string') {
        throw new Error('Invalid id type');
      }
      if (typeof item.title !== 'string') {
        throw new Error('Invalid title type');
      }
      if (typeof item.url !== 'string') {
        throw new Error('Invalid url type');
      }
      if (typeof item.submission_deadline !== 'string') {
        throw new Error('Invalid submission_deadline type');
      }
      if (!Array.isArray(item.prizes)) {
        throw new Error('Prizes must be an array');
      }

      const validatedPrizes = item.prizes.map(prize => {
        if (typeof prize.place !== 'string') {
          throw new Error('Invalid prize place type');
        }
        if (typeof prize.amount !== 'number') {
          throw new Error('Invalid prize amount type');
        }
        if (typeof prize.currency !== 'string') {
          throw new Error('Invalid prize currency type');
        }
        return prize;
      });

      return {
        id: item.id,
        title: item.title,
        url: item.url,
        submission_deadline: item.submission_deadline,
        prizes: validatedPrizes
      };
    });
  }

  private validateSubmissionsResponse(data: any): DevPostSubmission[] {
    if (!Array.isArray(data)) {
      throw new Error('Response is not an array');
    }

    return data.map(item => {
      if (typeof item.id !== 'string') {
        throw new Error('Invalid submission id type');
      }
      if (typeof item.project_title !== 'string') {
        throw new Error('Invalid project_title type');
      }
      if (typeof item.status !== 'string') {
        throw new Error('Invalid status type');
      }
      if (typeof item.prize_won !== 'number') {
        throw new Error('Invalid prize_won type');
      }
      if (typeof item.submitted_at !== 'string') {
        throw new Error('Invalid submitted_at type');
      }

      return {
        id: item.id,
        project_title: item.project_title,
        status: item.status,
        prize_won: item.prize_won,
        submitted_at: item.submitted_at
      };
    });
  }

  async getHackathons(): Promise<DevPostProject[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}/v1/hackathons`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`DevPost API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return this.validateHackathonsResponse(data);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Failed to fetch hackathons:', error.message);
        throw new Error(`Failed to fetch hackathons: ${error.message}`);
      }
      throw new Error('Failed to fetch hackathons: Unknown error');
    }
  }

  async getSubmissions(): Promise<DevPostSubmission[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}/v1/submissions`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`DevPost API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return this.validateSubmissionsResponse(data);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Failed to fetch submissions:', error.message);
        throw new Error(`Failed to fetch submissions: ${error.message}`);
      }
      throw new Error('Failed to fetch submissions: Unknown error');
    }
  }
}