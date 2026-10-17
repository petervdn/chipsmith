/**
 * A prompt made up from parts at random, to start from on the New page: how many songs, a mood, a
 * kind of piece, the chips, a rhythm and one thing to build it around. Knows nothing of the page.
 */

/** The parts, in the order a prompt joins them. */
const COUNTS = ['One', 'Two', 'Three'];
const MOODS = [
  'dark',
  'sunny',
  'melancholic',
  'frantic',
  'dreamy',
  'tense',
  'triumphant',
  'eerie',
  'playful',
  'brooding',
  'hopeful',
  'mysterious',
  'nostalgic',
  'aggressive',
  'calm',
  'bittersweet',
  'heroic',
  'lonely',
  'mischievous',
  'urgent',
  'cold',
  'warm',
  'cheeky',
  'solemn',
  'restless',
];
const PIECES = [
  'funk grooves',
  'boss battle themes',
  'title screen themes',
  'town themes',
  'fugues',
  'ambient loops',
  'breakbeat tracks',
  'chase themes',
  'end credits themes',
  'puzzle game loops',
  'overworld themes',
  'dungeon themes',
  'underwater levels',
  'castle themes',
  'shop themes',
  'game over jingles',
  'level clear fanfares',
  'night levels',
  'racing themes',
  'space shooter stages',
  'marches',
  'waltzes',
  'lullabies',
  'disco tracks',
  'rock anthems',
  'jazz ballads',
  'bossa novas',
  'drum and bass tracks',
  'synth-pop songs',
  'baroque dances',
];
const CHIPS = ['for the NES', 'for the NES with the SCC'];
const RHYTHMS = [
  'in 4/4',
  'in a straight 4/4 at 120 bpm',
  'in 4/4 with a backbeat',
  'four on the floor',
  'at a relaxed 90 bpm',
  'at a driving 140 bpm',
  'in 3/4',
  'in 6/8',
  'in 2/4 like a march',
  'in 12/8',
  'in 7/8',
  'in 5/4',
  'in 11/16',
  'in 9/8',
  'with a swung shuffle',
  'at a slow 70 bpm',
  'at a racing 170 bpm',
  'in half-time',
  'in double-time',
  'with a syncopated groove',
];
const IDEAS = [
  'with a walking bass',
  'built around a call-and-response hook',
  'where the triangle carries the melody',
  'with arpeggiated chords',
  'with a breakdown in the middle',
  'with a key change near the end',
  'with the noise channel playing a breakbeat',
  'with an echo on the lead',
  'with a catchy whistled-style melody',
  'with a long build-up to a big drop',
  'with a slow intro that speeds up',
  'with a counter-melody against the lead',
  'with stabbing chords on the offbeat',
  'with a pedal note under changing chords',
  'with vibrato on the lead',
  'with pitch slides in the bass',
  'with a drum solo halfway',
  'that ends on an unresolved chord',
  'with a melody that climbs throughout',
  'with a quiet middle section',
  'with a riff passed between the channels',
  'with fast arpeggio runs',
  'with a minor-key turn in the bridge',
  'with sparse drums and lots of space',
  'with the melody doubled in octaves',
];

/**
 * Makes up a prompt at random from its parts: how many songs, a mood, a kind of piece, the chips, a
 * rhythm and one thing to build it around.
 *
 * @param getRandom - Gives numbers from 0 up to 1, as Math.random does.
 * @returns The prompt, one sentence.
 */
export function getRandomPrompt(getRandom: () => number): string {
  function pick(parts: string[]): string {
    return parts[Math.floor(getRandom() * parts.length)] ?? parts[0] ?? '';
  }
  const count = pick(COUNTS);
  const song = count === 'One' ? 'song' : 'songs';
  return `${count} ${pick(MOODS)} ${song}: ${pick(PIECES)} ${pick(CHIPS)}, ${pick(RHYTHMS)}, ${pick(IDEAS)}.`;
}
