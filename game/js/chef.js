// Ember Kitchen — the chef: movement, carrying, and what the hands hold.
// The chef carries exactly one thing at a time: a raw ingredient, a prepared
// item, a burnt item, or a finished plate. That one-slot limit is the whole
// game: every trip is a choice about what to carry next.

export function makeChef() {
  return {
    x: 640, y: 580, r: 22, speed: 250,
    dx: 0, dy: 0, facing: 1,
    carry: null, // { kind: 'raw'|'prepared'|'burnt'|'plate', id, parts? }
    walkPhase: 0, moving: false,
  };
}

export function moveChef(chef, input, dt) {
  // A movement key cancels click-to-move: the keys always win.
  if (input.up || input.down || input.left || input.right) input.clickTarget = null;
  let mx = 0;
  let my = 0;
  if (input.left) mx -= 1;
  if (input.right) mx += 1;
  if (input.up) my -= 1;
  if (input.down) my += 1;
  if (input.clickTarget) {
    const dx = input.clickTarget.x - chef.x;
    const dy = input.clickTarget.y - chef.y;
    const d = Math.hypot(dx, dy);
    if (d > 8) { mx = dx / d; my = dy / d; }
    else { input.clickTarget = null; }
  }
  const len = Math.hypot(mx, my);
  chef.moving = len > 0;
  if (len > 0) {
    mx /= len; my /= len;
    chef.x += mx * chef.speed * dt;
    chef.y += my * chef.speed * dt;
    if (mx !== 0) chef.facing = mx > 0 ? 1 : -1;
    chef.walkPhase += dt * 12;
  }
}

export function carryLabel(carry) {
  if (!carry) return '';
  if (carry.kind === 'plate') return 'Plate (' + carry.parts.length + '/3)';
  if (carry.kind === 'burnt') return 'Burnt mess';
  return carry.id;
}
