import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GratitudeExchangeActivity } from './GratitudeExchangeActivity';

describe('GratitudeExchangeActivity', () => {
  const coupleData = {
    status: 'active',
    user1Id: 'u1',
    user2Id: 'u2',
    user1DisplayName: 'Alex',
    user2DisplayName: 'Jamie'
  };

  test('records first gratitude note and passes turn', async () => {
    const onUpdateActivity = jest.fn().mockResolvedValue(undefined);
    const onEndActivity = jest.fn();

    render(
      <GratitudeExchangeActivity
        activity={{
          turn: 'u1',
          data: { prompt: 'Share gratitude', notes: [] }
        }}
        onUpdateActivity={onUpdateActivity}
        onEndActivity={onEndActivity}
        coupleData={coupleData}
        userId="u1"
      />
    );

    fireEvent.change(screen.getByPlaceholderText('I appreciate you because...'), { target: { value: 'You always listen deeply.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Share Gratitude' }));

    await waitFor(() => expect(onUpdateActivity).toHaveBeenCalledTimes(1));
    expect(onEndActivity).not.toHaveBeenCalled();

    const payload = onUpdateActivity.mock.calls[0][0];
    expect(payload.turn).toBe('u2');
    expect(payload.notes).toHaveLength(1);
    expect(payload.notes[0].text).toBe('You always listen deeply.');
  });

  test('ends activity when second gratitude note is submitted', async () => {
    const onUpdateActivity = jest.fn().mockResolvedValue(undefined);
    const onEndActivity = jest.fn();

    render(
      <GratitudeExchangeActivity
        activity={{
          turn: 'u2',
          data: {
            prompt: 'Share gratitude',
            notes: [{ userId: 'u1', role: '', text: 'Thanks for being patient with me.' }]
          }
        }}
        onUpdateActivity={onUpdateActivity}
        onEndActivity={onEndActivity}
        coupleData={coupleData}
        userId="u2"
      />
    );

    fireEvent.change(screen.getByPlaceholderText('I appreciate you because...'), { target: { value: 'You make me laugh every day.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Share Gratitude' }));

    await waitFor(() => expect(onEndActivity).toHaveBeenCalledTimes(1));
    expect(onUpdateActivity).not.toHaveBeenCalled();
    const result = onEndActivity.mock.calls[0][0];
    expect(result.notes).toHaveLength(2);
    expect(result.scoreChange).toBe(22);
  });
});
