const ADJECTIVES = [
  'Nimble', 'Silent', 'Cosmic', 'Cipher', 'Digital', 'Echo', 'Frost',
  'Ghost', 'Haze', 'Iron', 'Jade', 'Keen', 'Lunar', 'Mystic', 'Neon',
  'Onyx', 'Pixel', 'Quartz', 'Rune', 'Shadow', 'Torch', 'Ultra',
  'Vivid', 'Wire', 'Zenith', 'Amber', 'Blaze', 'Cloud', 'Drift',
];

const NOUNS = [
  'Fox', 'Wolf', 'Hawk', 'Bear', 'Sage', 'Monk', 'Owl', 'Raven',
  'Phoenix', 'Lynx', 'Tiger', 'Viper', 'Crane', 'Falcon', 'Panther',
  'Leopard', 'Eagle', 'Cobra', 'Dragon', 'Sphinx', 'Griffin', 'Hydra',
  'Mantis', 'Condor', 'Jackal', 'Scorpion', 'Wraith', 'Specter',
];

/**
 * Generate a random anonymous alias name
 */
export function generateAlias(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 999) + 1;
  return `${adj}${noun}${num}`;
}

/**
 * Generate a deterministic avatar seed for consistent anonymous avatar rendering
 */
export function generateAvatarSeed(): string {
  return Math.random().toString(36).substring(2, 12);
}
