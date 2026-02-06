# Platform Clients

Bug bounty platform API integrations for HackerOne, Bugcrowd, and Devpost.

## 📁 Structure

```
platform-clients/
├── hackerone.ts       # HackerOne API client
├── bugcrowd.ts        # Bugcrowd API client
└── devpost.ts         # Devpost API client
```

---

## 🔓 HackerOne Client

### Purpose
Interact with HackerOne platform to fetch programs, submit findings, and manage submissions.

### Authentication

HackerOne uses API key authentication. Set in `.env`:

```bash
HACKERONE_API_KEY=your-hackerone-api-key
HACKERONE_EMAIL=your-email@example.com
HACKERONE_USERNAME=your-username
```

### Usage

```typescript
import { HackerOneClient } from './hackerone';

const client = new HackerOneClient({
  apiKey: process.env.HACKERONE_API_KEY,
  email: process.env.HACKERONE_EMAIL,
  username: process.env.HACKERONE_USERNAME
});

// Get all programs
const programs = await client.getPrograms();

// Get program details
const program = await client.getProgram('program-id');

// Submit a finding
await client.submitFinding({
  programId: 'program-id',
  title: 'XSS vulnerability',
  description: 'Detailed description...',
  severity: 'medium',
  url: 'https://example.com/vuln',
  proof: 'Proof of concept...',
  weakness: 'Cross-Site Scripting (XSS)'
});
```

### API Methods

| Method | Description |
|--------|-------------|
| `getPrograms()` | List all accessible programs |
| `getProgram(id)` | Get program details |
| `submitFinding(data)` | Submit a vulnerability report |
| `getReport(id)` | Get submission report details |
| `getScope(id)` | Get program scope |

---

## 🎯 Bugcrowd Client

### Purpose
Interact with Bugcrowd platform for program management and submissions.

### Authentication

Set in `.env`:

```bash
BUGCROWD_API_KEY=your-bugcrowd-api-key
BUGCROWD_EMAIL=your-email@example.com
```

### Usage

```typescript
import { BugcrowdClient } from './bugcrowd';

const client = new BugcrowdClient({
  apiKey: process.env.BUGCROWD_API_KEY,
  email: process.env.BUGCROWD_EMAIL
});

// Get programs
const programs = await client.getPrograms();

// Submit finding
await client.submitFinding({
  targetId: 'target-id',
  title: 'SQL Injection',
  description: '...',
  severity: 'high',
  reproducible: true,
  impact: 'Data breach risk',
  poc: 'Proof...'
});
```

### API Methods

| Method | Description |
|--------|-------------|
| `getPrograms()` | List all programs |
| `getTarget(id)` | Get target scope |
| `submitFinding(data)` | Submit vulnerability report |
| `getSubmission(id)` | Get submission status |

---

## 🏆 Devpost Client

### Purpose
Interact with Devpost for hackathon submissions and project management.

### Authentication

Set in `.env`:

```bash
DEVPOST_API_KEY=your-devpost-api-key
```

### Usage

```typescript
import { DevpostClient } from './devpost';

const client = new DevpostClient({
  apiKey: process.env.DEVPOST_API_KEY
});

// Get hackathons
const hackathons = await client.getHackathons();

// Submit project
await client.submitProject({
  hackathonId: 'hackathon-id',
  title: 'Security Scanner',
  description: '...',
  repository: 'https://github.com/user/repo'
});
```

### API Methods

| Method | Description |
|--------|-------------|
| `getHackathons()` | List hackathons |
| `getHackathon(id)` | Get hackathon details |
| `submitProject(data)` | Submit project to hackathon |
| `getSubmissions(id)` | Get hackathon submissions |

---

## 🔄 Dry Run Mode

All clients support dry run mode for testing without actual submissions:

```typescript
const client = new HackerOneClient({
  apiKey: 'test-key',
  email: 'test@example.com',
  username: 'testuser',
  dryRun: true  // Only log, don't actually submit
});
```

---

## 🧪 Testing

### Test API Connection

```typescript
// Test HackerOne connection
await client.testConnection();

// Check rate limits
const limits = await client.getRateLimits();
console.log('Remaining requests:', limits.remaining);
```

---

## 📊 Common Operations

### Get Platform Statistics

```typescript
// HackerOne
const stats = await client.getStatistics();

// Bugcrowd
const stats = await client.getStatistics();

// Devpost
const stats = await client.getStatistics();
```

### Search Programs

```typescript
// HackerOne
const programs = await client.searchPrograms({ keyword: 'payment' });

// Bugcrowd
const programs = await client.searchPrograms({ target_type: 'web_app' });

// Devpost
const hackathons = await client.searchHackathons({ technology: 'react' });
```

---

## 🔑 Dependencies

| Package | Purpose |
|---------|---------|
| axios | HTTP requests |
| dotenv | Environment variables |

---

## 📝 Error Handling

All clients implement error handling:

```typescript
try {
  await client.submitFinding(data);
} catch (error) {
  if (error.code === 'RATE_LIMIT') {
    console.log('Rate limited. Try again later.');
  } else if (error.code === 'INVALID_SCOPE') {
    console.log('Finding outside program scope.');
  }
}
```