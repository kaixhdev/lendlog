# Contributing to LendLog

Thanks for taking the time to contribute to LendLog.

LendLog tracks money lent to and borrowed from friends and family. It stores records on the device and is designed to work offline without an account or a hosted service. Please keep that design in mind when proposing changes.

## Ground rules

- Keep lending records and personal information on the user's device.
- Do not add accounts, cloud sync, advertising, analytics, telemetry, or network-dependent features without discussing the proposal with the maintainer first.
- Prefer free and open-source dependencies. Explain any new dependency and why it is needed.
- Keep the app usable without an internet connection.
- Avoid adding permissions that the feature does not need.
- Keep changes focused and avoid unrelated refactoring.

## Setting up

### Requirements

- Node.js 20 and npm.
- JDK 21 for Android builds.
- Android Studio and the Android SDK if you plan to build or run the native Android project locally.
- An Android device or emulator for device testing.

### Install dependencies

Fork the repository, clone your fork, and install the locked dependencies:

```bash
git clone https://github.com/<your-username>/lendlog.git
cd lendlog
npm ci
```

Start the Expo development server:

```bash
npx expo start
```

Open the project with Expo Go where supported, or use an Android emulator or device for native testing.

## Checks before opening a pull request

Run these commands from the repository root:

```bash
npm run lint
npm run typecheck
npm test
```

The lint command runs ESLint and checks formatting with Prettier. The CI workflow also builds the Android APK using JDK 21.

If you change Android-specific code, test the change on an Android device or emulator when possible. Include the test environment and any checks you could not run in your pull request.

## Commit messages

Use a short message that describes the change. Keep each commit focused on one logical task. Examples:

- `fix: handle partial repayment amounts`
- `docs: clarify backup instructions`
- `test: cover balance calculations`

## Pull requests

- Open your pull request against the `main` branch.
- Explain the problem or use case behind the change.
- Summarize what you changed and mention any relevant issue.
- List the checks you ran and their results.
- Include screenshots or a short recording for visible UI changes.
- Call out changes to permissions, dependencies, storage, or app behaviour.
- Keep the pull request focused. Larger changes are easier to review when discussed before implementation.

## Accessibility

Keep text readable and controls usable with assistive technology. Use accessible labels for interactive elements, maintain sufficient colour contrast, and avoid relying on colour alone to communicate a status. Check that touch targets are practical on a phone-sized screen.

## Reporting bugs

Open an issue and include:

- The device and Android version.
- The steps needed to reproduce the problem.
- What you expected to happen and what happened instead.
- Screenshots or logs, if they help explain the issue.

Do not include real names, financial records, backup files, or other personal information in an issue. Use sample data when describing a problem.

## Questions

For questions about contributing or a proposed change, open an issue with enough context for the maintainer to understand what you want to do. For larger changes, ask before spending time on an implementation.
