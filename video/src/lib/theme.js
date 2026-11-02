// Vox house style tokens. Single source of truth for colour + type.
export const W = 1920, H = 1080;

export const C = {
  bg:      '#F7F3EC',   // cream paper
  bgAlt:   '#EFE9DC',   // panel cream
  ink:     '#15120E',   // near-black
  inkSoft: '#6B655C',   // secondary text
  rule:    '#D6CEBF',   // hairlines
  white:   '#FFFFFF',
  dark:    '#120F0C',   // dark-card bg
  darkAlt: '#1E1A15',

  yellow:  '#F2C230',
  yellowD: '#D9A615',
  red:     '#E04B38',
  redD:    '#B9361F',
  teal:    '#2E8B8B',
  tealD:   '#1F6565',
  blue:    '#3C6DA8',
  plum:    '#7C4A6B',
};

// categorical order used for multi-series data
export const SERIES = [C.red, C.teal, C.yellow, C.blue, C.plum];

export const F = {
  display: 'Anton',            // big headlines, all caps
  stat:    'ArchivoBlack',     // huge numbers
  label:   'BarlowCondensed',  // dense caps labels
  body:    'Inter',            // annotations, sentences
  mono:    'RobotoMono',       // data readouts
};

// font(size, family, weight) -> canvas font string
export const font = (size, family = F.body, weight = 400) =>
  `${weight} ${size}px "${family}", "Liberation Sans", sans-serif`;

export const SAFE = { x: 140, y: 96, w: W - 280, h: H - 192 };
