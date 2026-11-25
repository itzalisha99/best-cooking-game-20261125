// Ember Kitchen — input: keyboard (WASD/arrows + E) and mouse (click to walk,
// click a station to walk to it and use it). One input object, read by the loop.

export function makeInput() {
  return {
    up: false, down: false, left: false, right: false,
    interactPressed: false, // set true on E keydown or station click, consumed by the loop
    clickTarget: null, // {x, y} in canvas coords, or null
    clickStation: null, // station id clicked, or null
    mouse: { x: 0, y: 0 },
  };
}

const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
};

export function bindInput(input, canvas, onKey) {
  window.addEventListener('keydown', (e) => {
    if (KEYMAP[e.key] || e.code in KEYMAP) {
      input[KEYMAP[e.key] || KEYMAP[e.code]] = true;
      e.preventDefault();
    }
    if (e.code === 'KeyE' || e.code === 'Space') {
      if (!e.repeat) input.interactPressed = true;
      e.preventDefault();
    }
    if (onKey) onKey(e.code, e);
  });
  window.addEventListener('keyup', (e) => {
    const dir = KEYMAP[e.key] || KEYMAP[e.code];
    if (dir) input[dir] = false;
  });
  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    input.mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
    input.mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
  });
  canvas.addEventListener('mousedown', (e) => {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) * (canvas.width / r.width);
    const y = (e.clientY - r.top) * (canvas.height / r.height);
    input.clickTarget = { x, y };
    input.mouse.x = x;
    input.mouse.y = y;
  });
}
