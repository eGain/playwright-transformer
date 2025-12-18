/**
 * Default pattern handler - handles text replacement
 * Matches Java: DefaultPatternHandler
 * Step 14: Full implementation with all 161 replacement rules
 */

import { PatternHandler } from "./PatternHandler";
import { TransformerConfig } from "../../config/configLoader";
import {
  extractSubstring,
  getReverseJsonMapToUseForMatchingString,
  getMatchingMapForGetByText,
  removeDateAtTheEnd,
  populateUniqueValueInMap,
} from "../utils/tcUtil";
import { Logger } from "../../utils/logger";
import { readFileLines } from "../../utils/fileUtils";

const COMMENTED_LINE = "//";
const DATA_FILE_VARIABLE_PREPENDER = "data.";
const UNIQUE_INDEX_APPEND_STRING = " + uniqueIndex";
const DYNAMIC_ID = "dynamicId";

export class DefaultPatternHandler extends PatternHandler {
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
    // Process the processed line through text replacement
    this.processChain(
      newTestScriptLines,
      sourcePath,
      destPath,
      jsonDataPath,
      jsonMap,
      reverseJsonMap,
      dynamicIdsMap,
      this.testScriptLines[this.index]
    );
  }

  protected processChain(
    newTestScriptLines: string[],
    sourcePath: string,
    destPath: string,
    jsonDataPath: string,
    jsonMap: Map<string, string>,
    reverseJsonMap: Map<string, string>,
    dynamicIdsMap: Map<string, string>,
    processedLine: string
  ): void {
    let transformedLine = processedLine;
    let processedLineAdded = false;

    Logger.log(`sourceTS:: ${sourcePath} transformedLine:: ${transformedLine}`);

    // Check if line is a comment - if so, add it and return
    if (
      transformedLine !== null &&
      transformedLine.trim().indexOf(COMMENTED_LINE) === 0
    ) {
      newTestScriptLines.push(transformedLine);
      processedLineAdded = true;
    } else {
      // Step 14: Loop through ALL patterns from replace_texts.json
      for (const rpdo of this.config.REPLACE_TEXT_DO_LIST) {
        const keysToBeTreatedAsNewPageLaunchers =
          rpdo.keysAsNewPageLaunchers && rpdo.keysAsNewPageLaunchers.trim() !== ""
            ? rpdo.keysAsNewPageLaunchers.split(",")
            : [];
        const keysWithContainTextOrToHaveValueAsDynamicIds =
          rpdo.keysWithContainTextOrToHaveValueAsDynamicIds &&
          rpdo.keysWithContainTextOrToHaveValueAsDynamicIds.trim() !== ""
            ? rpdo.keysWithContainTextOrToHaveValueAsDynamicIds.split(",")
            : [];
        const keysToBeTreatedAsConstants =
          rpdo.keysToBeTreatedAsConstants && rpdo.keysToBeTreatedAsConstants.trim() !== ""
            ? rpdo.keysToBeTreatedAsConstants.split(",")
            : [];
        const textForNonUniqueness =
          rpdo.matchTextForNonUniqueness && rpdo.matchTextForNonUniqueness.trim() !== ""
            ? rpdo.matchTextForNonUniqueness.split(",")
            : [];
        const valuesToBeIgnored =
          rpdo.valuesToBeIgnored && rpdo.valuesToBeIgnored.trim() !== ""
            ? rpdo.valuesToBeIgnored.split(",")
            : [];
        let keyIsAConstant = false;

        // Remove date at the end if needed
        const shouldRemoveDate =
          rpdo.removeDateAtTheEnd === true ||
          String(rpdo.removeDateAtTheEnd) === "true";
        if (shouldRemoveDate) {
          transformedLine = removeDateAtTheEnd(transformedLine, this.config);
        }

        // Handle regex in replace_texts.json
        let matchingText: string | null = "";
        let dataPrependedByWithoutRegex = "";
        const isRegex =
          rpdo.isRegex === true || String(rpdo.isRegex) === "true";

        if (isRegex && rpdo.dataPrependedBy) {
          // Extract the regex pattern from the dataPrependedBy
          const regexPattern = new RegExp(rpdo.dataPrependedBy);
          const regexMatch = transformedLine.match(regexPattern);

          if (regexMatch && regexMatch[1]) {
            // Extract the text from the transformedLine
            const resolvedPrependedBy = regexMatch[1];
            matchingText = extractSubstring(
              transformedLine,
              resolvedPrependedBy,
              rpdo.dataAppendedBy || ""
            );

            // Replace the prependedBy with the resolvedPrependedBy
            dataPrependedByWithoutRegex = resolvedPrependedBy;

            Logger.log(`resolvedPrependedBy:: ${dataPrependedByWithoutRegex}`);
          }
        }

        if (!matchingText || matchingText === "") {
          matchingText = extractSubstring(
            transformedLine,
            rpdo.dataPrependedBy || "",
            rpdo.dataAppendedBy || ""
          );
        }

        Logger.log(`matchingText:: ${matchingText}`);

        // Process dynamic IDs before others
        if (keysWithContainTextOrToHaveValueAsDynamicIds.length > 0) {
          for (const dynamicIdKeys of keysWithContainTextOrToHaveValueAsDynamicIds) {
            if (
              matchingText &&
              matchingText.startsWith(dynamicIdKeys) &&
              (transformedLine.includes(this.config.TO_CONTAIN_TEXT_STR) ||
                transformedLine.includes(this.config.TO_HAVE_VALUE_STR))
            ) {
              const isToContainText = transformedLine.includes(
                this.config.TO_CONTAIN_TEXT_STR
              );
              const dynamicIdMatchingPatternString = isToContainText
                ? this.config.TO_CONTAIN_TEXT_STR
                : this.config.TO_HAVE_VALUE_STR;
              const replacementTextForMatchingPattern = isToContainText
                ? ".textContent()"
                : ".getAttribute('data-value')";

              Logger.log(`dynamicIdKeys:: ${dynamicIdKeys} matchingText:: ${matchingText}`);
              Logger.log(
                `line:: ${transformedLine} Num keysWithContainTextOrToHaveValueAsDynamicIds:: ${keysWithContainTextOrToHaveValueAsDynamicIds.length}`
              );

              // Get the text within containText
              const containTextValue = extractSubstring(
                transformedLine,
                dynamicIdMatchingPatternString,
                rpdo.dataAppendedBy || ""
              );

              const dynamicId = populateUniqueValueInMap(
                dynamicIdsMap,
                containTextValue || "",
                DYNAMIC_ID
              );

              transformedLine =
                `const ${dynamicId} = ` +
                transformedLine.replace(
                  dynamicIdMatchingPatternString + (containTextValue || "") + "')",
                  replacementTextForMatchingPattern
                );

              // TODO: Hack - revisit this and clean it up.
              if (transformedLine.includes(this.config.EXPECT_TEXT_WITH_PARAM_STR)) {
                transformedLine = transformedLine
                  .replace(this.config.EXPECT_TEXT_WITH_PARAM_STR, " ")
                  .replace(
                    `))${replacementTextForMatchingPattern}`,
                    `)${replacementTextForMatchingPattern}`
                  );
              }

              Logger.log(`transformedLine:: ${transformedLine}`);
              break;
            }
          }
        }

        // Check if key is a constant
        if (keysToBeTreatedAsConstants.length > 0) {
          for (const constantKey of keysToBeTreatedAsConstants) {
            if (
              matchingText &&
              matchingText.toLowerCase() === constantKey.toLowerCase()
            ) {
              keyIsAConstant = true;
              break;
            }
          }
        }

        if (keyIsAConstant) {
          // No change needed as the key is a constant.
          Logger.log(
            `Not changing the string as the key is a constant. Pattern:${
              rpdo.dataPrependedBy
            }${matchingText}${rpdo.dataAppendedBy}`
          );
          Logger.log(`Constant line:: ${transformedLine}`);
        } else if (
          (rpdo.replaceWithDynamicIds === true ||
            String(rpdo.replaceWithDynamicIds) === "true") &&
          matchingText &&
          dynamicIdsMap.has(matchingText)
        ) {
          // Dynamic IDs will always be whole word matches
          transformedLine = getMatchingMapForGetByText(
            dynamicIdsMap,
            transformedLine,
            rpdo.dataPrependedBy || "",
            rpdo.dataAppendedBy || "",
            matchingText,
            rpdo.preferredFieldForMatchingText,
            jsonMap,
            rpdo.matchTextToUsePreferredField
          );
        } else if (
          rpdo.isWholeWordMatch === true ||
          String(rpdo.isWholeWordMatch) === "true"
        ) {
          transformedLine = getMatchingMapForGetByText(
            reverseJsonMap,
            transformedLine,
            rpdo.dataPrependedBy || "",
            rpdo.dataAppendedBy || "",
            matchingText || "",
            rpdo.preferredFieldForMatchingText,
            jsonMap,
            rpdo.matchTextToUsePreferredField
          );
        } else {
          // Handle multiple or single occurrences
          if (matchingText) {
            transformedLine = this.processStandardReplacement(
              transformedLine,
              rpdo,
              matchingText,
              dataPrependedByWithoutRegex,
              reverseJsonMap,
              jsonMap,
              processedLine,
              textForNonUniqueness,
              valuesToBeIgnored
            );
          }
        }

        Logger.log(
          `Keys to be treated as new page launchers:: ${keysToBeTreatedAsNewPageLaunchers} and matchingText:: ${matchingText}`
        );

        if (
          keysToBeTreatedAsNewPageLaunchers.includes(matchingText || "") &&
          transformedLine.endsWith(this.config.CLICK_METHOD_STR) &&
          this.config.OPEN_PORTAL_SCRIPT_FILE
        ) {
          const openPortalLines = readFileLines(
            this.config.OPEN_PORTAL_SCRIPT_FILE
          );
          newTestScriptLines.push(transformedLine);
          newTestScriptLines.push(...openPortalLines);
          processedLineAdded = true;
          break;
        }
      }
    }

    if (!processedLineAdded) {
      newTestScriptLines.push(transformedLine);
    }
  }

  /**
   * Process standard replacement (not whole word match)
   * Handles both single and multiple occurrences
   */
  private processStandardReplacement(
    transformedLine: string,
    rpdo: any,
    matchingText: string,
    dataPrependedByWithoutRegex: string,
    reverseJsonMap: Map<string, string>,
    jsonMap: Map<string, string>,
    processedLine: string,
    textForNonUniqueness: string[],
    valuesToBeIgnored: string[]
  ): string {
    const firstIndex = transformedLine.indexOf(rpdo.dataPrependedBy || "");
    const lastIndex = transformedLine.lastIndexOf(rpdo.dataPrependedBy || "");

    // Build regex pattern for matching
    let dataPrependedBy = dataPrependedByWithoutRegex || rpdo.dataPrependedBy || "";
    let dataAppendedBy = rpdo.dataAppendedBy || "";

    if (dataPrependedByWithoutRegex) {
      dataPrependedBy = dataPrependedByWithoutRegex.replace(/\(/g, "\\(");
      dataAppendedBy = dataAppendedBy.replace(/\)/g, "\\)");
      Logger.log(
        `Pattern when regex:: ${dataPrependedBy}([^\\\\']+)${dataAppendedBy.replace(/\)/g, "\\)")}`
      );
    } else {
      dataPrependedBy = dataPrependedBy.replace(/\(/g, "\\(").replace(/\{/g, "\\{");
      dataAppendedBy = dataAppendedBy.replace(/\)/g, "\\)");
      Logger.log(`Pattern:: ${dataPrependedBy}([^\\\\']+)${dataAppendedBy.replace(/\)/g, "\\)")}`);
    }

    const pattern = new RegExp(dataPrependedBy + "([^\\\\']+)" + dataAppendedBy);
    const matches = transformedLine.match(pattern);

    Logger.log(`transformedLine:: ${transformedLine}`);

    // Handle multiple occurrences
    if (firstIndex !== lastIndex && matches) {
      let matchCount = 0;
      let line = transformedLine;
      let lastMatchPos = 0;

      while (matchCount < 3 && (lastMatchPos = line.indexOf(rpdo.dataPrependedBy || "", lastMatchPos)) !== -1) {
        const matchResult = line.substring(lastMatchPos).match(pattern);
        if (!matchResult) break;

        const currentMatchingText = matchResult[1];
        line = this.replaceMatchingText(
          line,
          rpdo,
          currentMatchingText,
          dataPrependedByWithoutRegex,
          reverseJsonMap,
          jsonMap,
          processedLine,
          textForNonUniqueness,
          valuesToBeIgnored
        );

        lastMatchPos = lastMatchPos + 1;
        matchCount++;
      }
      return line;
    } else {
      // Single occurrence
      return this.replaceMatchingText(
        transformedLine,
        rpdo,
        matchingText,
        dataPrependedByWithoutRegex,
        reverseJsonMap,
        jsonMap,
        processedLine,
        textForNonUniqueness,
        valuesToBeIgnored
      );
    }
  }

  /**
   * Replace matching text with data reference
   */
  private replaceMatchingText(
    transformedLine: string,
    rpdo: any,
    matchingText: string,
    dataPrependedByWithoutRegex: string,
    reverseJsonMap: Map<string, string>,
    jsonMap: Map<string, string>,
    processedLine: string,
    textForNonUniqueness: string[],
    valuesToBeIgnored: string[]
  ): string {
    const reverseJsonMapTemp = getReverseJsonMapToUseForMatchingString(
      reverseJsonMap,
      matchingText
    );

    let replaceText = matchingText;
    let matchFound = false;
    let startsWith = false;
    let endsWith = false;

    for (const [value, dataRef] of reverseJsonMapTemp.entries()) {
      let valueFromMap = dataRef;
      const preferredKey = rpdo.preferredFieldForMatchingText;

      // Handle preferred field
      if (preferredKey && preferredKey.trim() !== "") {
        const preferredKeyValue = jsonMap.get(preferredKey);
        if (
          value === preferredKeyValue &&
          (!rpdo.matchTextToUsePreferredField ||
            rpdo.matchTextToUsePreferredField.trim() === "" ||
            processedLine.includes(rpdo.matchTextToUsePreferredField))
        ) {
          valueFromMap = DATA_FILE_VARIABLE_PREPENDER + preferredKey;
        }
      }

      // Handle non-uniqueness
      if (
        rpdo.matchTextForNonUniqueness &&
        rpdo.matchTextForNonUniqueness.trim() !== ""
      ) {
        let addUniqueness = true;
        for (const nonUnqText of textForNonUniqueness) {
          if (transformedLine.includes(nonUnqText)) {
            addUniqueness = false;
            break;
          }
        }

        if (!addUniqueness) {
          Logger.log(`valueFromMap before removing uniqueness:: ${valueFromMap}`);
          valueFromMap = valueFromMap.replace(UNIQUE_INDEX_APPEND_STRING, "");
          Logger.log(`valueFromMap after removing uniqueness:: ${valueFromMap}`);
        }
      }

      // Skip ignored values
      if (valuesToBeIgnored.includes(value)) {
        Logger.log(`Ignored value:: ${value}`);
        continue;
      }

      // Handle replacement based on position
      if (replaceText.startsWith(value)) {
        replaceText = valueFromMap + " + '" + replaceText.substring(value.length);
        matchFound = true;
        startsWith = true;
      } else if (replaceText.endsWith(value)) {
        replaceText =
          replaceText.substring(0, replaceText.lastIndexOf(value)) +
          "' + " +
          valueFromMap;
        matchFound = true;
        endsWith = true;
      } else if (replaceText.includes(value)) {
        const lastIndex = replaceText.lastIndexOf(value);
        replaceText =
          replaceText.substring(0, lastIndex) +
          "' + " +
          valueFromMap +
          " + '" +
          replaceText.substring(lastIndex + value.length);
        matchFound = true;
      }
    }

    if (matchFound) {
      replaceText = startsWith ? "'+ " + replaceText : replaceText;
      replaceText = endsWith ? replaceText + " +'" : replaceText;

      const originalPattern = dataPrependedByWithoutRegex
        ? dataPrependedByWithoutRegex + matchingText + (rpdo.dataAppendedBy || "")
        : (rpdo.dataPrependedBy || "") + matchingText + (rpdo.dataAppendedBy || "");

      Logger.log(`Original:: ${originalPattern}`);
      Logger.log(`Replacement:: ${(dataPrependedByWithoutRegex || rpdo.dataPrependedBy || "")}${replaceText}${rpdo.dataAppendedBy || ""}`);

      let line = transformedLine.replace(
        originalPattern,
        (dataPrependedByWithoutRegex || rpdo.dataPrependedBy || "") +
          replaceText +
          (rpdo.dataAppendedBy || "")
      );

      // Clean up empty quotes (negative lookbehind not supported in JS, use simpler pattern)
      line = line.replace(/''(\s)*\+/g, "").replace(/\+(\s)*''/g, "");
      
      // Remove trailing commas that might be incorrectly added after method calls
      // Pattern: closing paren followed by comma and then another closing paren or semicolon
      // e.g., getByTestId('...'),) or getByTestId('...'),;
      // Also handle cases like ),) or ),;
      line = line.replace(/(\))\s*,\s*(\))/g, "$1$2"); // Remove comma between two closing parens
      line = line.replace(/(\))\s*,\s*(;)/g, "$1$2"); // Remove comma before semicolon
      line = line.replace(/(\))\s*,\s*(\s*\))/g, "$1$2"); // Remove comma with whitespace
      
      Logger.log(`line:: ${line}`);

      return line;
    }

    return transformedLine;
  }
}
