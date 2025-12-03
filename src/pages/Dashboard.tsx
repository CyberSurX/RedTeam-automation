import React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../components/ui/card";

export const Dashboard: React.FC = () => {
  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Programs</CardTitle>
          <CardDescription>Tracked bounty programs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold">12</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Findings</CardTitle>
          <CardDescription>Reported vulnerabilities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold">38</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Revenue</CardTitle>
          <CardDescription>Last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold">$4,250</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;