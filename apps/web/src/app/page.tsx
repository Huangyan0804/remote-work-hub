"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface HealthResponse {
  status: string;
  db: string;
  userCount: number;
}

export default function Home() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const { data } = await apiClient.get<HealthResponse>("/health");
      return data;
    },
  });

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-background p-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>后端健康检查</CardTitle>
          <CardDescription>
            GET /api/health — 验证前端 → API → 数据库全链路
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-3">
          {isLoading && <Badge variant="outline">正在检查…</Badge>}
          {isError && (
            <div className="flex flex-col items-start gap-2">
              <Badge variant="destructive">连接失败</Badge>
              <p className="text-sm text-muted-foreground">
                请确认数据库与 API 服务已启动（docker compose up -d &amp;&amp;
                pnpm dev --filter=api）
              </p>
            </div>
          )}
          {data && (
            <div className="flex flex-col items-start gap-2">
              <div className="flex gap-2">
                <Badge>status: {data.status}</Badge>
                <Badge variant="secondary">db: {data.db}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                当前用户数：{data.userCount}
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            重新检查
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
