import { PlaywrightTransformer } from "./transformer/PlaywrightTransformer";
import { TransformerConfig } from "./types";
import { Logger } from "./utils/logger";

/**
 * Main entry point for the Playwright Transformer
 */

/**
 * Transform Playwright test files from recordings to data-driven tests
 *
 * @param config Configuration object specifying input/output directories
 * @returns Promise with transform result
 *
 * @example
 * ```typescript
 * import { transform } from 'playwright-transformer';
 *
 * await transform({
 *   inputDir: './tests/input',
 *   outputDir: './tests/output',
 *   dataDir: './data/output'
 * });
 * ```
 */
export async function transform(config: TransformerConfig) {
  Logger.enable();
  Logger.log("Starting Playwright Transformer");

  try {
    const transformer = new PlaywrightTransformer(config);
    const result = await transformer.transform();

    if (result.success) {
      Logger.log(`\n✓ Transformation completed successfully!`);
      Logger.log(`  Transformed files: ${result.transformedFiles}`);
    } else {
      Logger.error(`\n✗ Transformation completed with errors`);
      Logger.error(`  Errors: ${result.errors.length}`);
      result.errors.forEach((err) => Logger.error(`  - ${err}`));
    }

    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? `Transformation failed: ${error.message}${error.stack ? `\n${error.stack}` : ''}`
        : `Transformation failed: ${String(error)}`;
    Logger.error(errorMessage);
    throw error;
  }
}

/**
 * Export the transformer class for advanced usage
 */
export { PlaywrightTransformer } from "./transformer/PlaywrightTransformer";

/**
 * Export all types
 */
export * from "./types";
