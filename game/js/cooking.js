// Ember Kitchen — cooking: station timers, the interact rules, plating, serving.
// One press of E near a station does the one sensible thing for that station,
// so the game reads at a glance and plays fast with keyboard or mouse.

import { INGREDIENTS, PREP_STATION, recipeById } from './data.js';

export const BURN_AFTER = 6; // seconds a finished item waits before it burns

export function stationAccepts(station, ingredientId) {
  if (station.kind === 'board') return INGREDIENTS[ingredientId].prep === 'chop';
  if (station.kind === 'grill') return INGREDIENTS[ingredientId].prep === 'grill';
  if (station.kind === 'pot') return INGREDIENTS[ingredientId].prep === 'boil';
  if (station.kind === 'fryer') return INGREDIENTS[ingredientId].prep === 'fry';
  return false;
}

// Advance every cooking station one frame. now is seconds since shift start.
export function tickCooking(stations, dt, now, onBurnt) {
  for (const s of stations) {
    if (!s.cooking || !s.item) continue;
    s.progress += dt;
    const need = INGREDIENTS[s.item.raw].prepTime;
    if (!s.done && s.progress >= need) {
      s.done = true;
      s.readyAt = now;
      s.item = { kind: 'prepared', id: s.item.raw + '_' + INGREDIENTS[s.item.raw].prep, raw: s.item.raw };
    } else if (s.done && !s.burnt && now - s.readyAt > BURN_AFTER) {
      s.burnt = true;
      s.item = { kind: 'burnt', id: 'burnt', raw: s.item.raw };
      if (onBurnt) onBurnt(s);
    }
  }
}

// What does E do here? Returns a short prompt for the HUD, or '' for nothing.
export function interactPrompt(game, station) {
  const chef = game.chef;
  if (!station) return '';
  if (station.kind === 'pantry') {
    return chef.carry ? '' : 'E: grab ' + INGREDIENTS[station.ingredient].name;
  }
  if (station.kind === 'board' || station.kind === 'grill' || station.kind === 'pot' || station.kind === 'fryer') {
    if (!station.item) {
      if (chef.carry && chef.carry.kind === 'raw' && stationAccepts(station, chef.carry.id)) {
        return 'E: ' + INGREDIENTS[chef.carry.id].prep + ' ' + INGREDIENTS[chef.carry.id].name;
      }
      if (chef.carry && chef.carry.kind === 'raw') return 'Wrong station — needs the ' + PREP_STATION[INGREDIENTS[chef.carry.id].prep];
      return '';
    }
    if (station.cooking && !station.done) return 'Cooking… ' + Math.ceil(INGREDIENTS[station.item.raw].prepTime - station.progress) + 's';
    if (station.burnt) return chef.carry ? '' : 'E: pick up the burnt mess';
    return chef.carry ? '' : 'E: pick up ' + station.item.id.replace('_', ' ');
  }
  if (station.kind === 'plating') {
    const plates = station.plates;
    if (chef.carry && chef.carry.kind === 'prepared') {
      const open = plates.find((p) => p.parts.length < 3);
      return open ? 'E: add to plate (' + open.parts.length + '/3)' : 'Plates are full';
    }
    if (chef.carry && chef.carry.kind === 'plate') return plates.length < 2 ? 'E: set the plate down' : 'No room for the plate';
    if (!chef.carry && plates.length) {
      const ready = plates.find((p) => plateMatchesOrder(game, p));
      return ready ? 'E: pick up the READY plate!' : 'E: pick up plate (' + plates[0].parts.length + '/3)';
    }
    return 'Plating counter — bring prepared food here';
  }
  if (station.kind === 'serve') {
    if (chef.carry && chef.carry.kind === 'plate') {
      return plateMatchesOrder(game, chef.carry) ? 'E: SERVE! ' + matchingRecipe(game, chef.carry).name : 'E: serve (no order wants this)';
    }
    return 'Serving window — bring a finished plate';
  }
  if (station.kind === 'bin') {
    return chef.carry ? 'E: throw away ' + (chef.carry.kind === 'plate' ? 'plate' : chef.carry.id) : 'Bin — for burnt food and mistakes';
  }
  return '';
}

