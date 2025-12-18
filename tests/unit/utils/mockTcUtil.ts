/**
 * Mock implementations for tcUtil functions
 */

import { vi } from 'vitest';
import * as tcUtil from '../../../src/transformer/utils/tcUtil';

/**
 * Mocks all tcUtil functions with their original implementations by default
 * Individual functions can be overridden in tests
 */
export function setupTcUtilMocks(): void {
  vi.spyOn(tcUtil, 'extractSubstring').mockImplementation(
    tcUtil.extractSubstring,
  );
  vi.spyOn(
    tcUtil,
    'getReverseJsonMapToUseForMatchingString',
  ).mockImplementation(tcUtil.getReverseJsonMapToUseForMatchingString);
  vi.spyOn(tcUtil, 'getMatchingMapForGetByText').mockImplementation(
    tcUtil.getMatchingMapForGetByText,
  );
  vi.spyOn(tcUtil, 'removeDateAtTheEnd').mockImplementation(
    tcUtil.removeDateAtTheEnd,
  );
  vi.spyOn(tcUtil, 'populateUniqueValueInMap').mockImplementation(
    tcUtil.populateUniqueValueInMap,
  );
}

/**
 * Restores all tcUtil mocks
 */
export function restoreTcUtilMocks(): void {
  vi.restoreAllMocks();
}
