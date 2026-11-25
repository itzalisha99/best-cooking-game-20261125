# Ember Kitchen — cook for the dragon court

[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![Rank](https://make.fun/badge/best-cooking-game-20261125-0137/itzalisha99/best-cooking-game-20261125/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![Reward](https://make.fun/badge/best-cooking-game-20261125-0137/itzalisha99/best-cooking-game-20261125/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

You are the head cook of a night-market kitchen that serves a court of hungry
dragons. Grab ingredients from the pantry, cook each one at the right station,
plate three cooked parts into a dish, and serve it at the golden window before
the dragon loses patience. Food left on the heat burns. Wrong dishes cost a
heart. The rush never stops — but a fast serve, a favourite dish, and a long
combo pay extra.

## What is in the kitchen

- **12 recipes** from **8 ingredients** (tomato, onion, mushroom, ember fish,
  noodle, dragon egg, fire chili, moon herb), each with one correct preparation
- **5 dragon guests** — Saffron, Cinder, Moss, Pepper, Bramble — each with a
  favourite dish that pays a +6 tip
- **4 cooking stations** (chopping board, grill, pot, fryer) + plating counter,
  serving window and bin; food burns if left 6 seconds past done
- **VIP Ember Feast** orders worth double coins
- **Combos, speed tips and favourite tips**; 3 difficulties (Apprentice, Cook,
  Dragon Master) and endless shifts that get faster every time
- **Synthesized sound** (WebAudio, no files): chops, sizzles, serve dings and a
  small ember groove — M toggles it

## How to play

Move: WASD / arrow keys, or click to walk. Use: E or click a station. Pause: P.
Sound: M. Restart: R. Pick up an ingredient, cook it at the station that
matches its preparation (chop / grill / boil / fry), carry the cooked part to
the plating counter, add three parts to a plate, pick the plate up when it
matches an order, and serve it at the golden window.

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network requests: `game/` is plain static files, and every
sound is synthesized in code.

## Hand in

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/`
into the output directory and writes `dossier.json` with the vendored
`vendor/makefun-game.ts` library:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Built for the [make.fun](https://make.fun/bounty/best-cooking-game-20261125-0137)
bounty "Make the best cooking game".
