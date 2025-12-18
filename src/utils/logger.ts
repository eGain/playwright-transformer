/**
 * Simple logging utility
 */
export class Logger {
  private static enabled = true;

  static enable() {
    this.enabled = true;
  }

  static disable() {
    this.enabled = false;
  }

  static log(message: string): void {
    if (this.enabled) {
      console.log(`[Transformer] ${message}`);
    }
  }

  static error(message: string): void {
    console.error(`[Transformer ERROR] ${message}`);
  }
}

