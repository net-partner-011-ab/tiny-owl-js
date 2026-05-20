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
  /** Your project's secret for HMAC signing (recommended for security) */
  projectSecret?: string;
  /** Base URL of the TinyOwl API (default: "http://localhost:5001/api") */
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 5000) */
  timeout?: number;
  /** Enable HMAC signature verification (default: true when projectSecret is provided) */
  enableHMAC?: boolean;
  /**
   * Default context fields merged into every log call made on this instance.
   * Call-site context wins over defaults on key conflicts.
   */
  defaultContext?: Record<string, unknown>;
  /**
   * Automatically attach a stable traceId to every event logged by this instance.
   * A fresh UUID is generated at construction time and reused for the instance lifetime.
   * Child instances created via `withContext()` receive their own unique traceId.
   * Set to `false` to opt out of automatic traceId generation.
   * @default true
   */
  autoTraceId?: boolean;
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
    hmacVerified?: boolean;
    /** The traceId that was stored with this event, if any. */
    traceId?: string;
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
   * const logger = new TinyOwl({
   *   apiKey: "YOUR_API_KEY",
   *   projectSecret: "YOUR_PROJECT_SECRET",
   *   baseUrl: "https://api.tinyowl.com/api",
   * });
   * // Every event logged by `logger` shares the same auto-generated traceId.
   * ```
   */
  constructor(config: EchoNovaConfig);

  /**
   * Create a child logger scope with merged default context.
   *
   * Each child receives its own unique traceId (unless you supply one via
   * `partial.traceId`), so all events from the child are automatically
   * correlated in the Dashboard.
   *
   * @param partial - Context fields to merge with the current defaults.
   * @returns A new `EchoNova` instance sharing the same credentials.
   *
   * @example
   * ```typescript
   * const reqLogger = logger.withContext({ requestId: req.id, userId: user.id });
   * reqLogger.info("Request received");
   * reqLogger.error("Validation failed", { field: "email" });
   * // Both events share the same traceId — searchable in the Dashboard.
   * ```
   */
  withContext(partial: Record<string, unknown>): EchoNova;

  /**
   * Log an event to TinyOwl
   *
   * @param message - Event message/description
   * @param options - Logging options
   * @returns Promise resolving to API response
   *
   * @example
   * ```typescript
   * await logger.log("User signed in", {
   *   severity: "info",
   *   context: { userId: "123" },
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
   * await logger.info("User logged in", { userId: "123" });
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
   * await logger.warning("API rate limit approaching", { currentRate: 95 });
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
   * await logger.error("Payment failed", { orderId: "123", error: "Card declined" });
   * ```
   */
  error(message: string, context?: Record<string, any>): Promise<LogResponse>;

  /**
   * Get SDK configuration information (useful for debugging).
   * Never exposes sensitive information like API keys or secrets.
   *
   * @example
   * ```typescript
   * const { instanceTraceId } = logger.getConfig();
   * console.log("Root traceId:", instanceTraceId);
   * ```
   */
  getConfig(): Omit<EchoNovaConfig, "apiKey" | "projectSecret"> & {
    hasApiKey: boolean;
    hasProjectSecret: boolean;
    hmacEnabled: boolean;
    /** The traceId assigned to this instance (present when autoTraceId is enabled). */
    instanceTraceId?: string;
  };
}

/** @alias EchoNova — canonical public name */
export { EchoNova as TinyOwl };
export default EchoNova;
