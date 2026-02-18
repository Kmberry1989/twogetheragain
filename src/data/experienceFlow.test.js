import { EXPERIENCE_FLOW, getExperienceStep } from './experienceFlow';

describe('experienceFlow', () => {
  test('defines a deterministic structured sequence', () => {
    expect(EXPERIENCE_FLOW.map((step) => step.id)).toEqual([
      'coin-toss',
      'collaborative-story',
      'scripted-scenes',
      'duet-harmonies-measures',
      'song-creation'
    ]);
  });

  test('normalizes step values safely', () => {
    expect(getExperienceStep(undefined)).toBe(0);
    expect(getExperienceStep(null)).toBe(0);
    expect(getExperienceStep('3')).toBe(3);
    expect(getExperienceStep(2.7)).toBe(2);
    expect(getExperienceStep(-4)).toBe(0);
  });
});
