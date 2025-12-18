# 🎭 Playwright Transformer

[![npm version](https://img.shields.io/npm/v/@egain-qe/egain-playwright-transformer)](https://www.npmjs.com/package/@egain-qe/egain-playwright-transformer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Playwright Transformer is a powerful tool that automatically converts recorded Playwright test scripts into data-driven tests. It extracts test data values from your test files, externalizes them to JSON data files, and transforms your tests to use data-driven patterns—making your test suite more maintainable, scalable, and easier to update.

## ✨ Features

**Automated Value Extraction** • **Pattern-Based Transformation**

- **Smart Pattern Matching**. Automatically identifies and extracts values from Playwright actions like `.fill()`, `.selectOption()`, `.click()`, and more using configurable regex patterns and externalize these into data files.

- **Data-Driven Conversion**. Transforms hardcoded test values into data references, enabling easy test data management and parameterization. Generated external data file is json array which enables test data addition.

- **Flexible Configuration**. Uses JSON-based configuration files for patterns, replacements, and transformations—no code changes needed to customize behavior.

- **Pre-processing Pipeline**. Automatically inserts boilerplate code, removes noise lines, and applies custom transformations before pattern processing.

## 📋 Table of Contents

- [Features](#-features)
- [Installation](#-installation)
  - [Prerequisites](#prerequisites)
  - [Install from npm](#install-from-npm)
  - [Install from GitHub Packages](#install-from-github-packages)
- [Quick Start](#-quick-start)
  - [Prerequisites](#prerequisites-1)
  - [Using the CLI](#using-the-cli)
  - [Using npm scripts](#using-npm-scripts)
- [Usage](#-usage)
  - [CLI Usage](#cli-usage)
  - [Programmatic API](#programmatic-api)
- [How It Works](#-how-it-works)
- [Configuration](#️-configuration)
  - [Configuration Files](#configuration-files)
  - [Customizing Patterns](#customizing-patterns)
- [Examples](#-examples)
- [API Reference](#-api-reference)
- [Development](#️-development)
- [Contributing](#-contributing)
- [License](#-license)
- [Related Projects](#-related-projects)
- [Support](#-support)

## 🚀 Installation

### Prerequisites

- **Node.js** >= 18.0.0 (required for building the package)
- **npm** or **yarn**

### Install from npm

```bash
npm install -D @egain-qe/egain-playwright-transformer
```

Or using yarn:

```bash
yarn add -D @egain-qe/egain-playwright-transformer
```

## 🎯 Quick Start

### Prerequisites

1. Make sure application under test uses static ids - preferably follow best practise to use data-testid.
2. Before running the transformer, ensure you have a `config/` directory in your project root with all required configuration files:

- `fill_patterns.json`
- `replace_texts.json`
- `insert_lines.json`
- `prepend.ts`
- `test_start.ts`

The transformer will auto-detect the `config/` directory relative to your current working directory.

### Using the CLI

The easiest way to get started is using the command-line interface as below where:

- `--input-dir` = folder with recorded test scripts
- `--output-dir` = folder where transformed script will be generated
- `--data-dir` = folder where output data files will be generated

```bash
# Transform all test files
node node_modules/@egain-qe/egain-playwright-transformer/dist/cli.mjs \
  --all \
  --input-dir tests/input \
  --output-dir tests/output \
  --data-dir data/output
```

### Using npm scripts

Add to your `package.json`:

```json
{
  "scripts": {
    "transform:all": "node node_modules/@egain-qe/egain-playwright-transformer/dist/cli.mjs --all --input-dir tests/input --output-dir tests/output --data-dir tests/data"
  }
}
```

Then run:

```bash
npm run transform:all
```

## 📖 Usage

### CLI Usage

The CLI provides a simple interface for transforming test files:

```bash
# Transform all test files
node node_modules/@egain-qe/egain-playwright-transformer/dist/cli.mjs \
  --all \
  --input-dir tests/input \
  --output-dir tests/output \
  --data-dir data/output
```

#### Options

| Option         | Short | Description                                         | Required |
| -------------- | ----- | --------------------------------------------------- | -------- |
| `--input-dir`  | `-i`  | Directory containing source test files (`.spec.ts`) | ✅ Yes   |
| `--output-dir` | `-o`  | Directory for transformed test files                | ✅ Yes   |
| `--data-dir`   | `-d`  | Directory for JSON data files                       | ✅ Yes   |
| `--help`       | `-h`  | Show help message                                   | ❌ No    |

#### Examples

```bash
# Transform all test files
node node_modules/@egain-qe/egain-playwright-transformer/dist/cli.mjs \
  --all \
  --input-dir ./tests/input \
  --output-dir ./tests/output \
  --data-dir ./data/output
```

### Programmatic API

For more control, use the programmatic API:

```typescript
import {
  transform,
  PlaywrightTransformer,
} from '@egain-qe/egain-playwright-transformer';

// Simple usage
await transform({
  inputDir: './tests/input',
  outputDir: './tests/output',
  dataDir: './data/output',
});

// Advanced usage with custom configuration
const transformer = new PlaywrightTransformer({
  inputDir: './tests/input',
  outputDir: './tests/output',
  dataDir: './data/output',
});

const result = await transformer.transformAll();

if (result.success) {
  console.log(`Transformed ${result.transformedFiles} files`);
} else {
  console.error('Errors:', result.errors);
}
```

## 🔧 How It Works

Playwright Transformer follows a multi-phase transformation pipeline:

### 1. **Pre-processing Phase**

- **Remove Noise**: Filters out unnecessary lines like goto steps for browser redirect
- **Prepend Boilerplate**: Injects setup code from `prepend.ts` and `test_start.ts` at the beginning of each test file

### 2. **Pattern Processing Phase**

For each line in the test file:

- **Pattern Matching**: Analyzes the line against configured patterns
- **Value Extraction**: Identifies hardcoded values in actions like:
  - `.fill('value')` → extracts `'value'`
  - `.selectOption('option')` → extracts `'option'`
  - And all other pattern types in `fill_patterns.json`

- **Data Mapping**: Stores extracted values in maps:
  - `jsonMap`: Maps field names to values (for JSON output)
  - `reverseJsonMap`: Maps values to data references (for replacement)
  - `dynamicIdsMap`: Tracks dynamic selectors

### 3. **Transformation Phase**

- **Fill Pattern Handler**: Replaces hardcoded values with data references:

  ```typescript
  // Before
  await page.getByTestId('username').fill('john@example.com');

  // After
  await page.getByTestId('username').fill(data.username + uniqueIndex);
  ```

- **Default Pattern Handler**: Applies text replacements from `replace_texts.json`:
  - Data value replacement
  - locators and IDs using the data values if any
  - Skip any constant value substitution
  - exclude unique index addition for any defined elements/steps

- **Special Handlers**: Handle test structure, file endings, and special cases

### 4. **Output Generation Phase**

- **Transformed Test File**: Writes the data-driven test to the output directory
- **JSON Data File**: Generates a JSON file with all extracted values:
  ```json
  {
    "tcName": "TC01",
    "username": "john@example.com",
    "password": "secret123"
  }
  ```

### Transformation Example

**Input** (`input/TC01_Login.spec.ts`):

```typescript
import { test } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://example.com/login');
  await page.getByTestId('username').fill('john@example.com');
  await page.getByTestId('password').fill('secret123');
  await page.getByRole('button', { name: 'Sign in' }).click();
});
```

**Output** (`output/TC01_Login.spec.ts`):

```typescript
import { test } from '@playwright/test';
import input from '@data/output/TC01_Login.json';

for (const data of input) {
  test(`${data['tcName']}`, async ({ page }) => {
    await page.goto(process.env.BASE_URL);
    await page.getByTestId('username').fill(data.username);
    await page.getByTestId('password').fill(data.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
  });
}
```

**Data File** (`data/output/TC01_Login.json`):

```json
[
  {
    "tcName": "TC01",
    "username": "john@example.com",
    "password": "secret123"
  }
]
```

## ⚙️ Configuration

Playwright Transformer uses JSON configuration files located in the `config/` directory. The `config/` directory must exist in your project root (where you run the CLI command) with all required configuration files as mentioned below. Refer to configuration files used in different examples in example folder.

### Configuration Files

| File                 | Purpose          | Description                                                                                               |
| -------------------- | ---------------- | --------------------------------------------------------------------------------------------------------- |
| `fill_patterns.json` | Value Extraction | Defined regex patterns for extracting test data values from recorded script steps.                        |
| `replace_texts.json` | Text Replacement | Rules for replacing hardcoded data values in recorded scripts with data references from externalized data |
| `insert_lines.json`  | Code Injection   | Inserts/Updates steps based on defined "existingLines" in json                                            |
| `prepend.ts`         | Boilerplate      | Define all import statements code needed for tests                                                        |
| `test_start.ts`      | Boilerplate      | Define initial steps of test case include any custom method initialization if needed                      |

## Customizing Patterns

Edit the JSON configuration files to customize transformation behavior:

### 1. fill_patterns.json example

Below patterns will get data from all steps which has

- "getByTestId()" and "fill()"
- "getByTestId()" and "selectOption()"
  to parameterize the value in fill() and selectOption() in external data file. This will create data file json with data for username and password when transformer is run.

```json
[
  {
    "regex": "getByTestId\\(['\"]([^'\"]+)['\"]\\)\\.fill\\(['\"]([^'\"]+)['\"]\\)",
    "groupNoForKey": 1, //group 1 from above regex will be used as key in data file
    "groupNoForValue": 2, //group 2 from above regex will be used as value in data file
    "keysToBeTreatedAsConstants": "", //comma separated values of testids which should be parameterized
    "nonUniqueKeys": "email", //this ensures that unique index is NOT added for step with this key.
    "isKeyFrameset": "false",
    "isContentFrameHandlingNeeded": "false", //set this to true if you want fill() to replaced with pressSequentially() to simulate typing of content
    "ignorePathInValue": "false", //this will ignore the path of attachment file and only parameterize file name.
    "isFileUpload": "false" //this is set to true for steps which has file upload.
  },
  {
    "regex": "(?=.*getByTestId\\('([^']*)'\\))(?=.*selectOption\\('(.*)'\\)).*",
    "groupNoForKey": "1",
    "groupNoForValue": "2",
    "keysToBeTreatedAsConstants": "",
    "nonUniqueKeys": "country",
    "isKeyFrameset": "false",
    "isContentFrameHandlingNeeded": "false",
    "ignorePathInValue": "false",
    "isFileUpload": "false"
  }
]
```

### 2. replace_texts.json example

Below will update the value in all the steps which have texts prepended ".getByTestId(" and appended by "')" to use the data from the json data file thereby parameterizing the data.

```json
[
  {
    "dataPrependedBy": ".getByTestId('",
    "dataAppendedBy": "')",
    "isWholeWordMatch": "false",
    "removeDateAtTheEnd": "true", //if there is timestamp in the end - it will be removed/kept based on value of this field
    "keysToBeTreatedAsConstants": "email", //this will not append unique index to step wherever key "email" is used from data file in the the test script
    "replaceWithDynamicIds": "false",
    "keysForFileUploading": "",
    "valuesToBeIgnored": "0,1" //values defined in this will not be parameterized
  }
]
```

### 3. insert_lines.json example

Configure this file to include existing patterns which needs to be transformed with different steps. In addition to below patterns, add any other transformation which is required for any step to below list of transformation.

```json
[
  //this will remove the import statement mentioned below
  {
    "existingLines": "import { test, expect } from '@playwright/test'",
    "removeLines": "0",
    "separator": "\\|"
  },
  {
    //This will remove all redirects in recorded script, pattern can be updated to exclude any specific goto which need not be removed.
    "existingLines": ".goto\\('[^']*'\\)",
    "isRegex": "true",
    "removeLines": "0"
  }
]
```

### 4. prepend.ts example

In addition to below values include any other imports which are needed for your tests

```ts
import { expect, test } from '@playwright/test';
import input from '@[[DATA_SOURCE_PATH_PLACEHOLDER]]/[[COMPLETE_TEST_FILE_NAME]].json' assert { type: 'json' };
import { faker } from '@faker-js/faker';
import path from 'path';
```

### 5. test_start.ts example

In addition to below values include any additional steps needed in your tests before goto() steps. This is useful when you want to initialize any class, set any variables in your tests at start - for using it later in transformation in insert_lines.json file

```ts
for (const data of input) {
  test(`[[TEST_CASE_NAME_MATCHER]]`, async ({ page }) => {
      const uniqueIndex = "_" + faker.string.alphanumeric(10)  //this unique index will be used in all test data, can be updated to empty string if not needed to be used.

      await page.goto(process.env.BASE_URL); //This ensures that browser is launched using the BASE_URL defined in env file
```

## 📚 Examples

### Example 1: Basic Form Fill

**Input:**

```typescript
await page.getByTestId('email').fill('user@example.com');
await page.getByTestId('name').fill('John Doe');
```

**fill_patterns.json:**

```json
[
  {
    "regex": "getByTestId\\(['\"]([^'\"]+)['\"]\\)\\.fill\\(['\"]([^'\"]+)['\"]\\)",
    "groupNoForKey": 1,
    "groupNoForValue": 2,
    "keysToBeTreatedAsConstants": "",
    "nonUniqueKeys": "email",
    "isKeyFrameset": "false",
    "isContentFrameHandlingNeeded": "false",
    "ignorePathInValue": "false",
    "isFileUpload": "false"
  }
]
```

**relace_texts.json:**

```json
[
  {
    "dataPrependedBy": ".getByTestId('",
    "dataAppendedBy": "')",
    "isWholeWordMatch": "false",
    "removeDateAtTheEnd": "true", //if there is timestamp in the end - it will be removed/kept based on value of this field
    "keysToBeTreatedAsConstants": "email", //this will not append unique index to step wherever key "email" is used from data file in the the test script
    "keysForFileUploading": "",
    "valuesToBeIgnored": "0,1" //values defined in this will not be parameterized
  }
]
```

**Transformed:**

```typescript
await page.getByTestId('email').fill(data.email);
await page.getByTestId('name').fill(data.name + uniqueIndex);
```

**JSON Output:**

```json
[
  {
    "tcName": "TC01",
    "email": "user@example.com",
    "name": "John Doe"
  }
]
```

### Example 2: Dropdown Selection

**Input:**

```typescript
await page.getByTestId('country').selectOption('United States');
```

**fill_patterns.json:**

```json
[
  {
    "regex": "(?=.*getByTestId\\('([^']*)'\\))(?=.*selectOption\\('(.*)'\\)).*",
    "groupNoForKey": "1",
    "groupNoForValue": "2",
    "keysToBeTreatedAsConstants": "",
    "nonUniqueKeys": "country", //this will not append unique index to step with this key
    "isKeyFrameset": "false",
    "isContentFrameHandlingNeeded": "false",
    "ignorePathInValue": "false",
    "isFileUpload": "false"
  }
]
```

**relace_texts.json:**

```json
[
  {
    "dataPrependedBy": ".selectOption('",
    "dataAppendedBy": "')",
    "isWholeWordMatch": "false",
    "removeDateAtTheEnd": "true", //if there is timestamp in the end - it will be removed/kept based on value of this field
    "keysToBeTreatedAsConstants": "country", //this will not append unique index to step with this key
    "keysForFileUploading": "",
    "valuesToBeIgnored": "0,1" //values defined in this will not be parameterized
  }
]
```

**Transformed:**

```typescript
await page.getByTestId('country').selectOption(data.country);
```

**JSON Output:**

```json
[
  {
    "tcName": "TC01",
    "country": "United States"
  }
]
```

### Example 3: File Upload

**Input:**

```typescript
await page.getByTestId('upload').setInputFiles('path/to/file.pdf');
```

**fill_patterns.json:**

```json
[
  {
    "regex": "(?=.*getByTestId\\('([^']*)'\\))(?=.*setInputFiles\\('(.*)'\\)).*",
    "groupNoForKey": "1",
    "groupNoForValue": "2",
    "keysToBeTreatedAsConstants": "", //comma separated test-dataid to be added if transformation not needed for any element with this id.
    "nonUniqueKeys": "",
    "isKeyFrameset": "false",
    "isContentFrameHandlingNeeded": "false",
    "ignorePathInValue": "true", //if this is set to true the relative path to the file will be ignored in test data and attachment file should be kept in attachment folder in root directory
    "isFileUpload": "true" //this should be true as setInputFiles is used for fileupload step
  }
]
```

**Transformed:**

```typescript
const filePath_1 = path.join(process.cwd(), 'attachments', data.upload);
await page.locator('//input[@type="file"]').setInputFiles(filePath_1);
```

**JSON Output:**

```json
[
  {
    "tcName": "TC01",
    "upload": "file.pdf"
  }
]
```

## 📖 API Reference

### `transform(config: TransformerConfig): Promise<TransformResult>`

Transforms test files from the input directory.

**Parameters:**

- `config.inputDir` (string): Directory containing source test files
- `config.outputDir` (string): Directory for transformed test files
- `config.dataDir` (string): Directory for JSON data files

**Returns:** `Promise<TransformResult>`

**Example:**

```typescript
const result = await transform({
  inputDir: './tests/input',
  outputDir: './tests/output',
  dataDir: './data/output',
});
```

### `PlaywrightTransformer`

Main transformer class for advanced usage.

#### Constructor

```typescript
new PlaywrightTransformer(config: TransformerConfig)
```

#### Methods

##### `transformAll(): Promise<TransformResult>`

Transforms all test files in the input directory.

**Returns:** `Promise<TransformResult>`

```typescript
interface TransformResult {
  success: boolean;
  transformedFiles: number;
  errors: string[];
}
```

### Types

```typescript
interface TransformerConfig {
  inputDir: string;
  outputDir: string;
  dataDir: string;
  patternsFile?: string;
  constantsFile?: string;
  prependFile?: string;
}

interface TransformResult {
  success: boolean;
  transformedFiles: number;
  errors: string[];
}
```

## 🛠️ Development

### Building

```bash
npm run build
```

### Running Tests

```bash
npm test
```

### Development Mode

```bash
npm run dev
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Related Projects

- [Playwright](https://playwright.dev/) - End-to-end testing framework
- [Playwright Test](https://playwright.dev/docs/test-intro) - Playwright's test runner

## 💬 Support

For issues, questions, or contributions, please open an issue on [GitHub](https://github.com/egain/playwright-transformer/issues).

---

**Made with ❤️ by the eGain Development Team**
