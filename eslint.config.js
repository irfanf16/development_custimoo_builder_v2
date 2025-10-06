import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { FlatCompat } from '@eslint/eslintrc'
import vue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'
import tseslint from 'typescript-eslint'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const compat = new FlatCompat({ baseDirectory: __dirname })

const vueFlatRecommended = Array.isArray(vue.configs['flat/recommended'])
  ? vue.configs['flat/recommended']
  : [vue.configs['flat/recommended']]

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'components.d.ts',
      'src/paraglide/**'
    ]
  },
  ...vueFlatRecommended,
  // TypeScript base recommendations (no type info) - only TS/TSX files
  ...tseslint.configs.recommended.map(cfg => ({
    ...cfg,
    files: ['**/*.{ts,tsx}']
  })),
  // Type-aware recommendations - only TS/TSX files
  ...tseslint.configs.recommendedTypeChecked.map(cfg => ({
    ...cfg,
    files: ['**/*.{ts,tsx}']
  })),
  // Provide project service and parser for TS/TSX only
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname
      }
    }
  },
  // For Vue SFCs, keep vue-eslint-parser and only point script blocks to TS parser
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        projectService: true,
        tsconfigRootDir: __dirname,
        extraFileExtensions: ['.vue']
      }
    }
  },
  // Disable rules that conflict with Prettier
  ...compat.extends('@vue/eslint-config-prettier/skip-formatting'),
  // Custom project rules
  {
    plugins: {
      '@typescript-eslint': tseslint.plugin
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off'
    }
  }
]
