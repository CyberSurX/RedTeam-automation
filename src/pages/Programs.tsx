import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  Plus, 
  Target, 
  Globe, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle,
  Edit,
  Trash2,
  Play,
  Pause,
  Settings
} from 'lucide-react';

interface Program {
  id: string;
  name: string;
  platform: 'hackerone' | 'bugcrowd' | 'yeswehack' | 'intigriti' | 'custom';
  url: string;
  status: 'active' | 'paused' | 'completed';
  scope: string[];
  createdAt: string;
  lastScan: string;
  totalFindings: number;
  criticalFindings: number;
  isAutomated: boolean;
  autoRecon: boolean;
  autoScan: boolean;
  autoReport: boolean;
}

interface CreateProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (program: Omit<Program, 'id' | 'createdAt' | 'lastScan' | 'totalFindings' | 'criticalFindings'>) => void;
}

const CreateProgramModal: React.FC<CreateProgramModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    name: '',
    platform: 'hackerone' as Program['platform'],
    url: '',
    scope: '',
    isAutomated: false,
    autoRecon: false,
    autoScan: false,
    autoReport: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      name: formData.name,
      platform: formData.platform,
      url: formData.url,
      scope: formData.scope.split('\n').filter(s => s.trim()),
      status: 'active',
      isAutomated: formData.isAutomated,
      autoRecon: formData.autoRecon,
      autoScan: formData.autoScan,
      autoReport: formData.autoReport
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Create New Program</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Program Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
            <select
              value={formData.platform}
              onChange={(e) => setFormData({ ...formData, platform: e.target.value as Program['platform'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="hackerone">HackerOne</option>
              <option value="bugcrowd">Bugcrowd</option>
              <option value="yeswehack">YesWeHack</option>
              <option value="intigriti">Intigriti</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Program URL</label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Scope (one per line)</label>
            <textarea
              value={formData.scope}
              onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="*.example.com&#10;api.example.com&#10;app.example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isAutomated}
                onChange={(e) => setFormData({ ...formData, isAutomated: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm">Enable Automation</span>
            </label>

            {formData.isAutomated && (
              <div className="ml-6 space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.autoRecon}
                    onChange={(e) => setFormData({ ...formData, autoRecon: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">Auto Reconnaissance</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.autoScan}
                    onChange={(e) => setFormData({ ...formData, autoScan: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">Auto Vulnerability Scanning</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.autoReport}
                    onChange={(e) => setFormData({ ...formData, autoReport: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">Auto Report Generation</span>
                </label>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Create Program
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const Programs: React.FC = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching programs
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    setIsLoading(true);
    // Mock API call - replace with actual API call
    setTimeout(() => {
      setPrograms([
        {
          id: '1',
          name: 'TechCorp Bug Bounty',
          platform: 'hackerone',
          url: 'https://hackerone.com/techcorp',
          status: 'active',
          scope: ['*.techcorp.com', 'api.techcorp.com', 'app.techcorp.com'],
          createdAt: '2024-01-15T10:00:00Z',
          lastScan: '2024-01-20T14:30:00Z',
          totalFindings: 12,
          criticalFindings: 2,
          isAutomated: true,
          autoRecon: true,
          autoScan: true,
          autoReport: false
        },
        {
          id: '2',
          name: 'FinanceApp Security',
          platform: 'bugcrowd',
          url: 'https://bugcrowd.com/financeapp',
          status: 'active',
          scope: ['*.financeapp.com', 'api.financeapp.com'],
          createdAt: '2024-01-10T09:00:00Z',
          lastScan: '2024-01-19T16:45:00Z',
          totalFindings: 8,
          criticalFindings: 0,
          isAutomated: false,
          autoRecon: false,
          autoScan: false,
          autoReport: false
        },
        {
          id: '3',
          name: 'E-commerce Platform',
          platform: 'custom',
          url: 'https://example.com/security',
          status: 'paused',
          scope: ['shop.example.com', 'api.example.com', 'checkout.example.com'],
          createdAt: '2024-01-05T08:00:00Z',
          lastScan: '2024-01-18T12:00:00Z',
          totalFindings: 15,
          criticalFindings: 1,
          isAutomated: true,
          autoRecon: true,
          autoScan: false,
          autoReport: false
        }
      ]);
      setIsLoading(false);
    }, 1000);
  };

  const handleCreateProgram = async (programData: Omit<Program, 'id' | 'createdAt' | 'lastScan' | 'totalFindings' | 'criticalFindings'>) => {
    const newProgram: Program = {
      ...programData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      lastScan: new Date().toISOString(),
      totalFindings: 0,
      criticalFindings: 0
    };
    setPrograms([...programs, newProgram]);
  };

  const handleToggleStatus = async (programId: string) => {
    setPrograms(programs.map(program => 
      program.id === programId 
        ? { ...program, status: program.status === 'active' ? 'paused' : 'active' }
        : program
    ));
  };

  const handleDeleteProgram = async (programId: string) => {
    if (window.confirm('Are you sure you want to delete this program?')) {
      setPrograms(programs.filter(program => program.id !== programId));
    }
  };

  const getPlatformColor = (platform: string) => {
    const colors = {
      hackerone: 'bg-red-100 text-red-800',
      bugcrowd: 'bg-blue-100 text-blue-800',
      yeswehack: 'bg-green-100 text-green-800',
      intigriti: 'bg-purple-100 text-purple-800',
      custom: 'bg-gray-100 text-gray-800'
    };
    return colors[platform] || colors.custom;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || colors.completed;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Programs</h1>
          <p className="text-gray-600 mt-1">Manage your bug bounty programs</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Program
        </Button>
      </div>

      {/* Programs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {programs.map((program) => (
          <Card key={program.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{program.name}</CardTitle>
                <div className="flex space-x-2">
                  <Badge className={getPlatformColor(program.platform)}>
                    {program.platform}
                  </Badge>
                  <Badge className={getStatusColor(program.status)}>
                    {program.status}
                  </Badge>
                </div>
              </div>
              <CardDescription className="flex items-center mt-2">
                <Globe className="h-4 w-4 mr-1" />
                {program.url}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                {/* Scope */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Scope</h4>
                  <div className="space-y-1">
                    {program.scope.slice(0, 3).map((item, index) => (
                      <div key={index} className="text-xs text-gray-600 bg-gray-100 rounded px-2 py-1">
                        {item}
                      </div>
                    ))}
                    {program.scope.length > 3 && (
                      <div className="text-xs text-gray-500">+{program.scope.length - 3} more</div>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{program.totalFindings}</div>
                    <div className="text-xs text-gray-500">Total Findings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{program.criticalFindings}</div>
                    <div className="text-xs text-gray-500">Critical</div>
                  </div>
                </div>

                {/* Automation Status */}
                {program.isAutomated && (
                  <div className="flex items-center justify-center space-x-2 text-xs text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    <span>Automation Enabled</span>
                  </div>
                )}

                {/* Last Scan */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    Last scan: {new Date(program.lastScan).toLocaleDateString()}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleToggleStatus(program.id)}
                    className="flex-1"
                  >
                    {program.status === 'active' ? <Pause className="h-3 w-3 mr-1" /> : <Play className="h-3 w-3 mr-1" />}
                    {program.status === 'active' ? 'Pause' : 'Resume'}
                  </Button>
                  <Button size="sm" variant="outline" className="p-2">
                    <Settings className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleDeleteProgram(program.id)}
                    className="p-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Program Modal */}
      <CreateProgramModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateProgram}
      />
    </div>
  );
};