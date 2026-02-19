import { allActivitiesList, buildInitialActivityData, getActivityById } from './activitiesRegistry';
import { EXPERIENCE_FLOW } from './experienceFlow';

describe('activitiesRegistry', () => {
  test('contains key couple activities including new additions', () => {
    const ids = allActivitiesList.map((item) => item.id);
    expect(ids).toContain('check-in');
    expect(ids).toContain('gratitude-exchange');
    expect(ids).toContain('collaborative-story');
    expect(ids).toContain('scripted-scenes');
  });

  test('returns activity details by id', () => {
    const activity = getActivityById('check-in');
    expect(activity).not.toBeNull();
    expect(activity.name).toBe('Relationship Check-In');
    expect(typeof activity.component).toBe('function');
  });

  test('builds structured initial data for new activities', () => {
    const checkInData = buildInitialActivityData('check-in');
    expect(Array.isArray(checkInData.entries)).toBe(true);
    expect(checkInData.entries).toHaveLength(0);
    expect(typeof checkInData.prompt).toBe('string');

    const gratitudeData = buildInitialActivityData('gratitude-exchange');
    expect(Array.isArray(gratitudeData.notes)).toBe(true);
    expect(gratitudeData.notes).toHaveLength(0);
    expect(typeof gratitudeData.prompt).toBe('string');
  });

  test('builds structured initial data for legacy activities', () => {
    const storyData = buildInitialActivityData('collaborative-story');
    expect(storyData.currentText.startsWith(storyData.prompt)).toBe(true);

    const sceneData = buildInitialActivityData('scripted-scenes');
    expect(Array.isArray(sceneData.script)).toBe(true);
    expect(sceneData.currentLineIndex).toBe(0);
  });

  test('covers all experience flow ids', () => {
    EXPERIENCE_FLOW.forEach((step) => {
      expect(getActivityById(step.id)).not.toBeNull();
    });
  });
});
