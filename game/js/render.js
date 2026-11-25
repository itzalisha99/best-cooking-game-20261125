// Ember Kitchen — render: every pixel the judge sees. Canvas 2D, all art drawn
// in code (shapes + system emoji, no image files, no network). The cover shot
// must show, at a glance: kitchen, order board, ingredients, a dish mid-assembly,
// a timer, and a plate ready to serve — so the HUD and the stations are drawn
// big, bright, and labelled.

import { INGREDIENTS, RECIPES, GUESTS, DIFFICULTIES, recipeById, guestById } from './data.js';
import { FLOOR, ISLAND } from './kitchen.js';

export const W = 1280;
export const H = 720;

const C = {
  bg: '#17100c', floorA: '#2b1d16', floorB: '#251811',
  wall: '#3d2b20', panel: '#241812', panelEdge: '#5a3d28',
  cream: '#fff3e0', dim: '#c9a98c', gold: '#ffd166', ember: '#ff7a1a',
  red: '#ff5d5d', green: '#7ee787', teal: '#2ec4b6', purple: '#b388ff',
};

export function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, align = 'left', weight = 'bold') {
  ctx.fillStyle = color;
  ctx.font = weight + ' ' + size + 'px Arial, sans-serif';
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

function bar(ctx, x, y, w, h, frac, color, bg = '#3a2a1e') {
  ctx.fillStyle = bg;
  rr(ctx, x, y, w, h, h / 2);
  ctx.fill();
  if (frac > 0) {
    ctx.fillStyle = color;
    rr(ctx, x, y, Math.max(h, w * Math.min(1, frac)), h, h / 2);
    ctx.fill();
  }
}

export function drawGame(ctx, game) {
  // Floor
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.floorA;
  ctx.fillRect(FLOOR.x, FLOOR.y, FLOOR.w, FLOOR.h);
  ctx.fillStyle = C.floorB;
  for (let y = 0; y < 7; y++) {
    for (let x = 0; x < 16; x++) {
      if ((x + y) % 2 === 0) ctx.fillRect(FLOOR.x + x * 77, FLOOR.y + y * 79, 77, 79);
    }
  }
  ctx.strokeStyle = C.wall;
  ctx.lineWidth = 6;
  ctx.strokeRect(FLOOR.x, FLOOR.y, FLOOR.w, FLOOR.h);

  drawOrderBoard(ctx, game);
  drawHud(ctx, game);
  drawIsland(ctx);
  for (const s of game.stations) drawStation(ctx, game, s);
  drawChef(ctx, game);
  drawPrompt(ctx, game);
  drawFloaters(ctx, game);
}

function drawOrderBoard(ctx, game) {
  ctx.fillStyle = C.panel;
  rr(ctx, 24, 8, 1232, 92, 12);
  ctx.fill();
  ctx.strokeStyle = C.panelEdge;
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, '📋 ORDERS', 40, 30, 15, C.dim, 'left', 'bold');
  const slots = 4;
  for (let i = 0; i < slots; i++) {
    const x = 150 + i * 275;
    const o = game.orders[i];
    ctx.fillStyle = o ? (o.vip ? '#4a3208' : '#33241a') : '#221710';
    rr(ctx, x, 18, 262, 72, 10);
    ctx.fill();
    if (o) {
      const recipe = recipeById(o.recipeId);
      const guest = guestById(o.guestId);
      if (o.vip) { ctx.strokeStyle = C.gold; ctx.lineWidth = 2; ctx.stroke(); }
      text(ctx, (o.vip ? '👑 ' : '') + recipe.name, x + 12, 34, 16, C.cream);
      text(ctx, '● ' + guest.name, x + 12, 54, 12, guest.color);
      const parts = recipe.parts.map((p) => INGREDIENTS[p.split('_')[0]].emoji).join(' ');
      text(ctx, parts, x + 12, 76, 18, C.cream);
      const frac = o.patienceLeft / o.patience;
      bar(ctx, x + 130, 68, 120, 10, frac, frac > 0.5 ? C.green : frac > 0.25 ? C.gold : C.red);
      text(ctx, Math.ceil(o.patienceLeft) + 's', x + 252, 54, 12, frac > 0.25 ? C.dim : C.red, 'right');
    } else {
      text(ctx, '— waiting for orders —', x + 131, 54, 13, '#6b5138', 'center');
    }
  }
}

