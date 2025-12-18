# Unit Tests

This directory contains unit tests for the Playwright Transformer project.

## Structure

```
tests/unit/
├── handlers/          # Tests for handler classes
│   └── TestCaseStartHandler.test.ts
├── utils/             # Test utilities and mocks
│   ├── testHelpers.ts
│   └── mockFileUtils.ts
├── fixtures/          # Test fixtures and sample data
│   └── testStartContent.ts
└── README.md          # This file
```

## Running Tests

### Run all tests

```bash
npm test
```

### Run tests in watch mode

```bash
npm run test:watch
```

### Run tests with coverage

```bash
npm run test:coverage
```

## Testing Framework

We use [Vitest](https://vitest.dev/) as our testing framework. Vitest is:

- Fast and lightweight
- Compatible with Vite (which we use for building)
- Has excellent TypeScript support
- Provides Jest-like API for familiarity

## Test Utilities

### `testHelpers.ts`

Provides helper functions for creating mock configurations:

- `createMockConfig(overrides?)`: Creates a mock `TransformerConfig` with sensible defaults
- `createMockPreProcessor(...)`: Creates a mock `PreProcessorDataObject`

### `mockFileUtils.ts`

Provides utilities for mocking file operations:

- `mockReadFileLines(content)`: Mocks `readFileLines` to return the provided content
- `restoreReadFileLines()`: Restores the original implementation

## Writing Tests for Handlers

### Basic Structure

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { YourHandler } from '../../../src/transformer/handlers/YourHandler';
import { createMockConfig } from '../utils/testHelpers';
import {
  mockReadFileLines,
  restoreReadFileLines,
} from '../utils/mockFileUtils';

describe('YourHandler', () => {
  beforeEach(() => {
    restoreReadFileLines();
  });

  it('should do something', () => {
    // Arrange
    const testScriptLines = ["test('MyTest', async ({ page }) => {"];
    const config = createMockConfig();
    const handler = new YourHandler(testScriptLines, 0, config);

    mockReadFileLines(['line1', 'line2']);

    // Act
    const newTestScriptLines: string[] = [];
    handler.execute(
      newTestScriptLines,
      '/path/to/source.ts',
      '/path/to/dest.ts',
      '/path/to/data.json',
      new Map(),
      new Map(),
      new Map(),
    );

    // Assert
    expect(newTestScriptLines).toContain('expected line');
  });
});
```

### Testing Patterns

1. **Mock file operations**: Always mock `readFileLines` to avoid file system dependencies
2. **Use factory functions**: Use `createMockConfig()` to create test configurations
3. **Test edge cases**: Include tests for empty configs, missing values, etc.
4. **Clean up**: Always restore mocks in `beforeEach` or `afterEach`

## Test Coverage

Aim for high test coverage of:

- Core business logic
- Edge cases and error handling
- Configuration variations
- Integration between components

## Adding New Handler Tests

When adding tests for a new handler:

1. Create a test file: `tests/unit/handlers/YourHandler.test.ts`
2. Follow the structure shown above
3. Test all public methods and edge cases
4. Update this README if adding new test utilities
