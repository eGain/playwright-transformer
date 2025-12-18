/**
 * Test helper utilities for creating mock configurations and test data
 */

import { TransformerConfig } from '../../../src/config/configLoader';
import {
  PreProcessorDataObject,
  ReplaceTextDataObject,
  FillPatternDataObject,
} from '../../../src/types';

/**
 * Creates a mock TransformerConfig for testing
 */
export function createMockConfig(
  overrides?: Partial<TransformerConfig>,
): TransformerConfig {
  const defaultConfig: TransformerConfig = {
    TEST_START: "test('",
    TEST_CASE_NAME_MATCHER: '[[TEST_CASE_NAME_MATCHER]]',
    COMPLETE_TEST_FILE_NAME: '[[COMPLETE_TEST_FILE_NAME]]',
    FILL_PATTERN_STR: ".fill('",
    CLICK_METHOD_STR: '.click();',
    DATA_SOURCE_PATH_PLACEHOLDER: '[[DATA_SOURCE_PATH_PLACEHOLDER]]',
    CONTENTFRAME_STR: '.contentFrame()',
    TO_CONTAIN_TEXT_STR: ".toContainText('",
    TO_HAVE_VALUE_STR: ".toHaveValue('",
    FILE_UPLOAD_SET_FILE_PATTERN_STR_1:
      "const filePath = path.join(process.cwd(), 'attachments', [[EXTERNALIZED_DATA]]);",
    FILE_UPLOAD_SET_FILE_PATTERN_STR_2:
      'await page.locator(\'//input[@type="file"]\').setInputFiles(filePath);',
    FILE_UPLOAD_SET_MULTIPLEFILE_PATTERN_STR_1:
      "const filePath = [[EXTERNALIZED_DATA]].split(',').map(name => name.trim()).map(fileName => path.join(process.cwd(), 'attachments', fileName.replace(/'/g, '')));",
    FILE_UPLOAD_SET_MULTIPLEFILE_PATTERN_STR_2:
      'await page.locator(\'//input[@type="file"]\').setInputFiles(filePath);',
    SET_INPUT_FILES_STR: ".setInputFiles('",
    SET_MULTIPLE_INPUT_FILES_STR: '.setInputFiles([',
    FILE_UPLOAD_EXTERNALIZED_DATA: '[[EXTERNALIZED_DATA]]',
    EXPECT_TEXT_WITH_PARAM_STR: ' expect(',
    S3_UTILS_INIT: 'const s3Utils = new S3utils();',
    SELECT_OPTION_STR: ".selectOption('",
    PRESS_SEQUENTIALLY_STR: ".pressSequentially('",
    SEND_MAIL_STR: "sendMail.sendTextMail('",
    GET_BY_TEST_ID_STR: "getByTestId('",
    COPY_PASTE_IN_CK_EDITOR_PATTERN_START: 'await page.evaluate((text) => {',
    COPY_PASTE_IN_CONTENT_SOURCE_PATTERN:
      "navigator.clipboard.writeText(text); }, '",
    NOISE_LINE_REMOVAL_ITER_COUNT: 10,
    PREPEND_TS_PATH: '/mock/prepend.ts',
    TEST_START_TS_PATH: '/mock/test_start.ts',
    OPEN_PORTAL_SCRIPT_FILE: '/mock/open_portal.ts',
    TEST_SCRIPT_END_FILE_PATH: '/mock/test_script_end.ts',
    TEST_CASE_NAME_PATTERN: new RegExp("'(.*?)'"),
    TEXT_WITHIN_DOUBLE_QUOTE_PATTERN: new RegExp('"(.*?)"'),
    GET_BY_TEST_ID_IN_INSERTED_LINE_PATTERN: new RegExp(
      ".*getByTestId\\('(.*?)'\\).*",
    ),
    ENDS_WITH_DATE_FORMAT_PATTERN: new RegExp(
      '\\s-\\s\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}$',
    ),
    FILL_PATTERNS_DO_LIST: [],
    REPLACE_TEXT_DO_LIST: [],
    SKIP_PATTERNS_DO_LIST: [],
    INSERT_LINES_DO_LIST: [],
    PRE_PROCESSOR_PATTERNS_DO_LIST: [],
  };

  return { ...defaultConfig, ...overrides };
}

/**
 * Creates a mock PreProcessorDataObject for testing
 */
export function createMockPreProcessor(
  testScriptName: string,
  linesToBeInserted: string,
  separator = ',',
): PreProcessorDataObject {
  return {
    testScriptName,
    linesToBeInserted,
    separator,
  };
}

/**
 * Creates a mock ReplaceTextDataObject for testing
 */
export function createMockReplaceText(
  dataPrependedBy: string,
  dataAppendedBy: string,
  overrides?: Partial<ReplaceTextDataObject>,
): ReplaceTextDataObject {
  return {
    dataPrependedBy,
    dataAppendedBy,
    keysToBeTreatedAsConstants: '',
    keysAsNewPageLaunchers: '',
    matchTextForNonUniqueness: '',
    valuesToBeIgnored: '',
    replaceWithDynamicIds: false,
    isWholeWordMatch: false,
    keysWithContainTextOrToHaveValueAsDynamicIds: '',
    preferredFieldForMatchingText: '',
    matchTextToUsePreferredField: '',
    removeDateAtTheEnd: false,
    isRegex: false,
    ...overrides,
  };
}

/**
 * Creates a mock FillPatternDataObject for testing
 */
export function createMockFillPattern(
  regex: string,
  groupNoForKey: number,
  groupNoForValue: number,
  overrides?: Partial<FillPatternDataObject>,
): FillPatternDataObject {
  return {
    regex,
    groupNoForKey,
    groupNoForValue,
    keysToBeTreatedAsConstants: '',
    nonUniqueKeys: '',
    isKeyFrameset: false,
    isContentFrameHandlingNeeded: false,
    ignorePathInValue: false,
    isFileUpload: false,
    isMultipleFileUpload: false,
    keyToUse: '',
    isDelay: false,
    keysForLocatorInFileUpload: '',
    ...overrides,
  };
}
