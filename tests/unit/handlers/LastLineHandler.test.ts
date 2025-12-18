/**
 * Unit tests for LastLineHandler
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LastLineHandler } from '../../../src/transformer/handlers/LastLineHandler';
import { createMockConfig } from '../utils/testHelpers';
import {
  mockReadFileLines,
  restoreReadFileLines,
} from '../utils/mockFileUtils';
import { Logger } from '../../../src/utils/logger';

describe('LastLineHandler', () => {
  beforeEach(() => {
    // Disable logger during tests
    Logger.disable();
    restoreReadFileLines();
  });

  describe('Test script end lines handling', () => {
    it('should add test script end lines from file', () => {
      const testScriptLines = ['  });'];
      const index = 0;
      const config = createMockConfig();
      const handler = new LastLineHandler(testScriptLines, index, config);

      const testScriptEndLines = ['  });', '}'];
      mockReadFileLines(testScriptEndLines);

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

      expect(newTestScriptLines).toHaveLength(2);
      expect(newTestScriptLines).toContain('  });');
      expect(newTestScriptLines).toContain('}');
    });

    it('should handle single line in test script end file', () => {
      const testScriptLines = ['  });'];
      const index = 0;
      const config = createMockConfig();
      const handler = new LastLineHandler(testScriptLines, index, config);

      const testScriptEndLines = ['}'];
      mockReadFileLines(testScriptEndLines);

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

      expect(newTestScriptLines).toHaveLength(1);
      expect(newTestScriptLines[0]).toBe('}');
    });

    it('should handle multiple lines in test script end file', () => {
      const testScriptLines = ['  });'];
      const index = 0;
      const config = createMockConfig();
      const handler = new LastLineHandler(testScriptLines, index, config);

      const testScriptEndLines = ['  });', '}', '', '// End of test'];
      mockReadFileLines(testScriptEndLines);

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

      expect(newTestScriptLines).toHaveLength(4);
      expect(newTestScriptLines).toContain('  });');
      expect(newTestScriptLines).toContain('}');
      expect(newTestScriptLines).toContain('');
      expect(newTestScriptLines).toContain('// End of test');
    });

    it('should preserve line order from test script end file', () => {
      const testScriptLines = ['  });'];
      const index = 0;
      const config = createMockConfig();
      const handler = new LastLineHandler(testScriptLines, index, config);

      const testScriptEndLines = ['  });', '}', '});'];
      mockReadFileLines(testScriptEndLines);

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

      expect(newTestScriptLines).toHaveLength(3);
      expect(newTestScriptLines[0]).toBe('  });');
      expect(newTestScriptLines[1]).toBe('}');
      expect(newTestScriptLines[2]).toBe('});');
    });

    it('should handle lines with whitespace and indentation', () => {
      const testScriptLines = ['  });'];
      const index = 0;
      const config = createMockConfig();
      const handler = new LastLineHandler(testScriptLines, index, config);

      const testScriptEndLines = ['    });', '  }', '}'];
      mockReadFileLines(testScriptEndLines);

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

      expect(newTestScriptLines).toHaveLength(3);
      expect(newTestScriptLines[0]).toBe('    });');
      expect(newTestScriptLines[1]).toBe('  }');
      expect(newTestScriptLines[2]).toBe('}');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty test script end file', () => {
      const testScriptLines = ['  });'];
      const index = 0;
      const config = createMockConfig();
      const handler = new LastLineHandler(testScriptLines, index, config);

      const testScriptEndLines: string[] = [];
      mockReadFileLines(testScriptEndLines);

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

      // Should handle empty file gracefully
      expect(newTestScriptLines).toHaveLength(0);
    });

    it('should handle test script end file with only whitespace lines', () => {
      const testScriptLines = ['  });'];
      const index = 0;
      const config = createMockConfig();
      const handler = new LastLineHandler(testScriptLines, index, config);

      const testScriptEndLines = ['  ', '    ', ''];
      mockReadFileLines(testScriptEndLines);

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

      expect(newTestScriptLines).toHaveLength(3);
      expect(newTestScriptLines[0]).toBe('  ');
      expect(newTestScriptLines[1]).toBe('    ');
      expect(newTestScriptLines[2]).toBe('');
    });

    it('should handle test script end file with comments', () => {
      const testScriptLines = ['  });'];
      const index = 0;
      const config = createMockConfig();
      const handler = new LastLineHandler(testScriptLines, index, config);

      const testScriptEndLines = ['  });', '  // Closing brace for test', '}'];
      mockReadFileLines(testScriptEndLines);

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

      expect(newTestScriptLines).toHaveLength(3);
      expect(newTestScriptLines).toContain('  });');
      expect(newTestScriptLines).toContain('  // Closing brace for test');
      expect(newTestScriptLines).toContain('}');
    });

    it('should not modify existing lines in newTestScriptLines', () => {
      const testScriptLines = ['  });'];
      const index = 0;
      const config = createMockConfig();
      const handler = new LastLineHandler(testScriptLines, index, config);

      const testScriptEndLines = ['}'];
      mockReadFileLines(testScriptEndLines);

      const newTestScriptLines: string[] = [
        '// Existing line 1',
        '// Existing line 2',
      ];
      handler.execute(
        newTestScriptLines,
        '/path/to/source.ts',
        '/path/to/dest.ts',
        '/path/to/data.json',
        new Map(),
        new Map(),
        new Map(),
      );

      // Should append to existing lines
      expect(newTestScriptLines.length).toBeGreaterThan(2);
      expect(newTestScriptLines[0]).toBe('// Existing line 1');
      expect(newTestScriptLines[1]).toBe('// Existing line 2');
      expect(newTestScriptLines[newTestScriptLines.length - 1]).toBe('}');
    });

    it('should work with different index values', () => {
      const testScriptLines = ['line1', 'line2', 'line3'];
      const index = 2; // Last line
      const config = createMockConfig();
      const handler = new LastLineHandler(testScriptLines, index, config);

      const testScriptEndLines = ['  });', '}'];
      mockReadFileLines(testScriptEndLines);

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

      // Should still add test script end lines regardless of index
      expect(newTestScriptLines).toHaveLength(2);
      expect(newTestScriptLines).toContain('  });');
      expect(newTestScriptLines).toContain('}');
    });
  });
});
