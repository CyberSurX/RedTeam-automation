import axios, { AxiosInstance, AxiosError } from 'axios';

export interface HackerOneProgram {
  id: string;
  name: string;
  handle: string;
  currency: string;
  bounty_table: Array<{
    amount: string;
    min_amount: number;
    max_amount: number;
  }>;
  submission_state: string;
  triage_active: boolean;
  submission_information: string;
  started_accepting_at: string;
}

export interface HackerOneReport {
  id: string;
  title: string;
  state: string;
  bounty_amount: number;
  currency: string;
  created_at: string;
  url: string;
  severity_rating: string;
  substate: string;
  triaged_at: string;
  closed_at: string;
  awarded_at: string;
  vulnerability_information: string;
  reporter: {
    username: string;
    name: string;
  };
}

export interface HackerOneScope {
  identifier: string;
  asset_type: string;
  eligible_for_bounty: boolean;
  eligible_for_submission: boolean;
  instruction?: string;
}

export interface HackerOneSubmissionResponse {
  id: string;
  title: string;
  state: string;
  url: string;
  created_at: string;
}

export interface HackerOneUserProfile {
  id: string;
  username: string;
  name: string;
  reputation: number;
  signal: number;
  impact: number;
  bio: string;
  website: string;
  location: string;
}

export interface HackerOneApiResponse<T> {
  data: T;
  included?: any[];
  links?: {
    first?: string;
    last?: string;
    next?: string;
    prev?: string;
  };
}

export class HackerOneClient {
  private apiKey: string;
  private username: string;
  private email: string;
  private baseURL = 'https://api.hackerone.com/v1';
  private client: AxiosInstance;
  private debugMode: boolean;

