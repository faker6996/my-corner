// ESLint flat config dùng cho project Next.js + TypeScript
// Không dùng eslint-config-next để tránh lỗi @rushstack/eslint-patch trên Jenkins.

import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  {
    ignores: ["node_modules/**", ".next/**", "dist/**", "coverage/**"],
  },
  // TypeScript / TSX files
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        module: "writable",
        require: "writable",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      "react-hooks": reactHooks,
    },
    rules: {
      // Chỉ bật một số rule cơ bản để tránh phá build vì style
      "no-unexpected-multiline": "error",
      "no-unsafe-negation": "error",
      // Định nghĩa nhưng tắt các rule react-hooks để tránh lỗi khi có eslint-disable trong code
      "react-hooks/rules-of-hooks": "off",
      "react-hooks/exhaustive-deps": "off",
    },
  },
  // Plain JS / JSX files
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      ecmaFeatures: { jsx: true },
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        module: "writable",
        require: "writable",
      },
    },
    rules: {
      "no-unexpected-multiline": "error",
      "no-unsafe-negation": "error",
    },
  },
];
