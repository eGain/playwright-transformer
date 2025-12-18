/**
 * Configuration loader
 * Loads configuration files from both internal package location and user's config/ directory
 * Internal files (constants.properties, test_script_end.ts, open_portal.ts, skip_patterns.json)
 * are loaded from the package's internal config directory
 * User-provided files are loaded from the config/ directory relative to current working directory
 * Replicates the Java TransformerConstants static initialization
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import {
  FillPatternDataObject,
  ReplaceTextDataObject,
  SkipPatternDataObject,
  InsertLinesDataObject,
  PreProcessorDataObject,
} from "../types";

/**
 * Configuration object containing all loaded constants and JSON patterns
 */
export interface TransformerConfig {
  // Constants from constants.properties
  TEST_START: string;
  TEST_CASE_NAME_MATCHER: string;
  COMPLETE_TEST_FILE_NAME: string;
  FILL_PATTERN_STR: string;
  CLICK_METHOD_STR: string;
  DATA_SOURCE_PATH_PLACEHOLDER: string;
  CONTENTFRAME_STR: string;
  TO_CONTAIN_TEXT_STR: string;
  TO_HAVE_VALUE_STR: string;
  FILE_UPLOAD_SET_FILE_PATTERN_STR_1: string;
  FILE_UPLOAD_SET_FILE_PATTERN_STR_2: string;
  FILE_UPLOAD_SET_MULTIPLEFILE_PATTERN_STR_1: string;
  FILE_UPLOAD_SET_MULTIPLEFILE_PATTERN_STR_2: string;
  SET_INPUT_FILES_STR: string;
  SET_MULTIPLE_INPUT_FILES_STR: string;
  FILE_UPLOAD_EXTERNALIZED_DATA: string;
  EXPECT_TEXT_WITH_PARAM_STR: string;
  S3_UTILS_INIT: string;
  SELECT_OPTION_STR: string;
  PRESS_SEQUENTIALLY_STR: string;
  SEND_MAIL_STR: string;
  GET_BY_TEST_ID_STR: string;
  COPY_PASTE_IN_CK_EDITOR_PATTERN_START: string;
  COPY_PASTE_IN_CONTENT_SOURCE_PATTERN: string;
  NOISE_LINE_REMOVAL_ITER_COUNT: number;

  // File paths (relative to config/ directory)
  PREPEND_TS_PATH: string;
  TEST_START_TS_PATH: string;
  OPEN_PORTAL_SCRIPT_FILE: string;
  TEST_SCRIPT_END_FILE_PATH: string;

  // Compiled regex patterns
  TEST_CASE_NAME_PATTERN: RegExp;
  TEXT_WITHIN_DOUBLE_QUOTE_PATTERN: RegExp;
  GET_BY_TEST_ID_IN_INSERTED_LINE_PATTERN: RegExp;
  ENDS_WITH_DATE_FORMAT_PATTERN: RegExp;

  // JSON data arrays
  FILL_PATTERNS_DO_LIST: FillPatternDataObject[];
  REPLACE_TEXT_DO_LIST: ReplaceTextDataObject[];
  SKIP_PATTERNS_DO_LIST: SkipPatternDataObject[];
  INSERT_LINES_DO_LIST: InsertLinesDataObject[];
  PRE_PROCESSOR_PATTERNS_DO_LIST: PreProcessorDataObject[];
}

let config: TransformerConfig | null = null;

/**
 * Get the path to the internal config directory
 * Works in both ESM and CJS environments
 */
function getInternalConfigDir(): string {
  // For ESM: use import.meta.url
  if (typeof import.meta !== "undefined" && import.meta.url) {
    const fileName = fileURLToPath(import.meta.url);
    const dirName = path.dirname(fileName);
    // In dist, this will be dist/index.mjs or dist/index.cjs
    // Internal config will be at dist/config/internal
    return path.resolve(dirName, "config", "internal");
  }
  
  // For CJS: use __dirname (will be set by bundler)
  // ts-expect-error - __dirname may not exist in ESM, but we check for it
  if (typeof __dirname !== "undefined") {
    // ts-expect-error
    return path.resolve(__dirname, "config", "internal");
  }
  
  // Fallback: try to resolve relative to process.cwd() (for development)
  // This handles the case when running from source
  const possiblePaths = [
    path.resolve(process.cwd(), "dist", "config", "internal"),
    path.resolve(process.cwd(), "src", "config", "internal"),
  ];
  
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      return possiblePath;
    }
  }
  
  throw new Error(
    "Could not locate internal config directory. " +
    "Please ensure the package is properly built."
  );
}

/**
 * Parse .properties file into key-value map
 */
function parseProperties(content: string): Map<string, string> {
  const props = new Map<string, string>();
  const lines = content.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const equalIndex = trimmed.indexOf("=");
    if (equalIndex > 0) {
      const key = trimmed.substring(0, equalIndex).trim();
      const value = trimmed.substring(equalIndex + 1).trim();
      props.set(key, value);
    }
  }

  return props;
}

/**
 * Load JSON file and parse into type T[]
 */
