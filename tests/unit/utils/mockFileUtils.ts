/**
 * Mock implementations for file utilities
 */

import { vi } from 'vitest';
import * as fileUtils from '../../../src/utils/fileUtils';

/**
 * Creates a mock for readFileLines that returns the provided content
 */
export function mockReadFileLines(content: string[]): void {
  vi.spyOn(fileUtils, 'readFileLines').mockReturnValue(content);
}

/**
 * Restores the original readFileLines implementation
 */
export function restoreReadFileLines(): void {
  vi.restoreAllMocks();
}
