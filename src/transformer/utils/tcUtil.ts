/**
 * TCUtil - Helper functions
 * Matches Java: TCUtil
 */

//import { InsertLinesDataObject, SkipPatternDataObject } from "../../types";
import { TransformerConfig } from '../../config/configLoader';
import { Logger } from '../../utils/logger';
//import { readFileLines } from "../../utils/fileUtils";

// Constants matching Java TransformerConstants
const EG_ID_PLACEHOLDER = '__%EG_ID%__';
const EG_ID_VARIABLE_DECLARATION_STR = 'const ';
const GET_BY_TEST_ID_IN_INSERTED_LINE_STR = '__GET_BY_TEST_ID__';
const GET_BY_TEST_ID_IN_INSERTED_LINE_PATTERN = /.*getByTestId\('(.*?)'\).*/;

/**
 * Parse comma-separated integer string to integer array
 */
function getIntegerListFromString(input: string | undefined): number[] {
  if (!input || input.trim() === '') {
    return [];
  }
  return input.split(',').map((s) => parseInt(s.trim(), 10));
}

/**
 * Get line to be inserted, handling GET_BY_TEST_ID_IN_INSERTED_LINE_STR patterns
 */
function getLineToBeInserted(
  lineToBeInserted: string,
  existingLines: string[],
  //config: TransformerConfig
): string {
  let modifiedLineToBeInserted = lineToBeInserted;

  if (modifiedLineToBeInserted.includes(GET_BY_TEST_ID_IN_INSERTED_LINE_STR)) {
    const startIndex =
      lineToBeInserted.indexOf(GET_BY_TEST_ID_IN_INSERTED_LINE_STR) +
      GET_BY_TEST_ID_IN_INSERTED_LINE_STR.length;
    const index = parseInt(
      lineToBeInserted.substring(startIndex, startIndex + 1),
      10,
    );

    if (index >= 0 && index < existingLines.length) {
      const lineToUse = existingLines[index];
      const matcher = lineToUse.match(GET_BY_TEST_ID_IN_INSERTED_LINE_PATTERN);

      if (matcher && matcher[1]) {
        const matchingString = matcher[1];
        const replacementString =
          GET_BY_TEST_ID_IN_INSERTED_LINE_STR + index + '__';
        modifiedLineToBeInserted = lineToBeInserted.replace(
          replacementString,
          matchingString,
        );
      } else {
        Logger.log('Insert line modification:: No match found');
      }
    }
  }

  return modifiedLineToBeInserted;
}

/**
 * Apply insert line patterns from insert_lines.json
 * Matches Java: TCUtil.applyInsertLinePattern()
 */
