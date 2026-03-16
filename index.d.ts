/**
 * TinyOwl JavaScript SDK - TypeScript Definitions
 */

/**
 * Event severity levels
 */
export type Severity = "info" | "warning" | "error";

/**
 * Configuration options for TinyOwl client
 */
export interface EchoNovaConfig {
  /** Your project's API key from TinyOwl dashboard */
  apiKey: string;
  /** Base URL of the TinyOwl API (default: "http://localhost:5001/api") */
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 5000) */
  timeout?: number;
}

/**
 * Options for logging events
 */
export interface LogOptions {
  /** Event severity level (default: "info") */
  severity?: Severity;
  /** Additional context data for the event */
  context?: Record<string, any>;
}

/**
 * API response structure
 */
export interface LogResponse {
  success: boolean;
  message: string;
  data?: {
    eventId: string;
    timestamp: string;
  };
}

/**
 * Main SDK class for TinyOwl event logging
 */
export class EchoNova {
  /**
   * Create a new TinyOwl client instance
   *
   * @param config - Configuration options
   *
   * @example
   * ```typescript
   * const client = new EchoNova({
   *   apiKey: "YOUR_API_KEY",
   *   baseUrl: "https://api.tinyowl.com/api"
   * });
   * ```
   */
  constructor(config: EchoNovaConfig);

  /**
   * Log an event to TinyOwl
   *
   * @param message - Event message/description
   * @param options - Logging options
   * @returns Promise resolving to API response
   *
   * @example
   * ```typescript
   * await client.log("User signed in", {
   *   severity: "info",
   *   context: { userId: "123" }
   * });
   * ```
   */
  log(message: string, options?: LogOptions): Promise<LogResponse>;

  /**
   * Log an info level event
   *
   * @param message - Event message
   * @param context - Additional context data
   * @returns Promise resolving to API response
   *
   * @example
   * ```typescript
   * await client.info("User logged in", { userId: "123" });
   * ```
   */
  info(message: string, context?: Record<string, any>): Promise<LogResponse>;

  /**
   * Log a warning level event
   *
   * @param message - Event message
   * @param context - Additional context data
   * @returns Promise resolving to API response
   *
   * @example
   * ```typescript
   * await client.warning("API rate limit approaching", { currentRate: 95 });
   * ```
   */
  warning(message: string, context?: Record<string, any>): Promise<LogResponse>;

  /**
   * Log an error level event
   *
   * @param message - Event message
   * @param context - Additional context data
   * @returns Promise resolving to API response
   *
   * @example
   * ```typescript
   * await client.error("Payment failed", { orderId: "123", error: "Card declined" });
   * ```
   */
  error(message: string, context?: Record<string, any>): Promise<LogResponse>;
}

/** @alias EchoNova — canonical public name */
export { EchoNova as TinyOwl };
export default EchoNova;
