/**
 * Abstract base class for pattern handlers
 * Implements chain of responsibility pattern
 * Matches Java: PatternHandler
 */

export abstract class PatternHandler {
  protected testScriptLines: string[];
  protected index: number;
  protected tsLine: string;
  protected chain: PatternHandler | null = null;

  constructor(testScriptLines: string[], index: number) {
    this.testScriptLines = testScriptLines;
    this.index = index;
    this.tsLine = testScriptLines[index].trim();
  }

  /**
   * Chain a handler to this handler
   */
  public chainPattern(chain: PatternHandler): void {
    const lastPatternInChain = this.getLastPatternInChain();
    lastPatternInChain.chain = chain;
  }

  /**
   * Get the last handler in the chain
   */
  private getLastPatternInChain(): PatternHandler {
    let p: PatternHandler = this;
    while (p.chain !== null) {
      p = p.chain;
    }
    return p;
  }

  /**
   * Execute handler - public entry point
   */
  public execute(
    newTestScriptLines: string[],
    sourcePath: string,
    destPath: string,
    jsonDataPath: string,
    jsonMap: Map<string, string>,
    reverseJsonMap: Map<string, string>,
    dynamicIdsMap: Map<string, string>
  ): void {
    this.processLine(
      newTestScriptLines,
      sourcePath,
      destPath,
      jsonDataPath,
      jsonMap,
      reverseJsonMap,
      dynamicIdsMap
    );
  }

  /**
   * Process the line - to be implemented by subclasses
   */
  protected abstract processLine(
    newTestScriptLines: string[],
    sourcePath: string,
    destPath: string,
    jsonDataPath: string,
    jsonMap: Map<string, string>,
    reverseJsonMap: Map<string, string>,
    dynamicIdsMap: Map<string, string>
  ): void;

  /**
   * Process chain - default implementation adds line as-is
   */
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
    // Default: add the line as-is
    newTestScriptLines.push(this.testScriptLines[this.index]);
  }

  /**
   * Continue chain - passes processed line to next handler or adds it
   */
  protected continueChain(
    newTestScriptLines: string[],
    sourcePath: string,
    destPath: string,
    jsonDataPath: string,
    jsonMap: Map<string, string>,
    reverseJsonMap: Map<string, string>,
    dynamicIdsMap: Map<string, string>,
    processedLine: string
  ): void {
    if (this.chain !== null) {
      this.chain.processChain(
        newTestScriptLines,
        sourcePath,
        destPath,
        jsonDataPath,
        jsonMap,
        reverseJsonMap,
        dynamicIdsMap,
        processedLine
      );
    } else {
      newTestScriptLines.push(processedLine);
    }
  }
}
