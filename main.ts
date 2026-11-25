// Ember Kitchen — hand-in program (Node 22, standard library only).
// It gathers the entry into the output directory the grader reads:
//   - game/        the playable game, plain static files, no network
//   - screenshots/ 3-4 renders of the game running in a browser
//   - dossier.json the judge's summary, built by the vendored make.fun library
// Run it outside the grader with MAKEFUN_OUTPUT_DIR set:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outDir, 'game'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// The gate's caps, from the kit: 4 screenshots at most 256 KiB each, game/
// at most 993 files and 48 MiB, paths at most 1000 bytes, dossier text at
// most 160 KiB. buildDossier refuses anything over them, so a bad entry
// fails loudly here instead of silently at the gate.
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
