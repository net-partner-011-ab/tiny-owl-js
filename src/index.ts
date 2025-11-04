/**
 * Task 5.5: Entry Point - TinyOwl SDK
 *
 * This module provides the TinyOwl SDK (formerly EchoNova) with TinyIT integration
 * with enhanced features including queue system, retry mechanism, and security.
 */

// TinyOwl SDK imports (preserving existing functionality)
import { createSecureHeaders, type SecurityHeaders } from "./security.js";

// New TinyIT SDK imports
import {
  TinyITLogger,
  type TinyITLoggerConfig,
  type LogMetadata,
  type LogLevel,
} from "./logger.js";
import { TinyITClient, type TinyITClientConfig } from "./client.js";

/**
 * Event severity levels (TinyOwl compatibility)
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
}

/**
 * Options for logging events (TinyOwl compatibility)
 */
export interface LogOptions {
  /** Event severity level (default: "info") */
  severity?: Severity;
  /** Additional context data for the event */
  context?: Record<string, any>;
}

/**
 * API response structure (TinyOwl compatibility)
 */
export interface LogResponse {
  success: boolean;
  message: string;
  data?: {
    eventId: string;
    timestamp: string;
    hmacVerified?: boolean; // Indicates if HMAC verification was used
  };
}

/**
 * TinyOwl SDK class for event logging with security features
 * (Maintains backward compatibility with legacy EchoNova interface)
 */
export class EchoNova {
  private readonly apiKey: string;
  private readonly projectSecret: string | undefined;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly enableHMAC: boolean;

  /**
   * Create a new TinyOwl client instance
   */
  constructor(config: EchoNovaConfig) {
    if (!config.apiKey) {
      throw new Error("API key is required");
    }

    this.apiKey = config.apiKey;
    this.projectSecret = config.projectSecret;
    this.baseUrl = config.baseUrl || "http://localhost:5001/api";
    this.timeout = config.timeout || 5000;

    // Enable HMAC by default when projectSecret is provided
    this.enableHMAC =
      config.enableHMAC !== false && Boolean(this.projectSecret);

    // Warn if HMAC is disabled but projectSecret is provided
    if (this.projectSecret && !this.enableHMAC) {
      console.warn(
        "TinyOwl SDK: Project secret provided but HMAC verification is disabled. Consider enabling HMAC for better security."
      );
    }

    // Warn if HMAC is requested but no projectSecret is provided
    if (config.enableHMAC && !this.projectSecret) {
      console.warn(
        "TinyOwl SDK: HMAC verification requested but no project secret provided. Falling back to legacy authentication."
      );
      this.enableHMAC = false;
    }
  }

