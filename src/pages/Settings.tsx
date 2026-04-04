import React, { useState, useEffect } from 'react';
import axios from 'axios';

import { Badge } from '../components/ui/badge';
import { Save, User, Shield, Key, Globe, CreditCard, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('profile');

  // States for new features
  const [domains, setDomains] = useState<Domain[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [isVerifying, setIsVerifying] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  
  const [licenseKey, setLicenseKey] = useState('');
  const [activeLicense, setActiveLicense] = useState<any>(null);
  const [myLicenses, setMyLicenses] = useState<any[]>([]);

  useEffect(() => {
    fetchSettings();
    fetchLicenses();
  }, []);

  const fetchLicenses = async () => {
    try {
      const res = await axios.get('/api/licenses/my-licenses');
      setMyLicenses(res.data as any[]);
      if ((res.data as any[]).length > 0) {
        setActiveLicense((res.data as any[])[0]); // Just pick the first one for display
      }
    } catch (e) {
      console.error('Failed to load licenses');
    }
  };

  const handleVerifyLicense = async () => {
    if (!licenseKey) return;
    setLoading(true);
    try {
      // In a real desktop app, we'd send a machine UUID.
      // For web, we just validate it exists and is active.
      const res = await axios.post('/api/licenses/validate', { 
        licenseKey: licenseKey,
        hardwareId: 'web-browser-client'
      });
      setActiveLicense(res.data as any);
      setSuccessMessage(`License verified successfully! Tier: ${(res.data as any).tier}`);
      fetchLicenses();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid license key');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (planId: string, tier: string) => {
    setCheckoutLoading(true);
    try {
      const res = await axios.post('/api/billing/create-checkout-session', { planId, tier });
      window.location.href = (res.data as any).url;
    } catch (err) {
      alert('Failed to start checkout process. Have you configured Stripe Products?');
      setCheckoutLoading(false);
    }
  };

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

  const handleProfileUpdate = (field: keyof UserProfile, value: string | boolean) => {
    setUserProfile({ ...userProfile, [field]: value });
    setHasChanges(true);
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      await axios.put('/api/settings/profile', { name: userProfile.name, email: userProfile.email });
      
      setHasChanges(false);
      alert('Settings saved successfully!');
    } catch (error) {
      alert('Failed to save settings');
    } finally {
      setIsLoading(false);
    }
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
      setDomains([res.data as Domain, ...domains]);
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
      setDomains(domains.map(d => d.id === id ? (res.data as any).domain : d));
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



  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-400" />
                Profile Information
              </h2>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
                  <input type="text" className="sharp-input w-full px-3 py-2" defaultValue={userProfile.name || ''} onChange={(e) => handleProfileUpdate('name', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                  <input type="email" className="sharp-input w-full px-3 py-2" defaultValue={userProfile.email || ''} onChange={(e) => handleProfileUpdate('email', e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        );
      case 'api-keys':
        return (
          <div className="space-y-6">
            <div className="glass-card p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <Key className="h-5 w-5 mr-2 text-blue-400" />
                  API Keys
                </h2>
                <button className="sharp-btn px-4 py-2 text-sm" onClick={handleAddApiKey}>Add Key</button>
              </div>
              <p className="text-slate-400 mb-4">Manage API keys for bug bounty platforms</p>
              
              <div className="mb-6 p-4 border border-slate-700/50 rounded-lg bg-slate-900/50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input
                    type="text"
                    placeholder="Key Name"
                    value={newApiKey.name}
                    onChange={(e) => setNewApiKey({ ...newApiKey, name: e.target.value })}
                    className="sharp-input px-3 py-2"
                  />
                  <select
                    value={newApiKey.platform}
                    onChange={(e) => setNewApiKey({ ...newApiKey, platform: e.target.value })}
                    className="sharp-input px-3 py-2"
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
                    className="sharp-input px-3 py-2"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {apiKeys.map((key) => (
                  <div key={key.id} className="flex items-center justify-between p-4 border border-slate-700/50 bg-slate-900/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{getPlatformIcon(key.platform)}</div>
                      <div>
                        <div className="font-medium text-white">{key.name}</div>
                        <div className="text-sm text-slate-400 capitalize">{key.platform}</div>
                        <div className="text-xs text-slate-500">
                          Created: {new Date(key.createdAt).toLocaleDateString()}
                          {key.lastUsed && ` • Last used: ${new Date(key.lastUsed).toLocaleDateString()}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(key.status)}>
                        {key.status.toUpperCase()}
                      </Badge>
                      <button
                        onClick={() => setShowApiKey(showApiKey === key.id ? null : key.id)}
                        className="sharp-btn-outline p-2 text-sm"
                      >
                        {showApiKey === key.id ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </button>
                      <button
                        onClick={() => handleToggleApiKey(key.id)}
                        className="sharp-btn-outline p-2 text-sm"
                      >
                        {key.status === 'active' ? <XCircle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                      </button>
                      <button
                        onClick={() => handleDeleteApiKey(key.id)}
                        className="p-2 text-red-400 border border-red-500/30 rounded hover:bg-red-500/10 transition-colors"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'domains':
        return (
          <div className="space-y-6">
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <Globe className="h-5 w-5 mr-2 text-blue-400" />
                Domain Verification
              </h2>
              <p className="text-slate-400 mb-4 text-sm">Verify ownership of domains before scanning.</p>
              
              <div className="flex gap-3 mb-6">
                <input
                  type="text"
                  placeholder="example.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="sharp-input flex-1 px-3 py-2"
                />
                <button onClick={handleAddDomain} className="sharp-btn px-4 py-2">Add Domain</button>
              </div>

              <div className="space-y-3">
                {domains.map(domain => (
                  <div key={domain.id} className="p-4 bg-slate-900/50 border border-slate-700/50 rounded-lg flex justify-between items-center">
                    <div>
                      <div className="font-medium text-white">{domain.domain}</div>
                      <div className="text-xs text-slate-400 font-mono mt-1">TXT: {domain.verificationToken}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={domain.status === 'verified' ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'}>
                        {domain.status}
                      </Badge>
                      {domain.status !== 'verified' && (
                        <button
                          onClick={() => handleVerifyDomain(domain.id)}
                          disabled={isVerifying === domain.id}
                          className="sharp-btn-outline px-3 py-1 text-sm"
                        >
                          {isVerifying === domain.id ? 'Verifying...' : 'Verify Now'}
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteDomain(domain.id)}
                        className="p-2 text-red-400 border border-red-500/30 rounded hover:bg-red-500/10 transition-colors"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {domains.length === 0 && (
                  <div className="text-center p-4 text-slate-500 border border-dashed border-slate-700 rounded">
                    No domains added yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 'billing':
        return (
          <div className="space-y-6">
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-blue-400" />
                Licenses & Billing
              </h2>
              <p className="text-slate-400 mb-6">Purchase and manage your one-time software licenses</p>
              
              <div className="mb-8 p-6 glass-card border border-blue-500/20 bg-blue-900/10">
                <h3 className="text-lg font-bold mb-2 text-white">Activate Existing License</h3>
                <p className="text-sm text-slate-400 mb-4">Enter your license key below to unlock features.</p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="RTA-XXXX-YYYY-ZZZZ"
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                    className="sharp-input flex-1 px-4 py-2 uppercase tracking-widest"
                  />
                  <button className="sharp-btn px-6" onClick={handleVerifyLicense} disabled={loading || !licenseKey}>
                    {loading ? 'Verifying...' : 'Activate'}
                  </button>
                </div>
                {activeLicense && (
                  <div className="mt-4 p-3 bg-green-900/30 border border-green-500/50 rounded text-green-400 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Active License Found: <strong className="ml-2 capitalize text-green-300">{activeLicense.tier} Tier</strong>
                  </div>
                )}
              </div>

              <h3 className="text-lg font-bold mb-4 text-white">Purchase Lifetime License</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 glass-card relative flex flex-col shadow-[0_0_15px_rgba(37,99,235,0.2)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] transition-all">
                  <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs px-3 py-1 rounded-bl-lg rounded-tr-lg font-bold">Popular</div>
                  <h3 className="text-xl font-bold mb-2 text-blue-400">Pro</h3>
                  <p className="text-slate-400 mb-4 flex-1">The standard for professional penetration testers.</p>
                  <div className="text-4xl font-bold mb-2 text-white">$499<span className="text-sm text-slate-400 font-normal"> / lifetime</span></div>
                  <ul className="text-sm space-y-3 mb-8 mt-4 text-slate-300">
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 mr-2 text-blue-500"/> Up to 3 Machines</li>
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 mr-2 text-blue-500"/> Deep Network Scans</li>
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 mr-2 text-blue-500"/> PDF Export</li>
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 mr-2 text-blue-500"/> 1 Year Updates</li>
                  </ul>
                  <button 
                    className="sharp-btn w-full mt-auto py-3"
                    onClick={() => handleCheckout('price_pro', 'pro')}
                    disabled={checkoutLoading}
                  >
                    Buy Pro
                  </button>
                </div>
                <div className="p-6 glass-card flex flex-col shadow-[0_0_15px_rgba(79,70,229,0.2)] hover:shadow-[0_0_25px_rgba(79,70,229,0.4)] transition-all">
                  <h3 className="text-xl font-bold mb-2 text-indigo-400">Enterprise</h3>
                  <p className="text-slate-400 mb-4 flex-1">For consulting firms and corporate red teams.</p>
                  <div className="text-4xl font-bold mb-2 text-white">$1,899<span className="text-sm text-slate-400 font-normal"> / lifetime</span></div>
                  <ul className="text-sm space-y-3 mb-8 mt-4 text-slate-300">
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 mr-2 text-indigo-500"/> Unlimited Machines</li>
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 mr-2 text-indigo-500"/> AI-Powered Payloads</li>
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 mr-2 text-indigo-500"/> White-label Reports</li>
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 mr-2 text-indigo-500"/> Lifetime Updates</li>
                  </ul>
                  <button 
                    className="sharp-btn-outline w-full mt-auto py-3"
                    onClick={() => handleCheckout('price_enterprise', 'enterprise')}
                    disabled={checkoutLoading}
                  >
                    Buy Enterprise
                  </button>
                </div>
              </div>

              {myLicenses.length > 0 && (
                <div className="mt-10">
                  <h3 className="text-lg font-bold mb-4 text-white">My Licenses</h3>
                  <div className="space-y-3">
                    {myLicenses.map(lic => (
                      <div key={lic.id} className="p-4 glass-card flex justify-between items-center">
                        <div>
                          <div className="font-mono text-sm tracking-wider font-bold text-blue-300">{lic.licenseKey}</div>
                          <div className="text-xs text-slate-400 mt-1 capitalize">{lic.tier} Edition • Purchased: {new Date(lic.createdAt).toLocaleDateString()}</div>
                        </div>
                        <div className="px-3 py-1 rounded-full text-xs font-medium border bg-green-900/30 text-green-400 border-green-500/30">
                          {lic.status.toUpperCase()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-slate-400">Manage your account, security, and preferences</p>
        </div>
        <button onClick={handleSaveSettings} disabled={!hasChanges || isLoading} className="sharp-btn px-4 py-2 flex items-center">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-900/30 text-red-400 rounded-md border border-red-500/30">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-4 bg-green-900/30 text-green-400 rounded-md border border-green-500/30 flex items-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1">
          <div className="space-y-1 glass-card p-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'profile'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <User className="h-5 w-5 mr-3" />
              Profile
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'security'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <Shield className="h-5 w-5 mr-3" />
              Security
            </button>
            <button
              onClick={() => setActiveTab('api-keys')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'api-keys'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <Key className="h-5 w-5 mr-3" />
              API Keys
            </button>
            <button
              onClick={() => setActiveTab('domains')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'domains'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <Globe className="h-5 w-5 mr-3" />
              Domains
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'billing'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <CreditCard className="h-5 w-5 mr-3" />
              Licenses & Billing
            </button>
          </div>
        </div>

        <div className="md:col-span-3">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Settings;
