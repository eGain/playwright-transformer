/**
 * Main transformer class
 * Orchestrates the transformation process
 */

import {
  TransformerConfig as TypesTransformerConfig,
  TransformResult,
} from '../types';
import { getConfig, TransformerConfig } from '../config/configLoader';
import {
  findTsFiles,
  readFileLines,
  writeFileLines,
  //writeJsonFile,
  getDestinationPath,
  deleteFileIfExists,
} from '../utils/fileUtils';
import { Logger } from '../utils/logger';
import {
  applyInsertLinePattern,
  removeAllNoiseLines,
  putInMapWithUniqueKeys,
  getJsonStringFromMap,
} from './utils/tcUtil';
import { processPatternsInLine } from './PatternProcessor';
import { FillPatternHandler } from './handlers/FillPatternHandler';
import * as path from 'path';
import * as fs from 'fs';

export class PlaywrightTransformer {
  private config: TypesTransformerConfig;
  private transformerConfig: TransformerConfig;

  constructor(config: TypesTransformerConfig) {
    this.config = config;
    // Load transformer config (constants and JSON patterns file paths)
    this.transformerConfig = getConfig();
  }

  async transform(): Promise<TransformResult> {
    // Validate input directory exists
    if (!fs.existsSync(this.config.inputDir)) {
      const errorMsg = `Input directory does not exist: ${this.config.inputDir}`;
      Logger.error(errorMsg);
      return {
        success: false,
        transformedFiles: 0,
        errors: [errorMsg],
      };
    }

    const errors: string[] = [];
    let transformedFiles = 0;

    try {
      // Find all TypeScript test files in input directory
      const testFiles = findTsFiles(this.config.inputDir);
      Logger.log(`Found ${testFiles.length} test file(s) to transform`);

      if (testFiles.length === 0) {
        const errorMsg = `No test files found in input directory: ${this.config.inputDir}`;
        Logger.error(errorMsg);
        return {
          success: false,
          transformedFiles: 0,
          errors: [errorMsg],
        };
      }

      // Process only the first file (use transformAll() to process all files)
      const filesToProcess = testFiles.slice(0, 1);
      for (const sourcePath of filesToProcess) {
        try {
          // Get destination paths
          const destPath = getDestinationPath(
            sourcePath,
            this.config.inputDir,
            this.config.outputDir,
          );
          const jsonDataPath = getDestinationPath(
            sourcePath,
            this.config.inputDir,
            this.config.dataDir,
            'json',
          );

          // Delete existing output files if they exist
          deleteFileIfExists(destPath);
          deleteFileIfExists(jsonDataPath);

          // Transform file
          await this.transformFile(sourcePath, destPath, jsonDataPath);

          transformedFiles++;
          Logger.log(`Successfully processed: ${path.basename(sourcePath)}`);
        } catch (error) {
          const errorMsg = this.formatError(
            `Failed to transform ${sourcePath}`,
            error,
          );
          Logger.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      Logger.log(
        `\nDone. Successfully transformed ${transformedFiles} file(s)`,
      );

      return {
        success: errors.length === 0,
        transformedFiles,
        errors,
      };
    } catch (error) {
      const errorMsg = this.formatError('Transformation failed', error);
      Logger.error(errorMsg);
      errors.push(errorMsg);
      return {
        success: false,
        transformedFiles,
        errors,
      };
    }
  }

  /**
   * Transform all files in the input directory
   */
  async transformAll(): Promise<TransformResult> {
    // Validate input directory exists
    if (!fs.existsSync(this.config.inputDir)) {
      const errorMsg = `Input directory does not exist: ${this.config.inputDir}`;
      Logger.error(errorMsg);
      return {
        success: false,
        transformedFiles: 0,
        errors: [errorMsg],
      };
    }

    const errors: string[] = [];
    let transformedFiles = 0;

    try {
      // Find all TypeScript test files in input directory
      const testFiles = findTsFiles(this.config.inputDir);
      Logger.log(`Found ${testFiles.length} test file(s) to transform`);

      if (testFiles.length === 0) {
        const errorMsg = `No test files found in input directory: ${this.config.inputDir}`;
        Logger.error(errorMsg);
        return {
          success: false,
          transformedFiles: 0,
          errors: [errorMsg],
        };
      }

      // Process all files
      for (const sourcePath of testFiles) {
        try {
          // Get destination paths
          const destPath = getDestinationPath(
            sourcePath,
            this.config.inputDir,
            this.config.outputDir,
          );
          const jsonDataPath = getDestinationPath(
            sourcePath,
            this.config.inputDir,
            this.config.dataDir,
            'json',
          );

          // Delete existing output files if they exist
          deleteFileIfExists(destPath);
          deleteFileIfExists(jsonDataPath);

          // Transform file
          await this.transformFile(sourcePath, destPath, jsonDataPath);

          transformedFiles++;
          Logger.log(`Successfully processed: ${path.basename(sourcePath)}`);
        } catch (error) {
          const errorMsg = this.formatError(
            `Failed to transform ${sourcePath}`,
            error,
          );
          Logger.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      Logger.log(
        `\nDone. Successfully transformed ${transformedFiles} file(s)`,
      );

      return {
        success: errors.length === 0,
        transformedFiles,
        errors,
      };
    } catch (error) {
      const errorMsg = this.formatError('Transformation failed', error);
      Logger.error(errorMsg);
      errors.push(errorMsg);
      return {
        success: false,
        transformedFiles,
        errors,
      };
    }
  }

  /**
   * Format error message preserving stack trace and error details
   */
  private formatError(context: string, error: unknown): string {
    if (error instanceof Error) {
      return `${context}: ${error.message}${error.stack ? `\n${error.stack}` : ''}`;
    }
    return `${context}: ${String(error)}`;
  }

  /**
   * Transform a single file
   * Step 6: Applies insert line patterns, removes noise, and injects prepend file
   */
  private async transformFile(
    sourcePath: string,
    destPath: string,
    jsonDataPath: string,
  ): Promise<void> {
    // Reset upload counter for this file transformation
    FillPatternHandler.resetUploadCounterForFile(sourcePath);

    // Read source file
    let lines = readFileLines(sourcePath);

    // Step 1: Apply insert line patterns
    lines = applyInsertLinePattern(lines, this.transformerConfig);

    // Step 2: Remove all noise lines
    lines = removeAllNoiseLines(lines, this.transformerConfig);

    // Step 3: Insert prepend file at the top
    Logger.log(
      `Inserting content from file ${this.transformerConfig.PREPEND_TS_PATH}`,
    );
    const prependLines = readFileLines(this.transformerConfig.PREPEND_TS_PATH);
    // Filter out empty lines from prepend file to avoid unnecessary blank lines
    const filteredPrependLines = prependLines.filter(
      (line) => line.trim() !== '',
    );
    lines = [...filteredPrependLines, ...lines];
    Logger.log(
      `Inserted content from file ${this.transformerConfig.PREPEND_TS_PATH}`,
    );

    // Step 4: Process patterns line by line
    const newTestScriptLines: string[] = [];
    const jsonMap = new Map<string, string>();
    const reverseJsonMap = new Map<string, string>();
    const dynamicIdsMap = new Map<string, string>();

    // Initialize with tcName (extract from filename)
    const baseName = path.basename(sourcePath, '.spec.ts');
    const tcNameMatch = baseName.match(/^(TC\d+)/);
    const tcName = tcNameMatch ? tcNameMatch[1] : 'TC01';
    putInMapWithUniqueKeys(jsonMap, 'tcName', tcName);

    // Calculate data source path for placeholder replacement
    // The prepend file has: import input from '@[[DATA_SOURCE_PATH_PLACEHOLDER]]/...'
    // We need to replace [[DATA_SOURCE_PATH_PLACEHOLDER]] with just the path (without @)
    // Expected output: @data/output/TC01_...json
    const relativePath = path.relative(
      path.dirname(destPath),
      path.dirname(jsonDataPath),
    );
    let dataSourcePath = relativePath.replace(/\\/g, '/');

    // Remove leading .. or ./ to get clean path (prepend already has @)
    // If path is ../data, we want "data" (for @data/...)
    // If path is data/output, we want "data/output" (for @data/output/...)
    if (dataSourcePath.startsWith('../')) {
      dataSourcePath = dataSourcePath.replace(/^\.\.\//, '');
    } else if (dataSourcePath.startsWith('./')) {
      dataSourcePath = dataSourcePath.replace(/^\.\//, '');
    }

    // For expected format @data/tests-standalone/templates-s3, check if we need custom path
    // Default to data/output structure, but allow override via config
    // The dataSourcePath is used to replace [[DATA_SOURCE_PATH_PLACEHOLDER]] in prepend.ts

    // Process each line through pattern handlers
    for (let i = 0; i < lines.length; i++) {
      processPatternsInLine(
        lines,
        i,
        newTestScriptLines,
        sourcePath,
        destPath,
        jsonDataPath,
        jsonMap,
        reverseJsonMap,
        dynamicIdsMap,
        this.transformerConfig,
        this.config.inputDir,
        dataSourcePath || '@data',
      );
    }

    // Remove consecutive blank lines (keep max 1 blank line between non-blank lines)
    const cleanedLines: string[] = [];
    let isLastBlank = false;
    for (const line of newTestScriptLines) {
      const isBlank = line.trim() === '';
      if (!isBlank) {
        cleanedLines.push(line);
        isLastBlank = false;
      } else if (!isLastBlank) {
        // Allow one blank line
        cleanedLines.push(line);
        isLastBlank = true;
      }
      // Skip consecutive blank lines
    }

    // Write transformed file
    writeFileLines(destPath, cleanedLines);

    // Write JSON data file (Step 19: Custom formatting matching Java)
    const jsonData = [jsonMap];
    const jsonStr = getJsonStringFromMap(jsonData);
    fs.writeFileSync(jsonDataPath, jsonStr, 'utf-8');

    // Clean up upload counter for this file
    FillPatternHandler.clearUploadCounterForFile(sourcePath);
  }
}
