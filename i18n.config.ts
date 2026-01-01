export const locales = ['en', 'vi', 'ko', 'ja'] as const;
export type Locale = (typeof locales)[number];
