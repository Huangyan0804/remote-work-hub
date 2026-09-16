import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "next-i18next/client";
import type { I18nConfig } from "next-i18next/proxy";
import { getResources, getT, initServerI18next } from "next-i18next/server";
import { Toaster } from "@/components/ui/sonner";
import i18nConfig from "../../i18n.config";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT("common");
  return {
    title: t("app.name"),
    description: t("app.description"),
  };
}

// Turbopack/Webpack 会缓存 resourceLoader 里的动态 import()，dev 下改用 fs 读取，
// 这样改动 src/i18n/locales/*.json 才能即时生效（不影响 Edge 端的 i18n.config.ts）
const devResourceLoader: I18nConfig["resourceLoader"] = async (
  language,
  namespace,
) => {
  const [{ readFile }, path] = await Promise.all([
    import("node:fs/promises"),
    import("node:path"),
  ]);
  const file = await readFile(
    path.resolve(
      process.cwd(),
      `src/i18n/locales/${language}/${namespace}.json`,
    ),
    "utf-8",
  );
  return JSON.parse(file);
};

const isDev = process.env.NODE_ENV === "development";

initServerI18next({
  ...i18nConfig,
  resourceLoader: isDev ? devResourceLoader : i18nConfig.resourceLoader,
  reloadOnPrerender: isDev,
});

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { i18n } = await getT();
  const resources = getResources(i18n);
  const lng = i18n.language;
  return (
    <html
      lang={lng}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <I18nProvider language={lng} resources={resources}>
          <Providers>
            {children}
            <Toaster richColors position="top-center" />
          </Providers>
        </I18nProvider>
      </body>
    </html>
  );
}