  /**
   * Log an event to TinyOwl
   */
  async log(message: string, options: LogOptions = {}): Promise<LogResponse> {
    // Validate inputs
    if (!message || typeof message !== "string") {
      throw new Error("Message is required and must be a string");
    }

    const { severity = "info", context = {} } = options;
    const validSeverities: Severity[] = ["info", "warning", "error"];

    if (!validSeverities.includes(severity)) {
      throw new Error(
        `Invalid severity. Must be one of: ${validSeverities.join(", ")}`
      );
    }

    // Create request payload
    const payload = {
      apiKey: this.apiKey,
      message,
      severity,
      context,
    };

    // Create request headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add HMAC security headers if enabled
    if (this.enableHMAC && this.projectSecret) {
      try {
        // Create payload for signature (exclude apiKey from signature for security)
        const payloadForSignature = {
          message,
          severity,
          context,
        };

        const securityHeaders = createSecureHeaders(
          payloadForSignature,
          this.projectSecret
        );
        Object.assign(headers, securityHeaders);
      } catch (error) {
        throw new Error(
          `Failed to create security headers: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/ingest`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Parse response
      const data = (await response.json()) as LogResponse;

      // Handle non-2xx responses
      if (!response.ok) {
        throw new Error(
          data.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle abort/timeout
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Request timeout after ${this.timeout}ms`);
      }

      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Log an info level event
   */
  async info(
    message: string,
    context: Record<string, any> = {}
  ): Promise<LogResponse> {
    return this.log(message, { severity: "info", context });
  }

  /**
   * Log a warning level event
   */
  async warning(
    message: string,
    context: Record<string, any> = {}
  ): Promise<LogResponse> {
    return this.log(message, { severity: "warning", context });
  }

  /**
   * Log an error level event
   */
  async error(
    message: string,
    context: Record<string, any> = {}
  ): Promise<LogResponse> {
    return this.log(message, { severity: "error", context });
  }

  /**
   * Get SDK configuration information (useful for debugging)
   * Note: This method never exposes sensitive information like API keys or secrets
   */
  getConfig(): Omit<EchoNovaConfig, "apiKey" | "projectSecret"> & {
    hasApiKey: boolean;
    hasProjectSecret: boolean;
    hmacEnabled: boolean;
  } {
    return {
      baseUrl: this.baseUrl,
      timeout: this.timeout,
      enableHMAC: this.enableHMAC,
      hasApiKey: Boolean(this.apiKey),
      hasProjectSecret: Boolean(this.projectSecret),
      hmacEnabled: this.enableHMAC,
    };
  }
}

/**
 * TinyIT SDK Configuration Interface
 */
export interface TinyITConfig {
  /** API base URL */
  apiUrl: string;
  /** Project API key */
  apiKey: string;
  /** Project secret for HMAC signing (optional, enables security) */
  projectSecret?: string;
  /** Additional configuration options */
  options?: Partial<
    Omit<TinyITClientConfig, "apiUrl" | "apiKey" | "projectSecret">
  >;
}

/**
 * Task 5.5: Initialize TinyIT SDK
 *
 * Creates a new TinyIT logger instance with the provided configuration.
 * Includes validation and enhanced error handling.
 *
 * @param config - Configuration object with apiUrl, apiKey, and optional projectSecret
 * @returns TinyITLogger instance
 *
 * @example
 * ```typescript
 * import { initTinyIT } from "@tinyOwlJs/observability";
 *
 * const tinyit = initTinyIT({
 *   apiUrl: "https://api.tinyit.io",
 *   apiKey: "PUBLIC_PROJECT_KEY"
 * });
 *
 * tinyit.info("App started");
 * tinyit.error("Something went wrong", { code: 500 });
 * ```
 */
export function initTinyIT(config: TinyITConfig): TinyITLogger {
  // Enhanced validation
  if (!config.apiUrl || !config.apiKey) {
    throw new Error("TinyIT: Missing apiUrl or apiKey");
  }

  if (typeof config.apiUrl !== "string" || typeof config.apiKey !== "string") {
    throw new Error("TinyIT: apiUrl and apiKey must be strings");
  }

  // Validate URL format
  try {
    new URL(config.apiUrl);
  } catch {
    throw new Error("TinyIT: Invalid apiUrl format");
  }

  // Create logger configuration
  const loggerConfig: TinyITLoggerConfig = {
    apiUrl: config.apiUrl,
    apiKey: config.apiKey,
    ...(config.projectSecret && { projectSecret: config.projectSecret }),
    ...(config.options && { clientConfig: config.options }),
  };

  return new TinyITLogger(loggerConfig);
}

// Export all types and classes for advanced usage
export {
  // Security utilities (from TinyOwl SDK)
  createSecureHeaders,
  generateNonce,
  signPayload,
  type SecurityHeaders,
} from "./security.js";

export {
  // TinyIT Logger exports
  TinyITLogger,
  type TinyITLoggerConfig,
  type LogMetadata,
  type LogLevel,
  createLogger,
} from "./logger.js";

export {
  // TinyIT Client exports
  TinyITClient,
  type TinyITClientConfig,
} from "./client.js";

// Support both named and default exports for backward compatibility
export default EchoNova;
