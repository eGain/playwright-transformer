/**
 * Pattern processor
 * Routes lines to appropriate handlers based on content
 * Matches Java: PatternProcessor
 */

import { PatternHandler } from './handlers/PatternHandler';
import { TransformerConfig } from '../config/configLoader';

// Import handlers
import { FillPatternHandler } from './handlers/FillPatternHandler';
import { DefaultPatternHandler } from './handlers/DefaultPatternHandler';
import { TestCaseStartHandler } from './handlers/TestCaseStartHandler';
import { LastLineHandler } from './handlers/LastLineHandler';
import { CompleteFileNameHandler } from './handlers/CompleteFileNameHandler';

const commentedLine = '//';

/**
 * Chain a handler to the current handler
 */
function chainPattern(
  currentHandler: PatternHandler | null,
  newHandler: PatternHandler,
): PatternHandler {
  if (currentHandler === null) {
    return newHandler;
  } else {
    currentHandler.chainPattern(newHandler);
    return currentHandler;
  }
}

/**
 * Get appropriate handler(s) for a line
 * Matches Java: PatternProcessor.getPattern()
 */
export function getPattern(
  testScriptLines: string[],
  index: number,
  config: TransformerConfig,
  sourceDir?: string,
  dataSourcePath?: string,
  sourcePath?: string,
): PatternHandler {
  const tsLine = testScriptLines[index].trim();
  let handler: PatternHandler | null = null;

  // Check for test start
  if (tsLine.indexOf(config.TEST_START) === 0) {
    return new TestCaseStartHandler(testScriptLines, index, config);
  }

  // Check for commented line
  // Commented lines are handled by DefaultPatternHandler which is always chained at the end.
  // The DefaultPatternHandler will add comments as-is without transformation.
  // This allows comments to pass through the chain and be preserved in the output.
  if (tsLine.indexOf(commentedLine) === 0) {
    // Continue to chain handlers - DefaultPatternHandler will handle the comment
  }

  // Check for complete test file name placeholder
  if (tsLine.includes(config.COMPLETE_TEST_FILE_NAME)) {
    return new CompleteFileNameHandler(
      testScriptLines,
      index,
      config,
      sourceDir || '',
      dataSourcePath || '',
    );
  }

  // Check for fill patterns
  if (
    tsLine.includes(config.FILL_PATTERN_STR) ||
    tsLine.includes(config.SET_INPUT_FILES_STR) ||
    tsLine.includes(config.SET_MULTIPLE_INPUT_FILES_STR) ||
    tsLine.includes(config.SELECT_OPTION_STR) ||
    tsLine.includes(config.PRESS_SEQUENTIALLY_STR) ||
    tsLine.includes(config.SEND_MAIL_STR) ||
    tsLine.includes(config.GET_BY_TEST_ID_STR) ||
    tsLine.includes(config.COPY_PASTE_IN_CONTENT_SOURCE_PATTERN)
  ) {
    handler = chainPattern(
      handler,
      new FillPatternHandler(testScriptLines, index, config, sourcePath),
    );
  }

  // Check if last line
  if (index + 1 === testScriptLines.length) {
    handler = chainPattern(
      handler,
      new LastLineHandler(testScriptLines, index, config),
    );
  }

  // Always end with DefaultPatternHandler
  handler = chainPattern(
    handler,
    new DefaultPatternHandler(testScriptLines, index, config),
  );

  return handler!;
}

/**
 * Process patterns in a line
 * Matches Java: PatternProcessor.processPatternsInLine()
 */
export function processPatternsInLine(
  testScriptLines: string[],
  index: number,
  newTestScriptLines: string[],
  sourcePath: string,
  destPath: string,
  jsonDataPath: string,
  jsonMap: Map<string, string>,
  reverseJsonMap: Map<string, string>,
  dynamicIdsMap: Map<string, string>,
  config: TransformerConfig,
  sourceDir?: string,
  dataSourcePath?: string,
): void {
  const handler = getPattern(
    testScriptLines,
    index,
    config,
    sourceDir,
    dataSourcePath,
    sourcePath,
  );
  handler.execute(
    newTestScriptLines,
    sourcePath,
    destPath,
    jsonDataPath,
    jsonMap,
    reverseJsonMap,
    dynamicIdsMap,
  );
}
