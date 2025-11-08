import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Shield, 
  Target, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  Download,
  Eye,
  Filter,
  Plus
} from 'lucide-react';

interface ScanJob {
  id: string;
  programId: string;
  programName: string;
  type: 'port' | 'web' | 'vulnerability' | 'full';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  progress: number;
  startTime: string;
  endTime?: string;
  targets: string[];
  profile: string;
  findings: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  results: Array<{
    id: string;
    title: string;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    target: string;
    description: string;
    confidence: number;
    cve?: string;
  }>;
}

interface ScanProfile {
  id: string;
  name: string;
  type: 'port' | 'web' | 'vulnerability' | 'full';
  description: string;
  tools: string[];
  settings: Record<string, any>;
}

export const Scanning: React.FC = () => {
  const [jobs, setJobs] = useState<ScanJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [isNewScanOpen, setIsNewScanOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [targets, setTargets] = useState<string>('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const scanProfiles: ScanProfile[] = [
    {
      id: '1',
      name: 'Port Scan',
      type: 'port',
      description: 'Basic port scanning with service detection',
      tools: ['nmap', 'masscan'],
      settings: { ports: '1-1000', timing: 'T4' }
    },
    {
      id: '2',
      name: 'Web Application',
      type: 'web',
      description: 'Web application security testing',
      tools: ['nuclei', 'zap', 'nikto'],
      settings: { depth: 3, timeout: 30 }
    },
    {
      id: '3',
      name: 'Vulnerability Assessment',
      type: 'vulnerability',
      description: 'Comprehensive vulnerability scanning',
      tools: ['nuclei', 'nmap', 'testssl'],
      settings: { severity: 'medium+', templates: 'all' }
    },
    {
      id: '4',
      name: 'Full Security Audit',
      type: 'full',
      description: 'Complete security assessment',
      tools: ['nmap', 'nuclei', 'zap', 'testssl', 'nikto'],
      settings: { comprehensive: true, timeout: 60 }
    }
  ];

  useEffect(() => {
    // Simulate fetching scan jobs
    fetchScanJobs();
  }, []);

  const fetchScanJobs = async () => {
    // Mock API call - replace with actual API call
    setTimeout(() => {
      setJobs([
        {
          id: '1',
          programId: '1',
          programName: 'TechCorp Bug Bounty',
          type: 'full',
          status: 'running',
          progress: 45,
          startTime: new Date(Date.now() - 3600000).toISOString(),
          targets: ['app.techcorp.com', 'api.techcorp.com', 'admin.techcorp.com'],
          profile: 'Full Security Audit',
          findings: {
            critical: 2,
            high: 5,
            medium: 12,
            low: 23,
            info: 45
          },
          results: [
            {
              id: '1',
              title: 'SQL Injection in Login Form',
              severity: 'critical',
              target: 'app.techcorp.com/login',
              description: 'SQL injection vulnerability found in login form',
              confidence: 95,
              cve: 'CVE-2023-1234'
            },
            {
              id: '2',
              title: 'Cross-Site Scripting (XSS)',
              severity: 'high',
              target: 'app.techcorp.com/search',
              description: 'Reflected XSS vulnerability in search parameter',
              confidence: 90
            },
            {
              id: '3',
              title: 'Missing Security Headers',
              severity: 'medium',
              target: 'api.techcorp.com',
              description: 'Missing Content-Security-Policy header',
              confidence: 100
            }
          ]
        },
        {
          id: '2',
          programId: '2',
          programName: 'FinanceApp Security',
          type: 'web',
          status: 'completed',
          progress: 100,
          startTime: new Date(Date.now() - 7200000).toISOString(),
          endTime: new Date(Date.now() - 3600000).toISOString(),
          targets: ['financeapp.com', 'api.financeapp.com'],
          profile: 'Web Application',
          findings: {
            critical: 0,
            high: 2,
            medium: 8,
            low: 15,
            info: 32
          },
          results: [
            {
              id: '4',
              title: 'Weak SSL/TLS Configuration',
              severity: 'high',
              target: 'financeapp.com',
              description: 'Weak cipher suites supported',
              confidence: 85
            },
            {
              id: '5',
              title: 'Information Disclosure',
              severity: 'medium',
              target: 'api.financeapp.com',
              description: 'Server version disclosed in headers',
              confidence: 100
            }
          ]
        },
        {
          id: '3',
          programId: '3',
          programName: 'E-commerce Platform',
          type: 'port',
          status: 'failed',
          progress: 10,
          startTime: new Date(Date.now() - 1800000).toISOString(),
          targets: ['ecommerce.com'],
          profile: 'Port Scan',
          findings: {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            info: 0
          },
          results: []
        }
      ]);
    }, 1000);
  };

  const handleStartScan = async () => {
    if (!selectedProfile || !targets) {
      alert('Please select a scan profile and enter targets');
      return;
    }

    const profile = scanProfiles.find(p => p.id === selectedProfile);
    if (!profile) return;

    const newJob: ScanJob = {
      id: Date.now().toString(),
      programId: '1',
      programName: 'Manual Scan',
      type: profile.type,
      status: 'pending',
      progress: 0,
      startTime: new Date().toISOString(),
      targets: targets.split('\n').filter(t => t.trim()),
      profile: profile.name,
      findings: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        info: 0
      },
      results: []
    };

    setJobs([newJob, ...jobs]);
    
    // Simulate job starting
    setTimeout(() => {
      setJobs(prev => prev.map(job => 
        job.id === newJob.id 
          ? { ...job, status: 'running', progress: 5 }
          : job
      ));
    }, 2000);

    setIsNewScanOpen(false);
  };

  const handlePauseJob = async (jobId: string) => {
    setJobs(prev => prev.map(job => 
      job.id === jobId 
        ? { ...job, status: 'paused' }
        : job
    ));
  };

  const handleResumeJob = async (jobId: string) => {
    setJobs(prev => prev.map(job => 
      job.id === jobId 
        ? { ...job, status: 'running' }
        : job
    ));
  };

  const handleStopJob = async (jobId: string) => {
    setJobs(prev => prev.map(job => 
      job.id === jobId 
        ? { ...job, status: 'failed', progress: job.progress }
        : job
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'text-blue-600 bg-blue-100';
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      case 'info':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredResults = (results: any[]) => {
    if (filterSeverity === 'all') return results;
    return results.filter(result => result.severity === filterSeverity);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vulnerability Scanning</h1>
          <p className="text-gray-600 mt-1">Scan targets for security vulnerabilities</p>
        </div>
        <Button onClick={() => setIsNewScanOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Scan
        </Button>
      </div>

      {/* New Scan Modal */}
      {isNewScanOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Configure Vulnerability Scan</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scan Profile</label>
                <select
                  value={selectedProfile}
                  onChange={(e) => setSelectedProfile(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a profile</option>
                  {scanProfiles.map(profile => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name} - {profile.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Targets (one per line)</label>
                <textarea
                  value={targets}
                  onChange={(e) => setTargets(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="app.example.com&#10;api.example.com&#10;admin.example.com"
                />
              </div>

              {selectedProfile && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Selected Tools</label>
                  <div className="flex flex-wrap gap-1">
                    {scanProfiles.find(p => p.id === selectedProfile)?.tools.map(tool => (
                      <Badge key={tool} variant="secondary" className="text-xs">
                        {tool}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={() => setIsNewScanOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleStartScan}>
                Start Scan
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Jobs List */}
      <div className="space-y-4">
        {jobs.map((job) => (
          <Card key={job.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${getStatusColor(job.status)}`}>
                    {job.status === 'running' && <Play className="h-4 w-4" />}
                    {job.status === 'completed' && <CheckCircle className="h-4 w-4" />}
                    {job.status === 'failed' && <XCircle className="h-4 w-4" />}
                    {job.status === 'pending' && <Clock className="h-4 w-4" />}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{job.programName}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <Shield className="h-4 w-4 mr-1" />
                      {job.profile}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(job.status)}>
                    {job.status.toUpperCase()}
                  </Badge>
                  {job.status === 'running' && (
                    <div className="flex space-x-1">
                      <Button size="sm" variant="outline" onClick={() => handlePauseJob(job.id)}>
                        <Pause className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleStopJob(job.id)}>
                        <XCircle className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  {job.status === 'paused' && (
                    <Button size="sm" variant="outline" onClick={() => handleResumeJob(job.id)}>
                      <Play className="h-3 w-3" />
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setSelectedJob(selectedJob === job.id ? null : job.id)}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                {/* Progress */}
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{job.progress}%</span>
                  </div>
                  <Progress value={job.progress} className="h-2" />
                </div>

                {/* Targets */}
                <div>
                  <div className="text-sm text-gray-600 mb-2">Targets</div>
                  <div className="flex flex-wrap gap-1">
                    {job.targets.map(target => (
                      <Badge key={target} variant="outline" className="text-xs">
                        {target}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Findings Summary */}
                <div className="grid grid-cols-5 gap-2">
                  <div className="text-center p-2 bg-red-50 rounded">
                    <div className="text-lg font-bold text-red-600">{job.findings.critical}</div>
                    <div className="text-xs text-gray-500">Critical</div>
                  </div>
                  <div className="text-center p-2 bg-orange-50 rounded">
                    <div className="text-lg font-bold text-orange-600">{job.findings.high}</div>
                    <div className="text-xs text-gray-500">High</div>
                  </div>
                  <div className="text-center p-2 bg-yellow-50 rounded">
                    <div className="text-lg font-bold text-yellow-600">{job.findings.medium}</div>
                    <div className="text-xs text-gray-500">Medium</div>
                  </div>
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <div className="text-lg font-bold text-blue-600">{job.findings.low}</div>
                    <div className="text-xs text-gray-500">Low</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="text-lg font-bold text-gray-600">{job.findings.info}</div>
                    <div className="text-xs text-gray-500">Info</div>
                  </div>
                </div>

                {/* Detailed View */}
                {selectedJob === job.id && (
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">Scan Results</h4>
                      <div className="flex items-center space-x-2">
                        <Filter className="h-4 w-4 text-gray-500" />
                        <select
                          value={filterSeverity}
                          onChange={(e) => setFilterSeverity(e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="all">All Severities</option>
                          <option value="critical">Critical</option>
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                          <option value="info">Info</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {filteredResults(job.results).map((result) => (
                        <div key={result.id} className="border rounded-lg p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <Badge className={getSeverityColor(result.severity)}>
                                  {result.severity.toUpperCase()}
                                </Badge>
                                {result.cve && (
                                  <Badge variant="outline" className="text-xs">
                                    {result.cve}
                                  </Badge>
                                )}
                                <Badge variant="outline" className="text-xs">
                                  {result.confidence}% confidence
                                </Badge>
                              </div>
                              <h5 className="font-medium text-sm">{result.title}</h5>
                              <p className="text-xs text-gray-600 mt-1">{result.description}</p>
                              <p className="text-xs text-gray-500 mt-1">Target: {result.target}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex justify-end space-x-2 mt-3">
                      <Button size="sm" variant="outline">
                        <Download className="h-3 w-3 mr-1" />
                        Export Report
                      </Button>
                      <Button size="sm" variant="outline">
                        <Settings className="h-3 w-3 mr-1" />
                        Configure
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};