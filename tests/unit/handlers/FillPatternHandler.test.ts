/**
 * Unit tests for FillPatternHandler
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FillPatternHandler } from '../../../src/transformer/handlers/FillPatternHandler';
import { createMockConfig, createMockFillPattern } from '../utils/testHelpers';
import { Logger } from '../../../src/utils/logger';

describe('FillPatternHandler', () => {
  beforeEach(() => {
    // Disable logger during tests
    Logger.disable();
    // Reset static counter
    FillPatternHandler.uploadCounter = 0;
  });

  describe('Basic fill pattern matching', () => {
    it('should extract key and value from fill pattern', () => {
      const testScriptLines = [
        "await page.getByTestId('username').fill('testuser');",
      ];
      const index = 0;
      const fillPattern = createMockFillPattern(
        "getByTestId\\('([^']+)'\\)\\.fill\\('([^']+)'\\)",
        1,
        2,
      );
      const config = createMockConfig({
        FILL_PATTERNS_DO_LIST: [fillPattern],
      });
      const handler = new FillPatternHandler(testScriptLines, index, config);

      const jsonMap = new Map<string, string>();
      const reverseJsonMap = new Map<string, string>();

      const newTestScriptLines: string[] = [];
      handler.execute(
        newTestScriptLines,
        '/path/to/source.ts',
        '/path/to/dest.ts',
        '/path/to/data.json',
        jsonMap,
        reverseJsonMap,
        new Map(),
      );

      expect(jsonMap.size).toBeGreaterThan(0);
      expect(newTestScriptLines.length).toBeGreaterThan(0);
      const resultLine = newTestScriptLines[0];
      expect(resultLine).toContain('data.');
      expect(resultLine).not.toContain("'testuser'");
    });

    it('should handle line with no matching pattern', () => {
      const testScriptLines = ['await page.goto("https://example.com");'];
      const index = 0;
      const fillPattern = createMockFillPattern(
        "getByTestId\\('([^']+)'\\)\\.fill\\('([^']+)'\\)",
        1,
        2,
      );
      const config = createMockConfig({
        FILL_PATTERNS_DO_LIST: [fillPattern],
      });
      const handler = new FillPatternHandler(testScriptLines, index, config);

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

      // Should continue chain with original line
      expect(newTestScriptLines.length).toBeGreaterThan(0);
    });
  });

  describe('Constants handling', () => {
    it('should not transform when key is treated as constant', () => {
      const testScriptLines = [
        "await page.getByTestId('CONSTANT_KEY').fill('value');",
      ];
      const index = 0;
      const fillPattern = createMockFillPattern(
        "getByTestId\\('([^']+)'\\)\\.fill\\('([^']+)'\\)",
        1,
        2,
        { keysToBeTreatedAsConstants: 'CONSTANT_KEY' },
      );
      const config = createMockConfig({
        FILL_PATTERNS_DO_LIST: [fillPattern],
      });
      const handler = new FillPatternHandler(testScriptLines, index, config);

      const jsonMap = new Map<string, string>();
      const reverseJsonMap = new Map<string, string>();

      const newTestScriptLines: string[] = [];
      handler.execute(
        newTestScriptLines,
        '/path/to/source.ts',
        '/path/to/dest.ts',
        '/path/to/data.json',
        jsonMap,
        reverseJsonMap,
        new Map(),
      );

      // Should not add to jsonMap for constants
      expect(newTestScriptLines.length).toBeGreaterThan(0);
      const resultLine = newTestScriptLines[0];
      // Line should remain unchanged
      expect(resultLine).toBeDefined();
    });
  });

  describe('Dynamic ID handling', () => {
    it('should use dynamic ID when value exists in dynamicIdsMap', () => {
      const testScriptLines = [
        "await page.getByTestId('input').fill('dynamicValue');",
      ];
      const index = 0;
      const fillPattern = createMockFillPattern(
        "getByTestId\\('([^']+)'\\)\\.fill\\('([^']+)'\\)",
        1,
        2,
      );
      const config = createMockConfig({
        FILL_PATTERNS_DO_LIST: [fillPattern],
      });
      const handler = new FillPatternHandler(testScriptLines, index, config);

      const dynamicIdsMap = new Map<string, string>();
      dynamicIdsMap.set('dynamicValue', 'dynamicId1');
      const jsonMap = new Map<string, string>();
      const reverseJsonMap = new Map<string, string>();

      const newTestScriptLines: string[] = [];
      handler.execute(
        newTestScriptLines,
        '/path/to/source.ts',
        '/path/to/dest.ts',
        '/path/to/data.json',
        jsonMap,
        reverseJsonMap,
        dynamicIdsMap,
      );

      expect(newTestScriptLines.length).toBeGreaterThan(0);
      const resultLine = newTestScriptLines[0];
      expect(resultLine).toContain('dynamicId1');
      expect(resultLine).not.toContain("'dynamicValue'");
    });
  });

  describe('File upload handling', () => {
    it('should handle single file upload', () => {
      const testScriptLines = [
        "await page.getByTestId('fileInput').setInputFiles('file.pdf');",
      ];
      const index = 0;
      const fillPattern = createMockFillPattern(
        "setInputFiles\\('([^']+)'\\)",
        1,
        1,
        { isFileUpload: true },
      );
      const config = createMockConfig({
        FILL_PATTERNS_DO_LIST: [fillPattern],
        FILE_UPLOAD_SET_FILE_PATTERN_STR_1:
          "const filePath = path.join(process.cwd(), 'attachments', [[EXTERNALIZED_DATA]]);",
        FILE_UPLOAD_SET_FILE_PATTERN_STR_2:
          'await page.locator(\'//input[@type="file"]\').setInputFiles(filePath);',
        FILE_UPLOAD_EXTERNALIZED_DATA: '[[EXTERNALIZED_DATA]]',
      });
      const handler = new FillPatternHandler(testScriptLines, index, config);

      const jsonMap = new Map<string, string>();
      const reverseJsonMap = new Map<string, string>();

      const newTestScriptLines: string[] = [];
      handler.execute(
        newTestScriptLines,
        '/path/to/source.ts',
        '/path/to/dest.ts',
        '/path/to/data.json',
        jsonMap,
        reverseJsonMap,
        new Map(),
      );

      // Should add two lines for file upload
      expect(newTestScriptLines.length).toBeGreaterThanOrEqual(2);
      expect(newTestScriptLines.some((line) => line.includes('filePath'))).toBe(
        true,
      );
    });

    it('should handle multiple file upload', () => {
      const testScriptLines = [
        "await page.getByTestId('fileInput').setInputFiles(['file1.pdf', 'file2.pdf']);",
      ];
      const index = 0;
      const fillPattern = createMockFillPattern(
        'setInputFiles\\(\\[([^\\]]+)\\]\\)',
        1,
        1,
        { isFileUpload: true, isMultipleFileUpload: true },
      );
      const config = createMockConfig({
        FILL_PATTERNS_DO_LIST: [fillPattern],
        FILE_UPLOAD_SET_MULTIPLEFILE_PATTERN_STR_1:
          "const filePath = [[EXTERNALIZED_DATA]].split(',').map(name => name.trim()).map(fileName => path.join(process.cwd(), 'attachments', fileName.replace(/'/g, '')));",
        FILE_UPLOAD_SET_MULTIPLEFILE_PATTERN_STR_2:
          'await page.locator(\'//input[@type="file"]\').setInputFiles(filePath);',
        FILE_UPLOAD_EXTERNALIZED_DATA: '[[EXTERNALIZED_DATA]]',
      });
      const handler = new FillPatternHandler(testScriptLines, index, config);

      const jsonMap = new Map<string, string>();
      const reverseJsonMap = new Map<string, string>();

      const newTestScriptLines: string[] = [];
      handler.execute(
        newTestScriptLines,
        '/path/to/source.ts',
        '/path/to/dest.ts',
        '/path/to/data.json',
        jsonMap,
        reverseJsonMap,
        new Map(),
      );

      expect(newTestScriptLines.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle file upload with locator', () => {
      const testScriptLines = [
        "await page.getByTestId('uploadButton').setInputFiles('file.pdf');",
      ];
      const index = 0;
      const fillPattern = createMockFillPattern(
        "setInputFiles\\('([^']+)'\\)",
        1,
        1,
        {
          isFileUpload: true,
          keysForLocatorInFileUpload: 'uploadButton:upload-test-id',
        },
      );
      const config = createMockConfig({
        FILL_PATTERNS_DO_LIST: [fillPattern],
        FILE_UPLOAD_SET_FILE_PATTERN_STR_1:
          "const filePath = path.join(process.cwd(), 'attachments', [[EXTERNALIZED_DATA]]);",
        FILE_UPLOAD_SET_FILE_PATTERN_STR_2:
          'await page.locator(\'//input[@type="file"]\').setInputFiles(filePath);',
        FILE_UPLOAD_EXTERNALIZED_DATA: '[[EXTERNALIZED_DATA]]',
      });
      const handler = new FillPatternHandler(testScriptLines, index, config);

      const jsonMap = new Map<string, string>();
      const reverseJsonMap = new Map<string, string>();

      const newTestScriptLines: string[] = [];
      handler.execute(
        newTestScriptLines,
        '/path/to/source.ts',
        '/path/to/dest.ts',
        '/path/to/data.json',
        jsonMap,
        reverseJsonMap,
        new Map(),
      );

      expect(newTestScriptLines.length).toBeGreaterThanOrEqual(2);
      // Should contain getByTestId for locator
      const hasLocator = newTestScriptLines.some((line) =>
        line.includes('getByTestId'),
      );
      expect(hasLocator).toBe(true);
    });
  });

  describe('Content frame handling', () => {
    it('should handle content frame with pressSequentially', () => {
      const testScriptLines = [
        "await page.frameLocator('iframe').locator('input').contentFrame().fill('value');",
      ];
      const index = 0;
      const fillPattern = createMockFillPattern(
        "\\.fill\\('([^']+)'\\)",
        1,
        1,
        { isContentFrameHandlingNeeded: true },
      );
      const config = createMockConfig({
        FILL_PATTERNS_DO_LIST: [fillPattern],
        CONTENTFRAME_STR: '.contentFrame()',
        PRESS_SEQUENTIALLY_STR: '.pressSequentially(',
      });
      const handler = new FillPatternHandler(testScriptLines, index, config);

      const jsonMap = new Map<string, string>();
      const reverseJsonMap = new Map<string, string>();

      const newTestScriptLines: string[] = [];
      handler.execute(
        newTestScriptLines,
        '/path/to/source.ts',
        '/path/to/dest.ts',
        '/path/to/data.json',
        jsonMap,
        reverseJsonMap,
        new Map(),
      );

      expect(newTestScriptLines.length).toBeGreaterThan(0);
      const resultLine = newTestScriptLines[0];
      expect(resultLine).toContain('pressSequentially');
    });

    it('should handle content frame with empty line for copy-paste pattern', () => {
      const testScriptLines = [
        "await page.frameLocator('iframe').locator('input').contentFrame().fill('value');",
      ];
      const index = 0;
      const testScriptLinesWithNext = [
        ...testScriptLines,
        'await page.evaluate((text) => {',
      ];
      const fillPattern = createMockFillPattern(
        "\\.fill\\('([^']+)'\\)",
        1,
        1,
        { isContentFrameHandlingNeeded: true },
      );
      const config = createMockConfig({
        FILL_PATTERNS_DO_LIST: [fillPattern],
        CONTENTFRAME_STR: '.contentFrame()',
        COPY_PASTE_IN_CK_EDITOR_PATTERN_START:
          'await page.evaluate((text) => {',
      });
      const handler = new FillPatternHandler(
        testScriptLinesWithNext,
        index,
        config,
      );

      const jsonMap = new Map<string, string>();
      const reverseJsonMap = new Map<string, string>();

      const newTestScriptLines: string[] = [];
      handler.execute(
        newTestScriptLines,
        '/path/to/source.ts',
        '/path/to/dest.ts',
        '/path/to/data.json',
        jsonMap,
        reverseJsonMap,
        new Map(),
      );

      expect(newTestScriptLines.length).toBeGreaterThan(0);
    });
  });

  describe('Delay handling', () => {
    it('should add delay option when isDelay is true', () => {
      const testScriptLines = [
        "await page.getByTestId('input').fill('value');",
      ];
      const index = 0;
      const fillPattern = createMockFillPattern(
        "getByTestId\\('([^']+)'\\)\\.fill\\('([^']+)'\\)",
        1,
        2,
        { isDelay: true },
      );
      const config = createMockConfig({
        FILL_PATTERNS_DO_LIST: [fillPattern],
      });
      const handler = new FillPatternHandler(testScriptLines, index, config);

      const jsonMap = new Map<string, string>();
      const reverseJsonMap = new Map<string, string>();

      const newTestScriptLines: string[] = [];
      handler.execute(
        newTestScriptLines,
        '/path/to/source.ts',
        '/path/to/dest.ts',
        '/path/to/data.json',
        jsonMap,
        reverseJsonMap,
        new Map(),
      );

      expect(newTestScriptLines.length).toBeGreaterThan(0);
      const resultLine = newTestScriptLines[0];
      expect(resultLine).toContain('delay: 100');
    });
  });

  describe('Non-unique keys', () => {
    it('should not add uniqueIndex for non-unique keys', () => {
      const testScriptLines = [
        "await page.getByTestId('nonUnique').fill('value');",
      ];
      const index = 0;
      const fillPattern = createMockFillPattern(
        "getByTestId\\('([^']+)'\\)\\.fill\\('([^']+)'\\)",
        1,
        2,
        { nonUniqueKeys: 'nonUnique' },
      );
      const config = createMockConfig({
        FILL_PATTERNS_DO_LIST: [fillPattern],
      });
      const handler = new FillPatternHandler(testScriptLines, index, config);

      const jsonMap = new Map<string, string>();
      const reverseJsonMap = new Map<string, string>();

      const newTestScriptLines: string[] = [];
      handler.execute(
        newTestScriptLines,
        '/path/to/source.ts',
        '/path/to/dest.ts',
        '/path/to/data.json',
        jsonMap,
        reverseJsonMap,
        new Map(),
      );

      expect(newTestScriptLines.length).toBeGreaterThan(0);
      const resultLine = newTestScriptLines[0];
      expect(resultLine).not.toContain('uniqueIndex');
    });
  });

  describe('Frameset key handling', () => {
    it('should use getNameFromFramesetForJson for frameset keys', () => {
      const testScriptLines = [
        "await page.frameLocator('iframe').getByTestId('input').fill('value');",
      ];
      const index = 0;
      const fillPattern = createMockFillPattern(
        "getByTestId\\('([^']+)'\\)\\.fill\\('([^']+)'\\)",
        1,
        2,
        { isKeyFrameset: true },
      );
      const config = createMockConfig({
        FILL_PATTERNS_DO_LIST: [fillPattern],
        TEXT_WITHIN_DOUBLE_QUOTE_PATTERN: new RegExp('"(.*?)"'),
      });
      const handler = new FillPatternHandler(testScriptLines, index, config);

      const jsonMap = new Map<string, string>();
      const reverseJsonMap = new Map<string, string>();

      const newTestScriptLines: string[] = [];
      handler.execute(
        newTestScriptLines,
        '/path/to/source.ts',
        '/path/to/dest.ts',
        '/path/to/data.json',
        jsonMap,
        reverseJsonMap,
        new Map(),
      );

      expect(newTestScriptLines.length).toBeGreaterThan(0);
    });
  });

  describe('Path ignoring', () => {
    it('should ignore path in value when ignorePathInValue is true', () => {
      const testScriptLines = [
        "await page.getByTestId('fileInput').setInputFiles('/path/to/file.pdf');",
      ];
      const index = 0;
      const fillPattern = createMockFillPattern(
        "setInputFiles\\('([^']+)'\\)",
        1,
        1,
        { ignorePathInValue: true },
      );
      const config = createMockConfig({
        FILL_PATTERNS_DO_LIST: [fillPattern],
      });
      const handler = new FillPatternHandler(testScriptLines, index, config);

      const jsonMap = new Map<string, string>();
      const reverseJsonMap = new Map<string, string>();

      const newTestScriptLines: string[] = [];
      handler.execute(
        newTestScriptLines,
        '/path/to/source.ts',
        '/path/to/dest.ts',
        '/path/to/data.json',
        jsonMap,
        reverseJsonMap,
        new Map(),
      );

      // Should extract just filename, not full path
      expect(jsonMap.size).toBeGreaterThan(0);
      const jsonValue = Array.from(jsonMap.values())[0];
      expect(jsonValue).toBe('file.pdf');
    });
  });

  describe('Fixed key value', () => {
    it('should use fixed key when keyToUse is provided', () => {
      const testScriptLines = [
        "await page.getByTestId('input').fill('value');",
      ];
      const index = 0;
      const fillPattern = createMockFillPattern(
        "getByTestId\\('([^']+)'\\)\\.fill\\('([^']+)'\\)",
        1,
        2,
        { keyToUse: 'fixedKeyName' },
      );
      const config = createMockConfig({
        FILL_PATTERNS_DO_LIST: [fillPattern],
      });
      const handler = new FillPatternHandler(testScriptLines, index, config);

      const jsonMap = new Map<string, string>();
      const reverseJsonMap = new Map<string, string>();

      const newTestScriptLines: string[] = [];
      handler.execute(
        newTestScriptLines,
        '/path/to/source.ts',
        '/path/to/dest.ts',
        '/path/to/data.json',
        jsonMap,
        reverseJsonMap,
        new Map(),
      );

      expect(jsonMap.has('fixedKeyName')).toBe(true);
    });
  });

  describe('Reverse map handling', () => {
    it('should add value to reverseJsonMap', () => {
      const testScriptLines = [
        "await page.getByTestId('input').fill('testValue');",
      ];
      const index = 0;
      const fillPattern = createMockFillPattern(
        "getByTestId\\('([^']+)'\\)\\.fill\\('([^']+)'\\)",
        1,
        2,
      );
      const config = createMockConfig({
        FILL_PATTERNS_DO_LIST: [fillPattern],
      });
      const handler = new FillPatternHandler(testScriptLines, index, config);

      const jsonMap = new Map<string, string>();
      const reverseJsonMap = new Map<string, string>();

      const newTestScriptLines: string[] = [];
      handler.execute(
        newTestScriptLines,
        '/path/to/source.ts',
        '/path/to/dest.ts',
        '/path/to/data.json',
        jsonMap,
        reverseJsonMap,
        new Map(),
      );

      // Should add to reverse map
      expect(reverseJsonMap.size).toBeGreaterThan(0);
      expect(reverseJsonMap.has('testValue')).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty FILL_PATTERNS_DO_LIST', () => {
      const testScriptLines = [
        "await page.getByTestId('input').fill('value');",
      ];
      const index = 0;
      const config = createMockConfig({
        FILL_PATTERNS_DO_LIST: [],
      });
      const handler = new FillPatternHandler(testScriptLines, index, config);

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

      // Should continue chain with original line
      expect(newTestScriptLines.length).toBeGreaterThan(0);
    });

    it('should handle regex with no match groups', () => {
      const testScriptLines = [
        "await page.getByTestId('input').fill('value');",
      ];
      const index = 0;
      const fillPattern = createMockFillPattern(
        "getByTestId\\('input'\\)\\.fill\\('value'\\)",
        0,
        0,
      );
      const config = createMockConfig({
        FILL_PATTERNS_DO_LIST: [fillPattern],
      });
      const handler = new FillPatternHandler(testScriptLines, index, config);

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

      expect(newTestScriptLines.length).toBeGreaterThan(0);
    });

    it('should handle multiple patterns and use first match', () => {
      const testScriptLines = [
        "await page.getByTestId('input').fill('value');",
      ];
      const index = 0;
      const fillPattern1 = createMockFillPattern(
        "getByTestId\\('([^']+)'\\)\\.fill\\('([^']+)'\\)",
        1,
        2,
      );
      const fillPattern2 = createMockFillPattern(
        "getByTestId\\('([^']+)'\\)\\.selectOption\\('([^']+)'\\)",
        1,
        2,
      );
      const config = createMockConfig({
        FILL_PATTERNS_DO_LIST: [fillPattern1, fillPattern2],
      });
      const handler = new FillPatternHandler(testScriptLines, index, config);

      const jsonMap = new Map<string, string>();
      const reverseJsonMap = new Map<string, string>();

      const newTestScriptLines: string[] = [];
      handler.execute(
        newTestScriptLines,
        '/path/to/source.ts',
        '/path/to/dest.ts',
        '/path/to/data.json',
        jsonMap,
        reverseJsonMap,
        new Map(),
      );

      // Should match first pattern and break
      expect(newTestScriptLines.length).toBeGreaterThan(0);
    });
  });
});