export function applyInsertLinePattern(
  testScriptLines: string[],
  config: TransformerConfig,
): string[] {
  const newTestScriptLines: string[] = [];
  const j = testScriptLines.length;
  let egId = 0; //variable to increment the variableid whereever EG_ID placeholder is used in the inserted lines

  //iterate through each line in testScriptLines
  for (let i = 0; i < j; i++) {
    const line = testScriptLines[i];
    let isLinesMatch = false;

    //iterate through each item in INSERT_LINES_DO_LIST for each line in testScriptLines
    for (const ildo of config.INSERT_LINES_DO_LIST) {
      // Unescape separator (e.g., "\\|" -> "|")
      let separator =
        ildo.separator === null || ildo.separator === undefined
          ? ','
          : ildo.separator;
      if (separator === '\\|') {
        separator = '|';
      }

      // Get existing lines, linesToBeInserted, removeLines, insertAt from insert_lines.json for each list item in INSERT_LINES_DO_LIST
      const existingLinesList = ildo.existingLines
        ? ildo.existingLines.split(separator)
        : [];
      const linesToBeInsertedList = ildo.linesToBeInserted
        ? ildo.linesToBeInserted.split(separator)
        : [];
      const removeLines = getIntegerListFromString(ildo.removeLines);
      const insertLinesAt = getIntegerListFromString(ildo.insertAt);
      const isRegex = ildo.isRegex === true || String(ildo.isRegex) === 'true';

      //get size of existingLinesList based on separator
      const existingLinesListSize = existingLinesList.length;

      //initialize actualMatchingLinesList to store the lines that match the existingLines pattern
      const actualMatchingLinesList: string[] = [];
      //initialize groupMapping to store the groups from the regex matching
      const groupMapping = new Map<string, string>();

      // Try to match existingLines pattern
      let x = 0;
      //iterate through each step in existingLinesList
      for (x = 0; x < existingLinesListSize; x++) {
        //if number of lines in existingLinesList is greater than number of lines in testScriptLines, break the loop
        if (i + x >= j) {
          break;
        }

        const tsLine = testScriptLines[i + x].trim().toLowerCase();
        const patternLine = existingLinesList[x].toLowerCase();
        actualMatchingLinesList.push(testScriptLines[i + x]);
        let isMatchFound = false;

        if (isRegex) {
          // Regex matching
          const regex = new RegExp(existingLinesList[x]);
          const match = testScriptLines[i + x].trim().match(regex);

          if (match) {
            isMatchFound = true;
            // Extract groups
            for (let matchNo = 1; matchNo < match.length; matchNo++) {
              const key = `__LINE__${x}__GROUP__${matchNo}__`;
              const value = match[matchNo] || '';
              Logger.log(
                `Line insertion regex match processing:: key=${key} value=${value}`,
              );
              groupMapping.set(key, value);
            }
          }
        } else {
          // String contains matching
          isMatchFound = tsLine.includes(patternLine);
        }

        if (!isMatchFound) {
          break;
        }
      }

      isLinesMatch = x === existingLinesListSize;

      if (isLinesMatch) {
        // Pattern matched - process insertion
        let y = 0;
        let insertedLineNo = 0;

        for (y = 0; y < existingLinesListSize; y++) {
          Logger.log(`Line insertion processing :: i=${i} y=${y}`);

          // Insert lines at specified positions
          if (insertLinesAt.includes(y)) {
            let lineBeingInserted: string | null = null;

            if (isRegex) {
              // Handle regex substitution
              lineBeingInserted = linesToBeInsertedList[insertedLineNo] || '';
              for (const [key, value] of groupMapping.entries()) {
                Logger.log(
                  `Regex processing: insertedLineNo=${insertedLineNo} Key()=${key} Value=${value}`,
                );
                Logger.log(
                  `Regex processing: lineBeingInserted=${lineBeingInserted}`,
                );
                lineBeingInserted = lineBeingInserted.replace(key, value);
                Logger.log(
                  `Regex processing: replacedLine=${lineBeingInserted}`,
                );
              }
              linesToBeInsertedList[insertedLineNo] = lineBeingInserted;
              insertedLineNo++;
            } else {
              // Handle string-based insertion
              lineBeingInserted = getLineToBeInserted(
                linesToBeInsertedList[insertedLineNo] || '',
                actualMatchingLinesList,
                //config
              );
              insertedLineNo++;
            }

            // Handle EG_ID placeholder
            if (lineBeingInserted) {
              const isEgIdDeclaration = lineBeingInserted
                .trim()
                .startsWith(EG_ID_VARIABLE_DECLARATION_STR);
              const replacementStr =
                egId === 0 || (egId === 1 && !isEgIdDeclaration)
                  ? ''
                  : String(egId);

              if (
                isEgIdDeclaration &&
                lineBeingInserted.includes(EG_ID_PLACEHOLDER)
              ) {
                egId++;
              }

              lineBeingInserted = lineBeingInserted.replace(
                EG_ID_PLACEHOLDER,
                replacementStr,
              );

              Logger.log(`Line inserted:: ${lineBeingInserted}`);
              Logger.log(
                `EgId:: ${egId} isEgIdDeclaration: ${isEgIdDeclaration}`,
              );
              newTestScriptLines.push(lineBeingInserted);
            }
          }

          // Add original line if not in removeLines
          if (!removeLines.includes(y)) {
            Logger.log(`Retained line :: ${testScriptLines[i + y]}`);
            newTestScriptLines.push(testScriptLines[i + y]);
          } else {
            Logger.log(`Removed line :: ${testScriptLines[i + y]}`);
          }
        }

        // Skip processed lines
        i = i + existingLinesListSize - 1;

        // Insert lines beyond existingLines size if needed
        for (let z = 0; z < insertLinesAt.length; z++) {
          Logger.log(
            `Line insertion processing after loop :: z=${z} insertLinesValue=${insertLinesAt[z]} y=${y} insertedLineNo=${insertedLineNo}`,
          );

          if (y === insertLinesAt[z]) {
            let lineBeingInserted: string | null = null;

            if (isRegex) {
              // Handle regex substitution for lines beyond existingLines
              if (insertedLineNo < linesToBeInsertedList.length) {
                lineBeingInserted = linesToBeInsertedList[insertedLineNo] || '';
                for (const [key, value] of groupMapping.entries()) {
                  lineBeingInserted = lineBeingInserted.replace(key, value);
                }
                insertedLineNo++;
              }
            } else {
              // Handle string-based insertion
              if (insertedLineNo < linesToBeInsertedList.length) {
                lineBeingInserted = getLineToBeInserted(
                  linesToBeInsertedList[insertedLineNo] || '',
                  actualMatchingLinesList,
                  //config
                );
                insertedLineNo++;
              }
            }

            if (lineBeingInserted) {
              // Handle EG_ID placeholder
              const isEgIdDeclaration = lineBeingInserted
                .trim()
                .startsWith(EG_ID_VARIABLE_DECLARATION_STR);
              const replacementStr =
                egId === 0 || (egId === 1 && !isEgIdDeclaration)
                  ? ''
                  : String(egId);

              if (
                isEgIdDeclaration &&
                lineBeingInserted.includes(EG_ID_PLACEHOLDER)
              ) {
                egId++;
              }

              lineBeingInserted = lineBeingInserted.replace(
                EG_ID_PLACEHOLDER,
                replacementStr,
              );

              Logger.log(`Line inserted:: ${lineBeingInserted}`);
              Logger.log(
                `EgId:: ${egId} isEgIdDeclaration: ${isEgIdDeclaration}`,
              );
              newTestScriptLines.push(lineBeingInserted);
            }
            y++;
          }
        }

        isLinesMatch = true;
        break;
      }
    }

    if (!isLinesMatch) {
      newTestScriptLines.push(line);
    }
  }

  return newTestScriptLines;
}

