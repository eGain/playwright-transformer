#!/usr/bin/env node
/**
 * CLI entry point for Playwright Transformer
 * Parses command line arguments and invokes the transformer
 */

import { transform } from "./index";
import { TransformerConfig } from "./types";
import { Logger } from "./utils/logger";

function parseArgs(): { config: TransformerConfig; transformAll: boolean } {
  const args = process.argv.slice(2);
  const config: Partial<TransformerConfig> = {};
  let transformAll = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case "--input-dir":
      case "-i":
        if (nextArg) {
          config.inputDir = nextArg;
          i++;
        }
        break;
      case "--output-dir":
      case "-o":
        if (nextArg) {
          config.outputDir = nextArg;
          i++;
        }
        break;
      case "--data-dir":
      case "-d":
        if (nextArg) {
          config.dataDir = nextArg;
          i++;
        }
        break;
      case "--all":
      case "-a":
        transformAll = true;
        break;
      case "--help":
      case "-h":
        console.log(`
Playwright Transformer CLI

Usage:
  npm run transform -- [options]

Options:
  --input-dir, -i    Input directory containing test files (required)
  --output-dir, -o   Output directory for transformed files (required)
  --data-dir, -d     Data directory for JSON data files (required)
  --all, -a          Transform all files (default: transform first file only)
  --help, -h         Show this help message

Examples:
  npm run transform -- --input-dir tests/input --output-dir tests/output --data-dir data/output
  npm run transform -- --all --input-dir tests/input --output-dir tests/output --data-dir data/output
        `);
        process.exit(0);
        break;
    }
  }

  // Validate required arguments
  if (!config.inputDir || !config.outputDir || !config.dataDir) {
    console.error("Error: Missing required arguments");
    console.error("Required: --input-dir, --output-dir, --data-dir");
    console.error("Use --help for usage information");
    process.exit(1);
  }

  return { config: config as TransformerConfig, transformAll };
}

async function main() {
  try {
    const { config, transformAll } = parseArgs();
    
    if (transformAll) {
      // Use transformAll method
      const { PlaywrightTransformer } = await import("./transformer/PlaywrightTransformer");
      Logger.enable();
      Logger.log("Starting Playwright Transformer (All Files)");
      const transformer = new PlaywrightTransformer(config);
      const result = await transformer.transformAll();
      
      if (result.success) {
        Logger.log(`\n✓ Transformation completed successfully!`);
        Logger.log(`  Transformed files: ${result.transformedFiles}`);
      } else {
        Logger.error(`\n✗ Transformation completed with errors`);
        Logger.error(`  Errors: ${result.errors.length}`);
        result.errors.forEach((err) => Logger.error(`  - ${err}`));
      }
    } else {
      // Use regular transform method (first file only)
      await transform(config);
    }
    
    process.exit(0);
  } catch (error) {
    Logger.error(`CLI Error: ${error}`);
    process.exit(1);
  }
}

// Run if this file is executed directly
// For ESM compatibility, always run main() when this file is executed
main();

