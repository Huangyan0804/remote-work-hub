"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusDot } from "@/components/ui/status-dot";
import { apiClient } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";

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
    <div className="flex flex-1 flex-col items-start justify-start gap-6 bg-background p-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 lg:px-0">
        <div className="flex flex-col">
          <h1 className="text-3xl font-semibold">健康检查</h1>
          <div className="flex flex-row items-end justify-between gap-2">
            <p className="text-base text-foreground/60">
              展示健康检查接口返回的服务状态与注册人数
            </p>

            <Button onClick={() => refetch()} disabled={isLoading}>
              重新检查
            </Button>
          </div>
        </div>
        <div className="flex flex-col flex-wrap items-stretch gap-10 lg:flex-row">
          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="text-base text-foreground/60">
                服务状态
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col justify-center gap-8">
              <div className="flex flex-row items-center gap-3">
                {isLoading ? (
                  <Skeleton className="w-full h-10 rounded-full" />
                ) : isError ? (
                  <>
                    <StatusDot variant="error" />
                    <p className="text-4xl font-semibold text-red-700 dark:text-red-300">
                      {"Error"}
                    </p>
                    <Badge className="bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">
                      运行异常
                    </Badge>
                  </>
                ) : (
                  <>
                    <StatusDot variant="success" />
                    <p className="text-4xl font-semibold text-green-700 dark:text-green-300">
                      {data?.status || "未知"}
                    </p>
                    <Badge className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                      运行正常
                    </Badge>
                  </>
                )}
              </div>
              <p className="text-xs text-foreground/60">
                接口实时返回的健康检查结果
              </p>
            </CardContent>
          </Card>
          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="text-base text-foreground/60">
                注册人数
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col justify-center gap-8">
              <div className="flex flex-row items-center gap-2">
                <div className="flex w-full text-4xl font-semibold font-mono tracking-tight">
                  {isLoading ? (
                    <Skeleton className="w-full h-10 rounded-full" />
                  ) : isError ? (
                    <>-</>
                  ) : (
                    <>{data?.userCount.toLocaleString() || "0"}</>
                  )}
                </div>
              </div>
              <p className="text-xs text-foreground/60">
                接口实时返回的注册用户总量
              </p>
            </CardContent>
          </Card>
        </div>
        <div>
          <p className="text-xs text-foreground/60 pl-4">
            数据仅来自后端健康检查接口
          </p>
        </div>
      </div>
    </div>
  );
}
