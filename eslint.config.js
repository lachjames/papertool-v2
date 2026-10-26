import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactCompiler from "eslint-plugin-react-compiler"
import pluginReact from "eslint-plugin-react"
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginReactRedux from "eslint-plugin-react-redux";
import { defineConfig } from "eslint/config";

export default defineConfig([
  // Global ignores
  {
    ignores: [
      "_output/**",
      "repos/**",
      "dist/**",
      "build/**",
      "node_modules/**",
      "coverage/**",
      "*.config.js",
      "*.config.ts",
      ".vite/**",
      ".yarn/**",
      "public/**",
      "*.min.js",
      "*.bundle.js",
      "**/*.d.ts"
    ]
  },

  // Global language options with comprehensive globals
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,

        // React globals
        React: "readonly",
        JSX: "readonly",

        // NodeJS globals
        NodeJS: "readonly",

        // Browser API globals
        RequestInit: "readonly",
        RequestInfo: "readonly",
        RequestCredentials: "readonly",
        HeadersInit: "readonly",
        PermissionState: "readonly",
        LocalForage: "readonly",
        LockOptions: "readonly",
        RTCSdpType: "readonly",
        PerformanceMemory: "readonly",
        EventListener: "readonly",
      },
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    rules: {
      "no-undef": "error",
      "no-unused-vars": "off", // Let TypeScript handle this
      "no-console": "off",
      "no-debugger": "warn",
    }
  },

  // Minimal TypeScript - only parse errors
  tseslint.configs.base,
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      // Turn off ALL TypeScript rules initially
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-var-requires": "off",
      "@typescript-eslint/no-this-alias": "off",
      "@typescript-eslint/ban-types": "off",
    }
  },

  // ONLY React Hooks - these are critical
  {
    files: ["**/*.{jsx,tsx,js,ts}"],
    plugins: {
      "react-hooks": pluginReactHooks
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn", // Start with warn
    }
  },
  { ...pluginReact.configs.flat.recommended, settings: { react: { version: "detect" } } },
  reactCompiler.configs.recommended,

  // React Redux plugin configuration
  {
    files: ["**/*.{jsx,tsx,js,ts}"],
    plugins: {
      "react-redux": pluginReactRedux
    },
    rules: {
      // React Redux recommended rules (you can adjust these as needed)
      "react-redux/connect-prefer-named-arguments": "warn",
      "react-redux/mapDispatchToProps-returns-object": "error",
      "react-redux/mapStateToProps-no-store": "error",
      "react-redux/useSelector-prefer-selectors": "warn",
      "react-redux/mapStateToProps-prefer-selectors": "warn",
      "react-redux/prefer-separate-component-file": "off", // Often too strict for smaller projects
    }
  },

  // Override React rules
  {
    files: ["**/*.{jsx,tsx}"],
    rules: {
      "react/no-unescaped-entities": [
        "error",
        {
          // forbid: [">", "}", "&"] // Only forbid these characters, allow quotes and apostrophes
          forbid: [">", "}"] // Only forbid these characters, allow quotes and apostrophes
        }
      ],
    }
  }
]);
