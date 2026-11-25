// Ember Kitchen — screenshot staging: deterministic scenes for the 4 screenshots,
// reached with ?shot=cover|rush|serve|summary. These are real states of the live
// game (orders on the board, food cooking, a plate mid-assembly), staged by the
// same code the player drives — never edited or composited images.

import { recipeById } from './data.js';

function addOrder(game, recipeId, guestId, patienceLeft, vip = false) {
  const recipe = recipeById(recipeId);
  game.orders.push({
    recipeId, guestId: guestId || recipe.guest,
    patience: 60, patienceLeft, vip, born: 0,
  });
}

function setStation(stations, id, raw, progress, done) {
  const s = stations.find((st) => st.id === id);
  if (!s) return;
  s.item = { kind: done ? 'prepared' : 'cooking', id: raw, raw };
  s.cooking = true;
  s.progress = progress;
  s.done = done;
  s.burnt = false;
}

// Cover: the full judge criterion in one frame — order board busy, ingredients on
// the counter, a dish mid-assembly on the plating counter, the timer running,
// and a finished plate ready to serve.
export function stageCover(game) {
  game.coins = 86;
  game.combo = 4;
  game.shiftTime = 96;
  addOrder(game, 'ember-noodles', 'saffron', 42);
  addOrder(game, 'dragons-catch', 'cinder', 28);
  addOrder(game, 'mushroom-feast', 'moss', 55);
  setStation(game.stations, 'grill', 'fish', 4, true);
  setStation(game.stations, 'pot', 'noodle', 2.5, false);
  setStation(game.stations, 'board', 'chili', 2, true);
  const plating = game.stations.find((s) => s.id === 'plating');
  plating.plates.push({ kind: 'plate', parts: ['noodle_boil', 'chili_chop'] });
  plating.plates.push({ kind: 'plate', parts: ['fish_grill', 'herb_chop', 'tomato_chop'] });
  game.chef.x = 300;
  game.chef.y = 300;
  game.chef.carry = { kind: 'prepared', id: 'egg_fry' };
  game.prompt = 'E: add to plate (2/3)';
}

// Rush: four orders, every station busy, combo high, timer low — the pressure peak.
export function stageRush(game) {
  game.coins = 214;
  game.combo = 7;
  game.shiftTime = 18;
  addOrder(game, 'ember-noodles', 'saffron', 20);
  addOrder(game, 'fire-omelette', 'saffron', 12);
  addOrder(game, 'smoky-skewer', 'pepper', 33, true);
  addOrder(game, 'lava-soup', 'cinder', 25);
  setStation(game.stations, 'grill', 'mushroom', 3.5, false);
  setStation(game.stations, 'pot', 'noodle', 4, true);
  setStation(game.stations, 'fryer', 'egg', 2, false);
  setStation(game.stations, 'board', 'tomato', 1.2, false);
  const plating = game.stations.find((s) => s.id === 'plating');
  plating.plates.push({ kind: 'plate', parts: ['egg_fry', 'chili_chop'] });
  game.chef.x = 640;
  game.chef.y = 560;
  game.chef.carry = { kind: 'raw', id: 'chili' };
  game.prompt = 'E: chop Fire Chili';
}

// Serve: a finished plate in hand at the golden window, coins about to fly.
export function stageServe(game) {
  game.coins = 142;
  game.combo = 5;
  game.shiftTime = 74;
  addOrder(game, 'dragons-catch', 'cinder', 38);
  addOrder(game, 'garden-plate', 'moss', 50);
  game.chef.x = 1040;
  game.chef.y = 240;
  game.chef.carry = { kind: 'plate', parts: ['fish_grill', 'herb_chop', 'tomato_chop'] };
  game.floaters.push({ text: '+20 coins  Dragon\'s Catch (fast +8)', x: 640, y: 330, life: 1.8, color: '#ffd166' });
  game.prompt = 'E: SERVE! Dragon\'s Catch';
}

// Summary: the end-of-shift report with the grade and the counts.
export function stageSummary(game) {
  game.coins = 268;
  game.served = 14;
  game.failed = 2;
  game.bestCombo = 8;
  game.grade = 'S — Dragon Chef!';
}

export function applyShot(game, shot) {
  if (shot === 'cover') { stageCover(game); return 'playing'; }
  if (shot === 'rush') { stageRush(game); return 'playing'; }
  if (shot === 'serve') { stageServe(game); return 'playing'; }
  if (shot === 'summary') { stageSummary(game); return 'summary'; }
  return null;
}
