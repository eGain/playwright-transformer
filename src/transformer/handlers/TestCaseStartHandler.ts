/**
 * Handles test start pattern - wraps test with for loop
 * Matches Java: TestCaseStartPatternHandler
 */

import { PatternHandler } from "./PatternHandler";
import { TransformerConfig } from "../../config/configLoader";
import { readFileLines } from "../../utils/fileUtils";
import { Logger } from "../../utils/logger";
import * as path from "path";

export class TestCaseStartHandler extends PatternHandler {
  private config: TransformerConfig;

  constructor(
    testScriptLines: string[],
    index: number,
    config: TransformerConfig
  ) {
    super(testScriptLines, index);
    this.config = config;
  }

  protected processLine(
    newTestScriptLines: string[],
    sourcePath: string,
    destPath: string,
    jsonDataPath: string,
    jsonMap: Map<string, string>,
    reverseJsonMap: Map<string, string>,
    dynamicIdsMap: Map<string, string>
  ): void {
    const tsLine = this.testScriptLines[this.index];
    const testStartLines = readFileLines(this.config.TEST_START_TS_PATH);

    for (const testStartLine of testStartLines) {
      Logger.log(`testStartLine:: ${testStartLine}`);

      if (testStartLine.includes(this.config.TEST_CASE_NAME_MATCHER)) {
        // Extract test case name from tsLine and replace placeholder
        const match = tsLine.match(this.config.TEST_CASE_NAME_PATTERN);
        if (match && match[1]) {
          const replaceText = match[1];
          Logger.log(`replaceText:: ${replaceText}`);
          const modifiedLine = testStartLine.replace(
            this.config.TEST_CASE_NAME_MATCHER,
            `${replaceText} \${data['tcName']}`
          );
          Logger.log(`testStartLine:: ${modifiedLine}`);
          newTestScriptLines.push(modifiedLine);
        } else {
          newTestScriptLines.push(testStartLine);
        }
      } else if (testStartLine.trim() === this.config.S3_UTILS_INIT) {
        // Add S3 utils init line
        newTestScriptLines.push(testStartLine);

        // Check pre-processor patterns for additional lines
        for (const ppdo of this.config.PRE_PROCESSOR_PATTERNS_DO_LIST) {
          const testScriptName = ppdo.testScriptName || "";
          const linesToBeInserted = ppdo.linesToBeInserted || "";
          const separator = ppdo.separator || ",";

          if (
            testScriptName &&
            linesToBeInserted &&
            linesToBeInserted.trim() !== ""
          ) {
            const linesToBeInsertedList = linesToBeInserted.split(separator);
            const fileName = path.basename(sourcePath);

            Logger.log(`PreProcessing file name:: ${fileName}`);

            if (
              fileName.toLowerCase() === testScriptName.toLowerCase() &&
              linesToBeInsertedList.length > 0
            ) {
              newTestScriptLines.push(...linesToBeInsertedList);
            }
          }
        }
      } else {
        newTestScriptLines.push(testStartLine);
      }
    }
  }
}
