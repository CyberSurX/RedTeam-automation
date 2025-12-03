# Enhanced HackerOne Integration v2.0

This document describes the improved HackerOne integration for the RedTeam Automation platform, providing enhanced capabilities for interacting with HackerOne's API with better validation, debugging, and error handling.

## Overview

The enhanced v2.0 integration includes:
- **Enhanced credential validation** - Validates API keys, email formats, and required parameters before API calls
- **Improved debugging capabilities** - Request/response interceptors with detailed logging when DEBUG_HACKERONE=true
- **Better error handling** - More descriptive error messages with specific troubleshooting guidance
- **Dry run mode** - Test report submission without actual submission using { dryRun: true }
- **Enhanced scope validation** - Improved matching for URL, WILDCARD, CIDR, and IP scope types
- **Input validation** - Comprehensive validation for report submission parameters
- **TypeScript improvements** - Better type safety and eslint compliance

## Setup

### Environment Variables

Ensure your `.env.thundernight` file contains:

```env
HACKERONE_API_KEY=your-hackerone-api-key
HACKERONE_EMAIL=your-email@example.com
HACKERONE_USERNAME=your-hackerone-username
```

### Debug Mode

Enable detailed debugging by setting:
```env
DEBUG_HACKERONE=true
```

### Installation

The integration is included in the `services/platform-clients/hackerone.ts` module.

## Usage Examples

### Basic Authentication Test

```javascript
import { HackerOneClient } from './services/platform-clients/hackerone.js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.thundernight' });

const hackerOne = new HackerOneClient(
  process.env.HACKERONE_API_KEY,
  process.env.HACKERONE_EMAIL,
  process.env.HACKERONE_USERNAME
);

// Test authentication
const profile = await hackerOne.getProfile();
console.log('Authenticated as:', profile.username);
```

### Program Discovery

```javascript
// Get all available programs
const programs = await hackerOne.getPrograms();

// Get specific program details
const program = await hackerOne.getProgram('security');

// Check if program is active
const isActive = await hackerOne.isProgramActive('security');
```

### Scope Validation

```javascript
// Validate if a target is in scope
const target = 'https://example.com/api/v1';
const isValid = await hackerOne.validateScope('security', target);

if (isValid) {
  console.log('Target is in scope!');
} else {
  console.log('Target is out of scope');
}
```

### Report Management

```javascript
// Get recent reports
const reports = await hackerOne.getReports(10);

// Get report details
const report = await hackerOne.getReport('123456');

// Get template suggestions for a program
const templates = await hackerOne.getReportTemplates('security');
```

### Enhanced Report Submission

```javascript
// With dry-run mode and enhanced validation
try {
  const submission = await hackerOne.submitReport(
    'security', // program handle
    'SQL Injection in Login Endpoint', // title
    'Detailed vulnerability description...', // summary
    'critical', // severity
    'https://example.com/login', // affected asset
    'Proof of concept steps...', // PoC
    { 
      dryRun: true, // Test without actual submission
      validateScope: true // Validate target is in scope
    }
  );
  
  console.log('Dry-run successful:', submission);
} catch (error) {
  console.error('Submission failed:', error.message);
}

// Real submission (when ready)
try {
  const realSubmission = await hackerOne.submitReport(
    'security',
    'SQL Injection in Login Endpoint',
    'Detailed vulnerability description...',
    'critical',
    'https://example.com/login',
    'Proof of concept steps...',
    { validateScope: true } // Validate scope before submission
  );
  
  console.log('Report submitted:', realSubmission.url);
} catch (error) {
  console.error('Submission failed:', error.message);
}
```

## API Reference

### HackerOneClient Class

#### Constructor
```javascript
new HackerOneClient(apiKey: string, email: string, username?: string)
```

#### Methods

**getProfile()**
- Returns: `Promise<HackerOneUserProfile>`
- Gets researcher profile information

**getPrograms()**
- Returns: `Promise<HackerOneProgram[]>`
- Lists all available programs

**getProgram(programHandle: string)**
- Returns: `Promise<HackerOneProgram>`
- Gets detailed program information

**getProgramScope(programHandle: string)**
- Returns: `Promise<HackerOneScope[]>`
- Gets program scope information

**getReports(limit?: number)**
- Returns: `Promise<HackerOneReport[]>`
- Gets researcher's reports

**getReport(reportId: string)**
- Returns: `Promise<HackerOneReport>`
- Gets specific report details

**submitReport(programHandle, title, summary, severity, affectedAsset?, proofOfConcept?)**
- Returns: `Promise<HackerOneSubmissionResponse>`
- Submits a new report

**validateScope(programHandle: string, target: string)**
- Returns: `Promise<boolean>`
- Validates if target is in scope

