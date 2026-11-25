// Ember Kitchen — boot and game loop. Screens: menu → playing → paused →
// summary (next shift) or game-over. One requestAnimationFrame loop, one
// update step, one draw step. ?shot=cover|rush|serve|summary stages a fixed
// scene for screenshots; ?seed= is accepted and ignored (shots are fixed).

import { buildStations, nearestStation, collide, stationById } from './kitchen.js';
import { makeChef, moveChef } from './chef.js';
import { tickCooking, interact, interactPrompt } from './cooking.js';
import { makeOrderState, tickOrders, gradeShift } from './orders.js';
import { makeAudio, playSound, startMusic, stopMusic } from './audio.js';
import { makeInput, bindInput } from './input.js';
import { drawGame, drawMenu, drawSummary, drawGameOver, drawPaused, W, H } from './render.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = W;
canvas.height = H;

const input = makeInput();
const audio = makeAudio();

let game = null;
let screen = 'menu'; // menu | playing | paused | summary | gameover
let lastTime = 0;
let shotMode = null;

function newGame(difficultyId) {
  const base = makeOrderState(difficultyId);
  const g = {
    ...base,
    stations: buildStations(),
    chef: makeChef(),
    prompt: '',
    grade: '',
    ui: { buttons: [] },
  };
  return g;
}

function startShift(difficultyId) {
  game = newGame(difficultyId);
  input.clickTarget = null;
  input.clickStation = null;
  screen = 'playing';
  startMusic(audio);
}

function startGame() {
  startShift(game ? game.difficultyId : 'cook');
}

bindInput(input, canvas, (code) => {
  if (code === 'KeyP' && (screen === 'playing' || screen === 'paused')) {
    screen = screen === 'playing' ? 'paused' : 'playing';
    playSound(audio, 'click');
  }
  if (code === 'KeyM') {
    audio.muted = !audio.muted;
    if (audio.muted) stopMusic(audio); else if (screen === 'playing') startMusic(audio);
  }
  if (code === 'KeyR' && (screen === 'playing' || screen === 'gameover' || screen === 'summary')) startGame();
  if (code === 'Enter' && screen === 'menu') startGame();
});

function buttonAt(x, y) {
  if (!game || !game.ui || !game.ui.buttons) return null;
  return game.ui.buttons.find((b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) || null;
}

function handleClick(x, y) {
  const btn = buttonAt(x, y);
  if (btn) {
    // A button click is not a walk order: cancel any click-to-move target.
    input.clickTarget = null;
    input.clickStation = null;
    playSound(audio, 'click');
    if (btn.id === 'start') { startGame(); return; }
    if (btn.id.startsWith('diff-')) { game.difficultyId = btn.id.slice(5); return; }
    if (btn.id === 'next-shift') {
      const keep = { coins: game.coins, difficultyId: game.difficultyId, shift: game.shift + 1 };
      game = newGame(keep.difficultyId);
      game.coins = keep.coins;
      game.shift = keep.shift;
      screen = 'playing';
      return;
    }
    if (btn.id === 'restart') { startGame(); return; }
    if (btn.id === 'menu') { game = newGame(game.difficultyId); screen = 'menu'; return; }
  }
  if (screen === 'playing') {
    input.clickTarget = { x, y };
    const station = nearestStation(game.stations, { x, y });
    // Clicking a station walks to it; the loop interacts on arrival.
    if (station) input.clickStation = station.id;
  }
}

canvas.addEventListener('mousedown', (e) => {
  const r = canvas.getBoundingClientRect();
  const x = (e.clientX - r.left) * (canvas.width / r.width);
  const y = (e.clientY - r.top) * (canvas.height / r.height);
  handleClick(x, y);
});

function update(dt) {
  if (screen !== 'playing' || !game || game.frozen) return;
  moveChef(game.chef, input, dt);
  collide(game.chef, game.stations);

  // Arrived at a clicked station: use it once.
  if (input.clickStation) {
    const station = stationById(game.stations, input.clickStation);
    if (station) {
      const near = nearestStation(game.stations, game.chef);
      if (near === station) {
        const ev = interact(game, station);
        playSound(audio, ev);
        input.clickStation = null;
        input.clickTarget = null;
      }
    } else input.clickStation = null;
  }
  if (input.interactPressed) {
    input.interactPressed = false;
    const station = nearestStation(game.stations, game.chef);
    const ev = interact(game, station);
    playSound(audio, ev);
  }

  tickCooking(game.stations, dt, game.elapsed, (s) => playSound(audio, 'burnt'));
  const result = tickOrders(game, dt);
  if (result === 'shift-over') {
    game.grade = gradeShift(game);
    screen = 'summary';
    playSound(audio, 'shift-end');
    stopMusic(audio);
  } else if (result === 'game-over') {
    screen = 'gameover';
    playSound(audio, 'timeout');
    stopMusic(audio);
  }

  const station = nearestStation(game.stations, game.chef);
  game.prompt = interactPrompt(game, station);
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  if (screen === 'menu') { drawMenu(ctx, game); return; }
  drawGame(ctx, game);
  if (screen === 'summary') drawSummary(ctx, game);
  else if (screen === 'gameover') drawGameOver(ctx, game);
  else if (screen === 'paused') drawPaused(ctx, game);
}

function loop(t) {
  const dt = Math.min(0.05, (t - lastTime) / 1000 || 0.016);
  lastTime = t;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

// Boot: menu by default; ?shot= stages a fixed scene for screenshots.
const params = new URLSearchParams(location.search);
game = newGame('cook');
shotMode = params.get('shot');
if (shotMode) {
  const next = applyShot(game, shotMode);
  if (next) screen = next;
  // Freeze the staged scene: screenshots are taken of this exact frame.
  if (next === 'playing') {
    // Keep orders/cooking visible but stop the clock so the shot is stable.
    game.frozen = true;
  }
}
if (game.frozen) {
  // Draw one frozen frame; the loop keeps running but update() no-ops.
  draw();
}
requestAnimationFrame(loop);

// Debug/testing handle: the playtest script reads window.EMBER.
window.EMBER = {
  get screen() { return screen; },
  get game() { return game; },
  start: startGame,
  setDifficulty(id) { game.difficultyId = id; },
};
