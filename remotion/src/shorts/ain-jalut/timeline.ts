// Single source of truth for timing. When the voiceover arrives, only the
// `start`/`end` of each line need retiming (tools/align.sh prints them).
export const FPS = 30;

export type Line = {
  id: string;
  start: number;
  end: number;
  text: string;
  // Words drawn in the accent colour in the captions.
  highlight?: string[];
};

export const LINES: Line[] = [
  {id: 'hook', start: 0, end: 3, text: 'The Mongol Empire was stopped by an army of slaves.', highlight: ['Mongol', 'slaves.']},
  {id: 'loop', start: 3, end: 7.2, text: 'But the real reason they lost… died four thousand miles away.', highlight: ['real', 'reason', 'died']},
  {id: 'baghdad', start: 7.2, end: 13, text: '1258. Hulagu Khan takes Baghdad and wipes out the Abbasid Caliphate. Then Aleppo. Then Damascus.', highlight: ['1258.', 'Baghdad', 'Aleppo.', 'Damascus.']},
  {id: 'letter', start: 13, end: 18, text: 'Next target: Egypt. He sends Sultan Qutuz a letter: surrender… or end up like Baghdad.', highlight: ['Egypt.', 'surrender…']},
  {id: 'envoys', start: 18, end: 24, text: 'Qutuz read it… executed the envoys… and hung their heads on the gates of Cairo.', highlight: ['executed', 'heads']},
  {id: 'noback', start: 24, end: 26, text: 'No going back.', highlight: ['No', 'going', 'back.']},
  {id: 'mongke', start: 26, end: 35, text: 'What he didn’t know: months earlier, in China, the Great Khan Möngke had died. Hulagu pulled most of his army back east… leaving one general in Syria, Kitbuqa, with a fraction of the force.', highlight: ['died.', 'east…', 'Kitbuqa,', 'fraction']},
  {id: 'battle', start: 35, end: 44, text: 'September 3rd, 1260. Ain Jalut, Palestine. Baybars leads the vanguard… then fakes a retreat. The Mongols chase him… straight into a trap in the hills.', highlight: ['1260.', 'fakes', 'retreat.', 'trap']},
  {id: 'victory', start: 44, end: 51, text: 'Qutuz throws off his helmet and screams “Wa Islamah!” Kitbuqa is killed. The Mongols never set foot in Egypt.', highlight: ['“Wa', 'Islamah!”', 'never']},
  {id: 'betrayal', start: 51, end: 60, text: 'But Qutuz didn’t get a happy ending. Fifty days later, riding home a hero, he was murdered by his own commanders… led by the man who fought beside him.', highlight: ['murdered', 'own']},
  {id: 'reveal', start: 60, end: 63.5, text: 'Baybars. Who became the next Sultan.', highlight: ['Baybars.', 'Sultan.']},
];

export const TOTAL_SECONDS = LINES[LINES.length - 1].end + 0.5;

export const line = (id: string): Line => {
  const l = LINES.find((x) => x.id === id);
  if (!l) throw new Error(`Unknown line ${id}`);
  return l;
};

// [lon, lat]
export const PLACES = {
  baghdad: [44.36, 33.31],
  aleppo: [37.16, 36.2],
  damascus: [36.29, 33.51],
  cairo: [31.24, 30.04],
  ainJalut: [35.36, 32.55],
  diaoyu: [106.28, 30.0],
  karakorum: [102.8, 47.2],
  tabriz: [46.29, 38.08],
} as const satisfies Record<string, [number, number]>;

// Rough extent of the Mongol Empire in 1259 (stylised, not a survey map).
export const EMPIRE: [number, number][] = [
  [28, 47], [32, 52], [40, 56], [50, 58], [60, 58], [75, 56], [90, 55], [105, 55],
  [120, 53], [130, 48], [128, 42], [122, 40], [118, 35], [110, 33], [104, 30],
  [100, 26], [98, 30], [92, 30], [80, 32], [72, 34], [66, 30], [62, 26], [57, 25],
  [52, 27], [48, 30], [44.5, 31.5], [42, 34], [40, 36.5], [37.5, 37.2], [36.5, 38],
  [40, 40], [44, 41], [48, 42], [47, 45], [40, 45], [34, 45], [30, 46],
];

// Syria, added after Aleppo and Damascus fall.
export const SYRIA: [number, number][] = [
  [40, 36.5], [37.5, 37.2], [36.2, 36.6], [35.8, 35], [35.9, 33.4], [36.4, 32.4],
  [38.5, 32.6], [41, 34], [42, 34],
];

// Camera keyframes: time (s), centre [lon, lat], zoom (d3 Mercator scale).
export type CamKey = {t: number; c: [number, number]; z: number};
export const CAMERA: CamKey[] = [
  {t: 0, c: [41, 33], z: 1250},
  {t: 2.6, c: [39, 32], z: 1500},
  {t: 3.4, c: [72, 36], z: 520},
  {t: 7.0, c: [72, 36], z: 480},
  {t: 7.8, c: [43, 34], z: 2300},
  {t: 10.0, c: [40.5, 34.5], z: 2500},
  {t: 13.0, c: [36, 32.5], z: 2400},
  {t: 18.0, c: [32, 30.5], z: 3600},
  {t: 24.0, c: [33, 31], z: 3000},
  {t: 26.0, c: [80, 36], z: 520},
  {t: 30.0, c: [75, 36], z: 560},
  {t: 33.0, c: [42, 34], z: 1500},
  {t: 35.0, c: [35.36, 32.55], z: 30000},
  {t: 44.0, c: [35.36, 32.55], z: 34000},
  {t: 45.5, c: [38, 34], z: 2000},
  {t: 51.0, c: [34, 31.5], z: 3800},
  {t: 60.0, c: [33.5, 31.2], z: 4200},
];
