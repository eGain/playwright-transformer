/**
 * Handles fill patterns - extracts values from .fill(), .selectOption(), etc.
 * Matches Java: FillPatternHandler
 */

import { PatternHandler } from "./PatternHandler";
import { TransformerConfig } from "../../config/configLoader";
import {
  putInMapWithUniqueKeys,
  getStringForJson,
  getFilenameFromPath,
  putAndSortInReversemap,
  getNameFromFramesetForJson,
  convertStringToMap,
} from "../utils/tcUtil";
import { Logger } from "../../utils/logger";

const DATA_FILE_VARIABLE_PREPENDER = "data.";
const UNIQUE_INDEX_APPEND_STRING = " + uniqueIndex";
const EMPTY_LINE = " ";

export class FillPatternHandler extends PatternHandler {
  // Counter appended to the filePath variable in the test script to make it unique.
  static uploadCounter = 0;
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
    let transformedLine: string | null = null;
    let matchFound = false;
    let continueExecutionChain = true;

    // Step 10: Loop through ALL patterns from fill_patterns.json
    for (const fpdo of this.config.FILL_PATTERNS_DO_LIST) {
      const keysToBeTreatedAsConstants = fpdo.keysToBeTreatedAsConstants
        ? fpdo.keysToBeTreatedAsConstants.split(",")
        : [];
      const nonUniqueKeys = fpdo.nonUniqueKeys
        ? fpdo.nonUniqueKeys.split(",")
        : [];
      const fixedKeyValue = fpdo.keyToUse || "";

      // Compile regex with DOTALL flag (equivalent to Pattern.DOTALL in Java)
      const regex = new RegExp(fpdo.regex, "s");
      const match = this.tsLine.match(regex);

      if (match) {
        matchFound = true;
        let fillPatternKey: string;
        if (fixedKeyValue !== "") {
          fillPatternKey = fixedKeyValue;
        } else {
          const groupNoForKey = parseInt(String(fpdo.groupNoForKey), 10);
          fillPatternKey = match[groupNoForKey] || "";
        }

        Logger.log(`fillPatternKey:: ${fillPatternKey}`);

        const groupNoForValue = parseInt(String(fpdo.groupNoForValue), 10);
        let fillValue = match[groupNoForValue] || "";
        Logger.log(`fillValue:: ${fillValue}`);

        if (keysToBeTreatedAsConstants.includes(fillPatternKey)) {
          // Treat as constant - don't transform
          transformedLine = this.testScriptLines[this.index];
        } else if (dynamicIdsMap.has(fillValue)) {
          // Use dynamic ID if exists
          transformedLine = this.testScriptLines[this.index].replace(
            `'${fillValue}'`,
            dynamicIdsMap.get(fillValue) || ""
          );
        } else {
          // Extract and externalize value
          const isKeyFrameset =
            fpdo.isKeyFrameset === true ||
            String(fpdo.isKeyFrameset) === "true";
          const externalizedKey = isKeyFrameset
            ? getNameFromFramesetForJson(fillPatternKey, this.config)
            : getStringForJson(fillPatternKey);
          Logger.log(`externalizedKey:: ${externalizedKey}`);

          const ignorePathInValue =
            fpdo.ignorePathInValue === true ||
            String(fpdo.ignorePathInValue) === "true";
          if (ignorePathInValue) {
            fillValue = getFilenameFromPath(fillValue);
          }

          // Add to jsonMap with unique keys
          const finalKey = putInMapWithUniqueKeys(
            jsonMap,
            externalizedKey,
            fillValue
          );

          const isUniquenessNeededForIdentifier =
            !nonUniqueKeys.includes(fillPatternKey);
          let uniqueIndexStr = isUniquenessNeededForIdentifier
            ? UNIQUE_INDEX_APPEND_STRING
            : "";

          const isDelay =
            fpdo.isDelay === true || String(fpdo.isDelay) === "true";
          const delay = isDelay ? ", { delay: 100 }" : "";

          let line: string | null = null;

          // Handle file upload
          const isFileUpload =
            fpdo.isFileUpload === true || String(fpdo.isFileUpload) === "true";
          if (isFileUpload) {
            FillPatternHandler.uploadCounter++;

            let line2: string | null = null;
            const isMultipleFileUpload =
              fpdo.isMultipleFileUpload === true ||
              String(fpdo.isMultipleFileUpload) === "true";

            if (isMultipleFileUpload) {
              line =
                this.config.FILE_UPLOAD_SET_MULTIPLEFILE_PATTERN_STR_1.replace(
                  this.config.FILE_UPLOAD_EXTERNALIZED_DATA,
                  DATA_FILE_VARIABLE_PREPENDER + finalKey
                );
              line = line.replace(
                "filePath",
                "filePath" + "_" + FillPatternHandler.uploadCounter
              );
              newTestScriptLines.push(line);

              line2 =
                this.config.FILE_UPLOAD_SET_MULTIPLEFILE_PATTERN_STR_2.replace(
                  "filePath",
                  "filePath" + "_" + FillPatternHandler.uploadCounter
                );
            } else {
              line = this.config.FILE_UPLOAD_SET_FILE_PATTERN_STR_1.replace(
                this.config.FILE_UPLOAD_EXTERNALIZED_DATA,
                DATA_FILE_VARIABLE_PREPENDER + finalKey
              );
              line = line.replace(
                "filePath",
                "filePath" + "_" + FillPatternHandler.uploadCounter
              );
              newTestScriptLines.push(line);

              line2 = this.config.FILE_UPLOAD_SET_FILE_PATTERN_STR_2.replace(
                "filePath",
                "filePath" + "_" + FillPatternHandler.uploadCounter
              );
            }

            // Handle locator if provided
            if (
              fpdo.keysForLocatorInFileUpload &&
              fpdo.keysForLocatorInFileUpload.trim() !== ""
            ) {
              const locatorMap = convertStringToMap(
                fpdo.keysForLocatorInFileUpload
              );
              for (const [locatorKey, locatorValue] of locatorMap.entries()) {
                if (this.tsLine.includes(locatorKey)) {
                  line2 = line2.replace(
                    "page.",
                    `page.getByTestId('${locatorValue}').`
                  );
                  break;
                }
              }
            }

            newTestScriptLines.push(line2);
            uniqueIndexStr = "";
            continueExecutionChain = false;
            transformedLine = ""; // File upload handled, line is already added
          } else if (
            (fpdo.isContentFrameHandlingNeeded === true ||
              String(fpdo.isContentFrameHandlingNeeded) === "true") &&
            this.testScriptLines[this.index].includes(
              this.config.CONTENTFRAME_STR
            )
          ) {
            // Handle content frame
            const nextLine =
              this.index + 1 < this.testScriptLines.length
                ? this.testScriptLines[this.index + 1].trim()
                : "";
            if (
              nextLine.toLowerCase() ===
              this.config.COPY_PASTE_IN_CK_EDITOR_PATTERN_START.toLowerCase()
            ) {
              line = EMPTY_LINE;
            } else {
              line = this.testScriptLines[this.index].replace(
                `.fill('${fillValue}')`,
                `.pressSequentially(${DATA_FILE_VARIABLE_PREPENDER}${finalKey}${uniqueIndexStr}, { delay: 100 })`
              );
            }
          } else {
            // Standard fill pattern transformation
            line = this.testScriptLines[this.index].replace(
              `('${fillValue}')`,
              `(${DATA_FILE_VARIABLE_PREPENDER}${finalKey}${uniqueIndexStr}${delay})`
            );
          }

          // Add to reverse map
          putAndSortInReversemap(
            reverseJsonMap,
            fillValue,
            `${DATA_FILE_VARIABLE_PREPENDER}${finalKey}${uniqueIndexStr}`
          );

          if (line !== null) {
            Logger.log(`line:: ${line}`);
            transformedLine = line;
          }
        }
        break; // Pattern matched, exit loop
      }
    }

    if (!matchFound) {
      transformedLine = this.testScriptLines[this.index];
    }

    if (continueExecutionChain) {
      this.continueChain(
        newTestScriptLines,
        sourcePath,
        destPath,
        jsonDataPath,
        jsonMap,
        reverseJsonMap,
        dynamicIdsMap,
        transformedLine || this.testScriptLines[this.index]
      );
    }
  }
}
