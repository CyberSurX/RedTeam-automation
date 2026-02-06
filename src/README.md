# Frontend (React + Vite)

React 18 + TypeScript + Tailwind CSS frontend for RedTeam Automation Platform.

## 📁 Structure

```
src/
├── main.tsx               # Application entry point
├── App.tsx                # Root component
├── index.css              # Global styles
├── pages/                 # Route pages
│   ├── Dashboard.tsx     # Main dashboard
│   ├── Programs.tsx      # Bug bounty programs
│   ├── Findings.tsx      # Vulnerability findings
│   ├── Scanning.tsx      # Automated scanning
│   ├── Reconnaissance.tsx # Discovery/recon
│   ├── Reports.tsx        # Security reports
│   └── Login.tsx          # Authentication
├── components/            # UI components
│   ├── ui/               # shadcn/radix components
│   ├── Layout.tsx        # Page layout
│   └── ProtectedRoute.tsx # Route protection
├── hooks/                 # React hooks
├── contexts/              # React contexts
│   └── AuthContext.tsx   # Authentication state
├── lib/                   # External libraries
└── utils/                 # Utility functions
```

## 🚀 Start Development Server

```bash
# From root directory
npm run dev:frontend

# Frontend runs on port 5173 (or 5174 if 5173 is taken)
```

## 🔨 Build for Production

```bash
npm run build:frontend
```

Build output goes to `dist/` directory.

## 📦 Install Dependencies

```bash
# From root
npm install

# Or just frontend dependencies (if needed)
npm install react react-dom react-router-dom lucide-react recharts zustand
```

## 🎨 Styling

- **Tailwind CSS** for styling
- **shadcn/ui** components in `src/components/ui/`
- **Lucide React** for icons

## 🔑 Key Features

- **Authentication:** Login/Register pages
- **Dashboard:** Overview of all programs and findings
- **Scanning:** Initiate automated security scans
- **Findings:** View and manage vulnerability findings
- **Reports:** Generate and view security reports
- **Real-time:** Socket.io integration for live updates

## 📡 API Connection

API configured in `.env`:

```bash
VITE_API_URL=http://localhost:3001
```

## 🛣️ Routing

React Router is used for navigation:

```typescript
<Routes>
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/programs" element={<Programs />} />
  <Route path="/findings" element={<Findings />} />
  <Route path="/scan" element={<Scanning />} />
  <Route path="/reports" element={<Reports />} />
</Routes>
```

## 🔧 Environment Variables

```bash
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=RedTeam Automation
```

## 📦 Main Dependencies

| Package | Purpose |
|---------|---------|
| react | UI framework |
| react-dom | React DOM renderer |
| react-router-dom | Client-side routing |
| tailwindcss | Styling |
| zustand | State management |
| lucide-react | Icons |
| recharts | Charts and graphs |
| axios | HTTP client |