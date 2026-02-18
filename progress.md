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
