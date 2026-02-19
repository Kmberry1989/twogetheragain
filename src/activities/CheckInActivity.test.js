import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CheckInActivity } from './CheckInActivity';

describe('CheckInActivity', () => {
  const coupleData = {
    status: 'active',
    user1Id: 'u1',
    user2Id: 'u2',
    user1DisplayName: 'Alex',
    user2DisplayName: 'Jamie'
  };

  test('submits first check-in and advances turn', async () => {
    const onUpdateActivity = jest.fn().mockResolvedValue(undefined);
    const onEndActivity = jest.fn();

    render(
      <CheckInActivity
        activity={{
          turn: 'u1',
          data: { prompt: 'How are you?', entries: [] }
        }}
        onUpdateActivity={onUpdateActivity}
        onEndActivity={onEndActivity}
        coupleData={coupleData}
        userId="u1"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '5' }));
    fireEvent.change(screen.getByPlaceholderText('One short feeling update...'), { target: { value: 'Feeling calm and connected.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit Check-In' }));

    await waitFor(() => expect(onUpdateActivity).toHaveBeenCalledTimes(1));
    expect(onEndActivity).not.toHaveBeenCalled();

    const payload = onUpdateActivity.mock.calls[0][0];
    expect(payload.turn).toBe('u2');
    expect(payload.entries).toHaveLength(1);
    expect(payload.entries[0].mood).toBe(5);
    expect(payload.entries[0].note).toBe('Feeling calm and connected.');
  });

  test('completes and ends activity on second check-in', async () => {
    const onUpdateActivity = jest.fn().mockResolvedValue(undefined);
    const onEndActivity = jest.fn();

    render(
      <CheckInActivity
        activity={{
          turn: 'u2',
          data: {
            prompt: 'How are you?',
            entries: [{ userId: 'u1', role: '', mood: 4, note: 'Feeling good.' }]
          }
        }}
        onUpdateActivity={onUpdateActivity}
        onEndActivity={onEndActivity}
        coupleData={coupleData}
        userId="u2"
      />
    );

    fireEvent.change(screen.getByPlaceholderText('One short feeling update...'), { target: { value: 'A little tired but happy.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit Check-In' }));

    await waitFor(() => expect(onEndActivity).toHaveBeenCalledTimes(1));
    expect(onUpdateActivity).not.toHaveBeenCalled();
    const result = onEndActivity.mock.calls[0][0];
    expect(result.entries).toHaveLength(2);
    expect(result.scoreChange).toBe(18);
  });
});
