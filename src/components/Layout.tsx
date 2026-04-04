import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Home,
  Target,
  Search,
  Shield,
  Zap,
  AlertTriangle,
  FileText,
  BarChart3,
  Settings,
  Menu,
  X,
  User,
  LogOut
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Programs', href: '/programs', icon: Target },
    { name: 'Reconnaissance', href: '/reconnaissance', icon: Search },
    { name: 'Vulnerability Scanning', href: '/scanning', icon: Shield },
    { name: 'Exploitation Validation', href: '/exploitation', icon: Zap },
    { name: 'Findings Management', href: '/findings', icon: AlertTriangle },
    { name: 'Report Generation', href: '/reports', icon: FileText },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-transparent relative overflow-hidden">
      {/* Global 3D mesh decor for layout */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 glass-panel transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800/50 bg-slate-900/40">
          <div className="flex items-center">
            <div className="p-2 bg-slate-900/80 rounded-xl border border-blue-500/30 shadow-[0_0_15px_rgba(37,99,235,0.3)]">
              <Shield className="h-6 w-6 text-blue-400" />
            </div>
            <span className="ml-3 text-lg font-bold text-white tracking-tight">RTA Engine</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <nav className="mt-6 px-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-[0_0_10px_rgba(37,99,235,0.1)]'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
                }`}
              >
                <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Header */}
        <header className="glass-panel border-b border-slate-800/50 h-16">
          <div className="flex items-center justify-between h-full px-6">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-slate-400 hover:text-slate-300"
              >
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="ml-4 text-xl font-semibold text-white tracking-tight">
                {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-slate-900/50 py-1.5 px-3 rounded-full border border-slate-700/50">
                <div className="h-7 w-7 bg-blue-600 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(37,99,235,0.4)]">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium text-slate-200 pr-2">{user?.name || 'User'}</span>
              </div>
              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-red-400 transition-colors bg-slate-900/50 rounded-full border border-slate-700/50 hover:border-red-500/30 hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};