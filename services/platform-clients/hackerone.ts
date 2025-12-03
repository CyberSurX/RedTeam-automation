import axios, { AxiosInstance } from 'axios';

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
    
    // Enable debug mode if environment variable is set
    this.debugMode = process.env.DEBUG_HACKERONE === 'true';
    
    // Create authenticated axios instance
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
    
    // Add request/response interceptors for debugging and error handling
    this.setupInterceptors();
  }

  /**
   * Test authentication and get user profile
   */
  async getProfile(): Promise<HackerOneUserProfile> {
    try {
      if (this.debugMode) {
        console.log('🔍 [HackerOne] Fetching profile...');
      }
      
      const response = await this.client.get('/hackers/me');
      
      if (this.debugMode) {
        console.log('✅ [HackerOne] Profile fetched successfully');
      }
      
      return {
        id: response.data.data.id,
        username: response.data.data.attributes.username,
        name: response.data.data.attributes.name,
        reputation: response.data.data.attributes.reputation,
        signal: response.data.data.attributes.signal,
        impact: response.data.data.attributes.impact,
        bio: response.data.data.attributes.bio || '',
        website: response.data.data.attributes.website || '',
        location: response.data.data.attributes.location || ''
      };
    } catch (error) {
      const message = `Failed to get profile: ${this.getErrorMessage(error)}`;
      if (this.debugMode) {
        console.error('❌ [HackerOne] Profile fetch failed:', error);
      }
      throw new Error(message);
    }
  }

  /**
   * Get all programs available to the researcher
   */
  async getPrograms(): Promise<HackerOneProgram[]> {
    try {
      const response = await this.client.get('/hackers/programs');
      return response.data.data.map((program: Record<string, unknown>) => ({
        id: (program as { id: string }).id,
        name: ((program as { attributes: Record<string, unknown> }).attributes.name as string),
        handle: ((program as { attributes: Record<string, unknown> }).attributes.handle as string),
        currency: ((program as { attributes: Record<string, unknown> }).attributes.currency as string) || 'USD',
        bounty_table: ((program as { attributes: Record<string, unknown> }).attributes.bounty_table as Array<unknown>) || [],
        submission_state: ((program as { attributes: Record<string, unknown> }).attributes.submission_state as string),
        triage_active: ((program as { attributes: Record<string, unknown> }).attributes.triage_active as boolean),
        submission_information: ((program as { attributes: Record<string, unknown> }).attributes.submission_information as string) || '',
        started_accepting_at: ((program as { attributes: Record<string, unknown> }).attributes.started_accepting_at as string)
      }));
    } catch (error) {
      throw new Error(`Failed to get programs: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Get detailed information about a specific program
   */
  async getProgram(programHandle: string): Promise<HackerOneProgram> {
    try {
      const response = await this.client.get(`/hackers/programs/${programHandle}`);
      const program = response.data.data;
      return {
        id: program.id,
        name: program.attributes.name,
        handle: program.attributes.handle,
        currency: program.attributes.currency || 'USD',
        bounty_table: program.attributes.bounty_table || [],
        submission_state: program.attributes.submission_state,
        triage_active: program.attributes.triage_active,
        submission_information: program.attributes.submission_information || '',
        started_accepting_at: program.attributes.started_accepting_at
      };
    } catch (error) {
      throw new Error(`Failed to get program ${programHandle}: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Get program scope information
   */
  async getProgramScope(programHandle: string): Promise<HackerOneScope[]> {
    try {
      const response = await this.client.get(`/hackers/programs/${programHandle}/structured_scopes`);
      return response.data.data.map((scope: Record<string, unknown>) => ({
        identifier: ((scope as { attributes: Record<string, unknown> }).attributes.identifier as string),
        asset_type: ((scope as { attributes: Record<string, unknown> }).attributes.asset_type as string),
        eligible_for_bounty: ((scope as { attributes: Record<string, unknown> }).attributes.eligible_for_bounty as boolean),
        eligible_for_submission: ((scope as { attributes: Record<string, unknown> }).attributes.eligible_for_submission as boolean),
        instruction: ((scope as { attributes: Record<string, unknown> }).attributes.instruction as string) || undefined
      }));
    } catch (error) {
      throw new Error(`Failed to get program scope for ${programHandle}: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Get researcher's reports
   */
  async getReports(limit: number = 50): Promise<HackerOneReport[]> {
    try {
      const response = await this.client.get('/hackers/reports', {
        params: { limit }
      });
      return response.data.data.map((report: Record<string, unknown>) => {
        const attr = (report as { attributes: Record<string, unknown> }).attributes;
        const relationships = (report as { relationships: Record<string, unknown> }).relationships;
        
        return {
          id: (report as { id: string }).id,
          title: attr.title as string,
          state: attr.state as string,
          bounty_amount: (attr.bounty_amount as number) || 0,
          currency: (attr.bounty_currency as string) || 'USD',
          severity_rating: attr.severity_rating as string,
          substate: attr.substate as string,
          triaged_at: attr.triaged_at as string,
          closed_at: attr.closed_at as string,
          awarded_at: attr.awarded_at as string,
          created_at: attr.created_at as string,
          vulnerability_information: attr.vulnerability_information as string,
          url: `https://hackerone.com/reports/${(report as { id: string }).id}`,
          reporter: {
            username: ((relationships.reporter as { data: { attributes: Record<string, unknown> } }).data.attributes.username as string),
            name: ((relationships.reporter as { data: { attributes: Record<string, unknown> } }).data.attributes.name as string)
          }
        }});
    } catch (error) {
      throw new Error(`Failed to get reports: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Get details for a specific report
   */
  async getReport(reportId: string): Promise<HackerOneReport> {
    try {
      const response = await this.client.get(`/hackers/reports/${reportId}`);
      const report = response.data.data;
      return {
        id: report.id,
        title: report.attributes.title,
        state: report.attributes.state,
        bounty_amount: report.attributes.bounty_amount || 0,
        currency: report.attributes.bounty_currency || 'USD',
        severity_rating: report.attributes.severity_rating,
        substate: report.attributes.substate,
        triaged_at: report.attributes.triaged_at,
        closed_at: report.attributes.closed_at,
        awarded_at: report.attributes.awarded_at,
        created_at: report.attributes.created_at,
        vulnerability_information: report.attributes.vulnerability_information,
        url: `https://hackerone.com/reports/${report.id}`,
        reporter: {
          username: report.relationships.reporter.data.attributes.username,
          name: report.relationships.reporter.data.attributes.name
        }
      };
    } catch (error) {
      throw new Error(`Failed to get report ${reportId}: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Submit a new report to HackerOne with enhanced validation
   */
  async submitReport(
    programHandle: string,
    title: string,
    summary: string,
    severity: 'none' | 'low' | 'medium' | 'high' | 'critical',
    affectedAsset?: string,
    proofOfConcept?: string,
    options?: { dryRun?: boolean; validateScope?: boolean }
  ): Promise<HackerOneSubmissionResponse> {
    try {
      // Validate inputs
      this.validateReportInputs(programHandle, title, summary, severity);
      
      const dryRun = options?.dryRun ?? false;
      const validateScope = options?.validateScope ?? true;
      
      if (this.debugMode) {
        console.log(`🔍 [HackerOne] Submitting report to ${programHandle}`);
        if (dryRun) console.log('🔸 [HackerOne] DRY RUN MODE - no actual submission');
      }
      
      // Validate program is active
      if (!dryRun) {
        const isActive = await this.isProgramActive(programHandle);
        if (!isActive) {
          throw new Error(`Program ${programHandle} is not currently accepting submissions`);
        }
      }
      
      // Validate scope if enabled
      if (validateScope && affectedAsset) {
        const isInScope = await this.validateScope(programHandle, affectedAsset);
        if (!isInScope) {
          throw new Error(`Target ${affectedAsset} is not in scope for program ${programHandle}`);
        }
      }
      
      if (dryRun) {
        return {
          id: 'dry-run-simulation',
          title: title,
          state: 'dry-run',
          url: `https://hackerone.com/programs/${programHandle}`,
          created_at: new Date().toISOString()
        };
      }
      
      interface ReportAttributes {
        title: string;
        vulnerability_information: string;
        severity_rating: 'none' | 'low' | 'medium' | 'high' | 'critical';
        team_handle: string;
        affected_asset?: string;
        proof_of_concept?: string;
      }

      const attributes: ReportAttributes = {
        title,
        vulnerability_information: summary,
        severity_rating: severity,
        team_handle: programHandle
      };

      // Add optional fields
      if (affectedAsset) {
        attributes.affected_asset = affectedAsset;
      }
      if (proofOfConcept) {
        attributes.proof_of_concept = proofOfConcept;
      }

      const submissionData = {
        data: {
          type: 'report',
          attributes
        }
      };

      if (this.debugMode) {
        console.log('📝 [HackerOne] Sending report data:', JSON.stringify(submissionData, null, 2));
      }
      
      const response = await this.client.post('/hackers/reports', submissionData);
      
      if (this.debugMode) {
        console.log('✅ [HackerOne] Report submitted successfully');
      }
      
      return {
        id: response.data.data.id,
        title: response.data.data.attributes.title,
        state: response.data.data.attributes.state,
        url: `https://hackerone.com/reports/${response.data.data.id}`,
        created_at: response.data.data.attributes.created_at
      };
    } catch (error) {
      const message = `Failed to submit report to ${programHandle}: ${this.getErrorMessage(error)}`;
      if (this.debugMode) {
        console.error('❌ [HackerOne] Report submission failed:', error);
      }
      throw new Error(message);
    }
  }

  /**
   * Validate if a vulnerability is in scope for a program with enhanced matching
   */
  async validateScope(programHandle: string, target: string): Promise<boolean> {
    try {
      const scopes = await this.getProgramScope(programHandle);
      
      if (this.debugMode) {
        console.log(`🔍 [HackerOne] Validating scope for ${target} in ${programHandle}`);
        console.log(`📋 [HackerOne] Found ${scopes.length} scope entries`);
      }
      
      return scopes.some(scope => {
        const isEligible = scope.eligible_for_submission;
        
        if (!isEligible) {
          return false;
        }
        
        let match = false;
        const assetType = scope.asset_type;
        const identifier = scope.identifier;
        
        if (assetType === 'URL') {
          // Exact URL match or subdomain match
          match = target === identifier || target.startsWith(identifier + '/');
        } else if (assetType === 'WILDCARD') {
          // Wildcard domain matching
          const baseDomain = identifier.replace('*.', '');
          match = target.includes(baseDomain);
        } else if (assetType === 'CIDR') {
          // IP range matching (basic implementation)
          if (this.isIPAddress(target)) {
            match = this.isInCIDRRange(target, identifier);
          }
        } else if (assetType === 'IP') {
          // Exact IP match
          match = target === identifier;
        }
        
        return match;
      });
    } catch (scopeError) {
      if (this.debugMode) {
        console.error('❌ [HackerOne] Scope validation failed:', scopeError);
      }
      return false;
    }
  }

  /**
   * Check if program is accepting submissions
   */
  async isProgramActive(programHandle: string): Promise<boolean> {
    try {
      const program = await this.getProgram(programHandle);
      return program.submission_state === 'open' && program.triage_active;
    } catch {
      return false;
    }
  }

  /**
   * Get report template suggestions for a program
   */
  async getReportTemplates(programHandle: string): Promise<string[]> {
    try {
      const program = await this.getProgram(programHandle);
      const submissionInfo = program.submission_information.toLowerCase();
      
      const templates = [];
      if (submissionInfo.includes('sql') || submissionInfo.includes('injection')) {
        templates.push('sql_injection');
      }
      if (submissionInfo.includes('xss') || submissionInfo.includes('cross-site')) {
        templates.push('xss');
      }
      if (submissionInfo.includes('idor') || submissionInfo.includes('direct object')) {
        templates.push('idor');
      }
      if (submissionInfo.includes('csrf')) {
        templates.push('csrf');
      }
      
      return templates.length > 0 ? templates : ['default'];
    } catch {
      return ['default'];
    }
  }

  /**
   * Extract error message from API response
   */
  private getErrorMessage(error: unknown): string {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { errors?: Array<{ detail?: string; title?: string }> } } };
      if (axiosError.response?.data?.errors?.[0]?.detail) {
        return axiosError.response.data.errors[0].detail;
      }
      if (axiosError.response?.data?.errors?.[0]?.title) {
        return axiosError.response.data.errors[0].title;
      }
    }
    
    if (error instanceof Error) {
      return error.message;
    }
    
    return 'Unknown error occurred';
  }

  /**
   * Validate credentials before creating client
   */
  private validateCredentials(apiKey: string, email: string): void {
    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error('HackerOne API key is required');
    }
    if (!email || email.trim().length === 0) {
      throw new Error('HackerOne email is required');
    }
    if (!email.includes('@')) {
      throw new Error('Email address must be valid');
    }
  }

  /**
   * Set up request/response interceptors for debugging
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        if (this.debugMode) {
          console.log(`➡️ [HackerOne] Request: ${config.method?.toUpperCase()} ${config.url}`);
          if (config.data) {
            console.log('📤 [HackerOne] Request data:', JSON.stringify(config.data, null, 2));
          }
        }
        return config;
      },
      (error) => {
        if (this.debugMode) {
          console.error('❌ [HackerOne] Request failed:', error);
        }
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        if (this.debugMode) {
          console.log(`⬅️ [HackerOne] Response: ${response.status} ${response.statusText}`);
        }
        return response;
      },
      (error) => {
        if (this.debugMode) {
          console.error('❌ [HackerOne] Response error:', error.response?.status, error.response?.data);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Validate report submission inputs
   */
  private validateReportInputs(
    programHandle: string,
    title: string,
    summary: string,
    severity: 'none' | 'low' | 'medium' | 'high' | 'critical'
  ): void {
    if (!programHandle || programHandle.trim().length === 0) {
      throw new Error('Program handle is required');
    }
    if (!title || title.trim().length === 0) {
      throw new Error('Report title is required');
    }
    if (title.length > 200) {
      throw new Error('Report title must be less than 200 characters');
    }
    if (!summary || summary.trim().length === 0) {
      throw new Error('Report summary is required');
    }
    if (summary.length < 50) {
      throw new Error('Report summary must be at least 50 characters');
    }
    if (!['none', 'low', 'medium', 'high', 'critical'].includes(severity)) {
      throw new Error('Severity must be one of: none, low, medium, high, critical');
    }
  }

  /**
   * Check if a string is a valid IP address
   */
  private isIPAddress(ip: string): boolean {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  }

  /**
   * Basic CIDR range validation (simplified implementation)
   */
  private isInCIDRRange(ip: string, cidr: string): boolean {
    // Simplified implementation - returns true for basic CIDR format validation
    // In a production system, this would require proper IP range calculation
    try {
      const cidrParts = cidr.split('/');
      if (cidrParts.length !== 2) return false;
      
      const baseIP = cidrParts[0];
      const prefix = parseInt(cidrParts[1], 10);
      
      if (!this.isIPAddress(baseIP) || isNaN(prefix) || prefix < 0 || prefix > 32) {
        return false;
      }
      
      // For this demo, we'll simply check if the IP is the same as the base IP
      // A real implementation would calculate the full IP range
      return ip === baseIP;
    } catch {
      return false;
    }
  }
}
