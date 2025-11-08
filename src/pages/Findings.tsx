import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  AlertTriangle, 
  Shield, 
  Target, 
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  Search,
  Download,
  Eye,
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown,
  Tag,
  User,
  Calendar
} from 'lucide-react';

interface Finding {
  id: string;
  programId: string;
  programName: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  confidence: number;
  status: 'new' | 'triaged' | 'confirmed' | 'false_positive' | 'duplicate' | 'accepted' | 'rejected';
  type: 'sql_injection' | 'xss' | 'idor' | 'xxe' | 'ssrf' | 'lfi' | 'command_injection' | 'misconfiguration' | 'information_disclosure';
  target: string;
  cve?: string;
  cvss?: number;
  remediation: string;
  impact: string;
  likelihood: string;
  risk_score: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  triagedBy?: string;
  triagedAt?: string;
  reporter?: string;
  evidence: Array<{
    type: 'screenshot' | 'log' | 'request' | 'response' | 'file';
    data: string;
    description: string;
  }>;
  comments: Array<{
    id: string;
    author: string;
    content: string;
    createdAt: string;
  }>;
}

interface TriageConfig {
  autoTriage: boolean;
  severityThreshold: string;
  confidenceThreshold: number;
  falsePositiveRules: string[];
  duplicateDetection: boolean;
}

