/**
 * TypeScript type definitions for the Playwright Transformer
 */

/**
 * Represents a single pattern configuration for extracting values from test files
 * Matches Java: FillPatternDataObject
 */
export interface FillPatternDataObject {
  regex: string;
  groupNoForKey: number;
  groupNoForValue: number;
  keysToBeTreatedAsConstants?: string; // Default: ""
  nonUniqueKeys?: string; // Default: ""
  isKeyFrameset?: boolean;
  isContentFrameHandlingNeeded?: boolean;
  ignorePathInValue?: boolean;
  isFileUpload?: boolean;
  isMultipleFileUpload?: boolean;
  keyToUse?: string; // Default: ""
  isDelay?: boolean;
  keysForLocatorInFileUpload?: string;
}

/**
 * Configuration for text replacement patterns
 */
export interface ReplaceTextDataObject {
  dataPrependedBy: string;
  dataAppendedBy: string;
  keysToBeTreatedAsConstants?: string;
  keysAsNewPageLaunchers?: string;
  matchTextForNonUniqueness?: string;
  valuesToBeIgnored?: string;
  replaceWithDynamicIds?: boolean;
  isWholeWordMatch?: boolean;
  keysWithContainTextOrToHaveValueAsDynamicIds?: string;
  preferredFieldForMatchingText?: string;
  matchTextToUsePreferredField?: string;
  removeDateAtTheEnd?: boolean;
  isRegex?: boolean;
}

/**
 * Configuration for skipping lines
 * Matches Java: SkipPatternDataObject
 */
export interface SkipPatternDataObject {
  pattern: string;
  patternScope?: string; // Default: "singleLine"
  placeHolder?: string; // Default: ""
  placeHolderReplacements?: string; // Default: ""
  compareTextBeforePattern?: boolean; // Default: false
}

/**
 * Configuration for inserting lines
 * Matches Java: InsertLinesDataObject
 */
export interface InsertLinesDataObject {
  existingLines?: string; // Default: ""
  linesToBeInserted?: string; // Default: ""
  insertAt?: string; // Default: ""
  separator?: string | null; // Default: null
  removeLines?: string; // Default: ""
  isRegex?: boolean; // Default: false
}

/**
 * Configuration for pre-processing patterns
 * Matches Java: PreProcessorDataObject
 */
export interface PreProcessorDataObject {
  testScriptName?: string; // Default: ""
  methodToCall?: string; // Default: ""
  linesToBeInserted?: string; // Default: ""
  separator?: string; // Default: ","
  param3?: string; // Default: ""
}

/**
 * Main configuration object for the transformer
 */
export interface TransformerConfig {
  inputDir: string;
  outputDir: string;
  dataDir: string;
  patternsFile?: string;
  constantsFile?: string;
  prependFile?: string;
}

/**
 * Result of transformation
 */
export interface TransformResult {
  success: boolean;
  transformedFiles: number;
  errors: string[];
}
