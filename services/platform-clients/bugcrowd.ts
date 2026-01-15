typescript
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

export interface VulnerabilitySubmission {
  programId: string;
  title: string;
  description: string;
  severity: string;
}

export class BugCrowdClient {
  private readonly apiKey: string;
  private readonly baseURL = 'https://api.bugcrowd.com';
  private readonly headers: Record<string, string>;

  constructor(apiKey: string) {
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      throw new Error('BugCrowd API key is required and must be a non-empty string');
    }
    this.apiKey = apiKey.trim();
    this.headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  async getPrograms(): Promise<BugCrowdProgram[]> {
    try {
      const response = await fetch(`${this.baseURL}/programs`, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`BugCrowd API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format from BugCrowd API');
      }

      return data.map((program: any) => ({
        id: program.id || '',
        name: program.name || '',
        currency: program.currency || 'USD',
        reward_range: {
          min: typeof program.reward_range?.min === 'number' ? program.reward_range.min : 0,
          max: typeof program.reward_range?.max === 'number' ? program.reward_range.max : 0,
        },
      })).filter((program: BugCrowdProgram) => program.id && program.name);
    } catch (error) {
      console.error('Failed to fetch BugCrowd programs:', error);
      throw new Error(`Failed to fetch programs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getSubmissions(programId?: string): Promise<BugCrowdSubmission[]> {
    try {
      const url = programId 
        ? `${this.baseURL}/programs/${encodeURIComponent(programId)}/submissions`
        : `${this.baseURL}/submissions`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`BugCrowd API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format from BugCrowd API');
      }

      return data.map((submission: any) => ({
        id: submission.id || '',
        title: submission.title || '',
        status: submission.status || 'unknown',
        reward: typeof submission.reward === 'number' ? submission.reward : 0,
        currency: submission.currency || 'USD',
        submitted_at: submission.submitted_at || new Date().toISOString(),
      })).filter((submission: BugCrowdSubmission) => submission.id && submission.title);
    } catch (error) {
      console.error('Failed to fetch BugCrowd submissions:', error);
      throw new Error(`Failed to fetch submissions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async submitVulnerability(
    programId: string,
    title: string,
    description: string,
    severity: string
  ): Promise<string> {
    this.validateVulnerabilitySubmission({ programId, title, description, severity });

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        severity: severity.trim(),
        submitted_at: new Date().toISOString(),
      };

      const response = await fetch(
        `${this.baseURL}/programs/${encodeURIComponent(programId)}/submissions`,
        {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`BugCrowd API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.id || typeof data.id !== 'string') {
        throw new Error('Invalid response from BugCrowd API: missing submission ID');
      }

      return data.id;
    } catch (error) {
      console.error('Failed to submit vulnerability to BugCrowd:', error);
      throw new Error(`Failed to submit vulnerability: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private validateVulnerabilitySubmission(submission: VulnerabilitySubmission): void {
    const { programId, title, description, severity } = submission;

    if (!programId || typeof programId !== 'string' || programId.trim().length === 0) {
      throw new Error('Program ID is required and must be a non-empty string');
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw new Error('Title is required and must be a non-empty string');
    }

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      throw new Error('Description is required and must be a non-empty string');
    }

    if (!severity || typeof severity !== 'string' || severity.trim().length === 0) {
      throw new Error('Severity is required and must be a non-empty string');
    }

    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (!validSeverities.includes(severity.toLowerCase())) {
      throw new Error(`Severity must be one of: ${validSeverities.join(', ')}`);
    }

    if (title.trim().length > 200) {
      throw new Error('Title must be 200 characters or less');
    }

    if (description.trim().length > 10000) {
      throw new Error('Description must be 10000 characters or less');
    }
  }
}