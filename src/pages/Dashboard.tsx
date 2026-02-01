import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../components/ui/card";
import axios from "axios";

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
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
        const response = await axios.get('/api/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if ((response.data as any).success) {
          setStats({
            ...(response.data as any).data,
            loading: false
          });
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Programs</CardTitle>
          <CardDescription>Tracked bounty programs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold">
            {stats.loading ? "..." : stats.programs}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Findings</CardTitle>
          <CardDescription>Reported vulnerabilities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold">
            {stats.loading ? "..." : stats.findings}
            {stats.criticalFindings > 0 && (
              <span className="ml-2 text-sm text-red-500">
                ({stats.criticalFindings} critical)
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Revenue</CardTitle>
          <CardDescription>Last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold">
            {stats.loading ? "..." : `$${stats.revenue.toLocaleString()}`}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;