import fs from "fs";
import path from "path";

type EmailTranslations = {
    inviteSubject: string;
    inviteTitle: string;
    inviteBody: string;
    inviteExpiry: string;
    resetPasswordSubject: string;
    resetPasswordTitle: string;
    resetPasswordBody: string;
    resetPasswordExpiry: string;
};

const SUPPORTED_LOCALES = ["en", "vi", "ja", "ko"];
const DEFAULT_LOCALE = "en";

// Cache translations to avoid reading files repeatedly
const translationsCache: Record<string, EmailTranslations> = {};

/**
 * Get email translations for a specific locale
 * Falls back to default locale (en) if locale is not found
 */
export function getEmailTranslations(locale: string = DEFAULT_LOCALE): EmailTranslations {
    const normalizedLocale = SUPPORTED_LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;

    // Return cached translations if available
    if (translationsCache[normalizedLocale]) {
        return translationsCache[normalizedLocale];
    }

    try {
        const filePath = path.join(process.cwd(), "i18n", "locales", "email", `${normalizedLocale}.json`);
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const translations = JSON.parse(fileContent);
        translationsCache[normalizedLocale] = translations.Email;
        return translations.Email;
    } catch (error) {
        console.error(`Failed to load email translations for locale: ${normalizedLocale}`, error);
        // Fallback to default locale
        if (normalizedLocale !== DEFAULT_LOCALE) {
            return getEmailTranslations(DEFAULT_LOCALE);
        }
        // Return hardcoded fallback
        return {
            inviteSubject: "Activate your account",
            inviteTitle: "Welcome to OCR Editor",
            inviteBody: "You have been invited to join the system. Please click the link below to activate your account and set your password:",
            inviteExpiry: "This link will expire in 48 hours.",
            resetPasswordSubject: "Reset your password",
            resetPasswordTitle: "Password Reset Request",
            resetPasswordBody: "You have requested to reset your password. Please click the link below to set a new password:",
            resetPasswordExpiry: "This link will expire in 1 hour.",
        };
    }
}

/**
 * Generate invite email HTML
 */
export function generateInviteEmailHtml(activateUrl: string, locale: string = DEFAULT_LOCALE): string {
    const t = getEmailTranslations(locale);
    return `
    <h2>${t.inviteTitle}</h2>
    <p>${t.inviteBody}</p>
    <p><a href="${activateUrl}">${activateUrl}</a></p>
    <p>${t.inviteExpiry}</p>
  `;
}

/**
 * Generate password reset email HTML
 */
export function generateResetPasswordEmailHtml(resetUrl: string, locale: string = DEFAULT_LOCALE): string {
    const t = getEmailTranslations(locale);
    return `
    <h2>${t.resetPasswordTitle}</h2>
    <p>${t.resetPasswordBody}</p>
    <p><a href="${resetUrl}">${resetUrl}</a></p>
    <p>${t.resetPasswordExpiry}</p>
  `;
}
