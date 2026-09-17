"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { RegisterRequest } from "@repo/types";
import {
  Eye,
  EyeOff,
  Info,
  KeyRound,
  Lock,
  Mail,
  TriangleAlert,
  User,
} from "lucide-react";
import Link from "next/link";
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
import { useRegister } from "../hooks";

const formSchema = z
  .object({
    name: z
      .string()
      .min(1, "validation.name")
      .min(2, "validation.nameLength")
      .max(20, "validation.nameLength"),
    email: z.email("validation.email"),
    password: z
      .string()
      .min(1, "validation.password")
      .min(8, "validation.passwordLength")
      .max(72, "validation.passwordLength"),
    confirmPassword: z.string().min(1, "validation.confirmPassword"),
    policy: z.boolean().refine((value) => value, "validation.policy"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "validation.passwordMatch",
    path: ["confirmPassword"],
  }) satisfies z.ZodType<RegisterRequest>;

export default function Register() {
  const { t } = useT("auth");
  const { t: tErrors } = useT("errors");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const registerForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      policy: false,
    },
  });

  const { register, isError, isPending, error } = useRegister();

  const onSubmit = (form: z.infer<typeof formSchema>) => {
    register({ name: form.name, email: form.email, password: form.password });
  };

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-balance font-semibold text-foreground text-xl">
          {t("register.heading")}
        </h1>
        <p className="text-foreground text-sm">{t("register.subtitle")}</p>
      </div>
      <Card className="w-full p-4 sm:max-w-md">
        <CardContent className="p-4">
          <form
            id="form-register"
            onSubmit={registerForm.handleSubmit(onSubmit)}
          >
            <FieldGroup className="gap-4">
              {isError ? (
                <Alert className="border-error bg-error-surface text-error">
                  <TriangleAlert />
                  <AlertTitle className="font-medium">
                    {getErrorMessage(error, t)}
                  </AlertTitle>
                </Alert>
              ) : null}

              <Controller
                name="name"
                control={registerForm.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel
                      className="inline-flex items-center gap-1.5"
                      htmlFor="form-register-name"
                    >
                      {t("form.name")}
                      <span className="text-destructive">*</span>
                    </FieldLabel>
                    <InputGroup>
                      <InputGroupInput
                        id="form-register-name"
                        {...field}
                        aria-invalid={fieldState.invalid}
                        disabled={isPending}
                        autoComplete="name"
                      />
                      <InputGroupAddon align="inline-start">
                        <User />
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
                name="email"
                control={registerForm.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel
                      className="inline-flex items-center gap-1.5"
                      htmlFor="form-register-email"
                    >
                      {t("form.email")}
                      <span className="text-destructive">*</span>
                    </FieldLabel>
                    <InputGroup>
                      <InputGroupInput
                        id="form-register-email"
                        {...field}
                        aria-invalid={fieldState.invalid}
                        disabled={isPending}
                        autoComplete="email"
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
                control={registerForm.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel
                      className="inline-flex items-center gap-1.5"
                      htmlFor="form-register-password"
                    >
                      {t("form.password")}
                      <span className="text-destructive">*</span>
                    </FieldLabel>
                    <InputGroup>
                      <InputGroupInput
                        id="form-register-password"
                        type={showPassword ? "text" : "password"}
                        {...field}
                        aria-invalid={fieldState.invalid}
                        disabled={isPending}
                        autoComplete="new-password"
                      />
                      <InputGroupAddon align="inline-start">
                        <Lock />
                      </InputGroupAddon>
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
                              ? t("form.hidePassword")
                              : t("form.showPassword")
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
              <Controller
                name="confirmPassword"
                control={registerForm.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel
                      className="inline-flex items-center gap-1.5"
                      htmlFor="form-register-confirm-password"
                    >
                      {t("form.confirmPassword")}
                      <span className="text-destructive">*</span>
                    </FieldLabel>
                    <InputGroup>
                      <InputGroupInput
                        id="form-register-confirm-password"
                        type="password"
                        {...field}
                        aria-invalid={fieldState.invalid}
                        disabled={isPending}
                        autoComplete="new-password"
                      />
                      <InputGroupAddon align="inline-start">
                        <Lock />
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
                control={registerForm.control}
                name="policy"
                render={({ field, fieldState }) => (
                  <Field
                    className="inline-flex justify-center"
                    orientation="vertical"
                  >
                    <div className="inline-flex items-center gap-2">
                      <Checkbox
                        id="policy"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                      <FieldLabel htmlFor="policy" className="gap-1">
                        <span>{t("form.policy")}</span>
                        <Button variant="link" className="p-0 underline">
                          {t("form.policyLink")}
                        </Button>
                        <span>{t("form.and")}</span>
                        <Button variant="link" className="p-0 underline">
                          {t("form.privacyLink")}
                        </Button>
                      </FieldLabel>
                    </div>
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

              <Button
                type="submit"
                form="form-register"
                size="lg"
                className="w-full"
                disabled={isPending}
              >
                {isPending && <Spinner data-icon="inline-start" />}
                {t("form.registerSubmit")}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-muted-foreground text-xs">{t("form.or")}</span>
        <Separator className="flex-1" />
      </div>
      <Button size="lg" variant="outline">
        <KeyRound data-icon="inline-start" />
        <span>{t("form.sso")}</span>
      </Button>

      <div className="inline-flex items-center justify-center">
        <span className="text-muted-foreground text-xs">
          {t("form.hasAccount")}
        </span>
        <Button variant="link" className="p-0 text-[13px] underline">
          <Link href="/login">{t("form.toLogin")}</Link>
        </Button>
      </div>
    </>
  );
}