/**
 * Remove last few empty lines
 * Matches Java: TCUtil.removeLastFewEmptyLines()
 */
function removeLastFewEmptyLines(testScriptLines: string[]): string[] {
  const newTestScriptLines: string[] = [];
  const j = testScriptLines.length; // ignore the last line

  for (let i = 0; i < j; i++) {
    const tsLine = testScriptLines[i].trim();
    // Skip the last 5 lines if empty
    if (!(tsLine === '' && i > j - 5)) {
      newTestScriptLines.push(testScriptLines[i]);
    }
  }

  return newTestScriptLines;
}

/**
 * Remove noise lines based on skip patterns
 * Matches Java: TCUtil.removeNoiseLines()
 */
function removeNoiseLines(
  testScriptLines: string[],
  scope: string,
  config: TransformerConfig,
): string[] {
  const newTestScriptLines: string[] = [];
  const j = testScriptLines.length - 1; // ignore the last line

  for (let i = 0; i < j; i++) {
    const tsLine = testScriptLines[i].trim();
    let isSkip = false;

    for (const spdo of config.SKIP_PATTERNS_DO_LIST) {
      const patternScope = spdo.patternScope || 'singleLine';

      if (patternScope === 'doubleLine' && scope === 'doubleLine') {
        if (i + 1 < testScriptLines.length) {
          const tsNextLine = testScriptLines[i + 1].trim();

          if (
            tsLine.includes(spdo.pattern || '') &&
            tsNextLine.includes(spdo.pattern || '')
          ) {
            if (spdo.compareTextBeforePattern) {
              const pattern = spdo.pattern || '';
              const idx1 = tsLine.indexOf(pattern);
              const idx2 = tsNextLine.indexOf(pattern);

              if (idx1 >= 0 && idx2 >= 0) {
                const textBeforePatternCurrentLine = tsLine.substring(0, idx1);
                const textBeforePatternNextLine = tsNextLine.substring(0, idx2);

                if (
                  textBeforePatternCurrentLine.toLowerCase() ===
                  textBeforePatternNextLine.toLowerCase()
                ) {
                  isSkip = true;
                }
              }
            } else {
              isSkip = true;
            }
          }
        }
      }

      if (isSkip) {
        break;
      }
    }

    if (!isSkip) {
      newTestScriptLines.push(testScriptLines[i]);
    } else {
      Logger.log(`Removed line:: ${testScriptLines[i]}`);
    }
  }

  // Add the last line
  if (testScriptLines.length > 0) {
    newTestScriptLines.push(testScriptLines[testScriptLines.length - 1]);
  }

  return newTestScriptLines;
}

/**
 * Remove all noise lines
 * Matches Java: TCUtil.removeAllNoiseLines()
 */
export function removeAllNoiseLines(
  testScriptLines: string[],
  config: TransformerConfig,
): string[] {
  Logger.log(`Removing noise lines. Count: ${testScriptLines.length}`);

  let lines = removeLastFewEmptyLines(testScriptLines);
  let numLines = lines.length;
  lines = removeNoiseLines(lines, 'doubleLine', config);

  let iterCount = 0;
  const maxIter = config.NOISE_LINE_REMOVAL_ITER_COUNT || 10;

  while (iterCount++ < maxIter && lines.length !== numLines) {
    numLines = lines.length;
    lines = removeNoiseLines(lines, 'doubleLine', config);
  }

  Logger.log(
    `Number of iterations to remove double line noise lines: ${iterCount}`,
  );
  Logger.log(`Removed noise lines. Count: ${lines.length}`);

  return lines;
}

