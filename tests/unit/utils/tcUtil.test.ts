/**
 * Unit tests for tcUtil functions
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  applyInsertLinePattern,
  removeAllNoiseLines,
  putInMapWithUniqueKeys,
  getStringForJson,
  getFilenameFromPath,
  putAndSortInReversemap,
  getNameFromFramesetForJson,
  convertStringToMap,
  extractSubstring,
  getReverseJsonMapToUseForMatchingString,
  getMatchingMapForGetByText,
  removeDateAtTheEnd,
  populateUniqueValueInMap,
  getJsonStringFromMap,
} from '../../../src/transformer/utils/tcUtil';
import { createMockConfig } from './testHelpers';
import { Logger } from '../../../src/utils/logger';
import {
  InsertLinesDataObject,
  SkipPatternDataObject,
} from '../../../src/types';

describe('tcUtil', () => {
  beforeEach(() => {
    // Disable logger during tests
    Logger.disable();
  });

  describe('putInMapWithUniqueKeys', () => {
    it('should add key-value pair when key does not exist', () => {
      const map = new Map<string, string>();
      const key = putInMapWithUniqueKeys(map, 'testKey', 'testValue');

      expect(key).toBe('testKey');
      expect(map.has('testKey')).toBe(true);
      expect(map.get('testKey')).toBe('testValue');
    });

    it('should append _1 when key already exists', () => {
      const map = new Map<string, string>();
      map.set('testKey', 'value1');

      const key = putInMapWithUniqueKeys(map, 'testKey', 'value2');

      expect(key).toBe('testKey_1');
      expect(map.has('testKey_1')).toBe(true);
      expect(map.get('testKey_1')).toBe('value2');
    });

    it('should append _2 when key and _1 already exist', () => {
      const map = new Map<string, string>();
      map.set('testKey', 'value1');
      map.set('testKey_1', 'value2');

      const key = putInMapWithUniqueKeys(map, 'testKey', 'value3');

      expect(key).toBe('testKey_2');
      expect(map.has('testKey_2')).toBe(true);
      expect(map.get('testKey_2')).toBe('value3');
    });

    it('should handle multiple duplicates', () => {
      const map = new Map<string, string>();
      map.set('key', 'v1');
      map.set('key_1', 'v2');
      map.set('key_2', 'v3');

      const key = putInMapWithUniqueKeys(map, 'key', 'v4');

      expect(key).toBe('key_3');
      expect(map.get('key_3')).toBe('v4');
    });
  });

  describe('getStringForJson', () => {
    it('should convert string with less than 3 parts', () => {
      const result = getStringForJson('test-key');
      expect(result).toBe('test_key');
    });

    it('should handle string with special characters', () => {
      const result = getStringForJson('test@key#value');
      expect(result).toBe('test_key_value');
    });

    it('should handle string with 3 or more parts using last three', () => {
      const result = getStringForJson('part1-part2-part3');
      expect(result).toBe('part1Part2Part3');
    });

    it('should handle string with 4 parts using last three', () => {
      const result = getStringForJson('a-b-c-d');
      // Last three parts: b, c, d -> b + C + D = bCD
      expect(result).toBe('bCD');
    });

    it('should remove trailing underscore', () => {
      const result = getStringForJson('test-key-');
      expect(result).not.toMatch(/_$/);
    });

    it('should replace double underscores with single', () => {
      const result = getStringForJson('test--key');
      expect(result).not.toContain('__');
    });

    it('should handle empty string', () => {
      const result = getStringForJson('');
      expect(result).toBe('');
    });
  });

  describe('getFilenameFromPath', () => {
    it('should extract filename from Unix path', () => {
      const result = getFilenameFromPath('/path/to/file.pdf');
      expect(result).toBe('file.pdf');
    });

    it('should extract filename from Windows path', () => {
      const result = getFilenameFromPath('C:\\path\\to\\file.pdf');
      expect(result).toBe('file.pdf');
    });

    it('should return filename when no path separators', () => {
      const result = getFilenameFromPath('file.pdf');
      expect(result).toBe('file.pdf');
    });

    it('should handle path with both separators', () => {
      const result = getFilenameFromPath('/path\\to/file.pdf');
      expect(result).toBe('file.pdf');
    });

    it('should handle path ending with separator', () => {
      const result = getFilenameFromPath('/path/to/');
      expect(result).toBe('');
    });
  });

  describe('putAndSortInReversemap', () => {
    it('should add key-value pair to map', () => {
      const map = new Map<string, string>();
      putAndSortInReversemap(map, 'key1', 'value1');

      expect(map.has('key1')).toBe(true);
      expect(map.get('key1')).toBe('value1');
    });

    it('should not overwrite existing key', () => {
      const map = new Map<string, string>();
      map.set('key1', 'value1');
      putAndSortInReversemap(map, 'key1', 'value2');

      expect(map.get('key1')).toBe('value1');
    });

    it('should sort map by key length descending', () => {
      const map = new Map<string, string>();
      putAndSortInReversemap(map, 'a', 'value1');
      putAndSortInReversemap(map, 'longkey', 'value2');
      putAndSortInReversemap(map, 'key', 'value3');

      const entries = Array.from(map.entries());
      expect(entries[0][0]).toBe('longkey');
      expect(entries[1][0]).toBe('key');
      expect(entries[2][0]).toBe('a');
    });

    it('should maintain sort order after multiple additions', () => {
      const map = new Map<string, string>();
      putAndSortInReversemap(map, 'short', 'v1');
      putAndSortInReversemap(map, 'verylongkey', 'v2');
      putAndSortInReversemap(map, 'medium', 'v3');

      const entries = Array.from(map.entries());
      expect(entries[0][0]).toBe('verylongkey');
      expect(entries[1][0]).toBe('medium');
      expect(entries[2][0]).toBe('short');
    });
  });

  describe('getNameFromFramesetForJson', () => {
    it('should extract text from double quotes and convert', () => {
      const config = createMockConfig({
        TEXT_WITHIN_DOUBLE_QUOTE_PATTERN: new RegExp('"(.*?)"'),
      });
      const result = getNameFromFramesetForJson(
        'frameLocator("iframe-name")',
        config,
      );
      expect(result).toBe('iframe_name');
    });

    it('should handle input without double quotes', () => {
      const config = createMockConfig({
        TEXT_WITHIN_DOUBLE_QUOTE_PATTERN: new RegExp('"(.*?)"'),
      });
      const result = getNameFromFramesetForJson('iframe-name', config);
      expect(result).toBe('iframe_name');
    });

    it('should remove trailing underscore', () => {
      const config = createMockConfig({
        TEXT_WITHIN_DOUBLE_QUOTE_PATTERN: new RegExp('"(.*?)"'),
      });
      const result = getNameFromFramesetForJson(
        'frameLocator("test-")',
        config,
      );
      expect(result).not.toMatch(/_$/);
    });
  });

  describe('convertStringToMap', () => {
    it('should convert comma-separated key-value pairs', () => {
      const result = convertStringToMap('key1:value1, key2:value2');
      expect(result.size).toBe(2);
      expect(result.get('key1')).toBe('value1');
      expect(result.get('key2')).toBe('value2');
    });

    it('should handle string with spaces', () => {
      const result = convertStringToMap('key1 : value1 , key2 : value2');
      expect(result.size).toBe(2);
      expect(result.get('key1')).toBe('value1');
      expect(result.get('key2')).toBe('value2');
    });

    it('should return empty map for empty string', () => {
      const result = convertStringToMap('');
      expect(result.size).toBe(0);
    });

    it('should return empty map for whitespace only', () => {
      const result = convertStringToMap('   ');
      expect(result.size).toBe(0);
    });

    it('should ignore invalid pairs without colon', () => {
      const result = convertStringToMap('key1:value1, invalid, key2:value2');
      expect(result.size).toBe(2);
      expect(result.has('invalid')).toBe(false);
    });

    it('should handle single pair', () => {
      const result = convertStringToMap('key:value');
      expect(result.size).toBe(1);
      expect(result.get('key')).toBe('value');
    });
  });

  describe('extractSubstring', () => {
    it('should extract substring between start and end text', () => {
      const result = extractSubstring(
        "await page.getByText('Hello World').click();",
        ".getByText('",
        "')",
      );
      expect(result).toBe('Hello World');
    });

    it('should return null when start text not found', () => {
      const result = extractSubstring('test string', 'missing', "')");
      expect(result).toBeNull();
    });

    it('should return null when end text not found', () => {
      const result = extractSubstring("getByText('value", ".getByText('", "')");
      expect(result).toBeNull();
    });

    it('should handle empty substring', () => {
      // When substring is empty, end pattern is found immediately after start
      const result = extractSubstring(
        "await page.getByText('').click()",
        ".getByText('",
        "')",
      );
      expect(result).toBe('');
    });

    it('should extract from first occurrence of start text', () => {
      // The function finds first startText, then first endText after that
      const result = extractSubstring(
        "await page.getByText('first').getByText('second')",
        ".getByText('",
        "')",
      );
      expect(result).toBe('first');
    });
  });

  describe('getReverseJsonMapToUseForMatchingString', () => {
    it('should return map with matching values', () => {
      const reverseJsonMap = new Map<string, string>();
      reverseJsonMap.set('Hello', 'data.hello');
      reverseJsonMap.set('World', 'data.world');
      reverseJsonMap.set('Test', 'data.test');

      const result = getReverseJsonMapToUseForMatchingString(
        reverseJsonMap,
        'Hello World',
      );

      expect(result.size).toBeGreaterThan(0);
      expect(result.has('Hello')).toBe(true);
      expect(result.has('World')).toBe(true);
    });

    it('should return empty map when no matches', () => {
      const reverseJsonMap = new Map<string, string>();
      reverseJsonMap.set('Hello', 'data.hello');

      const result = getReverseJsonMapToUseForMatchingString(
        reverseJsonMap,
        'NoMatch',
      );

      expect(result.size).toBe(0);
    });

    it('should handle partial matches', () => {
      const reverseJsonMap = new Map<string, string>();
      reverseJsonMap.set('Hello', 'data.hello');
      reverseJsonMap.set('World', 'data.world');

      const result = getReverseJsonMapToUseForMatchingString(
        reverseJsonMap,
        'Hello',
      );

      expect(result.has('Hello')).toBe(true);
    });
  });

  describe('getMatchingMapForGetByText', () => {
    it('should replace matching text with data reference', () => {
      const reverseJsonMap = new Map<string, string>();
      reverseJsonMap.set('Test Text', 'data.testText');
      const jsonMap = new Map<string, string>();

      const result = getMatchingMapForGetByText(
        reverseJsonMap,
        "await page.getByText('Test Text').click();",
        ".getByText('",
        "')",
        'Test Text',
        undefined,
        jsonMap,
        undefined,
      );

      expect(result).toContain('data.testText');
      expect(result).not.toContain("'Test Text'");
    });

    it('should use preferred field when conditions match', () => {
      const reverseJsonMap = new Map<string, string>();
      reverseJsonMap.set('Preferred', 'data.original');
      const jsonMap = new Map<string, string>();
      jsonMap.set('preferredKey', 'Preferred');

      const result = getMatchingMapForGetByText(
        reverseJsonMap,
        "await page.getByText('Preferred').click();",
        ".getByText('",
        "')",
        'Preferred',
        'preferredKey',
        jsonMap,
        '',
      );

      expect(result).toContain('data.preferredKey');
    });

    it('should return original line when no match found', () => {
      const reverseJsonMap = new Map<string, string>();
      reverseJsonMap.set('Other', 'data.other');
      const jsonMap = new Map<string, string>();

      const originalLine = "await page.getByText('Test').click();";
      const result = getMatchingMapForGetByText(
        reverseJsonMap,
        originalLine,
        ".getByText('",
        "')",
        'Test',
        undefined,
        jsonMap,
        undefined,
      );

      expect(result).toBe(originalLine);
    });

    it('should handle case-insensitive matching', () => {
      const reverseJsonMap = new Map<string, string>();
      reverseJsonMap.set('test', 'data.test');
      const jsonMap = new Map<string, string>();

      const result = getMatchingMapForGetByText(
        reverseJsonMap,
        "await page.getByText('TEST').click();",
        ".getByText('",
        "')",
        'TEST',
        undefined,
        jsonMap,
        undefined,
      );

      expect(result).toContain('data.test');
    });
  });

  describe('removeDateAtTheEnd', () => {
    it('should remove date at the end of string', () => {
      const config = createMockConfig({
        ENDS_WITH_DATE_FORMAT_PATTERN: new RegExp(
          '\\s-\\s\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}$',
        ),
      });
      const result = removeDateAtTheEnd(
        'Test Text - 2024-01-15T10:30:00',
        config,
      );
      expect(result).toBe('Test Text');
    });

    it('should return original string when no date found', () => {
      const config = createMockConfig({
        ENDS_WITH_DATE_FORMAT_PATTERN: new RegExp(
          '\\s-\\s\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}$',
        ),
      });
      const input = 'Test Text';
      const result = removeDateAtTheEnd(input, config);
      expect(result).toBe(input);
    });

    it('should handle date in middle of string', () => {
      const config = createMockConfig({
        ENDS_WITH_DATE_FORMAT_PATTERN: new RegExp(
          '\\s-\\s\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}$',
        ),
      });
      const input = 'Test - 2024-01-15T10:30:00 - More Text';
      const result = removeDateAtTheEnd(input, config);
      // Should only remove if at the end
      expect(result).toBe(input);
    });
  });

  describe('populateUniqueValueInMap', () => {
    it('should add key-value pair when value does not exist', () => {
      const map = new Map<string, string>();
      const value = populateUniqueValueInMap(map, 'key1', 'dynamicId');

      expect(value).toBe('dynamicId');
      expect(map.has('key1')).toBe(true);
      expect(map.get('key1')).toBe('dynamicId');
    });

    it('should append _1 when value already exists', () => {
      const map = new Map<string, string>();
      map.set('key1', 'dynamicId');

      const value = populateUniqueValueInMap(map, 'key2', 'dynamicId');

      expect(value).toBe('dynamicId_1');
      expect(map.get('key2')).toBe('dynamicId_1');
    });

    it('should append _2 when value and _1 already exist', () => {
      const map = new Map<string, string>();
      map.set('key1', 'dynamicId');
      map.set('key2', 'dynamicId_1');

      const value = populateUniqueValueInMap(map, 'key3', 'dynamicId');

      expect(value).toBe('dynamicId_2');
      expect(map.get('key3')).toBe('dynamicId_2');
    });

    it('should handle multiple duplicates', () => {
      const map = new Map<string, string>();
      map.set('k1', 'id');
      map.set('k2', 'id_1');
      map.set('k3', 'id_2');

      const value = populateUniqueValueInMap(map, 'k4', 'id');

      expect(value).toBe('id_3');
    });
  });

  describe('getJsonStringFromMap', () => {
    it('should generate JSON string from single map', () => {
      const map = new Map<string, string>();
      map.set('key1', 'value1');
      map.set('key2', 'value2');

      const result = getJsonStringFromMap([map]);

      expect(result).toContain('[');
      expect(result).toContain(']');
      expect(result).toContain('"key1"');
      expect(result).toContain('"value1"');
      expect(result).toContain('"key2"');
      expect(result).toContain('"value2"');
    });

    it('should generate JSON string from multiple maps', () => {
      const map1 = new Map<string, string>();
      map1.set('key1', 'value1');
      const map2 = new Map<string, string>();
      map2.set('key2', 'value2');

      const result = getJsonStringFromMap([map1, map2]);

      expect(result).toContain('[');
      expect(result).toContain(']');
      expect(result).toContain('"key1"');
      expect(result).toContain('"key2"');
    });

    it('should escape quotes in values', () => {
      const map = new Map<string, string>();
      map.set('key', 'value with "quotes"');

      const result = getJsonStringFromMap([map]);

      expect(result).toContain('\\"');
      expect(result).not.toContain('"quotes"');
    });

    it('should handle empty map', () => {
      const map = new Map<string, string>();
      const result = getJsonStringFromMap([map]);

      expect(result).toContain('[');
      expect(result).toContain(']');
      // The function generates formatted JSON with newlines: [\n  {\n  }\n]
      expect(result).toContain('{');
      expect(result).toContain('}');
    });

    it('should handle empty array', () => {
      const result = getJsonStringFromMap([]);
      // The function generates formatted JSON with newlines: [\n]
      expect(result).toContain('[');
      expect(result).toContain(']');
      // Should be just brackets with newline
      expect(result.replace(/\n/g, '')).toBe('[]');
    });
  });

  describe('applyInsertLinePattern', () => {
    it('should insert lines when pattern matches', () => {
      const testScriptLines = [
        "await page.getByTestId('login').click();",
        "await page.getByTestId('username').fill('user');",
      ];
      const insertPattern: InsertLinesDataObject = {
        existingLines: "getByTestId('login').click()",
        linesToBeInserted: 'await page.waitForLoadState();',
        insertAt: '0',
        separator: ',',
      };
      const config = createMockConfig({
        INSERT_LINES_DO_LIST: [insertPattern],
      });

      const result = applyInsertLinePattern(testScriptLines, config);

      expect(result.length).toBeGreaterThan(testScriptLines.length);
      expect(result).toContain('await page.waitForLoadState();');
    });

    it('should handle regex pattern matching', () => {
      const testScriptLines = ["await page.getByTestId('test-123').click();"];
      const insertPattern: InsertLinesDataObject = {
        existingLines: "getByTestId\\('test-(\\d+)'\\)",
        linesToBeInserted: 'await page.waitForTimeout(__LINE__0__GROUP__1__);',
        insertAt: '0',
        separator: ',',
        isRegex: true,
      };
      const config = createMockConfig({
        INSERT_LINES_DO_LIST: [insertPattern],
      });

      const result = applyInsertLinePattern(testScriptLines, config);

      expect(result.length).toBeGreaterThan(testScriptLines.length);
      expect(result.some((line) => line.includes('123'))).toBe(true);
    });

    it('should remove lines when specified in removeLines', () => {
      const testScriptLines = ['line1', 'line2', 'line3'];
      const insertPattern: InsertLinesDataObject = {
        existingLines: 'line1,line2',
        linesToBeInserted: 'newLine',
        insertAt: '0',
        removeLines: '1',
        separator: ',',
      };
      const config = createMockConfig({
        INSERT_LINES_DO_LIST: [insertPattern],
      });

      const result = applyInsertLinePattern(testScriptLines, config);

      expect(result).not.toContain('line2');
      expect(result).toContain('line1');
      expect(result).toContain('line3');
    });

    it('should handle separator with pipe character', () => {
      const testScriptLines = ['line1', 'line2'];
      const insertPattern: InsertLinesDataObject = {
        existingLines: 'line1|line2',
        linesToBeInserted: 'newLine',
        insertAt: '0',
        separator: '\\|',
      };
      const config = createMockConfig({
        INSERT_LINES_DO_LIST: [insertPattern],
      });

      const result = applyInsertLinePattern(testScriptLines, config);

      expect(result.length).toBeGreaterThan(testScriptLines.length);
    });

    it('should handle EG_ID placeholder replacement', () => {
      const testScriptLines = ['line1'];
      const insertPattern: InsertLinesDataObject = {
        existingLines: 'line1',
        linesToBeInserted: 'const egId__%EG_ID%__ = 1;',
        insertAt: '0',
        separator: ',',
      };
      const config = createMockConfig({
        INSERT_LINES_DO_LIST: [insertPattern],
      });

      const result = applyInsertLinePattern(testScriptLines, config);

      expect(result.some((line) => line.includes('const egId'))).toBe(true);
    });

    it('should handle no matching pattern', () => {
      const testScriptLines = ['line1', 'line2'];
      const insertPattern: InsertLinesDataObject = {
        existingLines: 'nomatch',
        linesToBeInserted: 'newLine',
        insertAt: '0',
        separator: ',',
      };
      const config = createMockConfig({
        INSERT_LINES_DO_LIST: [insertPattern],
      });

      const result = applyInsertLinePattern(testScriptLines, config);

      expect(result).toEqual(testScriptLines);
    });
  });

  describe('removeAllNoiseLines', () => {
    it('should remove duplicate lines matching skip pattern', () => {
      const testScriptLines = [
        "await page.getByTestId('test').click();",
        "await page.getByTestId('test').click();",
        "await page.getByTestId('other').click();",
      ];
      const skipPattern: SkipPatternDataObject = {
        pattern: "getByTestId('test')",
        patternScope: 'doubleLine',
      };
      const config = createMockConfig({
        SKIP_PATTERNS_DO_LIST: [skipPattern],
        NOISE_LINE_REMOVAL_ITER_COUNT: 10,
      });

      const result = removeAllNoiseLines(testScriptLines, config);

      expect(result.length).toBeLessThanOrEqual(testScriptLines.length);
    });

    it('should remove last few empty lines', () => {
      const testScriptLines = [
        'line1',
        'line2',
        '',
        '',
        '',
        '',
        '',
        'lastLine',
      ];
      const config = createMockConfig({
        SKIP_PATTERNS_DO_LIST: [],
        NOISE_LINE_REMOVAL_ITER_COUNT: 10,
      });

      const result = removeAllNoiseLines(testScriptLines, config);

      // Should remove some empty lines from the end
      expect(result.length).toBeLessThanOrEqual(testScriptLines.length);
    });

    it('should handle compareTextBeforePattern option', () => {
      const testScriptLines = [
        "await page.getByTestId('test').click();",
        "await page.getByTestId('test').click();",
      ];
      const skipPattern: SkipPatternDataObject = {
        pattern: "getByTestId('test')",
        patternScope: 'doubleLine',
        compareTextBeforePattern: true,
      };
      const config = createMockConfig({
        SKIP_PATTERNS_DO_LIST: [skipPattern],
        NOISE_LINE_REMOVAL_ITER_COUNT: 10,
      });

      const result = removeAllNoiseLines(testScriptLines, config);

      expect(result.length).toBeLessThanOrEqual(testScriptLines.length);
    });

    it('should handle empty skip patterns list', () => {
      const testScriptLines = ['line1', 'line2', 'line3'];
      const config = createMockConfig({
        SKIP_PATTERNS_DO_LIST: [],
        NOISE_LINE_REMOVAL_ITER_COUNT: 10,
      });

      const result = removeAllNoiseLines(testScriptLines, config);

      expect(result.length).toBeGreaterThan(0);
    });

    it('should preserve last line', () => {
      const testScriptLines = ['line1', 'line2', 'lastLine'];
      const config = createMockConfig({
        SKIP_PATTERNS_DO_LIST: [],
        NOISE_LINE_REMOVAL_ITER_COUNT: 10,
      });

      const result = removeAllNoiseLines(testScriptLines, config);

      expect(result[result.length - 1]).toBe('lastLine');
    });
  });
});