// The E press itself. Returns an event string for sound/feedback: 'pickup',
// 'place', 'start-cook', 'collect', 'plate', 'serve', 'serve-fail', 'trash', 'no'.
export function interact(game, station) {
  const chef = game.chef;
  if (!station) return 'no';
  if (station.kind === 'pantry') {
    if (chef.carry) return 'no';
    chef.carry = { kind: 'raw', id: station.ingredient };
    return 'pickup';
  }
  if (station.kind === 'board' || station.kind === 'grill' || station.kind === 'pot' || station.kind === 'fryer') {
    if (!station.item) {
      if (chef.carry && chef.carry.kind === 'raw' && stationAccepts(station, chef.carry.id)) {
        station.item = { kind: 'cooking', id: chef.carry.id, raw: chef.carry.id };
        station.cooking = true; station.progress = 0; station.done = false; station.burnt = false;
        chef.carry = null;
        return 'start-cook';
      }
      return 'no';
    }
    if (station.cooking && !station.done) return 'no';
    if (chef.carry) return 'no';
    chef.carry = station.item.kind === 'burnt'
      ? { kind: 'burnt', id: 'burnt' }
      : { kind: 'prepared', id: station.item.id };
    station.item = null; station.cooking = false; station.progress = 0; station.done = false; station.burnt = false;
    return 'collect';
  }
  if (station.kind === 'plating') {
    const plates = station.plates;
    if (chef.carry && chef.carry.kind === 'prepared') {
      let open = plates.find((p) => p.parts.length < 3);
      if (!open) {
        if (plates.length >= 2) return 'no';
        open = { kind: 'plate', parts: [] };
        plates.push(open);
      }
      open.parts.push(chef.carry.id);
      chef.carry = null;
      return 'plate';
    }
    if (chef.carry && chef.carry.kind === 'plate') {
      if (plates.length >= 2) return 'no';
      plates.push(chef.carry);
      chef.carry = null;
      return 'place';
    }
    if (!chef.carry && plates.length) {
      const ready = plates.find((p) => plateMatchesOrder(game, p));
      const pick = ready || plates.reduce((a, b) => (b.parts.length > a.parts.length ? b : a), plates[0]);
      plates.splice(plates.indexOf(pick), 1);
      chef.carry = pick;
      return 'pickup';
    }
    return 'no';
  }
  if (station.kind === 'serve') {
    if (!chef.carry || chef.carry.kind !== 'plate') return 'no';
    const recipe = matchingRecipe(game, chef.carry);
    const parts = chef.carry.parts.slice();
    chef.carry = null;
    if (recipe) return serveOrder(game, recipe, parts);
    game.combo = 0;
    game.hearts -= 1;
    game.floaters.push({ text: 'Wrong dish! -1 ♥', x: 640, y: 330, life: 1.6, color: '#ff6b6b' });
    return 'serve-fail';
  }
  if (station.kind === 'bin') {
    if (!chef.carry) return 'no';
    chef.carry = null;
    return 'trash';
  }
  return 'no';
}

export function plateMatchesOrder(game, plate) {
  return matchingRecipe(game, plate) !== null;
}

export function matchingRecipe(game, plate) {
  for (const order of game.orders) {
    const recipe = recipeById(order.recipeId);
    if (sameParts(recipe.parts, plate.parts)) return recipe;
  }
  return null;
}

export function sameParts(a, b) {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((v, i) => v === sortedB[i]);
}

// Pay out a served order: coins, combo, tips, floaters. Returns 'serve'.
export function serveOrder(game, recipe, plateParts) {
  let order = null;
  for (const o of game.orders) {
    if (sameParts(recipeById(o.recipeId).parts, plateParts)) { order = o; break; }
  }
  const idx = order ? game.orders.indexOf(order) : -1;
  if (idx >= 0) game.orders.splice(idx, 1);
  game.combo += 1;
  game.bestCombo = Math.max(game.bestCombo, game.combo);
  const speedTip = order && order.patienceLeft / order.patience > 0.5 ? 8 : 0;
  const favTip = recipe.guest === order.guestId ? 6 : 0;
  const vipBonus = order && order.vip ? recipe.price : 0;
  const comboBonus = (game.combo - 1) * 2;
  const earned = recipe.price + speedTip + favTip + vipBonus + comboBonus;
  game.coins += earned;
  game.served += 1;
  const bits = [];
  if (speedTip) bits.push('fast +' + speedTip);
  if (favTip) bits.push('favourite +' + favTip);
  if (vipBonus) bits.push('VIP x2');
  if (comboBonus) bits.push('combo +' + comboBonus);
  game.floaters.push({
    text: '+' + earned + ' coins  ' + recipe.name + (bits.length ? ' (' + bits.join(', ') + ')' : ''),
    x: 640, y: 330, life: 1.8, color: '#ffd166',
  });
  return 'serve';
}
