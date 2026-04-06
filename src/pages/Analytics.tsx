import React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../components/ui/card";

export const Analytics: React.FC = () => {
  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Error Rate</CardTitle>
          <CardDescription>Last 24h</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl">0.8%</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Avg Response Time</CardTitle>
          <CardDescription>API p95</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl">320ms</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Requests/min</CardTitle>
          <CardDescription>Traffic</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl">145</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;