export const Findings: React.FC = () => {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [selectedFinding, setSelectedFinding] = useState<string | null>(null);
  const [isTriageModalOpen, setIsTriageModalOpen] = useState(false);
  const [triageConfig, setTriageConfig] = useState<TriageConfig>({
    autoTriage: true,
    severityThreshold: 'medium',
    confidenceThreshold: 70,
    falsePositiveRules: ['common_misconfigurations', 'ssl_scanner_artifacts'],
    duplicateDetection: true
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'severity' | 'confidence' | 'createdAt' | 'risk_score'>('severity');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    // Simulate fetching findings
    fetchFindings();
  }, []);

  const fetchFindings = async () => {
    // Mock API call - replace with actual API call
    setTimeout(() => {
      setFindings([
        {
          id: '1',
          programId: '1',
          programName: 'TechCorp Bug Bounty',
          title: 'SQL Injection in Login Form',
          description: 'SQL injection vulnerability found in the login form username parameter. An attacker could potentially extract sensitive data from the database.',
          severity: 'critical',
          confidence: 95,
          status: 'confirmed',
          type: 'sql_injection',
          target: 'app.techcorp.com/login',
          cve: 'CVE-2023-1234',
          cvss: 9.8,
          remediation: 'Use parameterized queries and input validation',
          impact: 'Complete database compromise',
          likelihood: 'High',
          risk_score: 9.5,
          tags: ['sql', 'authentication', 'database'],
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 3600000).toISOString(),
          triagedBy: 'security_analyst',
          triagedAt: new Date(Date.now() - 7200000).toISOString(),
          reporter: 'automated_scanner',
          evidence: [
            {
              type: 'screenshot',
              data: '/evidence/sql-injection-proof.png',
              description: 'Database error revealing table structure'
            },
            {
              type: 'request',
              data: 'POST /login HTTP/1.1\nContent-Type: application/x-www-form-urlencoded\n\nusername=admin\' OR 1=1--&password=test',
              description: 'Malicious request payload'
            }
          ],
          comments: [
            {
              id: '1',
              author: 'security_analyst',
              content: 'Confirmed SQL injection vulnerability. Database version extracted successfully.',
              createdAt: new Date(Date.now() - 7200000).toISOString()
            }
          ]
        },
        {
          id: '2',
          programId: '1',
          programName: 'TechCorp Bug Bounty',
          title: 'Cross-Site Scripting (XSS)',
          description: 'Reflected XSS vulnerability in search parameter allows execution of arbitrary JavaScript.',
          severity: 'high',
          confidence: 90,
          status: 'triaged',
          type: 'xss',
          target: 'app.techcorp.com/search',
          cvss: 8.8,
          remediation: 'Implement proper input sanitization and output encoding',
          impact: 'Session hijacking, data theft',
          likelihood: 'Medium',
          risk_score: 7.9,
          tags: ['xss', 'javascript', 'search'],
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          updatedAt: new Date(Date.now() - 10800000).toISOString(),
          reporter: 'automated_scanner',
          evidence: [
            {
              type: 'screenshot',
              data: '/evidence/xss-alert.png',
              description: 'JavaScript alert executed'
            }
          ],
          comments: []
        },
        {
          id: '3',
          programId: '2',
          programName: 'FinanceApp Security',
          title: 'Missing Security Headers',
          description: 'Content-Security-Policy header is missing, increasing risk of XSS attacks.',
          severity: 'medium',
          confidence: 100,
          status: 'false_positive',
          type: 'misconfiguration',
          target: 'api.financeapp.com',
          cvss: 4.3,
          remediation: 'Add Content-Security-Policy header',
          impact: 'Increased XSS risk',
          likelihood: 'Low',
          risk_score: 4.3,
          tags: ['headers', 'configuration'],
          createdAt: new Date(Date.now() - 259200000).toISOString(),
          updatedAt: new Date(Date.now() - 14400000).toISOString(),
          triagedBy: 'security_analyst',
          triagedAt: new Date(Date.now() - 14400000).toISOString(),
          reporter: 'automated_scanner',
          evidence: [],
          comments: [
            {
              id: '2',
              author: 'security_analyst',
              content: 'Marked as false positive. This is a low-risk finding for internal API.',
              createdAt: new Date(Date.now() - 14400000).toISOString()
            }
          ]
        },
        {
          id: '4',
          programId: '3',
          programName: 'E-commerce Platform',
          title: 'Weak SSL/TLS Configuration',
          description: 'Server supports weak cipher suites and TLS 1.0.',
          severity: 'high',
          confidence: 95,
          status: 'new',
          type: 'misconfiguration',
          target: 'ecommerce.com',
          cvss: 7.5,
          remediation: 'Disable weak ciphers and TLS 1.0/1.1',
          impact: 'Man-in-the-middle attacks',
          likelihood: 'Medium',
          risk_score: 7.1,
          tags: ['ssl', 'tls', 'encryption'],
          createdAt: new Date(Date.now() - 43200000).toISOString(),
          updatedAt: new Date(Date.now() - 43200000).toISOString(),
          reporter: 'automated_scanner',
          evidence: [],
          comments: []
        }
      ]);
    }, 1000);
  };

  const handleTriage = async (findingId: string, status: Finding['status']) => {
    setFindings(prev => prev.map(finding => 
      finding.id === findingId 
        ? { 
            ...finding, 
            status,
            triagedBy: 'current_user',
            triagedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        : finding
    ));
  };

  const handleBulkTriage = async (status: Finding['status']) => {
    const newFindings = findings.filter(f => f.status === 'new');
    setFindings(prev => prev.map(finding => 
      newFindings.includes(finding)
        ? { 
            ...finding, 
            status,
            triagedBy: 'current_user',
            triagedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        : finding
    ));
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'triaged':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-red-100 text-red-800';
      case 'false_positive':
        return 'bg-gray-100 text-gray-800';
      case 'duplicate':
        return 'bg-purple-100 text-purple-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sql_injection':
        return '🗃️';
      case 'xss':
        return '🌐';
      case 'idor':
        return '🔑';
      case 'xxe':
        return '📄';
      case 'ssrf':
        return '🌐';
      case 'lfi':
        return '📁';
      case 'command_injection':
        return '💻';
      case 'misconfiguration':
        return '⚙️';
      case 'information_disclosure':
        return '👁️';
      default:
        return '🔍';
    }
  };

  const filteredAndSortedFindings = () => {
    let filtered = findings.filter(finding => {
      const matchesSearch = searchTerm === '' || 
        finding.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        finding.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        finding.target.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSeverity = filterSeverity === 'all' || finding.severity === filterSeverity;
      const matchesStatus = filterStatus === 'all' || finding.status === filterStatus;
      
      return matchesSearch && matchesSeverity && matchesStatus;
    });

    return filtered.sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'severity':
          const severityOrder = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };
          aValue = severityOrder[a.severity];
          bValue = severityOrder[b.severity];
          break;
        case 'confidence':
          aValue = a.confidence;
          bValue = b.confidence;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'risk_score':
          aValue = a.risk_score;
          bValue = b.risk_score;
          break;
        default:
          return 0;
      }
      
      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });
  };

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Findings Management</h1>
          <p className="text-gray-600 mt-1">Review, triage, and manage security findings</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => handleBulkTriage('triaged')} variant="outline">
            Bulk Triage
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Triage Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Triage Configuration</CardTitle>
          <CardDescription>Configure automated triage rules</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={triageConfig.autoTriage}
                  onChange={(e) => setTriageConfig({ ...triageConfig, autoTriage: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Enable Auto-Triage</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Severity Threshold</label>
              <select
                value={triageConfig.severityThreshold}
                onChange={(e) => setTriageConfig({ ...triageConfig, severityThreshold: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="low">Low and above</option>
                <option value="medium">Medium and above</option>
                <option value="high">High and above</option>
                <option value="critical">Critical only</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confidence Threshold</label>
              <input
                type="number"
                value={triageConfig.confidenceThreshold}
                onChange={(e) => setTriageConfig({ ...triageConfig, confidenceThreshold: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                min="0"
                max="100"
              />
            </div>
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={triageConfig.duplicateDetection}
                  onChange={(e) => setTriageConfig({ ...triageConfig, duplicateDetection: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Enable Duplicate Detection</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search findings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
                <option value="info">Info</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="triaged">Triaged</option>
                <option value="confirmed">Confirmed</option>
                <option value="false_positive">False Positive</option>
                <option value="duplicate">Duplicate</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Findings List */}
      <div className="space-y-4">
        {filteredAndSortedFindings().map((finding) => (
          <Card key={finding.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">{getTypeIcon(finding.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge className={getSeverityColor(finding.severity)}>
                        {finding.severity.toUpperCase()}
                      </Badge>
                      <Badge className={getStatusColor(finding.status)}>
                        {finding.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      {finding.cve && (
                        <Badge variant="outline" className="text-xs">
                          {finding.cve}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {finding.confidence}% confidence
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{finding.title}</CardTitle>
                    <CardDescription className="mt-1">
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="flex items-center">
                          <Target className="h-3 w-3 mr-1" />
                          {finding.target}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(finding.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          {finding.reporter}
                        </span>
                      </div>
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline" onClick={() => setSelectedFinding(selectedFinding === finding.id ? null : finding.id)}>
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-700">{finding.description}</p>
                
                <div className="flex flex-wrap gap-2">
                  {finding.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">CVSS Score</div>
                    <div className="font-bold text-lg">{finding.cvss || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Risk Score</div>
                    <div className="font-bold text-lg">{finding.risk_score.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Impact</div>
                    <div className="font-bold">{finding.impact}</div>
                  </div>
                </div>

                {/* Detailed View */}
                {selectedFinding === finding.id && (
                  <div className="border-t pt-4">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-2">Technical Details</h4>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium">Likelihood:</span> {finding.likelihood}
                          </div>
                          <div>
                            <span className="font-medium">Remediation:</span> {finding.remediation}
                          </div>
                          {finding.triagedBy && (
                            <div>
                              <span className="font-medium">Triaged by:</span> {finding.triagedBy} on {new Date(finding.triagedAt!).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Evidence</h4>
                        <div className="space-y-2">
                          {finding.evidence.map((evidence, index) => (
                            <div key={index} className="text-sm">
                              <div className="font-medium">{evidence.type}:</div>
                              <div className="text-gray-600">{evidence.description}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-medium mb-2">Comments</h4>
                      <div className="space-y-2">
                        {finding.comments.map(comment => (
                          <div key={comment.id} className="bg-gray-50 rounded p-2 text-sm">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium">{comment.author}</span>
                              <span className="text-gray-500 text-xs">
                                {new Date(comment.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <div>{comment.content}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2 mt-4">
                      <Button size="sm" variant="outline">
                        <Download className="h-3 w-3 mr-1" />
                        Export Finding
                      </Button>
                      {finding.status === 'new' && (
                        <>
                          <Button size="sm" onClick={() => handleTriage(finding.id, 'confirmed')}>
                            Confirm
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleTriage(finding.id, 'false_positive')}>
                            False Positive
                          </Button>
                        </>
                      )}
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