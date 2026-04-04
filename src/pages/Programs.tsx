import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Badge } from '../components/ui/badge';
import {
  Plus,
  Globe,
  Clock,
  CheckCircle,
  Play,
  Pause,
  Settings,
  Trash2
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

interface BackendProgram {
  id: string;
  name: string;
  platform: string;
  metadata?: {
    url?: string;
    isAutomated?: boolean;
    autoRecon?: boolean;
    autoScan?: boolean;
    autoReport?: boolean;
  };
  status: string;
  scopes?: {
    in_scope?: string[];
  };
  created_at: string;
  updated_at: string;
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
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass-card p-6 w-full max-w-md border border-blue-500/30">
        <h2 className="text-xl font-bold mb-4 text-white">Create New Program</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Program Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="sharp-input w-full px-3 py-2"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Platform</label>
            <select
              value={formData.platform}
              onChange={(e) => setFormData({ ...formData, platform: e.target.value as Program['platform'] })}
              className="sharp-input w-full px-3 py-2"
            >
              <option value="hackerone">HackerOne</option>
              <option value="bugcrowd">Bugcrowd</option>
              <option value="yeswehack">YesWeHack</option>
              <option value="intigriti">Intigriti</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Program URL</label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="sharp-input w-full px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Scope (one per line)</label>
            <textarea
              value={formData.scope}
              onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
              className="sharp-input w-full px-3 py-2"
              rows={3}
              placeholder="*.example.com&#10;api.example.com&#10;app.example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center text-slate-300">
              <input
                type="checkbox"
                checked={formData.isAutomated}
                onChange={(e) => setFormData({ ...formData, isAutomated: e.target.checked })}
                className="mr-2 rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900"
              />
              <span className="text-sm">Enable Automation</span>
            </label>

            {formData.isAutomated && (
              <div className="ml-6 space-y-2 text-slate-400">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.autoRecon}
                    onChange={(e) => setFormData({ ...formData, autoRecon: e.target.checked })}
                    className="mr-2 rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900"
                  />
                  <span className="text-sm">Auto Reconnaissance</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.autoScan}
                    onChange={(e) => setFormData({ ...formData, autoScan: e.target.checked })}
                    className="mr-2 rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900"
                  />
                  <span className="text-sm">Auto Vulnerability Scanning</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.autoReport}
                    onChange={(e) => setFormData({ ...formData, autoReport: e.target.checked })}
                    className="mr-2 rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900"
                  />
                  <span className="text-sm">Auto Report Generation</span>
                </label>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" className="sharp-btn-outline px-4 py-2" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="sharp-btn px-4 py-2">
              Create Program
            </button>
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
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/programs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if ((response.data as Record<string, unknown>).success) {
        // Map backend response to match frontend interface if needed
        const mappedPrograms = ((response.data as Record<string, unknown>).data as BackendProgram[]).map((p: BackendProgram) => ({
          id: p.id,
          name: p.name,
          platform: p.platform,
          url: p.metadata?.url || '',
          status: p.status,
          scope: p.scopes?.in_scope || [],
          createdAt: p.created_at,
          lastScan: p.updated_at,
          totalFindings: 0,
          criticalFindings: 0,
          isAutomated: p.metadata?.isAutomated || false,
          autoRecon: p.metadata?.autoRecon || false,
          autoScan: p.metadata?.autoScan || false,
          autoReport: p.metadata?.autoReport || false
        })) as Program[];
        setPrograms(mappedPrograms);
      }
    } catch (_error) {
      console.error("Failed to fetch programs", _error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProgram = async (programData: Omit<Program, 'id' | 'createdAt' | 'lastScan' | 'totalFindings' | 'criticalFindings'>) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/programs', programData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const responseData = response.data as Record<string, unknown>;
      if (responseData.success) {
        fetchPrograms(); // Refresh list
      }
    } catch (_error) {
      console.error("Failed to create program", _error);
    }
  };

  const handleToggleStatus = async (programId: string) => {
    try {
      const token = localStorage.getItem('token');
      const currentProgram = programs.find(p => p.id === programId);
      const newStatus = currentProgram?.status === 'active' ? 'paused' : 'active';

      const response = await axios.patch(`/api/programs/${programId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const responseData = response.data as Record<string, unknown>;
      if (responseData.success) {
        setPrograms((prev: Program[]) => prev.map((p: Program) =>
          p.id === programId ? { ...p, status: newStatus as 'active' | 'paused' | 'completed' } : p
        ));
      }
    } catch (_error) {
      console.error("Failed to toggle program status", _error);
    }
  };

  const handleDeleteProgram = async (programId: string) => {
    if (window.confirm('Are you sure you want to delete this program?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.delete(`/api/programs/${programId}`, {
           headers: { Authorization: `Bearer ${token}` }
        });
        const responseData = response.data as Record<string, unknown>;
        if (responseData.success) {
          setPrograms((prev: Program[]) => prev.filter((p: Program) => p.id !== programId));
        }
      } catch (_error) {
        console.error("Failed to delete program", _error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-500/10 text-green-500 border-green-500/20',
      paused: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      completed: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    };
    return colors[status.toLowerCase()] || 'bg-gray-500/10 text-gray-500 border-gray-500/20';
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
          <h1 className="text-3xl font-bold text-white">Programs</h1>
          <p className="text-slate-400 mt-1">Manage your bug bounty programs</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="sharp-btn flex items-center px-4 py-2">
          <Plus className="h-4 w-4 mr-2" />
          Add Program
        </button>
      </div>

      {/* Programs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {programs.map((program) => (
          <div key={program.id} className="glass-card hover:shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all">
            <div className="p-6 border-b border-slate-800/50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">{program.name}</h3>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(program.status)}>
                    {program.status}
                  </Badge>
                </div>
              </div>
              <p className="flex items-center mt-2 text-sm text-blue-400">
                <Globe className="h-4 w-4 mr-1" />
                {program.url}
              </p>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {/* Scope */}
                <div>
                  <h4 className="text-sm font-medium text-slate-400 mb-2">Scope</h4>
                  <div className="space-y-1">
                    {program.scope.slice(0, 3).map((item, index) => (
                      <div key={index} className="text-xs text-slate-300 bg-slate-800/50 border border-slate-700/50 rounded px-2 py-1">
                        {item}
                      </div>
                    ))}
                    {program.scope.length > 3 && (
                      <div className="text-xs text-slate-500">+{program.scope.length - 3} more</div>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-800/50">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{program.totalFindings}</div>
                    <div className="text-xs text-slate-500">Total Findings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">{program.criticalFindings}</div>
                    <div className="text-xs text-slate-500">Critical</div>
                  </div>
                </div>

                {/* Automation Status */}
                {program.isAutomated && (
                  <div className="flex items-center justify-center space-x-2 text-xs text-green-400">
                    <CheckCircle className="h-3 w-3" />
                    <span>Automation Enabled</span>
                  </div>
                )}

                {/* Last Scan */}
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    Last scan: {new Date(program.lastScan).toLocaleDateString()}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-2">
                  <button 
                    onClick={() => handleToggleStatus(program.id)}
                    className="flex-1 sharp-btn-outline flex items-center justify-center py-2"
                  >
                    {program.status === 'active' ? <Pause className="h-3 w-3 mr-1" /> : <Play className="h-3 w-3 mr-1" />}
                    {program.status === 'active' ? 'Pause' : 'Resume'}
                  </button>
                  <button className="sharp-btn-outline p-2">
                    <Settings className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteProgram(program.id)}
                    className="p-2 text-red-400 border border-red-500/30 rounded hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
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