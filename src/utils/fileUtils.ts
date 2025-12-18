import * as fs from "fs";
import * as path from "path";

/**
 * Utility functions for file operations
 */

/**
 * Read a file and return its contents as an array of lines
 */
export function readFileLines(filePath: string): string[] {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return content.split("\n");
  } catch (error) {
    throw new Error(`Failed to read file: ${filePath}. Error: ${error}`);
  }
}

/**
 * Write an array of lines to a file
 */
export function writeFileLines(filePath: string, lines: string[]): void {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, lines.join("\n"), "utf-8");
  } catch (error) {
    throw new Error(`Failed to write file: ${filePath}. Error: ${error}`);
  }
}

/**
 * Write a JSON object to a file
 */
export function writeJsonFile(filePath: string, data: any): void {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    throw new Error(`Failed to write JSON file: ${filePath}. Error: ${error}`);
  }
}

/**
 * Get destination path based on source path and directory mapping
 */
export function getDestinationPath(
  sourcePath: string,
  sourceDir: string,
  destDir: string,
  newExtension?: string
): string {
  const relativePath = path.relative(sourceDir, sourcePath);
  const destinationPath = path.join(destDir, relativePath);

  if (newExtension) {
    const parsed = path.parse(destinationPath);
    // Remove .spec from filename if present (e.g., test.spec.ts -> test.json)
    let baseName = parsed.name;
    if (baseName.endsWith(".spec")) {
      baseName = baseName.slice(0, -5); // Remove ".spec" (5 characters)
    }
    return path.join(parsed.dir, baseName + "." + newExtension);
  }

  return destinationPath;
}

/**
 * Delete a file if it exists
 */
export function deleteFileIfExists(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    // Silently fail - file deletion is not critical
  }
}

/**
 * Find all .ts files recursively in a directory
 */
export function findTsFiles(dir: string): string[] {
  const results: string[] = [];

  function walkDir(currentDir: string) {
    const files = fs.readdirSync(currentDir);

    for (const file of files) {
      const fullPath = path.join(currentDir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else if (file.endsWith(".spec.ts") || file.endsWith(".ts")) {
        results.push(fullPath);
      }
    }
  }

  walkDir(dir);
  return results;
}