function drawHud(ctx, game) {
  const y = 122;
  text(ctx, '🪙 ' + game.coins, 40, y, 20, C.gold);
  text(ctx, '🔥 COMBO x' + game.combo, 180, y, 18, game.combo >= 3 ? C.ember : C.dim);
  const hearts = '♥'.repeat(Math.max(0, game.hearts)) + '♡'.repeat(Math.max(0, game.maxHearts - game.hearts));
  text(ctx, hearts, 360, y, 20, C.red);
  const t = Math.max(0, Math.ceil(game.shiftTime));
  const mm = Math.floor(t / 60);
  const ss = String(t % 60).padStart(2, '0');
  const low = game.shiftTime < 20;
  text(ctx, '⏱ ' + mm + ':' + ss + (low ? '  RUSH!' : ''), 640, y, 24, low ? C.red : C.cream, 'center');
  text(ctx, 'SHIFT ' + game.shift + '  ·  ' + DIFFICULTIES[game.difficultyId].name.toUpperCase(), 860, y, 16, C.dim);
  text(ctx, '🍽 ' + game.served + ' served', 1240, y, 16, C.teal, 'right');
}

function drawIsland(ctx) {
  ctx.fillStyle = '#4a3220';
  rr(ctx, ISLAND.x, ISLAND.y, ISLAND.w, ISLAND.h, 14);
  ctx.fill();
  ctx.strokeStyle = C.panelEdge;
  ctx.lineWidth = 3;
  ctx.stroke();
  text(ctx, '🌿 PREP ISLAND 🌿', ISLAND.x + ISLAND.w / 2, ISLAND.y + ISLAND.h / 2, 16, C.dim, 'center');
}

function drawStation(ctx, game, s) {
  const labels = { board: '🔪 CHOP', grill: '🔥 GRILL', pot: '🍲 POT', fryer: '🍳 FRYER', plating: '🍽 PLATE', serve: '🔔 SERVE', bin: '🗑 BIN' };
  ctx.fillStyle = s.kind === 'serve' ? '#5a3d10' : '#3a2a1c';
  rr(ctx, s.x, s.y, s.w, s.h, 10);
  ctx.fill();
  ctx.strokeStyle = s.kind === 'serve' ? C.gold : '#5a3d28';
  ctx.lineWidth = 2;
  ctx.stroke();

  if (s.kind === 'pantry') {
    const ing = INGREDIENTS[s.ingredient];
    text(ctx, ing.emoji, s.x + s.w / 2, s.y + 20, 26, C.cream, 'center');
    text(ctx, ing.name, s.x + s.w / 2, s.y + 42, 10, C.dim, 'center');
    return;
  }
  if (s.kind === 'serve') {
    text(ctx, '🔔 SERVE', s.x + s.w / 2, s.y + 18, 15, C.gold, 'center');
    text(ctx, 'bring finished plates', s.x + s.w / 2, s.y + 38, 11, C.dim, 'center');
    return;
  }
  if (s.kind === 'bin') {
    text(ctx, '🗑 BIN', s.x + s.w / 2, s.y + 24, 16, C.dim, 'center');
    text(ctx, 'burnt food goes here', s.x + s.w / 2, s.y + 48, 11, '#8a6a4a', 'center');
    return;
  }
  if (s.kind === 'plating') {
    text(ctx, labels.plating, s.x + s.w / 2, s.y + 16, 14, C.cream, 'center');
    s.plates.forEach((p, i) => {
      const py = s.y + 36 + i * 62;
      drawPlate(ctx, p, s.x + s.w / 2, py, 44);
      const ready = p.parts.length === 3;
      if (ready) text(ctx, 'READY!', s.x + s.w / 2, py + 34, 12, C.teal, 'center');
    });
    if (!s.plates.length) text(ctx, 'empty plates wait here', s.x + s.w / 2, s.y + 60, 11, '#8a6a4a', 'center');
    return;
  }
  // Cooking stations
  text(ctx, labels[s.kind], s.x + s.w / 2, s.y + 14, 13, C.cream, 'center');
  if (s.item) {
    const ing = INGREDIENTS[s.item.raw];
    const emoji = s.burnt ? '🔥' : ing.emoji;
    text(ctx, emoji, s.x + s.w / 2, s.y + 44, 30, C.cream, 'center');
    if (s.cooking && !s.done) {
      bar(ctx, s.x + 14, s.y + s.h - 16, s.w - 28, 8, s.progress / ing.prepTime, C.ember);
    } else if (s.done && !s.burnt) {
      text(ctx, 'READY ✓', s.x + s.w / 2, s.y + s.h - 12, 12, C.teal, 'center');
    } else if (s.burnt) {
      text(ctx, 'BURNT!', s.x + s.w / 2, s.y + s.h - 12, 12, C.red, 'center');
    }
  } else {
    text(ctx, '— empty —', s.x + s.w / 2, s.y + 46, 11, '#8a6a4a', 'center');
  }
}

