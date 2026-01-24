// songs.js
// null means rest
export const SONGS = {
  title: {
    bpm: 132,
    stepsPerBar: 16,
    lengthSteps: 64, // 4 bars

    // melody
    lead: [
      76, null, 79, null, 83, null, 79, null,
      78, null, 81, null, 84, null, 88, null,
    ],

    // bassline
    bass: [
      40, null, 40, null, 43, null, 43, null,
      35, null, 35, null, 38, null, 38, null,
    ],

    // chords for arpeggio, change per bar
    arpChords: [
      [64, 67, 71, 74], // E minor-ish
      [62, 66, 69, 74], // D-ish
      [59, 64, 67, 71], // B-ish
      [60, 64, 67, 72], // C-ish
    ],

    // noise hits (kick-ish) on 1 and 3, plus a couple extras
    drum: [
      1, 0, 0, 0,  0, 0, 1, 0,
      0, 0, 0, 0,  1, 0, 0, 0,
    ],
  },

  overworld: {
    bpm: 120,
    stepsPerBar: 16,
    lengthSteps: 64,

    lead: [
      74, 76, 79, null,  76, 74, 72, null,
      71, 72, 74, null,  72, 71, null, null,
    ],

    bass: [
      36, null, 36, null,  38, null, 38, null,
      31, null, 31, null,  33, null, 33, null,
    ],

    arpChords: [
      [62, 66, 69, 74],
      [60, 64, 67, 72],
      [59, 62, 67, 71],
      [57, 60, 64, 69],
    ],

    drum: [
      1, 0, 0, 0,  0, 0, 1, 0,
      0, 1, 0, 0,  0, 0, 1, 0,
    ],
  },
};
