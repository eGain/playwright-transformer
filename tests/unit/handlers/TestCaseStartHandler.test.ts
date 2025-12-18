/**
 * Unit tests for TestCaseStartHandler
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TestCaseStartHandler } from '../../../src/transformer/handlers/TestCaseStartHandler';
import { createMockConfig, createMockPreProcessor } from '../utils/testHelpers';
import {
  mockReadFileLines,
  restoreReadFileLines,
} from '../utils/mockFileUtils';
import { TEST_START_CONTENT } from '../fixtures/testStartContent';
import { Logger } from '../../../src/utils/logger';

describe('TestCaseStartHandler', () => {
  beforeEach(() => {
    // Disable logger during tests
    Logger.disable();
    restoreReadFileLines();
  });

  describe('Test case name replacement', () => {
    it('should replace TEST_CASE_NAME_MATCHER with extracted test name and data reference', () => {
      const testScriptLines = ["test('MyTestName', async ({ page }) => {"];
      const index = 0;
      const config = createMockConfig();
      const handler = new TestCaseStartHandler(testScriptLines, index, config);

      mockReadFileLines(TEST_START_CONTENT);

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

      // Find the line with the replaced test case name
      const testLine = newTestScriptLines.find((line) =>
        line.includes('MyTestName'),
      );
      expect(testLine).toBeDefined();
      expect(testLine).toContain('MyTestName');
      expect(testLine).toContain("${data['tcName']}");
      expect(testLine).not.toContain('[[TEST_CASE_NAME_MATCHER]]');
    });

    it('should handle test case name with special characters', () => {
      const testScriptLines = [
        "test('TC01_VerifyError-Message', async ({ page }) => {",
      ];
      const index = 0;
      const config = createMockConfig();
      const handler = new TestCaseStartHandler(testScriptLines, index, config);

      mockReadFileLines(TEST_START_CONTENT);

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

      const testLine = newTestScriptLines.find((line) =>
        line.includes('TC01_VerifyError-Message'),
      );
      expect(testLine).toBeDefined();
      expect(testLine).toContain('TC01_VerifyError-Message');
      expect(testLine).toContain("${data['tcName']}");
    });

    it('should add line as-is if test case name cannot be extracted', () => {
      const testScriptLines = ['test(async ({ page }) => {'];
      const index = 0;
      const config = createMockConfig();
      const handler = new TestCaseStartHandler(testScriptLines, index, config);

      const testStartContent = [
        'for (const data of input) {',
        '  test(`[[TEST_CASE_NAME_MATCHER]]`, async ({ userCreation, page }) => {',
      ];
      mockReadFileLines(testStartContent);

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

      // Should still contain the placeholder since no match was found
      const testLine = newTestScriptLines.find((line) =>
        line.includes('[[TEST_CASE_NAME_MATCHER]]'),
      );
      expect(testLine).toBeDefined();
    });
  });

  describe('S3 utils init line handling', () => {
    it('should add S3 utils init line correctly', () => {
      const testScriptLines = ["test('MyTest', async ({ page }) => {"];
      const index = 0;
      const config = createMockConfig();
      const handler = new TestCaseStartHandler(testScriptLines, index, config);

      const testStartContent = [
        'for (const data of input) {',
        '  test(`[[TEST_CASE_NAME_MATCHER]]`, async ({ userCreation, page }) => {',
        '      const s3Utils = new S3utils();',
      ];
      mockReadFileLines(testStartContent);

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

      const s3UtilsLine = newTestScriptLines.find((line) =>
        line.includes('const s3Utils = new S3utils();'),
      );
      expect(s3UtilsLine).toBeDefined();
    });
  });

  describe('Pre-processor pattern insertion', () => {
    it('should insert lines when file name matches pre-processor pattern', () => {
      const testScriptLines = ["test('MyTest', async ({ page }) => {"];
      const index = 0;
      const preProcessorPatterns = [
        createMockPreProcessor(
          'TC01_MyTest.spec.ts',
          "await s3Utils.updateS3Setting('base', {'setting': true});",
          ',',
        ),
      ];
      const config = createMockConfig({
        PRE_PROCESSOR_PATTERNS_DO_LIST: preProcessorPatterns,
      });
      const handler = new TestCaseStartHandler(testScriptLines, index, config);

      const testStartContent = [
        'for (const data of input) {',
        '  test(`[[TEST_CASE_NAME_MATCHER]]`, async ({ userCreation, page }) => {',
        '      const s3Utils = new S3utils();',
      ];
      mockReadFileLines(testStartContent);

      const newTestScriptLines: string[] = [];
      handler.execute(
        newTestScriptLines,
        '/path/to/TC01_MyTest.spec.ts',
        '/path/to/dest.ts',
        '/path/to/data.json',
        new Map(),
        new Map(),
        new Map(),
      );

      // Should contain the inserted line
      const insertedLine = newTestScriptLines.find((line) =>
        line.includes('updateS3Setting'),
      );
      expect(insertedLine).toBeDefined();
      expect(insertedLine).toContain('await s3Utils.updateS3Setting');
    });

    it('should NOT insert lines when file name does not match pre-processor pattern', () => {
      const testScriptLines = ["test('MyTest', async ({ page }) => {"];
      const index = 0;
      const preProcessorPatterns = [
        createMockPreProcessor(
          'TC01_MyTest.spec.ts',
          "await s3Utils.updateS3Setting('base', {'setting': true});",
          ',',
        ),
      ];
      const config = createMockConfig({
        PRE_PROCESSOR_PATTERNS_DO_LIST: preProcessorPatterns,
      });
      const handler = new TestCaseStartHandler(testScriptLines, index, config);

      const testStartContent = [
        'for (const data of input) {',
        '  test(`[[TEST_CASE_NAME_MATCHER]]`, async ({ userCreation, page }) => {',
        '      const s3Utils = new S3utils();',
      ];
      mockReadFileLines(testStartContent);

      const newTestScriptLines: string[] = [];
      handler.execute(
        newTestScriptLines,
        '/path/to/TC02_DifferentTest.spec.ts',
        '/path/to/dest.ts',
        '/path/to/data.json',
        new Map(),
        new Map(),
        new Map(),
      );

      // Should NOT contain the inserted line
      const insertedLine = newTestScriptLines.find((line) =>
        line.includes('updateS3Setting'),
      );
      expect(insertedLine).toBeUndefined();
    });

    it('should handle case-insensitive file name matching', () => {
      const testScriptLines = ["test('MyTest', async ({ page }) => {"];
      const index = 0;
      const preProcessorPatterns = [
        createMockPreProcessor(
          'tc01_mytest.spec.ts',
          "await s3Utils.updateS3Setting('base', {'setting': true});",
          ',',
        ),
      ];
      const config = createMockConfig({
        PRE_PROCESSOR_PATTERNS_DO_LIST: preProcessorPatterns,
      });
      const handler = new TestCaseStartHandler(testScriptLines, index, config);

      const testStartContent = [
        'for (const data of input) {',
        '  test(`[[TEST_CASE_NAME_MATCHER]]`, async ({ userCreation, page }) => {',
        '      const s3Utils = new S3utils();',
      ];
      mockReadFileLines(testStartContent);

      const newTestScriptLines: string[] = [];
      handler.execute(
        newTestScriptLines,
        '/path/to/TC01_MyTest.spec.ts',
        '/path/to/dest.ts',
        '/path/to/data.json',
        new Map(),
        new Map(),
        new Map(),
      );

      // Should match case-insensitively
      const insertedLine = newTestScriptLines.find((line) =>
        line.includes('updateS3Setting'),
      );
      expect(insertedLine).toBeDefined();
    });

    it('should handle multiple lines to be inserted with custom separator', () => {
      const testScriptLines = ["test('MyTest', async ({ page }) => {"];
      const index = 0;
      const preProcessorPatterns = [
        createMockPreProcessor('TC01_MyTest.spec.ts', 'line1|line2|line3', '|'),
      ];
      const config = createMockConfig({
        PRE_PROCESSOR_PATTERNS_DO_LIST: preProcessorPatterns,
      });
      const handler = new TestCaseStartHandler(testScriptLines, index, config);

      const testStartContent = [
        'for (const data of input) {',
        '  test(`[[TEST_CASE_NAME_MATCHER]]`, async ({ userCreation, page }) => {',
        '      const s3Utils = new S3utils();',
      ];
      mockReadFileLines(testStartContent);

      const newTestScriptLines: string[] = [];
      handler.execute(
        newTestScriptLines,
        '/path/to/TC01_MyTest.spec.ts',
        '/path/to/dest.ts',
        '/path/to/data.json',
        new Map(),
        new Map(),
        new Map(),
      );

      // Should contain all three lines
      expect(newTestScriptLines).toContain('line1');
      expect(newTestScriptLines).toContain('line2');
      expect(newTestScriptLines).toContain('line3');
    });

    it('should not insert lines when linesToBeInserted is empty', () => {
      const testScriptLines = ["test('MyTest', async ({ page }) => {"];
      const index = 0;
      const preProcessorPatterns = [
        createMockPreProcessor('TC01_MyTest.spec.ts', '', ','),
      ];
      const config = createMockConfig({
        PRE_PROCESSOR_PATTERNS_DO_LIST: preProcessorPatterns,
      });
      const handler = new TestCaseStartHandler(testScriptLines, index, config);

      const testStartContent = [
        'for (const data of input) {',
        '  test(`[[TEST_CASE_NAME_MATCHER]]`, async ({ userCreation, page }) => {',
        '      const s3Utils = new S3utils();',
      ];
      mockReadFileLines(testStartContent);

      const newTestScriptLines: string[] = [];
      handler.execute(
        newTestScriptLines,
        '/path/to/TC01_MyTest.spec.ts',
        '/path/to/dest.ts',
        '/path/to/data.json',
        new Map(),
        new Map(),
        new Map(),
      );

      // Should not have any extra lines beyond the test_start.ts content
      const s3UtilsIndex = newTestScriptLines.findIndex((line) =>
        line.includes('const s3Utils'),
      );
      expect(s3UtilsIndex).toBeGreaterThan(-1);
      // Should not contain any inserted lines with updateS3Setting
      const hasUpdateS3Setting = newTestScriptLines.some((line) =>
        line.includes('updateS3Setting'),
      );
      expect(hasUpdateS3Setting).toBe(false);
    });
  });

  describe('Regular lines handling', () => {
    it('should add all lines from test_start.ts as-is except for placeholders', () => {
      const testScriptLines = ["test('MyTest', async ({ page }) => {"];
      const index = 0;
      const config = createMockConfig();
      const handler = new TestCaseStartHandler(testScriptLines, index, config);

      mockReadFileLines(TEST_START_CONTENT);

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

      // Should contain the for loop
      expect(newTestScriptLines[0]).toContain('for (const data of input) {');
      // Should contain other regular lines
      expect(
        newTestScriptLines.some((line) => line.includes('const uniqueIndex')),
      ).toBe(true);
      expect(
        newTestScriptLines.some((line) => line.includes('const basePage')),
      ).toBe(true);
      expect(
        newTestScriptLines.some((line) => line.includes('const s3Utils')),
      ).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty pre-processor patterns list', () => {
      const testScriptLines = ["test('MyTest', async ({ page }) => {"];
      const index = 0;
      const config = createMockConfig({
        PRE_PROCESSOR_PATTERNS_DO_LIST: [],
      });
      const handler = new TestCaseStartHandler(testScriptLines, index, config);

      const testStartContent = [
        'for (const data of input) {',
        '  test(`[[TEST_CASE_NAME_MATCHER]]`, async ({ userCreation, page }) => {',
        '      const s3Utils = new S3utils();',
      ];
      mockReadFileLines(testStartContent);

      const newTestScriptLines: string[] = [];
      handler.execute(
        newTestScriptLines,
        '/path/to/TC01_MyTest.spec.ts',
        '/path/to/dest.ts',
        '/path/to/data.json',
        new Map(),
        new Map(),
        new Map(),
      );

      // Should still process normally without errors
      expect(newTestScriptLines.length).toBeGreaterThan(0);
    });

    it('should handle pre-processor pattern with missing testScriptName', () => {
      const testScriptLines = ["test('MyTest', async ({ page }) => {"];
      const index = 0;
      const preProcessorPatterns = [
        {
          testScriptName: '',
          linesToBeInserted:
            "await s3Utils.updateS3Setting('base', {'setting': true});",
          separator: ',',
        },
      ];
      const config = createMockConfig({
        PRE_PROCESSOR_PATTERNS_DO_LIST: preProcessorPatterns,
      });
      const handler = new TestCaseStartHandler(testScriptLines, index, config);

      const testStartContent = [
        'for (const data of input) {',
        '  test(`[[TEST_CASE_NAME_MATCHER]]`, async ({ userCreation, page }) => {',
        '      const s3Utils = new S3utils();',
      ];
      mockReadFileLines(testStartContent);

      const newTestScriptLines: string[] = [];
      handler.execute(
        newTestScriptLines,
        '/path/to/TC01_MyTest.spec.ts',
        '/path/to/dest.ts',
        '/path/to/data.json',
        new Map(),
        new Map(),
        new Map(),
      );

      // Should not insert lines when testScriptName is empty
      const insertedLine = newTestScriptLines.find((line) =>
        line.includes('updateS3Setting'),
      );
      expect(insertedLine).toBeUndefined();
    });

    it('should handle default separator when not provided', () => {
      const testScriptLines = ["test('MyTest', async ({ page }) => {"];
      const index = 0;
      const preProcessorPatterns = [
        {
          testScriptName: 'TC01_MyTest.spec.ts',
          linesToBeInserted: 'line1,line2,line3',
          // separator not provided, should default to ","
        },
      ];
      const config = createMockConfig({
        PRE_PROCESSOR_PATTERNS_DO_LIST: preProcessorPatterns,
      });
      const handler = new TestCaseStartHandler(testScriptLines, index, config);

      const testStartContent = [
        'for (const data of input) {',
        '  test(`[[TEST_CASE_NAME_MATCHER]]`, async ({ userCreation, page }) => {',
        '      const s3Utils = new S3utils();',
      ];
      mockReadFileLines(testStartContent);

      const newTestScriptLines: string[] = [];
      handler.execute(
        newTestScriptLines,
        '/path/to/TC01_MyTest.spec.ts',
        '/path/to/dest.ts',
        '/path/to/data.json',
        new Map(),
        new Map(),
        new Map(),
      );

      // Should split by default separator (comma)
      expect(newTestScriptLines).toContain('line1');
      expect(newTestScriptLines).toContain('line2');
      expect(newTestScriptLines).toContain('line3');
    });
  });
});
