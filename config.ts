import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

export const config = {
  // Safety Settings
  safeMode: process.env.SAFE_MODE === 'true',
  dryRun: process.env.DRY_RUN === 'true',
  
  // Platform API Keys
  hackerOneApiKey: process.env.HACKERONE_API_KEY || '',
  hackerOneEmail: process.env.HACKERONE_EMAIL || '',
  hackerOneUsername: process.env.HACKERONE_USERNAME || '',
  bugcrowdApiKey: process.env.BUGCROWD_API_KEY || '',
  bugcrowdEmail: process.env.BUGCROWD_EMAIL || '',
  devpostApiKey: process.env.DEVPOST_API_KEY || '',
  
  // Rate Limiting
  testRateLimit: parseInt(process.env.TEST_RATE_LIMIT || '10'),
  maxVulnerabilitiesPerScan: parseInt(process.env.MAX_VULNERABILITIES_PER_SCAN || '5'),
  
  // Revenue Settings
  minBountyAmount: parseInt(process.env.MIN_BOUNTY_AMOUNT || '20'),
  maxBountyAmount: parseInt(process.env.MAX_BOUNTY_AMOUNT || '5000'),
  
  // Database
  databaseUrl: process.env.DATABASE_URL || 'sqlite:./test-revenue.db',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  logFile: process.env.LOG_FILE || './logs/test-revenue.log',
  
  // Stripe Configuration
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripePublicKey: process.env.STRIPE_PUBLIC_KEY || '',
  
  // Test Settings
  testMode: process.env.TEST_MODE === 'true',
  validateScopes: process.env.VALIDATE_SCOPES === 'true'
};

export default config;