**isProgramActive(programHandle: string)**
- Returns: `Promise<boolean>`
- Checks if program accepts submissions

**getReportTemplates(programHandle: string)**
- Returns: `Promise<string[]>`
- Suggests report templates

### Interfaces

#### HackerOneUserProfile
```typescript
{
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
```

#### HackerOneProgram
```typescript
{
  id: string;
  name: string;
  handle: string;
  currency: string;
  bounty_table: Array<BountyEntry>;
  submission_state: string;
  triage_active: boolean;
  submission_information: string;
  started_accepting_at: string;
}
```

#### HackerOneReport
```typescript
{
  id: string;
  title: string;
  state: string;
  bounty_amount: number;
  currency: string;
  severity_rating: string;
  substate: string;
  triaged_at: string;
  closed_at: string;
  awarded_at: string;
  created_at: string;
  vulnerability_information: string;
  url: string;
  reporter: {
    username: string;
    name: string;
  };
}
```

## Enhanced Error Handling

The v2.0 integration provides much more detailed error handling:

```javascript
try {
  await hackerOne.getProfile();
} catch (error) {
  // Error message includes specific API response details and troubleshooting guidance
  console.error('Error:', error.message);
  
  // Debug mode provides additional request/response details
  if (process.env.DEBUG_HACKERONE) {
    console.error('Debug details:', error);
  }
}
```

Common error scenarios:
- **401**: Authentication failure
  - Check API key validity and format
  - Verify email matches HackerOne account
  - Ensure API access is enabled in HackerOne settings
- **403**: Permission denied (check account permissions and program access)
- **404**: Resource not found (verify program handle or report ID)
- **429**: Rate limit exceeded (implement retry logic)
- **Input validation errors**: Check required parameters and formatting

## Testing

Run the enhanced test to verify integration:

```bash
node test-hackerone-enhanced.js
```

## Integration with Services

The improved v2.0 client is ready for integration with the red team automation services:

```javascript
import { HackerOneClient } from './services/platform-clients/hackerone.js';

class EnhancedSecurityService {
  constructor(config) {
    this.hackerOne = new HackerOneClient(
      config.apiKey,
      config.email,
      config.username
    );
  }

  async validateAndSubmitReport(report, programHandle, options = {}) {
    // Validate program is active
    const isActive = await this.hackerOne.isProgramActive(programHandle);
    if (!isActive) {
      throw new Error(`Program ${programHandle} is not accepting submissions`);
    }
    
    // Validate scope
    if (report.affectedAsset) {
      const isInScope = await this.hackerOne.validateScope(
        programHandle,
        report.affectedAsset
      );
      
      if (!isInScope) {
        throw new Error(`Target ${report.affectedAsset} is not in program scope`);
      }
    }
    
    // Submit with enhanced validation
    return await this.hackerOne.submitReport(
      programHandle,
      report.title,
      report.description,
      report.severity,
      report.affectedAsset,
      report.proofOfConcept,
      options
    );
  }

  async getProgramSuggestions(vulnerabilities) {
    const programs = await this.hackerOne.getPrograms();
    
    // Filter for active programs and match based on vulnerability type
    return programs.filter(program => 
      program.submission_state === 'open' && 
      program.triage_active
    );
  }
}
```

## Best Practices

1. **Always validate scope** before submitting reports
2. **Check program activity** to avoid rejected submissions
3. **Use appropriate severity levels** based on impact
4. **Include proof of concept** when possible
5. **Monitor rate limits** and implement retry logic
6. **Handle errors gracefully** with user-friendly messages

## Troubleshooting

### Common Issues

**Authentication failures:**
- Verify API key is correct
- Check username/email matches HackerOne account
- Ensure API access is enabled in HackerOne settings

**Permission errors:**
- Verify account has necessary permissions
- Check if program requires invitation

**Scope validation failures:**
- Verify target URL matches program scope
- Check asset type (URL, WILDCARD, etc.)

### Debug Mode Enhancements

Debug mode now provides comprehensive logging:

```bash
# Enable debug mode to see detailed request/response information
DEBUG_HACKERONE=true node test-hackerone-improved.js
```

Debug output includes:
- Request URLs and methods
- Request payloads (when applicable)
- Response status codes and messages
- Detailed error information
- Scope validation progress

### Testing Improvements

Run the improved test:
```bash
npx tsx test-hackerone-improved.js
```

The improved test demonstrates:
- Credential validation
- Debug mode functionality
- Dry-run report submission
- Enhanced error handling with specific guidance

This v2.0 integration provides a much more robust and developer-friendly foundation for automated security testing and reporting workflows.
