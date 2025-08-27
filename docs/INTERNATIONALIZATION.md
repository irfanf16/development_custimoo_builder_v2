# Internationalization (i18n) Setup

This project uses [Paraglide JS](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) for internationalization, providing a modern, type-safe, and performant solution for multi-language support.

## Features

- **Three Languages**: English (default), French, and Danish
- **No Page Reloads**: Language switching happens instantly without page refresh
- **Type Safety**: Full TypeScript support with generated types
- **Maintainable**: Each language has its own JSON file for easy maintenance
- **Company Store Integration**: Language configuration stored in the company store
- **DateTime & Currency Support**: Separate configuration for locale-specific formatting

## Architecture

### 1. Message Files

Messages are stored in JSON files in the `messages/` directory:

- `messages/en.json` - English messages
- `messages/fr.json` - French messages
- `messages/da.json` - Danish messages

### 2. Company Store Configuration

The company store (`src/stores/company/index.ts`) contains:

```typescript
interface CompanyLocalization {
  availableLanguages: LanguageConfig[]
  defaultLanguage: string
  datetime: DateTimeConfig
  currency: CurrencyConfig
}
```

### 3. Paraglide Integration

- **Vite Plugin**: Automatically compiles messages during build
- **Runtime**: Handles locale switching without page reloads
- **Type Generation**: Creates TypeScript declarations for all messages

## Usage

### Adding New Messages

1. Add the message key and English text to `messages/en.json`:

```json
{
  "new_message": "This is a new message"
}
```

2. Add translations to `messages/fr.json` and `messages/da.json`

3. Rebuild the project: `npm run build`

4. Import and use in components:

```typescript
import { new_message } from '@/paraglide/messages/_index.js'

// In template
<span>{{ new_message() }}</span>
```

### Language Switching

The `LanguageSwitcher` component automatically:

- Shows available languages from the company store
- Hides itself if only one language is available
- Updates the locale without page reload
- Integrates with Paraglide runtime

### Locale Management

Use the `useParaglideLocale` composable:

```typescript
import { useParaglideLocale } from '@/composables/useParaglideLocale'

const { currentLocale, changeLocale, availableLocales } = useParaglideLocale()

// Change language
changeLocale('fr')
```

## Configuration

### Project Settings

The `project.inlang/settings.json` file configures:

- Base locale (English)
- Available locales (en, fr, da)
- Message format plugin
- Output directory (`src/paraglide`)

### Vite Configuration

The Vite plugin automatically:

- Watches message files for changes
- Compiles messages to JavaScript
- Enables hot module replacement for messages

## Build Process

1. **Development**: Messages are compiled on-demand with HMR
2. **Production**: Messages are compiled and bundled with the application
3. **Type Generation**: TypeScript declarations are automatically updated

## Available Messages

Current message keys:

- `save` - Save button text
- `locker_room` - Locker room button text
- `cart` - Shopping cart button text
- `language` - Language label
- `theme` - Theme label
- `sign_in` - Sign in button text
- `save_options` - Save options aria-label
- `welcome_message` - Welcome message
- `select_language` - Language selection label
- `current_language` - Current language label

## Best Practices

1. **Message Keys**: Use descriptive, lowercase keys with underscores
2. **Translation Files**: Keep all language files in sync
3. **Type Safety**: Always import from the generated index file
4. **Locale Switching**: Use the composable for consistent behavior
5. **Testing**: Test with different locales to ensure proper rendering

## Troubleshooting

### Type Errors

If you see TypeScript errors about missing message functions:

1. Ensure the message exists in all language files
2. Rebuild the project: `npm run build`
3. Check that the message is exported in `src/paraglide/messages/_index.js`

### Build Errors

If the build fails:

1. Check message file syntax (valid JSON)
2. Ensure all language files have the same message keys
3. Verify the project.inlang configuration

### Runtime Issues

If language switching doesn't work:

1. Check browser console for errors
2. Verify the company store has language configuration
3. Ensure the Paraglide runtime is properly imported

## Future Enhancements

- **Machine Translation**: Integration with translation services
- **Dynamic Language Loading**: Load languages on-demand
- **Locale Detection**: Automatic language detection from browser
- **RTL Support**: Right-to-left language support
- **Number Formatting**: Locale-specific number formatting
