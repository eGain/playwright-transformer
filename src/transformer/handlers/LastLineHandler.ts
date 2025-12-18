/**
 * Handles last line - adds test ending
 * Matches Java: LastLinePatternHandler
 */

import { PatternHandler } from "./PatternHandler";
import { TransformerConfig } from "../../config/configLoader";
import { readFileLines } from "../../utils/fileUtils";

export class LastLineHandler extends PatternHandler {
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
    // Last line - add the closing lines
    const testScriptEndLines = readFileLines(
      this.config.TEST_SCRIPT_END_FILE_PATH
    );
    newTestScriptLines.push(...testScriptEndLines);
  }
}
