import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-background p-8">
      <h1 className="text-xl font-semibold">shadcn/ui 组件陈列页（临时）</h1>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>按钮 Button</CardTitle>
          <CardDescription>五种 variant，源码见 components/ui/button.tsx</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button>default</Button>
          <Button variant="secondary">secondary</Button>
          <Button variant="outline">outline</Button>
          <Button variant="ghost">ghost</Button>
          <Button variant="destructive">destructive</Button>
        </CardContent>
      </Card>

      <Separator className="max-w-sm" />

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>输入框 + 徽章</CardTitle>
          <CardDescription>Input / Badge 组件</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Input placeholder="输入点什么…" />
          <div className="flex flex-wrap gap-2">
            <Badge>default</Badge>
            <Badge variant="secondary">secondary</Badge>
            <Badge variant="outline">outline</Badge>
            <Badge variant="destructive">destructive</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
