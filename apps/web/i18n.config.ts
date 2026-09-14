import type { I18nConfig } from "next-i18next/proxy";

// i18n.config.ts（项目根）
const i18nConfig: I18nConfig = {
  supportedLngs: ["zh"],
  fallbackLng: "zh",
  defaultNS: "common",
  ns: ["common", "errors"],
  localeInPath: false,
  resourceLoader: (language, namespace) =>
    import(`./src/i18n/locales/${language}/${namespace}.json`),
};
export default i18nConfig;