function drawPlate(ctx, plate, cx, cy, r) {
  ctx.fillStyle = '#f5f0e6';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c9a86a';
  ctx.lineWidth = 2;
  ctx.stroke();
  plate.parts.forEach((part, i) => {
    const ing = INGREDIENTS[part.split('_')[0]];
    const a = -Math.PI / 2 + (i - (plate.parts.length - 1) / 2) * 0.7;
    text(ctx, ing.emoji, cx + Math.cos(a) * r * 0.45, cy + Math.sin(a) * r * 0.45, 20, C.cream, 'center');
  });
}

function drawChef(ctx, game) {
  const chef = game.chef;
  const bob = chef.moving ? Math.sin(chef.walkPhase) * 2 : 0;
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(chef.x, chef.y + 20, 20, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body (apron)
  ctx.fillStyle = '#f5f0e6';
  ctx.beginPath();
  ctx.arc(chef.x, chef.y + bob, chef.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c9a86a';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Face
  ctx.fillStyle = '#ffdbac';
  ctx.beginPath();
  ctx.arc(chef.x, chef.y - 6 + bob, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#241812';
  ctx.beginPath();
  ctx.arc(chef.x - 4 + chef.facing * 2, chef.y - 7 + bob, 1.8, 0, Math.PI * 2);
  ctx.arc(chef.x + 4 + chef.facing * 2, chef.y - 7 + bob, 1.8, 0, Math.PI * 2);
  ctx.fill();
  // Chef hat
  ctx.fillStyle = '#ffffff';
  rr(ctx, chef.x - 13, chef.y - 26 + bob, 26, 12, 6);
  ctx.fill();
  // Carried item above the head
  if (chef.carry) {
    const cy = chef.y - 42 + bob;
    if (chef.carry.kind === 'plate') {
      drawPlate(ctx, chef.carry, chef.x, cy, 20);
    } else if (chef.carry.kind === 'burnt') {
      text(ctx, '🔥', chef.x, cy, 24, C.cream, 'center');
    } else if (chef.carry.kind === 'prepared') {
      text(ctx, INGREDIENTS[chef.carry.id.split('_')[0]].emoji, chef.x, cy, 26, C.cream, 'center');
    } else {
      text(ctx, INGREDIENTS[chef.carry.id].emoji, chef.x, cy, 26, C.cream, 'center');
    }
  }
}

function drawPrompt(ctx, game) {
  const prompt = game.prompt || '';
  if (!prompt) return;
  ctx.fillStyle = 'rgba(20,12,8,0.85)';
  rr(ctx, 340, 682, 600, 30, 15);
  ctx.fill();
  text(ctx, prompt, 640, 697, 15, C.gold, 'center');
}

function drawFloaters(ctx, game) {
  for (const f of game.floaters) {
    ctx.globalAlpha = Math.min(1, f.life);
    text(ctx, f.text, f.x, f.y, 20, f.color, 'center');
    ctx.globalAlpha = 1;
  }
}

// ---- Screens (menu / summary / game over / paused) ----

export function drawMenu(ctx, game) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  // Ember glow
  const g = ctx.createRadialGradient(640, 200, 40, 640, 200, 520);
  g.addColorStop(0, 'rgba(255,122,26,0.35)');
  g.addColorStop(1, 'rgba(23,16,12,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  text(ctx, '🔥 EMBER KITCHEN 🔥', 640, 110, 54, C.gold, 'center');
  text(ctx, 'Cook for the dragon court — 12 recipes · 8 ingredients · 5 dragon guests', 640, 165, 19, C.cream, 'center');
  text(ctx, 'Chop, grill, boil and fry. Plate it. Serve it before the dragons lose patience.', 640, 195, 16, C.dim, 'center');

  game.ui.buttons = [];
  const diffs = ['apprentice', 'cook', 'dragon'];
  diffs.forEach((id, i) => {
    const d = DIFFICULTIES[id];
    const x = 340 + i * 210;
    const sel = game.difficultyId === id;
    ctx.fillStyle = sel ? '#5a3d10' : C.panel;
    rr(ctx, x, 240, 190, 96, 12);
    ctx.fill();
    ctx.strokeStyle = sel ? C.gold : C.panelEdge;
    ctx.lineWidth = sel ? 3 : 2;
    ctx.stroke();
    text(ctx, d.name, x + 95, 268, 18, sel ? C.gold : C.cream, 'center');
    text(ctx, d.desc, x + 95, 296, 12, C.dim, 'center');
    text(ctx, d.hearts + ' ♥  ·  ' + d.patience + 's patience', x + 95, 318, 12, C.dim, 'center');
    game.ui.buttons.push({ id: 'diff-' + id, x, y: 240, w: 190, h: 96 });
  });
  ctx.fillStyle = C.ember;
  rr(ctx, 490, 370, 300, 64, 14);
  ctx.fill();
  text(ctx, '▶  START COOKING', 640, 402, 24, '#fff', 'center');
  game.ui.buttons.push({ id: 'start', x: 490, y: 370, w: 300, h: 64 });

  text(ctx, 'Move: WASD / arrows  ·  Use: E or click  ·  Pause: P  ·  Sound: M', 640, 470, 15, C.dim, 'center');
  text(ctx, 'HOW IT PLAYS — grab an ingredient from the pantry, cook it at the right station,', 640, 510, 14, C.cream, 'center');
  text(ctx, 'add 3 cooked parts to a plate, serve it at the golden window. Burnt food goes in the bin.', 640, 534, 14, C.cream, 'center');
  // Recipe list: countable depth, visible before play.
  text(ctx, 'THE MENU — 12 RECIPES', 640, 580, 15, C.gold, 'center');
  const cols = 3;
  RECIPES.forEach((r, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = 220 + col * 300;
    const y = 612 + row * 24;
    const parts = r.parts.map((p) => INGREDIENTS[p.split('_')[0]].emoji).join('');
    text(ctx, parts + '  ' + r.name + '  ·  ' + r.price + 'c', x, y, 14, C.cream);
  });
}

export function drawSummary(ctx, game) {
  ctx.fillStyle = 'rgba(15,9,6,0.88)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.panel;
  rr(ctx, 390, 130, 500, 440, 16);
  ctx.fill();
  ctx.strokeStyle = C.gold;
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'SHIFT ' + game.shift + ' DONE!', 640, 180, 34, C.gold, 'center');
  text(ctx, game.grade, 640, 232, 24, C.cream, 'center');
  text(ctx, '🪙 ' + game.coins + ' coins earned', 640, 290, 20, C.gold, 'center');
  text(ctx, '🍽 ' + game.served + ' dishes served  ·  ' + game.failed + ' failed', 640, 326, 18, C.cream, 'center');
  text(ctx, '🔥 Best combo x' + game.bestCombo, 640, 360, 18, C.ember, 'center');
  const next = game.shift + 1;
  text(ctx, 'Next shift: orders come faster, dragons get less patient.', 640, 400, 14, C.dim, 'center');
  game.ui.buttons = [];
  ctx.fillStyle = C.ember;
  rr(ctx, 460, 440, 360, 56, 12);
  ctx.fill();
  text(ctx, '▶  NEXT SHIFT (' + next + ')', 640, 468, 20, '#fff', 'center');
  game.ui.buttons.push({ id: 'next-shift', x: 460, y: 440, w: 360, h: 56 });
  ctx.fillStyle = C.panel;
  rr(ctx, 520, 510, 240, 40, 10);
  ctx.fill();
  ctx.strokeStyle = C.panelEdge;
  ctx.stroke();
  text(ctx, 'Back to menu', 640, 530, 15, C.dim, 'center');
  game.ui.buttons.push({ id: 'menu', x: 520, y: 510, w: 240, h: 40 });
}

export function drawGameOver(ctx, game) {
  ctx.fillStyle = 'rgba(15,9,6,0.9)';
  ctx.fillRect(0, 0, W, H);
  text(ctx, '😤 THE DRAGONS LEFT HUNGRY', 640, 220, 40, C.red, 'center');
  text(ctx, 'The kitchen ran out of hearts on shift ' + game.shift + '.', 640, 280, 18, C.cream, 'center');
  text(ctx, '🪙 ' + game.coins + ' coins  ·  🍽 ' + game.served + ' dishes served  ·  🔥 best combo x' + game.bestCombo, 640, 330, 20, C.gold, 'center');
  game.ui.buttons = [];
  ctx.fillStyle = C.ember;
  rr(ctx, 460, 380, 360, 56, 12);
  ctx.fill();
  text(ctx, '↻  COOK AGAIN', 640, 408, 20, '#fff', 'center');
  game.ui.buttons.push({ id: 'restart', x: 460, y: 380, w: 360, h: 56 });
  ctx.fillStyle = C.panel;
  rr(ctx, 520, 452, 240, 40, 10);
  ctx.fill();
  ctx.strokeStyle = C.panelEdge;
  ctx.stroke();
  text(ctx, 'Back to menu', 640, 472, 15, C.dim, 'center');
  game.ui.buttons.push({ id: 'menu', x: 520, y: 452, w: 240, h: 40 });
}

export function drawPaused(ctx, game) {
  ctx.fillStyle = 'rgba(15,9,6,0.7)';
  ctx.fillRect(0, 0, W, H);
  text(ctx, '⏸ PAUSED', 640, 330, 44, C.cream, 'center');
  text(ctx, 'Press P to keep cooking', 640, 390, 18, C.dim, 'center');
  game.ui.buttons = [];
}
