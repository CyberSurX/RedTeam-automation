import React, { useEffect, useState } from "react";
import axios from "axios";

interface DashboardStats {
  programs: number;
  findings: number;
  revenue: number;
  criticalFindings: number;
  loading: boolean;
}

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    programs: 0,
    findings: 0,
    revenue: 0,
    criticalFindings: 0,
    loading: true
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get<{ success: boolean; data: Omit<DashboardStats, 'loading'> }>('/api/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setStats({
            ...response.data.data,
            loading: false
          });
        }
      } catch (_error) {
        console.error("Failed to fetch dashboard stats", _error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-white mb-1">Programs</h2>
        <p className="text-sm text-slate-400 mb-4">Tracked bounty programs</p>
        <div className="text-4xl font-bold text-blue-400">
          {stats.loading ? "..." : stats.programs}
        </div>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-white mb-1">Findings</h2>
        <p className="text-sm text-slate-400 mb-4">Reported vulnerabilities</p>
        <div className="text-4xl font-bold text-indigo-400">
          {stats.loading ? "..." : stats.findings}
          {stats.criticalFindings > 0 && (
            <span className="ml-3 text-lg text-red-400 font-medium">
              ({stats.criticalFindings} critical)
            </span>
          )}
        </div>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-white mb-1">Revenue</h2>
        <p className="text-sm text-slate-400 mb-4">Last 30 days</p>
        <div className="text-4xl font-bold text-emerald-400">
          {stats.loading ? "..." : `$${stats.revenue.toLocaleString()}`}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;