function loadJsonFile<T>(filePath: string): T[] {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as T[];
  } catch (error) {
    throw new Error(`Failed to load JSON file ${filePath}: ${error}`);
  }
}

/**
 * Get the path to the config/ directory
 * Auto-detects config/ directory relative to current working directory
 * Throws error if config directory does not exist
 */
function getConfigDir(): string {
  const configDir = path.join(process.cwd(), "config");
  
  if (!fs.existsSync(configDir)) {
    throw new Error(
      `Configuration directory not found: ${configDir}\n` +
      `Please ensure the 'config/' directory exists in your project root with all required configuration files.`
    );
  }
  
  if (!fs.statSync(configDir).isDirectory()) {
    throw new Error(
      `Configuration path exists but is not a directory: ${configDir}`
    );
  }
  
  return configDir;
}

/**
 * Load all configuration from config directory
 * @param configDir Optional config directory path (defaults to auto-detected config/)
 */
export function loadConfig(configDir?: string): TransformerConfig {
  if (config) {
    return config;
  }

  const baseDir = configDir || getConfigDir();
  const internalConfigDir = getInternalConfigDir();
  
  // Load constants.properties from internal location
  const constantsPath = path.join(internalConfigDir, "constants.properties");
  if (!fs.existsSync(constantsPath)) {
    throw new Error(
      `Internal configuration file not found: ${constantsPath}\n` +
      `This file is internal to the package and should not be missing. Please reinstall the package.`
    );
  }

  const propertiesContent = fs.readFileSync(constantsPath, "utf-8");
  const properties = parseProperties(propertiesContent);
  
  // Validate user config directory exists (for user-provided files)
  if (!fs.existsSync(baseDir)) {
    throw new Error(
      `Configuration directory not found: ${baseDir}\n` +
      `Please ensure the 'config/' directory exists in your project root with all required configuration files.`
    );
  }

  // Helper to get property with default
  const getProp = (key: string, defaultValue = ""): string => {
    return properties.get(key) || defaultValue;
  };

  // Load all constants
  const transformerConfig: TransformerConfig = {
    // String constants
    TEST_START: getProp("TEST_START"),
    TEST_CASE_NAME_MATCHER: getProp("TEST_CASE_NAME_MATCHER"),
    COMPLETE_TEST_FILE_NAME: getProp("COMPLETE_TEST_FILE_NAME"),
    FILL_PATTERN_STR: getProp("FILL_PATTERN_STR"),
    CLICK_METHOD_STR: getProp("CLICK_METHOD_STR"),
    DATA_SOURCE_PATH_PLACEHOLDER: getProp("DATA_SOURCE_PATH_PLACEHOLDER"),
    CONTENTFRAME_STR: getProp("CONTENTFRAME_STR"),
    TO_CONTAIN_TEXT_STR: getProp("TO_CONTAIN_TEXT_STR"),
    TO_HAVE_VALUE_STR: getProp("TO_HAVE_VALUE_STR"),
    FILE_UPLOAD_SET_FILE_PATTERN_STR_1: getProp(
      "FILE_UPLOAD_SET_FILE_PATTERN_STR_1"
    ),
    FILE_UPLOAD_SET_FILE_PATTERN_STR_2: getProp(
      "FILE_UPLOAD_SET_FILE_PATTERN_STR_2"
    ),
    FILE_UPLOAD_SET_MULTIPLEFILE_PATTERN_STR_1: getProp(
      "FILE_UPLOAD_SET_MULTIPLEFILE_PATTERN_STR_1"
    ),
    FILE_UPLOAD_SET_MULTIPLEFILE_PATTERN_STR_2: getProp(
      "FILE_UPLOAD_SET_MULTIPLEFILE_PATTERN_STR_2"
    ),
    SET_INPUT_FILES_STR: getProp("SET_INPUT_FILES_STR"),
    SET_MULTIPLE_INPUT_FILES_STR: getProp("SET_MULTIPLE_INPUT_FILES_STR"),
    FILE_UPLOAD_EXTERNALIZED_DATA: getProp("FILE_UPLOAD_EXTERNALIZED_DATA"),
    EXPECT_TEXT_WITH_PARAM_STR: getProp("EXPECT_TEXT_WITH_PARAM_STR"),
    S3_UTILS_INIT: getProp("S3_UTILS_INIT"),
    SELECT_OPTION_STR: getProp("SELECT_OPTION_STR"),
    PRESS_SEQUENTIALLY_STR: getProp("PRESS_SEQUENTIALLY_STR"),
    SEND_MAIL_STR: getProp("SEND_MAIL_STR"),
    GET_BY_TEST_ID_STR: getProp("GET_BY_TEST_ID_STR"),
    COPY_PASTE_IN_CK_EDITOR_PATTERN_START: getProp(
      "COPY_PASTE_IN_CK_EDITOR_PATTERN_START"
    ),
    COPY_PASTE_IN_CONTENT_SOURCE_PATTERN: getProp(
      "COPY_PASTE_IN_CONTENT_SOURCE_PATTERN"
    ),
    NOISE_LINE_REMOVAL_ITER_COUNT: parseInt(
      getProp("NOISE_LINE_REMOVAL_ITER_COUNT", "10"),
      10
    ),

    // File paths (relative to config/ directory) - validate they exist
    PREPEND_TS_PATH: (() => {
      const filePath = path.join(baseDir, getProp("PREPEND_TS_PATH"));
      if (!fs.existsSync(filePath)) {
        throw new Error(
          `Required configuration file not found: ${filePath}\n` +
          `Please ensure 'prepend.ts' exists in the config/ directory.`
        );
      }
      return filePath;
    })(),
    TEST_START_TS_PATH: (() => {
      const filePath = path.join(baseDir, getProp("TEST_START_TS_PATH"));
      if (!fs.existsSync(filePath)) {
        throw new Error(
          `Required configuration file not found: ${filePath}\n` +
          `Please ensure 'test_start.ts' exists in the config/ directory.`
        );
      }
      return filePath;
    })(),
    OPEN_PORTAL_SCRIPT_FILE: (() => {
      // Load from internal location
      const filePath = path.join(internalConfigDir, "open_portal.ts");
      if (!fs.existsSync(filePath)) {
        throw new Error(
          `Internal configuration file not found: ${filePath}\n` +
          `This file is internal to the package and should not be missing. Please reinstall the package.`
        );
      }
      return filePath;
    })(),
    TEST_SCRIPT_END_FILE_PATH: (() => {
      // Load from internal location
      const filePath = path.join(internalConfigDir, "test_script_end.ts");
      if (!fs.existsSync(filePath)) {
        throw new Error(
          `Internal configuration file not found: ${filePath}\n` +
          `This file is internal to the package and should not be missing. Please reinstall the package.`
        );
      }
      return filePath;
    })(),

    // Compiled regex patterns (matching Java Pattern.compile calls)
    TEST_CASE_NAME_PATTERN: new RegExp("'(.*?)'"),
    TEXT_WITHIN_DOUBLE_QUOTE_PATTERN: new RegExp('"(.*?)"'),
    GET_BY_TEST_ID_IN_INSERTED_LINE_PATTERN: new RegExp(
      ".*getByTestId\\('(.*?)'\\).*"
    ),
    ENDS_WITH_DATE_FORMAT_PATTERN: new RegExp(
      "\\s-\\s\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}$"
    ),

    // Load JSON arrays with validation
    FILL_PATTERNS_DO_LIST: (() => {
      const filePath = path.join(baseDir, getProp("FILL_PATTERNS_JSON_PATH"));
      if (!fs.existsSync(filePath)) {
        throw new Error(
          `Required configuration file not found: ${filePath}\n` +
          `Please ensure 'fill_patterns.json' exists in the config/ directory.`
        );
      }
      return loadJsonFile<FillPatternDataObject>(filePath);
    })(),
    REPLACE_TEXT_DO_LIST: (() => {
      const filePath = path.join(baseDir, getProp("REPLACE_TEXTS_JSON_PATH"));
      if (!fs.existsSync(filePath)) {
        throw new Error(
          `Required configuration file not found: ${filePath}\n` +
          `Please ensure 'replace_texts.json' exists in the config/ directory.`
        );
      }
      return loadJsonFile<ReplaceTextDataObject>(filePath);
    })(),
    SKIP_PATTERNS_DO_LIST: (() => {
      // Load from internal location
      const filePath = path.join(internalConfigDir, "skip_patterns.json");
      if (!fs.existsSync(filePath)) {
        throw new Error(
          `Internal configuration file not found: ${filePath}\n` +
          `This file is internal to the package and should not be missing. Please reinstall the package.`
        );
      }
      return loadJsonFile<SkipPatternDataObject>(filePath);
    })(),
    INSERT_LINES_DO_LIST: (() => {
      const filePath = path.join(baseDir, getProp("INSERT_LINES_JSON_PATH"));
      if (!fs.existsSync(filePath)) {
        throw new Error(
          `Required configuration file not found: ${filePath}\n` +
          `Please ensure 'insert_lines.json' exists in the config/ directory.`
        );
      }
      return loadJsonFile<InsertLinesDataObject>(filePath);
    })(),
    PRE_PROCESSOR_PATTERNS_DO_LIST: (() => {
      const filePath = path.join(baseDir, getProp("PRE_PROCESSOR_JSON_PATH"));
      if (!fs.existsSync(filePath)) {
        // pre_processor.json is optional - return empty array if file doesn't exist
        return [];
      }
      return loadJsonFile<PreProcessorDataObject>(filePath);
    })(),
  };

  config = transformerConfig;
  return config;
}

/**
 * Get the loaded configuration (loads if not already loaded)
 * @param configDir Optional config directory path (defaults to auto-detected config/)
 */
export function getConfig(configDir?: string): TransformerConfig {
  return loadConfig(configDir);
}

/**
 * Reset configuration (useful for testing)
 */
export function resetConfig(): void {
  config = null;
}
