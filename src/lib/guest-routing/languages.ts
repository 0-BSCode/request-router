import { z } from "zod";

export const detectedLanguageSchema = z.string().regex(/^(?:[a-z]{2,3}|mixed|unknown)$/);

export function isSupportedLanguage(language: string) {
  return ["en", "fil", "ceb", "mixed"].includes(language);
}

export function getReplyLanguage(language: string) {
  return language === "fil" || language === "ceb" ? language : "en";
}

export function getLanguageLabel(language: string) {
  const labels: Record<string, string> = {
    en: "English",
    fil: "Filipino",
    ceb: "Cebuano",
    mixed: "Mixed supported languages",
    unknown: "Unknown",
  };
  if (labels[language]) return labels[language];
  try {
    return (
      new Intl.DisplayNames(["en"], { type: "language", fallback: "none" }).of(language) ?? language
    );
  } catch {
    return language;
  }
}

export function getLanguageSupportLabel(language: string) {
  if (language === "unknown") return "Review required";
  if (language === "mixed") return "English reply";
  return isSupportedLanguage(language) ? "Supported" : "Unsupported";
}
