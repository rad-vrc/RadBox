# Auto-Translation to Japanese

This repository includes an automated workflow that translates localization source files under `Reference/` into Japanese, applying translation guidelines from XML files.

## How it works

1. **Trigger**: The workflow runs automatically when files under `Reference/` are pushed to the `main` branch
2. **Detection**: Uses `tj-actions/changed-files` to detect which files changed
3. **Translation**: Runs a Node.js script that translates changed files using DeepL or Azure Translator
4. **Output**: Creates translated files under `i18n/ja/` mirroring the `Reference/` structure
5. **PR Creation**: Opens a Pull Request with the translated files

## Configuration

### Repository Secrets
- `DEEPL_API_KEY`: Your DeepL API key (required if using DeepL)
- `AZURE_TRANSLATOR_KEY`: Azure Translator API key (required if using Azure)
- `AZURE_TRANSLATOR_ENDPOINT`: Azure Translator endpoint (required if using Azure)
- `AZURE_TRANSLATOR_REGION`: Azure Translator region (required if using Azure)

### Repository Variables
- `TRANSLATOR_PROVIDER`: Set to `deepl` or `azure` to choose the translation service

## Supported File Formats

- `.json` - JSON files
- `.yml`, `.yaml` - YAML files
- `.properties` - Java properties files
- `.txt` - Plain text files
- `.md` - Markdown files
- `.hjson` - HJSON files (with support for multi-line strings using `'''`)

## Translation Guidelines

The script uses XML guideline files (prioritizes `Reference/CLAUDE.xml`) to:

- Apply term mappings (e.g., "Ichor" → "霊液")
- Protect do-not-translate terms
- Apply style formatting (polite vs casual tone)
- Handle punctuation localization (`.` → `。`, `,` → `、`)

## Placeholder Protection

The translation script automatically protects various placeholder formats during translation:

- `{0}`, `{name}` - Brace placeholders
- `%s`, `%1$s` - Printf-style placeholders
- `<b>`, `</b>` - HTML tags
- `$ENV_VAR` - Environment variables
- `:param` - Named parameters

## Workflow Behavior

- **Single file changes**: Translates only the changed files
- **Guideline changes**: If any `.xml` file under `Reference/` changes, retranslates all source files
- **No changes**: If no arguments provided, translates all source files
- **Concurrency**: Uses ref-based concurrency control to prevent overlapping runs

## Output Structure

```
Reference/
├── CLAUDE.xml           # Translation guidelines
└── ja-JP_Mods.VKE.hjson # Source file

i18n/ja/
└── ja-JP_Mods.VKE.hjson # Translated output
```

## Manual Usage

You can also run the translation script manually:

```bash
# Install dependencies
npm install --no-save fast-xml-parser yaml

# Set environment variables
export TRANSLATOR_PROVIDER=deepl
export DEEPL_API_KEY=your_api_key_here

# Translate specific files
node scripts/translate.mjs Reference/some-file.hjson

# Translate all files
node scripts/translate.mjs
```