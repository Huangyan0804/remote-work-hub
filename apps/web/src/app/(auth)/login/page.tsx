"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Info, KeyRound, Mail, TriangleAlert } from "lucide-react";
import { useT } from "next-i18next/client";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";

const formSchema = z.object({
  email: z.email("请输入有效的邮箱地址"),
  password: z.string().nonempty("请输入密码"),
});

export default function Login() {
  const { t } = useT();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    console.log(data);
    // wait 1s
    await new Promise((resolve) => setTimeout(resolve, 3000));
  };

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-balance font-semibold text-foreground text-xl">
          欢迎回来
        </h1>
        <p className="text-foreground text-sm">登录以继续你的远程工作台</p>
      </div>
      <Card className="w-full p-4 sm:max-w-md">
        <CardContent className="p-4">
          <form id="form-login" onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup className="gap-4">
              <Alert className="border-error bg-error-surface text-error">
                <TriangleAlert />
                <AlertTitle className="font-medium">邮箱或密码错误</AlertTitle>
                <AlertDescription className="text-error text-xs">
                  出于安全考虑不区分具体字段，请修正后重新登录
                </AlertDescription>
              </Alert>
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel
                      className="inline-flex items-center gap-1.5"
                      htmlFor="form-login-email"
                      aria-required
                    >
                      邮箱
                      <span className="text-destructive">*</span>
                    </FieldLabel>
                    <InputGroup>
                      <InputGroupInput
                        id="form-login-email"
                        {...field}
                        aria-invalid={fieldState.invalid}
                      />
                      <InputGroupAddon align="inline-start">
                        <Mail />
                      </InputGroupAddon>
                    </InputGroup>

                    {fieldState.invalid && (
                      <FieldError>
                        <p className="inline-flex items-center gap-1 text-xs">
                          <Info className="size-3" />
                          <span>{fieldState.error?.message}</span>
                        </p>
                      </FieldError>
                    )}
                  </Field>
                )}
              />
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel
                      className="inline-flex items-center gap-1.5"
                      htmlFor="form-login-password"
                      aria-required
                    >
                      密码
                      <span className="text-destructive">*</span>
                    </FieldLabel>
                    <InputGroup>
                      <InputGroupInput
                        id="form-login-password"
                        className="pl-7.5"
                        type={showPassword ? "text" : "password"}
                        {...field}
                        aria-invalid={fieldState.invalid}
                      />
                      <InputGroupAddon align="inline-end">
                        <Button
                          onClick={() => {
                            setShowPassword((prev) => !prev);
                          }}
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={showPassword ? "隐藏密码" : "显示密码"}
                        >
                          {showPassword ? <EyeOff /> : <Eye />}
                        </Button>
                      </InputGroupAddon>
                    </InputGroup>

                    {fieldState.invalid && (
                      <FieldError>
                        <p className="inline-flex items-center gap-1 text-xs">
                          <Info className="size-3" />
                          <span>{fieldState.error?.message}</span>
                        </p>
                      </FieldError>
                    )}
                  </Field>
                )}
              />

              <Field
                className="inline-flex items-center justify-between"
                orientation="horizontal"
              >
                <div className="inline-flex items-center gap-2">
                  <Checkbox id="remember" />
                  <FieldLabel htmlFor="remember">记住我</FieldLabel>
                </div>
                <Button variant="link" className="underline">
                  忘记密码？
                </Button>
              </Field>

              <Button
                type="submit"
                form="form-login"
                size="lg"
                className="w-full"
              >
                {form.formState.isSubmitting && (
                  <Spinner data-icon="inline-start" />
                )}
                登录
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-muted-foreground text-xs">或</span>
        <Separator className="flex-1" />
      </div>
      <Button size="lg" variant="outline">
        <KeyRound data-icon="inline-start" />
        <span>使用SSO登录</span>
      </Button>

      <div className="inline-flex items-center justify-center">
        <span className="text-muted-foreground text-xs">还没有账号？</span>
        <Button variant="link" className="p-0 text-[13px] underline">
          立即注册
        </Button>
      </div>
    </>
  );
}