  constructor(apiKey: string, email: string, username?: string) {
    this.validateCredentials(apiKey, email);
    
    this.apiKey = apiKey;
    this.email = email;
    this.username = username || email;
    
    this.debugMode = process.env.DEBUG_HACKERONE === 'true';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'RedTeamAutomation/2.0',
        'Content-Type': 'application/json'
      },
      auth: {
        username: this.username,
        password: this.apiKey
      },
      timeout: 30000
    });
    
    this.setupInterceptors();
  }

  private validateCredentials(apiKey: string, email: string): void {
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      throw new Error('API key is required and must be a non-empty string');
    }
    
    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      throw new Error('Email is required and must be a non-empty string');
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      (config) => {
        if (this.debugMode) {
          console.log(`🚀 [HackerOne] Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
        }
        return config;
      },
      (error) => {
        if (this.debugMode) {
          console.error('❌ [HackerOne] Request error:', error.message);
        }
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        if (this.debugMode) {
          console.log(`✅ [HackerOne] Response: ${response.status} ${response.statusText}`);
        }
        return response;
      },
      (error: AxiosError) => {
        if (this.debugMode) {
          console.error(`❌ [HackerOne] Response error: ${error.response?.status || error.code}`, error.message);
        }
        
        if (error.response) {
          switch (error.response.status) {
            case 401:
              throw new Error('Authentication failed. Check your API credentials.');
            case 403:
              throw new Error('Access forbidden. You may not have permission for this resource.');
            case 404:
              throw new Error('Resource not found.');
            case 429:
              throw new Error('Rate limit exceeded. Please wait before making more requests.');
            case 500:
              throw new Error('HackerOne server error. Please try again later.');
            default:
              throw new Error(`API request failed with status ${error.response.status}: ${error.message}`);
          }
        } else if (error.request) {
          throw new Error('No response received from HackerOne API. Check your network connection.');
        } else {
          throw new Error(`Request configuration error: ${error.message}`);
        }
      }
    );
  }

  /**
   * Test authentication and get user profile
   */
  async getProfile(): Promise<HackerOneUserProfile> {
    try {
      const response = await this.client.get<HackerOneApiResponse<{
        id: string;
        attributes: {
          username: string;
          name: string;
          reputation: number;
          signal: number;
          impact: number;
          bio: string;
          website: string;
          location: string;
        };
      }>>('/hackers/me');
      
      const { data } = response.data;
      
      return {
        id: data.id,
        username: data.attributes.username,
        name: data.attributes.name,
        reputation: data.attributes.reputation,
        signal: data.attributes.signal,
        impact: data.attributes.impact,
        bio: data.attributes.bio,
        website: data.attributes.website,
        location: data.attributes.location
      };
    } catch (error) {
      throw new Error(`Failed to fetch profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all programs accessible to the user
   */
  async getPrograms(): Promise<HackerOneProgram[]> {
    try {
      const response = await this.client.get<HackerOneApiResponse<Array<{
        id: string;
        attributes: {
          name: string;
          handle: string;
          currency: string;
          bounty_table: Array<{
            amount: string;
            min_amount: number;
            max_amount: number;
          }>;
          submission_state: string;
          triage_active: boolean;
          submission_information: string;
          started_accepting_at: string;
        };
      }>>>('/me/programs');
      
      return response.data.data.map(item => ({
        id: item.id,
        name: item.attributes.name,
        handle: item.attributes.handle,
        currency: item.attributes.currency,
        bounty_table: item.attributes.bounty_table,
        submission_state: item.attributes.submission_state,
        triage_active: item.attributes.triage_active,
        submission_information: item.attributes.submission_information,
        started_accepting_at: item.attributes.started_accepting_at
      }));
    } catch (error) {
      throw new Error(`Failed to fetch programs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get reports for the authenticated user
   */
  async getReports(limit: number = 50, page?: number): Promise<HackerOneReport[]> {
    if (limit < 1 || limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }
    
    try {
      const params: Record<string, any> = { 'page[size]': limit };
      if (page) {
        params['page[number]'] = page;
      }
      
      const response = await this.client.get<HackerOneApiResponse<Array<{
        id: string;
        attributes: {
          title: string;
          state: string;
          bounty_amount: number;
          currency: string;
          created_at: string;
          url: string;
          severity_rating: string;
          substate: string;
          triaged_at: string;
          closed_at: string;
          awarded_at: string;
          vulnerability_information: string;
        };
        relationships: {
          reporter: {
            data: {
              id: string;
              attributes: {
                username: string;
                name: string;
              };
            };
          };
        };
      }>>>('/hackers/me/reports', { params });
      
      return response.data.data.map(item => ({
        id: item.id,
        title: item.attributes.title,
        state: item.attributes.state,
        bounty_amount: item.attributes.bounty_amount,
        currency: item.attributes.currency,
        created_at: item.attributes.created_at,
        url: item.attributes.url,
        severity_rating: item.attributes.severity_rating,
        substate: item.attributes.substate,
        triaged_at: item.attributes.triaged_at,
        closed_at: item.attributes.closed_at,
        awarded_at: item.attributes.awarded_at,
        vulnerability_information: item.attributes.vulnerability_information,
        reporter: {
          username: item.relationships.reporter.data.attributes.username,
          name: item.relationships.reporter.data.attributes.name
        }
      }));
    } catch (error) {
      throw new Error(`Failed to fetch reports: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get scopes for a specific program
   */
  async getProgramScopes(programHandle: string): Promise<HackerOneScope[]> {
    if (!programHandle || typeof programHandle !== 'string' || programHandle.trim().length === 0) {
      throw new Error('Program handle is required and must be a non-empty string');
    }
    
    try {
      const response = await this.client.get<HackerOneApiResponse<Array<{
        attributes: {
          identifier: string;
          asset_type: string;
          eligible_for_bounty: boolean;
          eligible_for_submission: boolean;
          instruction?: string;
        };
      }>>>(`/programs/${encodeURIComponent(programHandle)}/structured_scopes`);
      
      return response.data.data.map(item => ({
        identifier: item.attributes.identifier,
        asset_type: item.attributes.asset_type,
        eligible_for_bounty: item.attributes.eligible_for_bounty,
        eligible_for_submission: item.attributes.eligible_for_submission,
        instruction: item.attributes.instruction
      }));
    } catch (error) {
      throw new Error(`Failed to fetch scopes for program ${programHandle}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Submit a new report
   */
  async submitReport(
    programHandle: string,
    title: string,
    vulnerabilityInformation: string,
    severityRating: string
  ): Promise<HackerOneSubmissionResponse> {
    if (!programHandle || typeof programHandle !== 'string' || programHandle.trim().length === 0) {
      throw new Error('Program handle is required and must be a non-empty string');
    }
    
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw new Error('Title is required and must be a non-empty string');
    }
    
    if (!vulnerabilityInformation || typeof vulnerabilityInformation !== 'string' || vulnerabilityInformation.trim().length === 0) {
      throw new Error('Vulnerability information is required and must be a non-empty string');
    }
    
    if (!severityRating || typeof severityRating !== 'string' || severityRating.trim().length === 0) {
      throw new Error('Severity rating is required and must be a non-empty string');
    }
    
    try {
      const response = await this.client.post<HackerOneApiResponse<{
        id: string;
        attributes: {
          title: string;
          state: string;
          url: string;
          created_at: string;
        };
      }>>(`/programs/${encodeURIComponent(programHandle)}/reports`, {
        data: {
          type: 'report',
          attributes: {
            title,
            vulnerability_information: vulnerabilityInformation,
            severity_rating: severityRating
          }
        }
      });
      
      const { data } = response.data;
      
      return {
        id: data.id,
        title: data.attributes.title,
        state: data.attributes.state,
        url: data.attributes.url,
        created_at: data.attributes.created_at
      };
    } catch (error) {
      throw new Error(`Failed to submit report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}