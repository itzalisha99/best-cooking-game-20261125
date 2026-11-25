// Ember Kitchen — the kitchen itself: station layout, walls, collision.
// Top-down kitchen, 1280x720. The order board and HUD sit above the floor;
// the centre island forces a real route between pantry, stoves and plating,
// so every order is a small path-planning puzzle.

export const FLOOR = { x: 24, y: 148, w: 1232, h: 556 };

// One station: a rect on the floor, a kind, and runtime state (item, progress).
// kind: 'pantry' (one per ingredient), 'board', 'grill', 'pot', 'fryer',
//       'plating', 'serve', 'bin'.
export function buildStations() {
  const stations = [];
  const pantryIds = ['tomato', 'onion', 'mushroom', 'fish', 'noodle', 'egg', 'chili', 'herb'];
  // Pantry bins along the top wall, left side: 8 bins, 58px wide.
  pantryIds.forEach((id, i) => {
    stations.push({
      id: 'pantry-' + id, kind: 'pantry', ingredient: id,
      x: 40 + i * 62, y: 152, w: 56, h: 52,
      item: null, progress: 0, cooking: false, done: false, burnt: false, readyAt: 0,
    });
  });
  // Serving window, top wall, right side.
  stations.push({ id: 'serve', kind: 'serve', x: 1000, y: 152, w: 240, h: 52, item: null, progress: 0, cooking: false, done: false, burnt: false, readyAt: 0 });
  // Left column: the four cooking stations. They sit low enough that the
  // corridor under the pantry (y 204..290) belongs to the pantry alone: a
  // chef standing at y=232 is far nearer a pantry bin than the board, so E
  // never grabs the wrong station.
  stations.push({ id: 'board', kind: 'board', x: 40, y: 290, w: 130, h: 86, item: null, progress: 0, cooking: false, done: false, burnt: false, readyAt: 0 });
  stations.push({ id: 'grill', kind: 'grill', x: 40, y: 396, w: 130, h: 86, item: null, progress: 0, cooking: false, done: false, burnt: false, readyAt: 0 });
  stations.push({ id: 'pot', kind: 'pot', x: 40, y: 502, w: 130, h: 86, item: null, progress: 0, cooking: false, done: false, burnt: false, readyAt: 0 });
  stations.push({ id: 'fryer', kind: 'fryer', x: 40, y: 608, w: 130, h: 86, item: null, progress: 0, cooking: false, done: false, burnt: false, readyAt: 0 });
  // Right column: plating counter (holds up to 2 plates) and the bin. The
  // plating counter starts below the serve window's approach lane (y 232) so
  // E at the window serves instead of setting the plate back down.
  stations.push({ id: 'plating', kind: 'plating', x: 1110, y: 290, w: 130, h: 170, plates: [], item: null, progress: 0, cooking: false, done: false, burnt: false, readyAt: 0 });
  stations.push({ id: 'bin', kind: 'bin', x: 1110, y: 480, w: 130, h: 86, item: null, progress: 0, cooking: false, done: false, burnt: false, readyAt: 0 });
  return stations;
}

// The centre island: a solid block the chef walks around. It is the reason a
// run from pantry to grill is a route, not a straight line.
export const ISLAND = { x: 520, y: 400, w: 240, h: 92 };

export function stationById(stations, id) {
  return stations.find((s) => s.id === id);
}

// Is a point inside a rect (with a small margin so the chef can stand close)?
export function nearStation(chef, station, reach = 52) {
  const cx = Math.max(station.x, Math.min(chef.x, station.x + station.w));
  const cy = Math.max(station.y, Math.min(chef.y, station.y + station.h));
  const dx = chef.x - cx;
  const dy = chef.y - cy;
  return dx * dx + dy * dy < reach * reach;
}

export function nearestStation(stations, chef) {
  let best = null;
  let bestD = Infinity;
  for (const s of stations) {
    if (!nearStation(chef, s)) continue;
    const cx = Math.max(s.x, Math.min(chef.x, s.x + s.w));
    const cy = Math.max(s.y, Math.min(chef.y, s.y + s.h));
    const d = (chef.x - cx) ** 2 + (chef.y - cy) ** 2;
    if (d < bestD) { bestD = d; best = s; }
  }
  return best;
}

// Keep the chef inside the floor and out of the island and station rects.
export function collide(chef, stations) {
  chef.x = Math.max(FLOOR.x + chef.r, Math.min(FLOOR.x + FLOOR.w - chef.r, chef.x));
  chef.y = Math.max(FLOOR.y + chef.r, Math.min(FLOOR.y + FLOOR.h - chef.r, chef.y));
  const solids = stations.concat([ISLAND]);
  for (const s of solids) {
    // Circle vs rect: push out along the smallest penetration so the chef
    // slides along counters instead of sticking to them.
    const cx = Math.max(s.x, Math.min(chef.x, s.x + s.w));
    const cy = Math.max(s.y, Math.min(chef.y, s.y + s.h));
    const dx = chef.x - cx;
    const dy = chef.y - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 > 0.01 && d2 < chef.r * chef.r) {
      const d = Math.sqrt(d2);
      chef.x = cx + (dx / d) * chef.r;
      chef.y = cy + (dy / d) * chef.r;
    } else if (d2 <= 0.01) {
      // Centre inside the rect: leave through the nearest side.
      const left = chef.x - s.x + chef.r;
      const right = s.x + s.w - chef.x + chef.r;
      const top = chef.y - s.y + chef.r;
      const bottom = s.y + s.h - chef.y + chef.r;
      const m = Math.min(left, right, top, bottom);
      if (m === left) chef.x = s.x - chef.r;
      else if (m === right) chef.x = s.x + s.w + chef.r;
      else if (m === top) chef.y = s.y - chef.r;
      else chef.y = s.y + s.h + chef.r;
    }
  }
}
