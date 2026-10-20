# LendLog — Project Engineering Guidelines (Ponytail Standards)

<!-- Sourced from and aligned with https://github.com/DietrichGebert/ponytail (MIT License) -->

LendLog is an offline-first, privacy-focused personal lending tracker built with React Native (Expo) and TypeScript.

## Engineering Principles
- **Smallest Complete Solution:** The best code is the code never written. Solve problems with the least new code.
- **Reuse Existing Patterns:** Use `StorageContext` helpers, existing modal components, and theme tokens in `constants/Colors.ts`.
- **Zero Bloat / Lean:** Do not add third-party libraries for trivial logic. Rely on standard JavaScript/TypeScript and native React Native APIs.
- **Privacy & F-Droid Compliance Baseline:** 
  - Strictly 100% offline. No telemetry, no third-party ads, analytics, or proprietary tracking SDKs.
  - Zero Google Play Services dependencies in release builds.

## Financial & Storage Invariants
- **Monetary Precision:** Always use `round2()` (two decimal places) for financial amounts and aggregations to prevent floating-point drift.
- **Data Integrity:** Never allow payments to exceed outstanding amounts. Deleting payments must automatically recalculate `settled` and `settled_date`.
- **Backup & Restore:** Maintain backward-compatible schema migration in `StorageContext.tsx`. Sanitization and defensive defaults are required on import.
- **Referential Integrity:** People deletions and rename operations must cascade cleanly across related transaction records.

## Automated Verification & Testing
- Every financial calculation change or data mutation logic must be covered by automated test cases in `tests/calculations.test.js`.
- Always verify TypeScript static types before committing (`npm run typecheck`).
- On-device testing: Verify changes on real hardware via ADB (`adb -s <serial> install -r release/LendLog-v1.0.2.apk`). Test both fresh install and cold-restart persistence.

## Reporting Standards
- Always conclude with concrete evidence: tests passed/failed, device verification logs, and explicitly disclose any skipped checks or unverified edge cases.
