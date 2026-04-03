import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
  User,
  CreditCard,
  Globe
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

interface Domain {
  id: string;
  domain: string;
  status: 'pending' | 'verified' | 'failed';
  verificationToken: string;
  createdAt: string;
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

  // States for new features
  const [domains, setDomains] = useState<Domain[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [isVerifying, setIsVerifying] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const [profileRes, apiKeysRes] = await Promise.all([
        axios.get('/api/settings/profile'),
        axios.get('/api/settings/api-keys')
      ]);

      const profile = (profileRes as any).data.data;
      setUserProfile({
        name: profile.name || '',
        email: profile.email || '',
        role: profile.role || '',
        twoFactorEnabled: profile.preferences?.security?.twoFactorEnabled || false,
        notificationsEnabled: profile.preferences?.notificationsEnabled ?? true
      });

      setApiKeys(((apiKeysRes as any).data.data || []).map((k: any) => ({
        id: k.id,
        name: k.name,
        platform: k.platform || 'custom',
        key: k.key,
        status: k.status || 'active',
        createdAt: k.createdAt,
        lastUsed: k.lastUsed,
        permissions: k.permissions || []
      })));

      const sec = profile.preferences?.security || {};
      setSecuritySettings([
        { id: '1', name: 'Enable Two-Factor Authentication', description: 'Require 2FA for all user accounts', value: sec.twoFactorEnabled ?? false, type: 'boolean' },
        { id: '2', name: 'Session Timeout', description: 'Auto-logout after inactivity (minutes)', value: String(sec.sessionTimeout ?? 30), type: 'select', options: ['15', '30', '60', '120'] },
        { id: '3', name: 'Max Login Attempts', description: 'Maximum failed login attempts before lockout', value: String(sec.maxLoginAttempts ?? 5), type: 'number' },
        { id: '4', name: 'API Rate Limiting', description: 'Enable rate limiting for API endpoints', value: sec.rateLimiting ?? true, type: 'boolean' },
        { id: '5', name: 'Data Encryption', description: 'Encrypt sensitive data at rest', value: sec.dataEncryption ?? true, type: 'boolean' },
        { id: '6', name: 'Audit Logging', description: 'Enable comprehensive audit logging', value: sec.auditLogging ?? true, type: 'boolean' }
      ]);

      // Also fetch domains
      const domainRes = await axios.get('/api/domains').catch(() => ({ data: [] }));
      setDomains(domainRes.data || []);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddApiKey = async () => {
    if (!newApiKey.name || !newApiKey.platform || !newApiKey.key) {
      alert('Please fill in all fields');
      return;
    }
    try {
      const res = await axios.post('/api/settings/api-keys', newApiKey);
      const newKey = (res as any).data.data;
      setApiKeys(prev => [...prev, { ...newKey, platform: newApiKey.platform, permissions: ['read', 'write'] }]);
      setNewApiKey({ name: '', platform: '', key: '' });
    } catch (error) {
      alert('Failed to add API key');
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    try {
      await axios.delete(`/api/settings/api-keys/${id}`);
      setApiKeys(apiKeys.filter(key => key.id !== id));
    } catch (error) {
      alert('Failed to delete API key');
    }
  };

  const handleToggleApiKey = async (id: string) => {
    const key = apiKeys.find(k => k.id === id);
    if (!key) return;
    try {
      const newStatus = key.status === 'active' ? false : true;
      await axios.patch(`/api/settings/api-keys/${id}`, { is_active: newStatus });
      setApiKeys(apiKeys.map(k => k.id === id ? { ...k, status: newStatus ? 'active' : 'inactive' } : k));
    } catch (error) {
      alert('Failed to toggle API key');
    }
  };

  const handleSecuritySettingChange = (id: string, value: boolean | string) => {
    setSecuritySettings(securitySettings.map(setting => 
      setting.id === id 
        ? { ...setting, value }
        : setting
    ));
    setHasChanges(true);
  };

  const handleProfileUpdate = (field: keyof UserProfile, value: string | boolean) => {
    setUserProfile({ ...userProfile, [field]: value });
    setHasChanges(true);
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      await axios.put('/api/settings/profile', { name: userProfile.name, email: userProfile.email });
      const sec = securitySettings.reduce((acc, s) => {
        if (s.type === 'boolean') acc[s.name.replace(/\s+/g, '').toLowerCase()] = s.value;
        else if (s.name.includes('Timeout')) acc['sessionTimeout'] = Number(s.value);
        else if (s.name.includes('Login')) acc['maxLoginAttempts'] = Number(s.value);
        return acc;
      }, {} as Record<string, unknown>);
      await axios.put('/api/settings/security', sec);
      setHasChanges(false);
      alert('Settings saved successfully!');
    } catch (error) {
      alert('Failed to save settings');
    } finally {
      setIsLoading(false);
    }
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

  const handleAddDomain = async () => {
    if (!newDomain) return;
    try {
      const res = await axios.post('/api/domains', { domainName: newDomain });
      setDomains([res.data, ...domains]);
      setNewDomain('');
      alert('Domain added successfully. Please add the TXT record to verify.');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add domain');
    }
  };

  const handleVerifyDomain = async (id: string) => {
    setIsVerifying(id);
    try {
      const res = await axios.post(`/api/domains/${id}/verify`);
      setDomains(domains.map(d => d.id === id ? res.data.domain : d));
      alert('Domain verified successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to verify domain');
    } finally {
      setIsVerifying(null);
    }
  };

  const handleDeleteDomain = async (id: string) => {
    try {
      await axios.delete(`/api/domains/${id}`);
      setDomains(domains.filter(d => d.id !== id));
      alert('Domain deleted successfully.');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete domain');
    }
  };

  const handleCheckout = async (planId: string) => {
    setCheckoutLoading(true);
    try {
      const res = await axios.post('/api/billing/create-checkout-session', { planId });
      window.location.href = res.data.url;
    } catch (err) {
      alert('Failed to start checkout process');
      setCheckoutLoading(false);
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

      {/* Domains Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="h-5 w-5 mr-2" />
            Domains
          </CardTitle>
          <CardDescription>Manage and verify your domains</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 border rounded-lg bg-gray-50">
            <h3 className="font-medium mb-3">Add New Domain</h3>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="example.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button onClick={handleAddDomain}>
                Add Domain
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {domains.map((domain) => (
              <div key={domain.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">{domain.domain}</div>
                  <div className="text-sm text-gray-500">
                    Added: {new Date(domain.createdAt).toLocaleDateString()}
                  </div>
                  {domain.status === 'pending' && (
                    <div className="text-xs mt-1 p-2 bg-yellow-50 text-yellow-800 rounded border border-yellow-200 break-all">
                      Add TXT record: <code>{domain.verificationToken}</code>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={
                    domain.status === 'verified' ? 'bg-green-100 text-green-800' :
                    domain.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }>
                    {domain.status.toUpperCase()}
                  </Badge>
                  {domain.status === 'pending' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleVerifyDomain(domain.id)}
                      disabled={isVerifying === domain.id}
                    >
                      {isVerifying === domain.id ? 'Verifying...' : 'Verify'}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteDomain(domain.id)}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Billing Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Billing & Plans
          </CardTitle>
          <CardDescription>Manage your subscription and billing details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 border rounded-lg flex flex-col">
              <h3 className="text-lg font-bold mb-2">Basic</h3>
              <p className="text-gray-500 mb-4 flex-1">Perfect for getting started</p>
              <div className="text-2xl font-bold mb-6">$29<span className="text-sm text-gray-500 font-normal">/mo</span></div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => handleCheckout('price_basic')}
                disabled={checkoutLoading}
              >
                Subscribe
              </Button>
            </div>
            <div className="p-6 border rounded-lg border-blue-500 relative flex flex-col">
              <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-bl-lg rounded-tr-lg">Popular</div>
              <h3 className="text-lg font-bold mb-2">Pro</h3>
              <p className="text-gray-500 mb-4 flex-1">Best for active hunters</p>
              <div className="text-2xl font-bold mb-6">$99<span className="text-sm text-gray-500 font-normal">/mo</span></div>
              <Button 
                className="w-full"
                onClick={() => handleCheckout('price_pro')}
                disabled={checkoutLoading}
              >
                Subscribe
              </Button>
            </div>
            <div className="p-6 border rounded-lg flex flex-col">
              <h3 className="text-lg font-bold mb-2">Enterprise</h3>
              <p className="text-gray-500 mb-4 flex-1">For large teams and organizations</p>
              <div className="text-2xl font-bold mb-6">$299<span className="text-sm text-gray-500 font-normal">/mo</span></div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => handleCheckout('price_enterprise')}
                disabled={checkoutLoading}
              >
                Contact Sales
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};