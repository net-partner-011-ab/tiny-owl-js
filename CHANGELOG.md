# Changelog

All notable changes to the TinyOwl JavaScript SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.6] - 2026-06-14

### Added

- **`autoTraceId`** config option (default `true`): every `EchoNova` instance
  auto-generates a stable UUID v4 `instanceTraceId` at construction time, so
  events from the same logger instance are correlated without any code change.
  Set `autoTraceId: false` to opt out.
- **`defaultContext`** config option: a `Record<string, unknown>` merged into
  every log call made on the instance. Useful for process-wide fields
  (`service`, `env`, `version`).
- **`withContext(partial)`** method: returns a new child `EchoNova` instance
  that merges `partial` on top of the parent's `defaultContext` and auto-assigns
  a fresh `traceId` to the child scope. Use this for per-request / per-job
  correlation in long-running servers — the child logger's `traceId` is unique
  and independent from the parent's.
- **Top-level `traceId` wire field**: `traceId` is now sent as a first-class
  sibling of `context` in the ingest payload (not embedded inside `context`).
  The backend indexes this field for O(log n) correlation queries.
- **Validation**: `traceId` values are validated against
  `[A-Za-z0-9._:-]{1,128}`. Invalid values are silently dropped with a
  `console.warn`; the event is still delivered (never throws).
- **Merge precedence**: `per-call context.traceId` > `withContext` scope >
  `defaultContext` > `instanceTraceId` (auto). Per-call context fields override
  `defaultContext` on key conflicts.

### Changed

- HMAC signing now explicitly includes `traceId` in the signed payload when
  present. (No algorithm change — the full body was already signed; this is a
  documentation clarification and explicit test coverage.)

### Notes for upgraders

- **No breaking changes.** All existing single-arg `logger.info("msg")` and
  two-arg `logger.info("msg", { context })` calls continue to work unchanged.
- Existing users will notice `traceId` appearing in the ingest payload by
  default (from `autoTraceId: true`). Requires backend ≥ the version that added
  `Event.traceId` (task 013.5). Older backends silently ignore the extra field.
- To disable: `new EchoNova({ ..., autoTraceId: false })`.

## [1.2.5] - 2026-05-18

### Fixed

- Fixed incorrect production `baseUrl` in documentation — `TINYOWL_BASE_URL` must include the `/api` suffix (`https://be.tiny-owl-kit.io/api`); missing suffix caused `Route /ingest not found` errors on production backends
- Updated `README.md` and `tinyowl-sdk.instructions.md` examples to use correct `baseUrl: "https://be.tiny-owl-kit.io/api"`

## [1.2.4] - 2026-05-18

### Fixed

- Replaced `axios` (CJS-only dependency chain) with the native `fetch` API, eliminating the `__require` CJS shim that `tsup` injected into the ESM bundle (`dist/index.js`)
- Resolved `Dynamic require of "util" is not supported` crash that occurred during Next.js "Collecting page data" phase when the ESM entry point was loaded by Node.js's native ESM loader (not webpack)
- Network errors are now detected via `TypeError` (fetch standard) and `DOMException` with `name === "TimeoutError"` (AbortSignal.timeout standard)
- HTTP 5xx / 429 errors detected through response `ok: false` + status code — retry logic unchanged
- Bundle size reduced from ~436 KB to a few KB (axios + form-data + combined-stream removed)
- Removed `axios` from `devDependencies`
- Fixed `TinyITLogger` sending requests to wrong endpoint `/logs` instead of `/ingest` — would have caused 404 errors against the backend for all users of `initTinyIT()`

## [1.2.3] - 2026-05-14

### Fixed

- Corrected `exports` map in `package.json`: `import` condition now points to the ESM build (`dist/index.js`) which actually exists in the published package
- Corrected `exports` map: `require` condition now points to the CJS build (`dist/index.cjs`) instead of the ESM file, fixing `Dynamic require is not supported` crash in webpack 5 / Next.js projects
- Fixed `main` field to reference the CJS build (`dist/index.cjs`) for legacy tooling compatibility
- Fixed `module` field to reference the existing ESM build (`dist/index.js`) instead of the missing `dist/index.mjs`
- Added explicit `types` per export condition (`dist/index.d.ts` for ESM, `dist/index.d.cts` for CJS) for correct TypeScript resolution in dual-package setups

### Added

- Comprehensive npm publishing guide in README
- Links to example files in README documentation
- Local testing instructions with mock backend examples
- Integration testing examples with Jest/Vitest
- Testing checklist for pre-production validation
- Debugging tips and configuration inspection methods

### Changed

- **BREAKING**: HMAC security with `projectSecret` is now mandatory for all requests
- Backend enforces HMAC verification - no legacy mode support
- Updated all examples to reflect mandatory HMAC security
- Simplified SDK configuration - removed optional HMAC flag
- Updated README to emphasize required security features
- Refactored security examples to show only secure implementations
- Updated version information to reflect current state

### Removed

- Optional HMAC configuration (now always enabled and required)
- Legacy/backward compatibility mode without security
- References to deprecated SDK names in examples

## [0.1.0] - 2025-10-28

### Added

- Initial release of TinyOwl JavaScript SDK
- Mandatory HMAC signature verification with SHA-256
- Timestamp validation for replay protection
- Nonce-based replay attack prevention
- Support for three severity levels: `info`, `warning`, `error`
- Convenience methods: `info()`, `warning()`, `error()`
- TypeScript definitions and full type safety
- CommonJS and ES Module support
- Browser and Node.js compatibility
- Comprehensive error handling
- Configuration inspection with `getConfig()`
- Request timeout configuration
- Security utilities for manual HMAC implementation:
  - `createSecureHeaders()`
  - `signPayload()`
  - `generateNonce()`
- Complete test suite with Jest
- Example files demonstrating security features
- MIT License
- Comprehensive documentation

### Security

- All requests require both `apiKey` and `projectSecret`
- Automatic HMAC-SHA256 signature generation
- Cryptographically secure nonce generation using `crypto.randomBytes()`
- 1-minute timestamp validation window
- 30-second clock skew tolerance
- Protection against replay attacks
- Secure payload integrity verification

### Documentation

- Quick start guide
- Security features documentation
- Configuration examples
- Usage examples for all severity levels
- Real-world implementation examples (e-commerce, authentication, API monitoring)
- Error handling guide
- TypeScript usage examples
- API response structure documentation
- Environment variables best practices
- Security best practices

## [0.0.1] - 2025-10-26

### Added

- Initial development version
- Basic logging functionality
- Core security features implementation
- Project structure setup

---

## Release Types

- **MAJOR** version for incompatible API changes
- **MINOR** version for new functionality in a backward compatible manner
- **PATCH** version for backward compatible bug fixes

## Categories

- **Added** for new features
- **Changed** for changes in existing functionality
- **Deprecated** for soon-to-be removed features
- **Removed** for removed features
- **Fixed** for bug fixes
- **Security** for security-related changes

[unreleased]: https://github.com/Regis011/tiny-owl-kit/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Regis011/tiny-owl-kit/releases/tag/v0.1.0
[0.0.1]: https://github.com/Regis011/tiny-owl-kit/releases/tag/v0.0.1
