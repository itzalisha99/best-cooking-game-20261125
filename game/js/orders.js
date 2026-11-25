// Ember Kitchen — orders: the order board, patience timers, the shift clock,
// VIP feasts, and the escalating rush. Orders are the pressure; the kitchen
// is the puzzle. Pressure grows by spawning faster, never by adding chores.

import { RECIPES, DIFFICULTIES, GUESTS } from './data.js';

export function makeOrderState(difficultyId) {
  const d = DIFFICULTIES[difficultyId];
  return {
    difficultyId,
    shift: 1,
    shiftTime: d.shiftLength, // seconds left in the shift
    shiftLength: d.shiftLength,
    hearts: d.hearts,
    maxHearts: d.hearts,
    coins: 0,
    combo: 0,
    bestCombo: 0,
    served: 0,
    failed: 0,
    orders: [],
    spawnIn: 2.5, // first order arrives quickly so the board is never empty
    vipIn: 45, // seconds until the next VIP Ember Feast
    elapsed: 0,
    floaters: [],
  };
}

export function currentDifficulty(game) {
  const base = DIFFICULTIES[game.difficultyId];
  const shrink = Math.pow(0.9, game.shift - 1);
  return {
    ...base,
    orderEvery: base.orderEvery * shrink,
    patience: base.patience * Math.pow(0.95, game.shift - 1),
  };
}

function pickRecipe(rng) {
  return RECIPES[Math.floor(rng() * RECIPES.length)];
}

export function spawnOrder(game, vip = false) {
  const d = currentDifficulty(game);
  const recipe = pickRecipe(Math.random);
  const guest = GUESTS[Math.floor(Math.random() * GUESTS.length)];
  game.orders.push({
    recipeId: recipe.id,
    guestId: vip ? recipe.guest : guest.id,
    patience: vip ? d.patience * 1.5 : d.patience,
    patienceLeft: vip ? d.patience * 1.5 : d.patience,
    vip,
    born: game.elapsed,
  });
}

// Advance orders, spawn timers and the shift clock one frame.
// Returns 'shift-over' when the shift ends, 'game-over' when hearts run out.
export function tickOrders(game, dt) {
  const d = currentDifficulty(game);
  game.elapsed += dt;
  game.shiftTime -= dt;

  // Escalation: every 30s of the shift, orders arrive 10% faster.
  const escalation = Math.pow(0.9, Math.floor(game.elapsed / 30));
  game.spawnIn -= dt;
  if (game.spawnIn <= 0 && game.orders.length < 4) {
    spawnOrder(game, false);
    game.spawnIn = d.orderEvery * escalation;
  }
  game.vipIn -= dt;
  if (game.vipIn <= 0 && game.orders.length < 4) {
    spawnOrder(game, true);
    game.floaters.push({ text: 'VIP EMBER FEAST! Double coins!', x: 640, y: 330, life: 2.2, color: '#ffb703' });
    game.vipIn = 55;
  }

  for (let i = game.orders.length - 1; i >= 0; i--) {
    const o = game.orders[i];
    o.patienceLeft -= dt;
    if (o.patienceLeft <= 0) {
      game.orders.splice(i, 1);
      game.failed += 1;
      game.hearts -= 1;
      game.combo = 0;
      game.floaters.push({ text: 'Order timed out! -1 ♥', x: 640, y: 330, life: 1.6, color: '#ff6b6b' });
      if (game.hearts <= 0) return 'game-over';
    }
  }

  // Floaters drift up and fade.
  for (let i = game.floaters.length - 1; i >= 0; i--) {
    const f = game.floaters[i];
    f.life -= dt;
    f.y -= 22 * dt;
    if (f.life <= 0) game.floaters.splice(i, 1);
  }

  if (game.shiftTime <= 0) return 'shift-over';
  return null;
}

export function gradeShift(game) {
  const rate = game.served / Math.max(1, game.served + game.failed);
  if (game.served >= 12 && rate >= 0.85) return 'S — Dragon Chef!';
  if (game.served >= 9 && rate >= 0.75) return 'A — Head Cook';
  if (game.served >= 6 && rate >= 0.6) return 'B — Solid Cook';
  if (game.served >= 3) return 'C — Apprentice';
  return 'D — The dragons are still hungry';
}
