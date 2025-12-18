/**
 * Unit tests for CompleteFileNameHandler
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CompleteFileNameHandler } from '../../../src/transformer/handlers/CompleteFileNameHandler';
import { createMockConfig } from '../utils/testHelpers';
import { Logger } from '../../../src/utils/logger';

describe('CompleteFileNameHandler', () => {
  beforeEach(() => {
    // Disable logger during tests
    Logger.disable();
  });

  describe('Test case name extraction', () => {
    it('should extract test case name from source path and replace placeholder', () => {
      const testScriptLines = [
        "import data from './data/[[COMPLETE_TEST_FILE_NAME]].json';",
      ];
      const index = 0;
      const config = createMockConfig();
      const sourceDir = '/path/to/tests';
      const dataSourcePath = './data/TC01_MyTest.json';
      const handler = new CompleteFileNameHandler(
        testScriptLines,
        index,
        config,
        sourceDir,
        dataSourcePath,
      );

      const newTestScriptLines: string[] = [];
      handler.execute(
        newTestScriptLines,
        '/path/to/tests/TC01_MyTest.spec.ts',
        '/path/to/dest.ts',
        '/path/to/data.json',
        new Map(),
        new Map(),
        new Map(),
      );

      expect(newTestScriptLines).toHaveLength(1);
      expect(newTestScriptLines[0]).toContain('TC01_MyTest');
      expect(newTestScriptLines[0]).not.toContain(
        '[[COMPLETE_TEST_FILE_NAME]]',
      );
    });

    it('should handle Windows path separators', () => {
      const testScriptLines = [
        "import data from './data/[[COMPLETE_TEST_FILE_NAME]].json';",
      ];
      const index = 0;
      const config = createMockConfig();
      const sourceDir = 'C:\\path\\to\\tests';
      const dataSourcePath = './data/TC02_Test.json';
      const handler = new CompleteFileNameHandler(
        testScriptLines,
        index,
        config,
        sourceDir,
        dataSourcePath,
      );

      const newTestScriptLines: string[] = [];
      handler.execute(
        newTestScriptLines,
        'C:\\path\\to\\tests\\TC02_Test.spec.ts',
        '/path/to/dest.ts',
        '/path/to/data.json',
        new Map(),
        new Map(),
        new Map(),
      );

      expect(newTestScriptLines[0]).toContain('TC02_Test');
    });

    it('should handle file names with underscores and hyphens', () => {
      const testScriptLines = [
        "import data from './data/[[COMPLETE_TEST_FILE_NAME]].json';",
      ];
      const index = 0;
      const config = createMockConfig();
      //const sourceDir = '/path/to/tests';
      const dataSourcePath = './data/TC03_Verify-Error-Message.json';
      const handler = new CompleteFileNameHandler(
        testScriptLines,
        index,
        config,
        dataSourcePath,
        dataSourcePath,
      );

      const newTestScriptLines: string[] = [];
      handler.execute(
        newTestScriptLines,
        '/path/to/tests/TC03_Verify-Error-Message.spec.ts',
        '/path/to/dest.ts',
        '/path/to/data.json',
        new Map(),
        new Map(),
        new Map(),
      );

      expect(newTestScriptLines[0]).toContain('TC03_Verify-Error-Message');
    });

    it('should extract name correctly when source path has subdirectories', () => {
      const testScriptLines = [
        "import data from './data/[[COMPLETE_TEST_FILE_NAME]].json';",
      ];
      const index = 0;
      const config = createMockConfig();
      const sourceDir = '/path/to/tests';
      const dataSourcePath = './data/TC04_SubDirTest.json';
      const handler = new CompleteFileNameHandler(
        testScriptLines,
        index,
        config,
        sourceDir,
        dataSourcePath,
      );

      const newTestScriptLines: string[] = [];
      handler.execute(
        newTestScriptLines,
        '/path/to/tests/subdir/TC04_SubDirTest.spec.ts',
        '/path/to/dest.ts',
        '/path/to/data.json',
        new Map(),
        new Map(),
        new Map(),
      );

      expect(newTestScriptLines[0]).toContain('TC04_SubDirTest');
    });
  });

  describe('DATA_SOURCE_PATH_PLACEHOLDER replacement', () => {
    it('should replace DATA_SOURCE_PATH_PLACEHOLDER with dataSourcePath', () => {
      const testScriptLines = [
        "import data from '[[DATA_SOURCE_PATH_PLACEHOLDER]]';",
      ];
      const index = 0;
      const config = createMockConfig();
      const sourceDir = '/path/to/tests';
      const dataSourcePath = './data/TC05_MyTest.json';
      const handler = new CompleteFileNameHandler(
        testScriptLines,
        index,
        config,
        sourceDir,
        dataSourcePath,
      );

      const newTestScriptLines: string[] = [];
      handler.execute(
        newTestScriptLines,
        '/path/to/tests/TC05_MyTest.spec.ts',
        '/path/to/dest.ts',
        '/path/to/data.json',
        new Map(),
        new Map(),
        new Map(),
      );

      expect(newTestScriptLines[0]).toContain(dataSourcePath);
      expect(newTestScriptLines[0]).not.toContain(
        '[[DATA_SOURCE_PATH_PLACEHOLDER]]',
      );
    });

    it('should handle empty dataSourcePath', () => {
      const testScriptLines = [
        "import data from '[[DATA_SOURCE_PATH_PLACEHOLDER]]';",
      ];
      const index = 0;
      const config = createMockConfig();
      const sourceDir = '/path/to/tests';
      const dataSourcePath = '';
      const handler = new CompleteFileNameHandler(
        testScriptLines,
        index,
        config,
        sourceDir,
        dataSourcePath,
      );

      const newTestScriptLines: string[] = [];
      handler.execute(
        newTestScriptLines,
        '/path/to/tests/TC06_MyTest.spec.ts',
        '/path/to/dest.ts',
        '/path/to/data.json',
        new Map(),
        new Map(),
        new Map(),
      );

      expect(newTestScriptLines[0]).not.toContain(
        '[[DATA_SOURCE_PATH_PLACEHOLDER]]',
      );
    });

    it('should replace both placeholders in the same line', () => {
      const testScriptLines = [
        "import data from '[[DATA_SOURCE_PATH_PLACEHOLDER]]/[[COMPLETE_TEST_FILE_NAME]].json';",
      ];
      const index = 0;
      const config = createMockConfig();
      const sourceDir = '/path/to/tests';
      const dataSourcePath = './data';
      const handler = new CompleteFileNameHandler(
        testScriptLines,
        index,
        config,
        sourceDir,
        dataSourcePath,
      );

      const newTestScriptLines: string[] = [];
      handler.execute(
        newTestScriptLines,
        '/path/to/tests/TC07_MyTest.spec.ts',
        '/path/to/dest.ts',
        '/path/to/data.json',
        new Map(),
        new Map(),
        new Map(),
      );

      expect(newTestScriptLines[0]).toContain(dataSourcePath);
      expect(newTestScriptLines[0]).toContain('TC07_MyTest');
      expect(newTestScriptLines[0]).not.toContain(
        '[[DATA_SOURCE_PATH_PLACEHOLDER]]',
      );
      expect(newTestScriptLines[0]).not.toContain(
        '[[COMPLETE_TEST_FILE_NAME]]',
      );
    });
  });

  describe('Edge cases', () => {
    it('should handle source path without extension', () => {
      const testScriptLines = [
        "import data from './data/[[COMPLETE_TEST_FILE_NAME]].json';",
      ];
      const index = 0;
      const config = createMockConfig();
      const sourceDir = '/path/to/tests';
      const dataSourcePath = './data/TC08_Test.json';
      const handler = new CompleteFileNameHandler(
        testScriptLines,
        index,
        config,
        sourceDir,
        dataSourcePath,
      );

      const newTestScriptLines: string[] = [];
      handler.execute(
        newTestScriptLines,
        '/path/to/tests/TC08_Test',
        '/path/to/dest.ts',
        '/path/to/data.json',
        new Map(),
        new Map(),
        new Map(),
      );

      // Should handle gracefully (substring(0, indexOf(".")) will return full string if no dot)
      expect(newTestScriptLines.length).toBeGreaterThan(0);
    });

    it('should handle source path with multiple dots', () => {
      const testScriptLines = [
        "import data from './data/[[COMPLETE_TEST_FILE_NAME]].json';",
      ];
      const index = 0;
      const config = createMockConfig();
      const sourceDir = '/path/to/tests';
      const dataSourcePath = './data/TC09_Test.json';
      const handler = new CompleteFileNameHandler(
        testScriptLines,
        index,
        config,
        sourceDir,
        dataSourcePath,
      );

      const newTestScriptLines: string[] = [];
      handler.execute(
        newTestScriptLines,
        '/path/to/tests/TC09_Test.v1.spec.ts',
        '/path/to/dest.ts',
        '/path/to/data.json',
        new Map(),
        new Map(),
        new Map(),
      );

      // Should extract name up to first dot
      expect(newTestScriptLines[0]).toContain('TC09_Test');
    });

    it('should handle line without placeholders', () => {
      const testScriptLines = ["import { test } from '@playwright/test';"];
      const index = 0;
      const config = createMockConfig();
      const sourceDir = '/path/to/tests';
      const dataSourcePath = './data/TC10_Test.json';
      const handler = new CompleteFileNameHandler(
        testScriptLines,
        index,
        config,
        sourceDir,
        dataSourcePath,
      );

      const newTestScriptLines: string[] = [];
      handler.execute(
        newTestScriptLines,
        '/path/to/tests/TC10_Test.spec.ts',
        '/path/to/dest.ts',
        '/path/to/data.json',
        new Map(),
        new Map(),
        new Map(),
      );

      // Should still process and add line (may replace COMPLETE_TEST_FILE_NAME if present)
      expect(newTestScriptLines.length).toBeGreaterThan(0);
    });
  });
});
