"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { LoginRequest } from "@repo/types";
import { Eye, EyeOff, Info, KeyRound, Mail, TriangleAlert } from "lucide-react";
import { useT } from "next-i18next/client";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Alert, AlertTitle } from "@/components/ui/alert";
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
import { getErrorMessage } from "@/lib/get-error-message";
import { useLogin } from "../hooks";

const formSchema = z.object({
  email: z.email("validation.email"),
  password: z.string().min(1, "validation.password"),
}) satisfies z.ZodType<LoginRequest>;

export default function Login() {
  const { t } = useT("auth");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const loginForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { login, isError, isPending, error } = useLogin();

  const onSubmit = (form: z.infer<typeof formSchema>) => {
    console.log(form);
    login(form);
  };

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-balance font-semibold text-foreground text-xl">
          {t("login.heading")}
        </h1>
        <p className="text-foreground text-sm">{t("login.subtitle")}</p>
      </div>
      <Card className="w-full p-4 sm:max-w-md">
        <CardContent className="p-4">
          <form id="form-login" onSubmit={loginForm.handleSubmit(onSubmit)}>
            <FieldGroup className="gap-4">
              {isError && (
                <Alert className="border-error bg-error-surface text-error">
                  <TriangleAlert />
                  <AlertTitle className="font-medium">
                    {getErrorMessage(error, t)}
                  </AlertTitle>
                </Alert>
              )}
              <Controller
                name="email"
                control={loginForm.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel
                      className="inline-flex items-center gap-1.5"
                      htmlFor="form-login-email"
                      aria-required
                    >
                      {t("login.email")}
                      <span className="text-destructive">*</span>
                    </FieldLabel>
                    <InputGroup>
                      <InputGroupInput
                        id="form-login-email"
                        {...field}
                        aria-invalid={fieldState.invalid}
                        disabled={isPending}
                      />
                      <InputGroupAddon align="inline-start">
                        <Mail />
                      </InputGroupAddon>
                    </InputGroup>

                    {fieldState.invalid && (
                      <FieldError>
                        <p className="inline-flex items-center gap-1 text-xs">
                          <Info className="size-3" />
                          <span>{t(fieldState.error?.message as string)}</span>
                        </p>
                      </FieldError>
                    )}
                  </Field>
                )}
              />
              <Controller
                name="password"
                control={loginForm.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel
                      className="inline-flex items-center gap-1.5"
                      htmlFor="form-login-password"
                      aria-required
                    >
                      {t("login.password")}
                      <span className="text-destructive">*</span>
                    </FieldLabel>
                    <InputGroup>
                      <InputGroupInput
                        id="form-login-password"
                        className="pl-7.5"
                        type={showPassword ? "text" : "password"}
                        {...field}
                        aria-invalid={fieldState.invalid}
                        disabled={isPending}
                      />
                      <InputGroupAddon align="inline-end">
                        <Button
                          onClick={() => {
                            setShowPassword((prev) => !prev);
                          }}
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={
                            showPassword
                              ? t("login.hidePassword")
                              : t("login.showPassword")
                          }
                        >
                          {showPassword ? <EyeOff /> : <Eye />}
                        </Button>
                      </InputGroupAddon>
                    </InputGroup>

                    {fieldState.invalid && (
                      <FieldError>
                        <p className="inline-flex items-center gap-1 text-xs">
                          <Info className="size-3" />
                          <span>{t(fieldState.error?.message as string)}</span>
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
                  <FieldLabel htmlFor="remember">
                    {t("login.remember")}
                  </FieldLabel>
                </div>
                <Button variant="link" className="underline">
                  {t("login.forgot")}
                </Button>
              </Field>

              <Button
                type="submit"
                form="form-login"
                size="lg"
                className="w-full"
                disabled={isPending}
              >
                {isPending && <Spinner data-icon="inline-start" />}
                {t("login.submit")}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-muted-foreground text-xs">{t("login.or")}</span>
        <Separator className="flex-1" />
      </div>
      <Button size="lg" variant="outline">
        <KeyRound data-icon="inline-start" />
        <span>{t("login.sso")}</span>
      </Button>

      <div className="inline-flex items-center justify-center">
        <span className="text-muted-foreground text-xs">
          {t("login.noAccount")}
        </span>
        <Button variant="link" className="p-0 text-[13px] underline">
          {t("login.register")}
        </Button>
      </div>
    </>
  );
}
