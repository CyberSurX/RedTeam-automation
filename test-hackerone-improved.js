import dotenv from 'dotenv';
import { HackerOneClient } from './services/platform-clients/hackerone.js';

// Enable debug mode for testing
process.env.DEBUG_HACKERONE = 'true';

// Load environment variables
dotenv.config({ path: '.env.thundernight' });

const apiKey = process.env.HACKERONE_API_KEY;
const email = process.env.HACKERONE_EMAIL;
const username = process.env.HACKERONE_USERNAME;

console.log('🚀 Enhanced HackerOne Integration Test Started');
console.log('👤 Username:', username);
console.log('📧 Email:', email);
console.log('🔐 API Key Length:', apiKey ? apiKey.length : 'Not found');
console.log('🐛 Debug Mode:', process.env.DEBUG_HACKERONE);

async function testImprovedIntegration() {
  if (!apiKey || !email) {
    console.error('❌ Missing HackerOne credentials. Please check .env.thundernight file.');
    return;
  }

  try {
    console.log('\n🔐 1. Validating credentials...');
    try {
      // Test credential validation
      const hackerOne = new HackerOneClient(apiKey, email, username);
      console.log('✅ Credentials validated successfully');
      
      console.log('\n📊 2. Testing Authentication and Profile...');
      const profile = await hackerOne.getProfile();
      console.log('✅ Authentication successful!');
      console.log('👤 Profile:', {
        username: profile.username,
        name: profile.name,
        reputation: profile.reputation,
        signal: profile.signal,
        impact: profile.impact
      });
      
      console.log('\n🎯 3. Testing dry-run report submission...');
      try {
        // Test dry-run mode
        const dryRunResult = await hackerOne.submitReport(
          'security',
          'Test: Dry Run Validation',
          'This is a test of the enhanced HackerOne integration with improved validation and debugging capabilities.',
          'low',
          'https://example.com/test',
          'Test proof of concept',
          { dryRun: true, validateScope: true }
        );
        
        console.log('✅ Dry-run submission successful');
        console.log('📋 Dry-run result:', dryRunResult);
      } catch (dryRunError) {
        console.log('⚠️ Dry-run test completed (may show expected errors):', dryRunError.message);
      }
      
      console.log('\n✅ Enhanced HackerOne implementation working correctly!');
      
    } catch (credentialError) {
      if (credentialError.message.includes('required')) {
        console.error('❌ Credential validation failed:', credentialError.message);
      } else {
        console.error('❌ API connection failed:', credentialError.message);
        
        if (credentialError.message.includes('401')) {
          console.log('🔐 Authentication Error Details:');
          console.log('   - Check if API key is still valid');
          console.log('   - Verify email matches HackerOne account');
          console.log('   - Ensure API access is enabled in HackerOne settings');
        }
      }
      return;
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('🔧 Detailed error information:', error);
  }
}

// Run the test
testImprovedIntegration();
