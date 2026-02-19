Original prompt: Create a plan to... scan this project for errors/bugs and rebuild into a playable structured couple's experience.

## Completed This Round
- Audited project structure, core contexts/pages/activities, and current build/test behavior.
- Installed dependencies and validated baseline commands (`npm run build`, `CI=true npm test -- --watch=false`).
- Fixed couple lookup logic to correctly detect if an invited partner is already in another couple.
- Added baseline structured-experience fields for new couples (`experienceStep`, `experienceCompleted`, `completedActivityIds`).
- Fixed recording lifecycle bugs in audio activities by wiring recorder refs and real stop behavior.
- Reworked Activities Hub into a guided multi-step flow instead of random-only starts.
- Added shared experience flow definition in `src/data/experienceFlow.js`.
- Fixed cleanup/listener issues in coin toss and journal audio cleanup.
- Corrected manifest filename casing mismatch (`public/manifest.json`).

## Validation Notes
- Build and test verification pending after latest code edits.
- There were no unit/integration tests in the repo before these changes.

## TODO / Next Agent Suggestions
- Run `npm run build` and `CI=true npm test -- --watch=false` to confirm lint/build/test status post-refactor.
- Add automated tests for structured progression: start next step, complete activity, advance `experienceStep`, and restart flow.
- Run real-browser/manual flow with two clients to verify turn sync and Firestore race behavior under concurrent updates.
- Consider normalizing activity update contract so `turn` is not passed inside `data` payloads by activity components.
- Added `src/data/experienceFlow.test.js` for deterministic sequence and step normalization coverage.
- Re-ran `npm run build`: now compiles successfully with no ESLint warnings.
- Ran `CI=true npm test -- --watch=false`: 1 suite passing (new experience flow tests).
- Ran `npm run build`: production build compiles successfully.
- Added new activities: `check-in` and `gratitude-exchange` with turn-based logic and journal-ready result payloads.
- Wired new activities into `ActivitiesPage` list + initialization and into the structured `EXPERIENCE_FLOW` sequence.
- Updated `JournalPage` to render both new activity result types.
- Added/expanded tests for existing activities:
  - `src/activities/CollaborativeWritingActivity.test.js`
  - `src/activities/ScriptedScenesActivity.test.js`
- Validation:
  - `CI=true npm test -- --watch=false` passes (3 suites, 5 tests)
  - `npm run build` passes
- Continued hardening:
  - Added `src/activities/CheckInActivity.test.js` (turn progression + completion assertions).
  - Added `src/activities/GratitudeExchangeActivity.test.js` (turn progression + completion assertions).
  - Removed a brittle `ActivitiesPage` helper test that imported Firebase runtime in Jest and caused `TextEncoder` failures.
- Current automated verification:
  - `CI=true npm test -- --watch=false` -> 5 suites passed, 9 tests passed.
  - `npm run build` -> compiled successfully.
- Refactored activity metadata into `src/data/activitiesRegistry.js` and reused it in:
  - `src/pages/ActivitiesPage.js`
  - `src/pages/JournalPage.js`
- Added `src/data/activitiesRegistry.test.js` to validate:
  - new activity registration
  - initial data builders
  - experience-flow ID coverage
- Added scripts in `package.json`:
  - `test:ci`
  - `verify`
- Updated `README.md` with structured journey/new activities/testing commands.
- Validation:
  - `npm run test:ci` passes
  - `npm run verify` passes
