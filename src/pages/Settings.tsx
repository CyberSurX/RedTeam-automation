import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Key,
  Shield,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Download,
  Upload,
  User
} from 'lucide-react';

interface APIKey {
  id: string;
  name: string;
  platform: string;
  key: string;
  status: 'active' | 'inactive' | 'expired';
  createdAt: string;
  lastUsed?: string;
  permissions: string[];
}

interface SecuritySetting {
  id: string;
  name: string;
  description: string;
  value: boolean | string;
  type: 'boolean' | 'select' | 'number';
  options?: string[];
}

interface UserProfile {
  name: string;
  email: string;
  role: string;
  avatar?: string;
  twoFactorEnabled: boolean;
  notificationsEnabled: boolean;
}

export const Settings: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [securitySettings, setSecuritySettings] = useState<SecuritySetting[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: '',
    email: '',
    role: '',
    twoFactorEnabled: false,
    notificationsEnabled: true
  });
  const [newApiKey, setNewApiKey] = useState({ name: '', platform: '', key: '' });
  const [showApiKey, setShowApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setApiKeys([
        {
          id: '1',
          name: 'HackerOne Production',
          platform: 'hackerone',
          key: 'sk_test_1234567890abcdef',
          status: 'active',
          createdAt: '2024-01-15T10:30:00Z',
          lastUsed: '2024-02-20T14:25:00Z',
          permissions: ['read', 'write', 'submit']
        },
        {
          id: '2',
          name: 'Bugcrowd API',
          platform: 'bugcrowd',
          key: 'bc_test_0987654321fedcba',
          status: 'active',
          createdAt: '2024-01-20T09:15:00Z',
          lastUsed: '2024-02-19T16:30:00Z',
          permissions: ['read', 'submit']
        },
        {
          id: '3',
          name: 'YesWeHack Dev',
          platform: 'yeswehack',
          key: 'ywh_test_abcdef1234567890',
          status: 'inactive',
          createdAt: '2024-02-01T11:45:00Z',
          permissions: ['read']
        }
      ]);

      setSecuritySettings([
        {
          id: '1',
          name: 'Enable Two-Factor Authentication',
          description: 'Require 2FA for all user accounts',
          value: true,
          type: 'boolean'
        },
        {
          id: '2',
          name: 'Session Timeout',
          description: 'Auto-logout after inactivity (minutes)',
          value: '30',
          type: 'select',
          options: ['15', '30', '60', '120']
        },
        {
          id: '3',
          name: 'Max Login Attempts',
          description: 'Maximum failed login attempts before lockout',
          value: '5',
          type: 'number'
        },
        {
          id: '4',
          name: 'API Rate Limiting',
          description: 'Enable rate limiting for API endpoints',
          value: true,
          type: 'boolean'
        },
        {
          id: '5',
          name: 'Data Encryption',
          description: 'Encrypt sensitive data at rest',
          value: true,
          type: 'boolean'
        },
        {
          id: '6',
          name: 'Audit Logging',
          description: 'Enable comprehensive audit logging',
          value: true,
          type: 'boolean'
        }
      ]);

      setUserProfile({
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'Security Researcher',
        avatar: '/api/placeholder/100/100',
        twoFactorEnabled: true,
        notificationsEnabled: true
      });

      setIsLoading(false);
    }, 1000);
  };

  const handleAddApiKey = () => {
    if (!newApiKey.name || !newApiKey.platform || !newApiKey.key) {
      alert('Please fill in all fields');
      return;
    }

    const key: APIKey = {
      id: Date.now().toString(),
      name: newApiKey.name,
      platform: newApiKey.platform,
      key: newApiKey.key,
      status: 'active',
      createdAt: new Date().toISOString(),
      permissions: ['read', 'write']
    };

    setApiKeys([...apiKeys, key]);
    setNewApiKey({ name: '', platform: '', key: '' });
    setHasChanges(true);
  };

  const handleDeleteApiKey = (id: string) => {
    setApiKeys(apiKeys.filter(key => key.id !== id));
    setHasChanges(true);
  };

  const handleToggleApiKey = (id: string) => {
    setApiKeys(apiKeys.map(key => 
      key.id === id 
        ? { ...key, status: key.status === 'active' ? 'inactive' : 'active' }
        : key
    ));
    setHasChanges(true);
  };

  const handleSecuritySettingChange = (id: string, value: boolean | string) => {
    setSecuritySettings(securitySettings.map(setting => 
      setting.id === id 
        ? { ...setting, value }
        : setting
    ));
    setHasChanges(true);
  };

  const handleProfileUpdate = (field: keyof UserProfile, value: any) => {
    setUserProfile({ ...userProfile, [field]: value });
    setHasChanges(true);
  };

  const handleSaveSettings = async () => {
    // Simulate API call
    setIsLoading(true);
    setTimeout(() => {
      setHasChanges(false);
      setIsLoading(false);
      alert('Settings saved successfully!');
    }, 1500);
  };

  const handleExportSettings = () => {
    const settings = {
      apiKeys: apiKeys.map(key => ({ ...key, key: '***' })),
      securitySettings,
      userProfile,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target?.result as string);
        if (settings.apiKeys) setApiKeys(settings.apiKeys);
        if (settings.securitySettings) setSecuritySettings(settings.securitySettings);
        if (settings.userProfile) setUserProfile(settings.userProfile);
        setHasChanges(true);
        alert('Settings imported successfully!');
      } catch {
        alert('Invalid settings file');
      }
    };
    reader.readAsText(file);
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'hackerone':
        return '🔴';
      case 'bugcrowd':
        return '🟢';
      case 'yeswehack':
        return '🔵';
      case 'intigriti':
        return '🟣';
      default:
        return '🔑';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Configure API keys, security preferences, and account settings</p>
        </div>
        <div className="flex items-center space-x-3">
          <input
            type="file"
            accept=".json"
            onChange={handleImportSettings}
            className="hidden"
            id="import-settings"
          />
          <label htmlFor="import-settings" className="inline-block">
            <span className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm cursor-pointer hover:bg-gray-50">
              <Upload className="h-4 w-4 mr-1" />
              Import
            </span>
          </label>
          <Button variant="outline" size="sm" onClick={handleExportSettings}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button 
            onClick={handleSaveSettings} 
            disabled={!hasChanges}
            className={hasChanges ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            <Save className="h-4 w-4 mr-1" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* API Keys Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="h-5 w-5 mr-2" />
            API Keys
          </CardTitle>
          <CardDescription>Manage API keys for bug bounty platforms</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Add New API Key */}
          <div className="mb-6 p-4 border rounded-lg bg-gray-50">
            <h3 className="font-medium mb-3">Add New API Key</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Key Name"
                value={newApiKey.name}
                onChange={(e) => setNewApiKey({ ...newApiKey, name: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={newApiKey.platform}
                onChange={(e) => setNewApiKey({ ...newApiKey, platform: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Platform</option>
                <option value="hackerone">HackerOne</option>
                <option value="bugcrowd">Bugcrowd</option>
                <option value="yeswehack">YesWeHack</option>
                <option value="intigriti">Intigriti</option>
                <option value="custom">Custom</option>
              </select>
              <input
                type="password"
                placeholder="API Key"
                value={newApiKey.key}
                onChange={(e) => setNewApiKey({ ...newApiKey, key: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button onClick={handleAddApiKey}>
                <Key className="h-4 w-4 mr-1" />
                Add Key
              </Button>
            </div>
          </div>

          {/* Existing API Keys */}
          <div className="space-y-3">
            {apiKeys.map((key) => (
              <div key={key.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{getPlatformIcon(key.platform)}</div>
                  <div>
                    <div className="font-medium">{key.name}</div>
                    <div className="text-sm text-gray-500 capitalize">{key.platform}</div>
                    <div className="text-xs text-gray-400">
                      Created: {new Date(key.createdAt).toLocaleDateString()}
                      {key.lastUsed && ` • Last used: ${new Date(key.lastUsed).toLocaleDateString()}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(key.status)}>
                    {key.status.toUpperCase()}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowApiKey(showApiKey === key.id ? null : key.id)}
                  >
                    {showApiKey === key.id ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleApiKey(key.id)}
                  >
                    {key.status === 'active' ? <XCircle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteApiKey(key.id)}
                  >
                    <XCircle className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Security Settings
          </CardTitle>
          <CardDescription>Configure security preferences and access controls</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {securitySettings.map((setting) => (
              <div key={setting.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{setting.name}</div>
                  <div className="text-sm text-gray-500">{setting.description}</div>
                </div>
                <div className="flex items-center space-x-2">
                  {setting.type === 'boolean' && (
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={setting.value as boolean}
                        onChange={(e) => handleSecuritySettingChange(setting.id, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  )}
                  {setting.type === 'select' && (
                    <select
                      value={setting.value as string}
                      onChange={(e) => handleSecuritySettingChange(setting.id, e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {setting.options?.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  )}
                  {setting.type === 'number' && (
                    <input
                      type="number"
                      value={setting.value as string}
                      onChange={(e) => handleSecuritySettingChange(setting.id, e.target.value)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Profile Settings
          </CardTitle>
          <CardDescription>Manage your account and preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={userProfile.name}
                  onChange={(e) => handleProfileUpdate('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={userProfile.email}
                  onChange={(e) => handleProfileUpdate('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">Two-Factor Authentication</div>
                  <div className="text-sm text-gray-500">Add an extra layer of security to your account</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={userProfile.twoFactorEnabled}
                    onChange={(e) => handleProfileUpdate('twoFactorEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">Email Notifications</div>
                  <div className="text-sm text-gray-500">Receive email updates about new findings and reports</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={userProfile.notificationsEnabled}
                    onChange={(e) => handleProfileUpdate('notificationsEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};