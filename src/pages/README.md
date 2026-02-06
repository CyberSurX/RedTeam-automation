# Page Components

React page components for the RedTeam automation frontend.

## 📁 Structure

```
pages/
├── Home.tsx             # Landing page
├── Login.tsx            # Login page
├── Dashboard.tsx        # Main dashboard
├── Programs.tsx         # Bug bounty programs
├── Findings.tsx         # Vulnerability findings
├── Scanning.tsx         # Scanning operations
├── Reconnaissance.tsx   # Reconnaissance tools
├── Exploitation.tsx     # Exploit testing
├── Reports.tsx          # Security reports
├── Analytics.tsx        # Analytics and metrics
└── Settings.tsx         # User settings
```

---

## 🏠 Home (Home.tsx)

### Purpose
Landing page with overview of the platform features.

### Features
- Feature showcase
- Getting started guide
- Call to action

---

## 🔐 Login (Login.tsx)

### Purpose
User authentication page.

### Features
- Username/password login
- JWT token handling
- Error display
- Remember me option

### Usage

```typescript
// Redirects to /dashboard on successful login
// Stores JWT token in localStorage
// Redirects unauthenticated users
```

---

## 📊 Dashboard (Dashboard.tsx)

### Purpose
Main dashboard showing overview of all activities.

### Features
- Quick stats (programs, findings, reports)
- Recent activity feed
- Quick action buttons
- System health status

---

## 📋 Programs (Programs.tsx)

### Purpose
Manage bug bounty programs from HackerOne, Bugcrowd, and Devpost.

### Features
- List all programs
- Add new programs
- View program details
- Edit program settings
- Delete programs

### Program Properties

| Property | Description |
|----------|-------------|
| Name | Program name |
| Platform | hackerone, bugcrowd, devpost |
| Scope | Target scope definition |
| Status | active, paused, closed |
| Bounty Range | Payout range |

---

## 🔍 Findings (Findings.tsx)

### Purpose
Manage vulnerability findings discovered during testing.

### Features
- List all findings
- View finding details
- Edit findings
- Delete findings
- Filter by severity, status, program
- Submit to platform

### Finding States

| Status | Description |
|--------|-------------|
| draft | Not yet submitted |
| submitted | Submitted to platform |
| resolved | Fixed by program |

### Severity Levels

| Severity | Color |
|----------|-------|
| Critical | Red |
| High | Orange |
| Medium | Yellow |
| Low | Blue |
| Informational | Gray |

---

## 📡 Scanning (Scanning.tsx)

### Purpose
Port and vulnerability scanning interface.

### Features
- Start port scans
- Start vulnerability scans
- View scan results
- Schedule recurring scans
- Scan history

### Scan Types

| Type | Tool | Description |
|------|------|-------------|
| Port Scan | nmap | Discover open ports |
| Vuln Scan | nuclei | Find vulnerabilities |
| Web Scan | nuclei | Web application vulns |

---

## 🕵️ Reconnaissance (Reconnaissance.tsx)

### Purpose
Subdomain enumeration and asset discovery tools.

### Features
- Subdomain enumeration (amass, subfinder)
- Active host verification
- Asset discovery
- Recon history

### Tools

| Tool | Description |
|------|-------------|
| amass | Comprehensive subdomain enumeration |
| subfinder | Fast subdomain discovery |

---

## 💥 Exploitation (Exploitation.tsx)

### Purpose
Exploit testing and validation interface.

### Features
- Validate exploits
- Test payloads
- View exploit results
- Safe testing mode

### Safety
- Requires explicit confirmation
- Only runs in authorized environments
- Results logged for audit

---

## 📄 Reports (Reports.tsx)

### Purpose
Generate and manage security assessment reports.

### Features
- Generate new reports
- View report details
- Export reports (PDF, HTML, JSON)
- Report templates
- Report history

### Report Types

| Type | Description |
|------|-------------|
| Vulnerability Assessment | Standard vuln assessment |
| Penetration Test | Full pentest report |
| Executive Summary | High-level overview |

---

## 📈 Analytics (Analytics.tsx)

### Purpose
Analytics and metrics dashboard.

### Features
- Charts and graphs
- Finding trends
- Program performance
- User activity stats
- Time range filtering

---

## ⚙️ Settings (Settings.tsx)

### Purpose
User account and platform settings.

### Features
- Profile settings
- Platform credentials (HackerOne, Bugcrowd, Devpost)
- Notification preferences
- API key management
- Security settings

---

## 🔄 Page Navigation

Pages are connected via React Router:

```typescript
// src/App.tsx
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/login" element={<Login />} />
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/programs" element={<Programs />} />
  <Route path="/findings" element={<Findings />} />
  <Route path="/scanning" element={<Scanning />} />
  <Route path="/recon" element={<Reconnaissance />} />
  <Route path="/exploitation" element={<Exploitation />} />
  <Route path="/reports" element={<Reports />} />
  <Route path="/analytics" element={<Analytics />} />
  <Route path="/settings" element={<Settings />} />
</Routes>
```

---

## 🎨 Common UI Patterns

### Protected Pages

Most pages require authentication:

```typescript
import { useAuth } from '../contexts/AuthContext';

function Dashboard() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  // ...
}
```

### Data Fetching

Pages use React hooks for data fetching:

```typescript
import { useState, useEffect } from 'react';
import axios from 'axios';

function Programs() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/programs')
      .then(res => setPrograms(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  // ...
}
```

---

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

---

## 📱 Responsive Design

All pages are responsive using Tailwind CSS breakpoints:

| Breakpoint | Width |
|------------|-------|
| sm | 640px |
| md | 768px |
| lg | 1024px |
| xl | 1280px |
| 2xl | 1536px |