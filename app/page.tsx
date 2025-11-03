'use client'
import React, { useEffect, useState, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, Terminal, UploadCloud } from "lucide-react";

interface Deployment {
  id: number;
  url: string;
  status: string;
  type: "static" | "dynamic";
}

const Dashboard = () => {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [repoUrl, setRepoUrl] = useState("");
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when logs update
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Connect to WebSocket for live logs
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:5673/build-logs");
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setLogs((prev) => [...prev, data.message]);
    };
    ws.onerror = (err) => console.error("WebSocket error:", err);
    return () => ws.close();
  }, []);

  const handleDeploy = async () => {
    if (!repoUrl.trim()) return alert("Enter repo URL");

    const res = await fetch("http://localhost:5673/deploy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repoUrl }),
    });

    const data = await res.json();
    if (data.success) {
      setDeployments((prev) => [
        { id: Date.now(), url: data.url, status: "Deployed", type: data.type },
        ...prev,
      ]);
    } else {
      alert("Deployment failed: " + data.error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">🚀 Deployment Dashboard</h1>
      </div>

      {/* Deploy form */}
      <Card className="p-4">
        <div className="flex gap-3 items-center">
          <Input
            placeholder="Enter GitHub repo URL (e.g. https://github.com/user/project.git)"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
          />
          <Button onClick={handleDeploy} className="gap-2">
            <UploadCloud className="h-4 w-4" />
            Deploy
          </Button>
        </div>
      </Card>

      {/* Deployment Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {deployments.length === 0 && (
          <p className="text-muted-foreground">No deployments yet.</p>
        )}
        {deployments.map((d) => (
          <Card key={d.id} className="hover:shadow-lg transition">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{d.url.replace("http://localhost:8070/", "")}</span>
                <Badge variant={d.status === "Deployed" ? "default" : "secondary"}>
                  {d.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Type: {d.type === "static" ? "Static (Nginx)" : "Dynamic (Docker)"}
              </p>
              <a
                href={d.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline text-sm"
              >
                Open Deployment →
              </a>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Build Logs */}
      <Card className="p-0 overflow-hidden">
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            <CardTitle>Build Logs</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLogs([])}
            className="text-xs"
          >
            Clear
          </Button>
        </CardHeader>
        <CardContent className="bg-black text-green-400 font-mono text-xs p-3 rounded-b-md">
          <ScrollArea className="h-[300px]">
            {logs.map((line, i) => (
              <div key={i} className="whitespace-pre-wrap">
                {line}
              </div>
            ))}
            <div ref={logsEndRef} />
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
