/**
 * Handles complete test file name placeholder replacement
 * Matches Java: CompleteTestFileNamePatternHandler
 */

import { PatternHandler } from "./PatternHandler";
import { TransformerConfig } from "../../config/configLoader";
import * as path from "path";

export class CompleteFileNameHandler extends PatternHandler {
  private config: TransformerConfig;
  private sourceDir: string;
  private dataSourcePath: string;

  constructor(
    testScriptLines: string[],
    index: number,
    config: TransformerConfig,
    sourceDir: string,
    dataSourcePath: string
  ) {
    super(testScriptLines, index);
    this.config = config;
    this.sourceDir = sourceDir;
    this.dataSourcePath = dataSourcePath;
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
    let tsLine = this.testScriptLines[this.index];

    // Extract tcName from source path
    let tcName = sourcePath.replace(/\\/g, "/").replace(this.sourceDir + "/", "");
    tcName = tcName.substring(0, tcName.indexOf("."));

    // Replace placeholders
    // DATA_SOURCE_PATH_PLACEHOLDER is already in the import line, replace it with actual path
    if (tsLine.includes(this.config.DATA_SOURCE_PATH_PLACEHOLDER)) {
      tsLine = tsLine.replace(
        this.config.DATA_SOURCE_PATH_PLACEHOLDER,
        this.dataSourcePath || ""
      );
    }
    tsLine = tsLine.replace(this.config.COMPLETE_TEST_FILE_NAME, tcName);

    newTestScriptLines.push(tsLine);
  }
}
