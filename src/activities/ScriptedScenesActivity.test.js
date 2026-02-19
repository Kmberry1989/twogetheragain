import React from 'react';
import { render, screen } from '@testing-library/react';
import { ScriptedScenesActivity } from './ScriptedScenesActivity';

describe('ScriptedScenesActivity', () => {
  test('shows waiting state when it is partner turn', () => {
    render(
      <ScriptedScenesActivity
        activity={{
          turn: 'u2',
          data: {
            scenePrompt: 'Pirate & Mermaid',
            currentLineIndex: 0,
            script: [
              { char: 'Captain', line: 'Arrr, treasure!', recordedAudioData: null, voiceDirection: null },
              { char: 'Mermaid', line: 'Never!', recordedAudioData: null, voiceDirection: null }
            ]
          }
        }}
        onUpdateActivity={jest.fn()}
        onEndActivity={jest.fn()}
        coupleData={{
          status: 'active',
          user1Id: 'u1',
          user2Id: 'u2',
          user1DisplayName: 'Alex',
          user2DisplayName: 'Jamie'
        }}
        userId="u1"
      />
    );

    expect(screen.getAllByText(/Pirate & Mermaid/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Waiting for Jamie/i)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Record as/i })).toBeNull();
  });
});
