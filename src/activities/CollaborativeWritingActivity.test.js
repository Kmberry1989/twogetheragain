import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { CollaborativeWritingActivity } from './CollaborativeWritingActivity';

describe('CollaborativeWritingActivity', () => {
  const baseCoupleData = {
    status: 'active',
    user1Id: 'u1',
    user2Id: 'u2',
    user1DisplayName: 'Alex',
    user2DisplayName: 'Jamie'
  };

  test('updates story and advances turn for non-final turns', async () => {
    const onUpdateActivity = jest.fn().mockResolvedValue(undefined);
    const onEndActivity = jest.fn();

    render(
      <CollaborativeWritingActivity
        activity={{
          turn: 'u1',
          data: {
            prompt: 'Once upon a time...',
            currentText: 'Once upon a time...\n',
            turnCount: 0,
            maxTurns: 2
          }
        }}
        onUpdateActivity={onUpdateActivity}
        onEndActivity={onEndActivity}
        coupleData={baseCoupleData}
        userId="u1"
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Add your sentence here...'), { target: { value: 'We met in Paris.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add to Story' }));

    await waitFor(() => expect(onUpdateActivity).toHaveBeenCalledTimes(1));
    expect(onEndActivity).not.toHaveBeenCalled();

    const payload = onUpdateActivity.mock.calls[0][0];
    expect(payload.turn).toBe('u2');
    expect(payload.turnCount).toBe(1);
    expect(payload.currentText).toContain('We met in Paris.\n');
  });

  test('ends activity when final turn is submitted', async () => {
    const onUpdateActivity = jest.fn().mockResolvedValue(undefined);
    const onEndActivity = jest.fn();

    render(
      <CollaborativeWritingActivity
        activity={{
          turn: 'u1',
          data: {
            prompt: 'The old house...',
            currentText: 'The old house...\nIt creaked.\nThe lights flickered.\nA cat appeared.\n',
            turnCount: 3,
            maxTurns: 2
          }
        }}
        onUpdateActivity={onUpdateActivity}
        onEndActivity={onEndActivity}
        coupleData={baseCoupleData}
        userId="u1"
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Add your sentence here...'), { target: { value: 'Then we laughed.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add to Story' }));

    await waitFor(() => expect(onEndActivity).toHaveBeenCalledTimes(1));
    expect(onUpdateActivity).not.toHaveBeenCalled();

    const result = onEndActivity.mock.calls[0][0];
    expect(result.prompt).toBe('The old house...');
    expect(result.story).toContain('Then we laughed.\n');
    expect(typeof result.scoreChange).toBe('number');
  });
});
