import { DiceIcon, PenToolIcon, MicIcon, Music2Icon, MessageSquareIcon } from '../components/Icons';
import { CoinTossActivity } from '../activities/CoinTossActivity';
import { CheckInActivity } from '../activities/CheckInActivity';
import { CollaborativeWritingActivity } from '../activities/CollaborativeWritingActivity';
import { GratitudeExchangeActivity } from '../activities/GratitudeExchangeActivity';
import { SongCreationActivity } from '../activities/SongCreationActivity';
import { DuetHarmoniesMeasuresActivity } from '../activities/DuetHarmoniesMeasuresActivity';
import { ScriptedScenesActivity } from '../activities/ScriptedScenesActivity';

export const allActivitiesList = [
  { id: 'coin-toss', name: 'Coin Toss Challenge', component: CoinTossActivity, icon: DiceIcon, description: "A quick 3D coin toss!" },
  { id: 'check-in', name: 'Relationship Check-In', component: CheckInActivity, icon: MessageSquareIcon, description: "Share how you are both feeling right now." },
  { id: 'collaborative-story', name: 'Our Story Unfolds', component: CollaborativeWritingActivity, icon: PenToolIcon, description: "Build a unique story together." },
  { id: 'gratitude-exchange', name: 'Gratitude Exchange', component: GratitudeExchangeActivity, icon: PenToolIcon, description: "Trade one meaningful appreciation note each." },
  { id: 'song-creation', name: 'Duet Harmonies (Original)', component: SongCreationActivity, icon: MicIcon, description: "Record audio layers for a song." },
  { id: 'duet-harmonies-measures', name: 'Duet Harmonies (Measures)', component: DuetHarmoniesMeasuresActivity, icon: Music2Icon, description: "Layer short musical measures." },
  { id: 'scripted-scenes', name: 'Scripted Scenes', component: ScriptedScenesActivity, icon: MessageSquareIcon, description: "Voice act a script together." },
];

export const getActivityById = (activityId) => allActivitiesList.find((activityItem) => activityItem.id === activityId) || null;

export const buildInitialActivityData = (activityId) => {
  const initialActivityData = { suggestionsLog: [], turnHistory: [] };

  if (activityId === 'collaborative-story') {
    const prompts = ["Once upon a time...", "The old house..."];
    initialActivityData.prompt = prompts[Math.floor(Math.random() * prompts.length)];
    initialActivityData.currentText = `${initialActivityData.prompt}\n`;
  } else if (activityId === 'check-in') {
    const prompts = [
      "How are you arriving to this moment together?",
      "What emotional weather are you feeling right now?"
    ];
    initialActivityData.prompt = prompts[Math.floor(Math.random() * prompts.length)];
    initialActivityData.entries = [];
  } else if (activityId === 'gratitude-exchange') {
    const prompts = [
      "Name one thing your partner did recently that meant a lot.",
      "What is one trait in your partner that made your day better?"
    ];
    initialActivityData.prompt = prompts[Math.floor(Math.random() * prompts.length)];
    initialActivityData.notes = [];
  } else if (activityId === 'duet-harmonies-measures') {
    const prompts = ["Rainy Day Groove", "Sunrise Serenity"];
    initialActivityData.prompt = prompts[Math.floor(Math.random() * prompts.length)];
    initialActivityData.tempo = 120;
    initialActivityData.measures = 2;
    initialActivityData.secondsPerLoop = (60 / initialActivityData.tempo) * 4 * initialActivityData.measures;
    initialActivityData.layers = [];
    initialActivityData.maxLayersPerUser = 2;
  } else if (activityId === 'scripted-scenes') {
    const scenes = [
      {
        prompt: "Pirate & Mermaid",
        script: [
          { char: "Captain", line: "Arrr, treasure!" },
          { char: "Mermaid", line: "Never!" }
        ]
      },
      {
        prompt: "Squirrels & Acorn",
        script: [
          { char: "Squeaky", line: "My acorn!" },
          { char: "Nutsy", line: "No, mine!" }
        ]
      }
    ];
    const selectedScene = scenes[Math.floor(Math.random() * scenes.length)];
    initialActivityData.scenePrompt = selectedScene.prompt;
    initialActivityData.script = selectedScene.script.map((line) => ({
      ...line,
      recordedAudioData: null,
      voiceDirection: null
    }));
    initialActivityData.currentLineIndex = 0;
    initialActivityData.maxLines = selectedScene.script.length;
  }

  return initialActivityData;
};