/**
 * Put key-value in map with unique keys (appends _1, _2 if duplicates)
 * Matches Java: TCUtil.putInMapWithUniqueKeys()
 */
export function putInMapWithUniqueKeys(
  map: Map<string, string>,
  key: string,
  value: string,
): string {
  let i = 0;
  const origKey = key;

  while (true) {
    if (!map.has(key)) {
      map.set(key, value);
      Logger.log(`Writing to json:: key: ${key} value: ${value}`);
      return key;
    }
    key = origKey + '_' + ++i;
  }
}

/**
 * Convert string to JSON-safe key format
 * Matches Java: TCUtil.getStringForJson()
 */
export function getStringForJson(input: string): string {
  // Split the string based on "-"
  const parts = input.split('-');
  let output = '';

  // Check if there are at least 3 parts
  if (parts.length < 3) {
    output = input
      .replace(/\\/g, '')
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/__/g, '_');
  } else {
    // Create the last three values - keep first as-is, capitalize first letter of 2nd and 3rd
    const lastThreeParts = parts.slice(-3);
    let lastThree = lastThreeParts[0];
    for (let i = 1; i < 3; i++) {
      const part = lastThreeParts[i];
      if (part.length > 0) {
        lastThree += part.substring(0, 1).toUpperCase() + part.substring(1);
      }
    }
    output = lastThree
      .replace(/\\/g, '')
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/__/g, '_');
  }

  if (output.endsWith('_')) {
    output = output.substring(0, output.length - 1);
  }

  return output;
}

/**
 * Get filename from path
 * Matches Java: TCUtil.getFilenameFromPath()
 */
export function getFilenameFromPath(fillValue: string): string {
  let lastSlash = fillValue.lastIndexOf('/');
  if (lastSlash !== -1) {
    fillValue = fillValue.substring(lastSlash + 1);
  }
  lastSlash = fillValue.lastIndexOf('\\');
  if (lastSlash !== -1) {
    fillValue = fillValue.substring(lastSlash + 1);
  }
  return fillValue;
}

/**
 * Put and sort in reverse map (sorted by key length, descending)
 * Matches Java: TCUtil.putAndSortInReversemap()
 */
export function putAndSortInReversemap(
  inputMap: Map<string, string>,
  key: string,
  value: string,
): void {
  if (!inputMap.has(key)) {
    inputMap.set(key, value);
  }

  // Sort by key length (descending) and rebuild map
  const sortedEntries = Array.from(inputMap.entries()).sort(
    (a, b) => b[0].length - a[0].length,
  );

  inputMap.clear();
  for (const [k, v] of sortedEntries) {
    inputMap.set(k, v);
  }
}

/**
 * Get name from frameset for JSON
 * Matches Java: TCUtil.getNameFromFramesetForJson()
 */
export function getNameFromFramesetForJson(
  input: string,
  config: TransformerConfig,
): string {
  let output = '';
  const match = input.match(config.TEXT_WITHIN_DOUBLE_QUOTE_PATTERN);

  if (match && match[1]) {
    output = getStringForJson(match[1]);
  } else {
    output = input.replace(/[^a-zA-Z0-9_]/g, '_').replace(/__/g, '_');
  }

  if (output.endsWith('_')) {
    output = output.substring(0, output.length - 1);
  }

  return output;
}

/**
 * Convert string to map (for keysForLocatorInFileUpload parsing)
 * Matches Java: StringToMapConverter.convertStringToMap()
 */
export function convertStringToMap(input: string): Map<string, string> {
  const resultMap = new Map<string, string>();
  if (!input || input.trim() === '') {
    return resultMap;
  }

  const pairs = input.split(/,\s*/);
  for (const pair of pairs) {
    const keyValue = pair.split(':');
    if (keyValue.length === 2) {
      resultMap.set(keyValue[0].trim(), keyValue[1].trim());
    }
  }
  return resultMap;
}

/**
 * Extract substring between start and end text
 * Matches Java: TCUtil.extractSubstring()
 */
export function extractSubstring(
  input: string,
  startText: string,
  endText: string,
): string | null {
  const startIndex = input.indexOf(startText);
  if (startIndex === -1) {
    return null;
  }

  const adjustedStartIndex = startIndex + startText.length;
  const endIndex = input.indexOf(endText, adjustedStartIndex);
  if (endIndex === -1) {
    return null;
  }

  return input.substring(adjustedStartIndex, endIndex);
}

