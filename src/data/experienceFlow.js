export const EXPERIENCE_FLOW = [
  {
    id: 'coin-toss',
    phase: 'Warm-up',
    summary: 'Quick icebreaker to set the tone.'
  },
  {
    id: 'collaborative-story',
    phase: 'Story Spark',
    summary: 'Build a short story one line at a time.'
  },
  {
    id: 'scripted-scenes',
    phase: 'Playful Acting',
    summary: 'Perform a scene together.'
  },
  {
    id: 'duet-harmonies-measures',
    phase: 'Music Layers',
    summary: 'Create loop layers into a shared groove.'
  },
  {
    id: 'song-creation',
    phase: 'Final Duet',
    summary: 'Record the final collaborative performance.'
  }
];

export const getExperienceStep = (stepValue) => {
  const parsed = Number.isFinite(stepValue) ? stepValue : Number(stepValue);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0;
};
