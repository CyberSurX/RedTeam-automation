import axios from 'axios';
import { config } from '../../config';

export interface SafetyCheck {
  type: 'scope' | 'rate_limit' | 'safe_mode' | 'blacklist';
  passed: boolean;
  message: string;
  details?: any;
}

export interface ScopeValidation {
  url: string;
  allowedDomains: string[];
  isValid: boolean;
  reason?: string;
}

export class SafetyGuard {
  private static instance: SafetyGuard;
  private requestCounts: Map<string, number[]> = new Map();
  private readonly MAX_REQUESTS_PER_MINUTE = 10;
  private readonly MAX_REQUESTS_PER_HOUR = 100;
  private readonly SAFE_DOMAINS = [
    'httpbin.org',
    'example.com',
    'testphp.vulnweb.com',
    'demo.testfire.net',
    'juice-shop.herokuapp.com'
  ];
  private readonly BLACKLISTED_PATHS = [
    '/admin',
    '/wp-admin',
    '/.git',
    '/.env',
    '/config',
    '/backup',
    '/database',
    '/private'
  ];

  private constructor() {}

  static getInstance(): SafetyGuard {
    if (!SafetyGuard.instance) {
      SafetyGuard.instance = new SafetyGuard();
    }
    return SafetyGuard.instance;
  }

  async validateScope(url: string): Promise<ScopeValidation> {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;

      if (config.safeMode && !this.SAFE_DOMAINS.some(safe => domain.includes(safe))) {
        return {
          url,
          allowedDomains: this.SAFE_DOMAINS,
          isValid: false,
          reason: `Domain ${domain} not in safe testing list`
        };
      }

      const hasBlacklistedPath = this.BLACKLISTED_PATHS.some(path => 
        urlObj.pathname.toLowerCase().includes(path)
      );

      if (hasBlacklistedPath) {
        return {
          url,
          allowedDomains: this.SAFE_DOMAINS,
          isValid: false,
          reason: 'URL contains blacklisted path'
        };
      }

      return {
        url,
        allowedDomains: this.SAFE_DOMAINS,
        isValid: true
      };
    } catch (error) {
      return {
        url,
        allowedDomains: this.SAFE_DOMAINS,
        isValid: false,
        reason: `Invalid URL: ${error.message}`
      };
    }
  }

  async checkRateLimit(identifier: string): Promise<SafetyCheck> {
    const now = Date.now();
    const minuteAgo = now - 60000;
    const hourAgo = now - 3600000;

    if (!this.requestCounts.has(identifier)) {
      this.requestCounts.set(identifier, []);
    }

    const requests = this.requestCounts.get(identifier)!;
    const recentMinuteRequests = requests.filter(timestamp => timestamp > minuteAgo);
    const recentHourRequests = requests.filter(timestamp => timestamp > hourAgo);

    if (recentMinuteRequests.length >= this.MAX_REQUESTS_PER_MINUTE) {
      return {
        type: 'rate_limit',
        passed: false,
        message: `Rate limit exceeded: ${recentMinuteRequests.length} requests in last minute`,
        details: { limit: this.MAX_REQUESTS_PER_MINUTE, current: recentMinuteRequests.length }
      };
    }

    if (recentHourRequests.length >= this.MAX_REQUESTS_PER_HOUR) {
      return {
        type: 'rate_limit',
        passed: false,
        message: `Hourly rate limit exceeded: ${recentHourRequests.length} requests in last hour`,
        details: { limit: this.MAX_REQUESTS_PER_HOUR, current: recentHourRequests.length }
      };
    }

    requests.push(now);
    this.requestCounts.set(identifier, requests);

    return {
      type: 'rate_limit',
      passed: true,
      message: 'Rate limit check passed',
      details: { minuteRequests: recentMinuteRequests.length, hourRequests: recentHourRequests.length }
    };
  }

  async checkSafeMode(): Promise<SafetyCheck> {
    if (!config.safeMode) {
      return {
        type: 'safe_mode',
        passed: false,
        message: 'WARNING: Safe mode is disabled - real submissions may occur!',
        details: { safeMode: false }
      };
    }

    return {
      type: 'safe_mode',
      passed: true,
      message: 'Safe mode is enabled - all operations are in test mode',
      details: { safeMode: true }
    };
  }

  async checkBlacklist(url: string): Promise<SafetyCheck> {
    try {
      const urlObj = new URL(url);
      const hasBlacklistedPath = this.BLACKLISTED_PATHS.some(path => 
        urlObj.pathname.toLowerCase().includes(path)
      );

      if (hasBlacklistedPath) {
        return {
          type: 'blacklist',
          passed: false,
          message: 'URL contains blacklisted path',
          details: { blacklistedPath: urlObj.pathname }
        };
      }

      return {
        type: 'blacklist',
        passed: true,
        message: 'Blacklist check passed',
        details: { url: urlObj.pathname }
      };
    } catch (error) {
      return {
        type: 'blacklist',
        passed: false,
        message: `Invalid URL for blacklist check: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  async performSafetyChecks(url: string, identifier: string): Promise<SafetyCheck[]> {
    const checks = await Promise.all([
      this.checkSafeMode(),
      this.checkRateLimit(identifier),
      this.checkBlacklist(url),
      this.validateScope(url).then(result => ({
        type: 'scope' as const,
        passed: result.isValid,
        message: result.isValid ? 'Scope validation passed' : `Scope validation failed: ${result.reason}`,
        details: result
      }))
    ]);

    return checks;
  }

  async safeRequest(url: string, options: { identifier?: string; method?: string; data?: unknown; headers?: Record<string, string> } = {}): Promise<{ status: 'simulated' | 'success' | 'error'; message?: string; data?: unknown; statusCode?: number; url?: string; safetyChecks: SafetyCheck[]; error?: string; }> {
    const identifier = options.identifier || 'default';
    
    const safetyChecks = await this.performSafetyChecks(url, identifier);
    const failedChecks = safetyChecks.filter(check => !check.passed);

    if (failedChecks.length > 0) {
      const errorMessages = failedChecks.map(check => check.message).join('; ');
      throw new Error(`Safety checks failed: ${errorMessages}`);
    }

    if (config.dryRun) {
      return {
        status: 'simulated',
        message: 'Request simulated in dry-run mode',
        url,
        safetyChecks
      };
    }

    try {
      const response = await axios({
        url,
        method: options.method || 'GET',
        data: options.data,
        headers: options.headers,
        timeout: 10000,
        maxRedirects: 5,
        validateStatus: (status) => status < 500
      });

      return {
        status: 'success',
        data: response.data,
        statusCode: response.status,
        safetyChecks
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        url,
        safetyChecks
      };
    }
  }

  getSafetyReport(): any {
    const totalRequests = Array.from(this.requestCounts.values()).reduce((sum, requests) => sum + requests.length, 0);
    const identifiers = this.requestCounts.size;

    return {
      totalRequests,
      uniqueIdentifiers: identifiers,
      safeMode: config.safeMode,
      dryRun: config.dryRun,
      allowedDomains: this.SAFE_DOMAINS,
      rateLimits: {
        perMinute: this.MAX_REQUESTS_PER_MINUTE,
        perHour: this.MAX_REQUESTS_PER_HOUR
      }
    };
  }

  clearRateLimits(): void {
    this.requestCounts.clear();
  }
}