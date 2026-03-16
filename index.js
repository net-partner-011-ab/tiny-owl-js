/**
 * TinyOwl JavaScript SDK
 *
 * A lightweight SDK for logging events to TinyOwl backend.
 * Supports info, warning, and error severity levels with optional context data.
 *
 * @example
 * import { TinyOwl } from "@tiny-owl-kit/observability";
 * const client = new TinyOwl({ apiKey: "YOUR_API_KEY" });
 * await client.log("User signed in", { severity: "info", context: { userId: "123" } });
 */

/**
 * Main SDK class for TinyOwl event logging
 */
export class EchoNova {
  /**
   * Create a new TinyOwl client instance
   *
   * @param {Object} config - Configuration options
   * @param {string} config.apiKey - Your project's API key from TinyOwl dashboard
   * @param {string} [config.baseUrl="http://localhost:5001/api"] - Base URL of the TinyOwl API
   * @param {number} [config.timeout=5000] - Request timeout in milliseconds
   *
   * @example
   * const client = new EchoNova({
   *   apiKey: "YOUR_API_KEY",
   *   baseUrl: "https://api.tinyowl.com/api"
   * });
   */
  constructor({ apiKey, baseUrl, timeout = 5000 }) {
    if (!apiKey) {
      throw new Error("API key is required");
    }

    this.apiKey = apiKey;
    this.baseUrl = baseUrl || "http://localhost:5001/api";
    this.timeout = timeout;
  }

  /**
   * Log an event to TinyOwl
   *
   * @param {string} message - Event message/description
   * @param {Object} [options={}] - Logging options
   * @param {("info"|"warning"|"error")} [options.severity="info"] - Event severity level
   * @param {Object} [options.context={}] - Additional context data for the event
   * @returns {Promise<Object>} Response from the API
   *
   * @example
   * // Simple info log
   * await client.log("User signed in");
   *
   * @example
   * // Log with severity and context
   * await client.log("Payment processed", {
   *   severity: "info",
   *   context: {
   *     userId: "12345",
   *     amount: 99.99,
   *     currency: "USD"
   *   }
   * });
   *
   * @example
   * // Log an error
   * await client.log("Database connection failed", {
   *   severity: "error",
   *   context: {
   *     database: "users",
   *     error: "Connection timeout"
   *   }
   * });
   */
  async log(message, { severity = "info", context = {} } = {}) {
    // Validate inputs
    if (!message || typeof message !== "string") {
      throw new Error("Message is required and must be a string");
    }

    const validSeverities = ["info", "warning", "error"];
    if (!validSeverities.includes(severity)) {
      throw new Error(
        `Invalid severity. Must be one of: ${validSeverities.join(", ")}`,
      );
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/ingest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey: this.apiKey,
          message,
          severity,
          context,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Parse response
      const data = await response.json();

      // Handle non-2xx responses
      if (!response.ok) {
        throw new Error(
          data.message || `HTTP ${response.status}: ${response.statusText}`,
        );
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle abort/timeout
      if (error.name === "AbortError") {
        throw new Error(`Request timeout after ${this.timeout}ms`);
      }

      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Log an info level event
   *
   * @param {string} message - Event message
   * @param {Object} [context={}] - Additional context data
   * @returns {Promise<Object>} Response from the API
   *
   * @example
   * await client.info("User logged in", { userId: "123" });
   */
  async info(message, context = {}) {
    return this.log(message, { severity: "info", context });
  }

  /**
   * Log a warning level event
   *
   * @param {string} message - Event message
   * @param {Object} [context={}] - Additional context data
   * @returns {Promise<Object>} Response from the API
   *
   * @example
   * await client.warning("API rate limit approaching", { currentRate: 95 });
   */
  async warning(message, context = {}) {
    return this.log(message, { severity: "warning", context });
  }

  /**
   * Log an error level event
   *
   * @param {string} message - Event message
   * @param {Object} [context={}] - Additional context data
   * @returns {Promise<Object>} Response from the API
   *
   * @example
   * await client.error("Payment processing failed", { orderId: "ORD-123", error: "Card declined" });
   */
  async error(message, context = {}) {
    return this.log(message, { severity: "error", context });
  }
}

// Support both named and default exports
// TinyOwl is the canonical public alias
export { EchoNova as TinyOwl };
export default EchoNova;