/**
 * Get reverse JSON map subset for matching string
 * Matches Java: TCUtil.getReverseJsonMapToUseForMatchingString()
 */
export function getReverseJsonMapToUseForMatchingString(
  reverseJsonMap: Map<string, string>,
  matchingText: string,
): Map<string, string> {
  const reverseJsonMapTemp = new Map<string, string>();
  let replaceText = matchingText;

  // Iterate through reverseJsonMap (already sorted by length descending)
  for (const [value, dataRef] of reverseJsonMap.entries()) {
    if (replaceText.includes(value)) {
      replaceText = replaceText.replace(value, '');
      reverseJsonMapTemp.set(value, dataRef);
    }
  }

  return reverseJsonMapTemp;
}

/**
 * Get matching map for getByText (whole word match)
 * Matches Java: TCUtil.getMatchingMapForGetByText()
 */
export function getMatchingMapForGetByText(
  reverseJsonMap: Map<string, string>,
  tsLine: string,
  beginPattern: string,
  endPattern: string,
  matchingText: string,
  preferredKey: string | undefined,
  jsonMap: Map<string, string>,
  matchTextToUsePreferredField: string | undefined,
): string {
  const upperCaseLine = tsLine.toUpperCase();
  const DATA_FILE_VARIABLE_PREPENDER = 'data.';

  for (const [value, dataRef] of reverseJsonMap.entries()) {
    const upperCaseValue = value.toUpperCase();
    const patternMatch = (
      beginPattern +
      upperCaseValue +
      endPattern
    ).toUpperCase();

    if (upperCaseLine.includes(patternMatch)) {
      let replacementValue = dataRef;

      if (preferredKey && preferredKey.trim() !== '') {
        const preferredKeyValue = jsonMap.get(preferredKey);
        if (
          matchingText === preferredKeyValue &&
          (!matchTextToUsePreferredField ||
            matchTextToUsePreferredField.trim() === '' ||
            tsLine.includes(matchTextToUsePreferredField))
        ) {
          replacementValue = DATA_FILE_VARIABLE_PREPENDER + preferredKey;
        }
      }

      return tsLine.replace(`'${matchingText}'`, replacementValue);
    }
  }

  return tsLine;
}

/**
 * Remove date at the end of string
 * Matches Java: TCUtil.removeDateAtTheEnd()
 */
export function removeDateAtTheEnd(
  input: string,
  config: TransformerConfig,
): string {
  const match = input.match(config.ENDS_WITH_DATE_FORMAT_PATTERN);
  if (match) {
    Logger.log(`input string: ${input}`);
    return input.replace(match[0], '');
  }
  return input;
}

/**
 * Populate unique value in map (for dynamic IDs)
 * Matches Java: TCUtil.populateUniqueValueInMap()
 */
export function populateUniqueValueInMap(
  dynamicIdsMap: Map<string, string>,
  key: string,
  value: string,
): string {
  const values = Array.from(dynamicIdsMap.values());
  let i = 0;
  const origValue = value;

  while (true) {
    if (!values.includes(value)) {
      dynamicIdsMap.set(key, value);
      Logger.log(`Writing to json:: key: ${key} value: ${value}`);
      return value;
    }
    value = origValue + '_' + ++i;
  }
}

/**
 * Get JSON string from map (custom formatting matching Java)
 * Matches Java: TCUtil.getJsonStringFromMap()
 */
export function getJsonStringFromMap(
  listOfMaps: Map<string, string>[],
): string {
  const jsonBuilder: string[] = [];
  jsonBuilder.push('[');

  const indentation = '  '; // 2 spaces for indentation

  for (let i = 0; i < listOfMaps.length; i++) {
    const map = listOfMaps[i];

    jsonBuilder.push(`${indentation}{`);

    const entries = Array.from(map.entries());
    for (let j = 0; j < entries.length; j++) {
      const [key, value] = entries[j];

      // Escape values: replace \' with ', \" with ", then escape " to \"
      const escapedValue = value
        .replace(/\\'/g, "'")
        .replace(/\\"/g, '"')
        .replace(/"/g, '\\"');

      jsonBuilder.push(
        `${indentation}${indentation}"${key}": "${escapedValue}"${
          j < entries.length - 1 ? ',' : ''
        }`,
      );
    }

    jsonBuilder.push(`${indentation}}${i < listOfMaps.length - 1 ? ',' : ''}`);
  }

  jsonBuilder.push(']');

  const jsonStr = jsonBuilder.join('\n');
  Logger.log(`json:: ${jsonStr}`);
  return jsonStr;
}
