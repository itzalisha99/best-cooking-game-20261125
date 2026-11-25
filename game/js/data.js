// Ember Kitchen — the game's data: ingredients, recipes, dragon guests, difficulties.
// Every number here is a design choice: 8 ingredients, 12 recipes, 5 guests, 3 difficulties.
// Each ingredient has exactly one correct preparation; each recipe is a set of
// 2-3 prepared ingredients, so orders force a different route through the kitchen.

export const INGREDIENTS = {
  tomato:   { name: 'Tomato',   color: '#e5484d', prep: 'chop', prepTime: 2.0, emoji: '🍅' },
  onion:    { name: 'Onion',    color: '#f5f0e6', prep: 'chop', prepTime: 2.0, emoji: '🧅' },
  mushroom: { name: 'Mushroom', color: '#c9a86a', prep: 'grill', prepTime: 4.0, emoji: '🍄' },
  fish:     { name: 'Ember Fish', color: '#ff9f43', prep: 'grill', prepTime: 4.0, emoji: '🐟' },
  noodle:   { name: 'Noodle',   color: '#ffd166', prep: 'boil', prepTime: 4.0, emoji: '🍜' },
  egg:      { name: 'Dragon Egg', color: '#fff3b0', prep: 'fry', prepTime: 3.0, emoji: '🥚' },
  chili:    { name: 'Fire Chili', color: '#ff5d3b', prep: 'chop', prepTime: 2.0, emoji: '🌶️' },
  herb:     { name: 'Moon Herb', color: '#7ee787', prep: 'chop', prepTime: 2.0, emoji: '🌿' },
};

// A prepared item is "<ingredient>_<prep>", e.g. "tomato_chop", "fish_grill".
export function preparedName(id) {
  const ing = INGREDIENTS[id];
  return ing.name + ' (' + ing.prep + 'ped)';
}

export const PREP_VERB = { chop: 'Chop', grill: 'Grill', boil: 'Boil', fry: 'Fry' };
export const PREP_STATION = { chop: 'board', grill: 'grill', boil: 'pot', fry: 'fryer' };

// 12 recipes. parts are prepared-item ids. price is the base coin reward.
export const RECIPES = [
  { id: 'ember-noodles',   name: 'Ember Noodles',   parts: ['noodle_boil', 'chili_chop', 'egg_fry'],      price: 18, guest: 'saffron' },
  { id: 'dragons-catch',   name: "Dragon's Catch",  parts: ['fish_grill', 'herb_chop', 'tomato_chop'],     price: 20, guest: 'cinder' },
  { id: 'mushroom-feast',  name: 'Mushroom Feast',  parts: ['mushroom_grill', 'onion_chop', 'herb_chop'],  price: 16, guest: 'moss' },
  { id: 'fire-omelette',   name: 'Fire Omelette',   parts: ['egg_fry', 'chili_chop', 'tomato_chop'],       price: 15, guest: 'saffron' },
  { id: 'market-stirfry',  name: 'Market Stir-fry', parts: ['noodle_boil', 'mushroom_grill', 'onion_chop'], price: 17, guest: 'pepper' },
  { id: 'lava-soup',       name: 'Lava Soup',       parts: ['noodle_boil', 'tomato_chop', 'herb_chop'],    price: 16, guest: 'cinder' },
  { id: 'smoky-skewer',    name: 'Smoky Skewer',    parts: ['fish_grill', 'mushroom_grill', 'chili_chop'], price: 19, guest: 'pepper' },
  { id: 'garden-plate',    name: 'Garden Plate',    parts: ['tomato_chop', 'onion_chop', 'herb_chop'],     price: 12, guest: 'moss' },
  { id: 'golden-fry',      name: 'Golden Fry',      parts: ['egg_fry', 'mushroom_grill', 'tomato_chop'],   price: 15, guest: 'bramble' },
  { id: 'chili-noodles',   name: 'Chili Noodles',   parts: ['noodle_boil', 'chili_chop', 'onion_chop'],    price: 14, guest: 'saffron' },
  { id: 'ember-fish',      name: 'Ember Fish',      parts: ['fish_grill', 'egg_fry', 'herb_chop'],         price: 18, guest: 'bramble' },
  { id: 'dragons-breakfast', name: "Dragon's Breakfast", parts: ['egg_fry', 'tomato_chop', 'onion_chop'], price: 13, guest: 'bramble' },
];

// 5 dragon guests. Each has a favourite recipe family (guest field on the recipe);
// serving a guest their favourite pays a +6 tip and fills their delight meter.
export const GUESTS = [
  { id: 'saffron', name: 'Saffron',  color: '#ffb703', blurb: 'loves heat, pays for spice' },
  { id: 'cinder',  name: 'Cinder',   color: '#ff5d3b', blurb: 'old, slow, very hungry' },
  { id: 'moss',    name: 'Moss',     color: '#7ee787', blurb: 'only eats green things' },
  { id: 'pepper',  name: 'Pepper',   color: '#e5484d', blurb: 'impatient, tips big' },
  { id: 'bramble', name: 'Bramble',  color: '#b388ff', blurb: 'quiet, never complains' },
];

export const DIFFICULTIES = {
  apprentice: { name: 'Apprentice', orderEvery: 14, patience: 75, shiftLength: 150, hearts: 4, desc: 'slow orders, patient dragons' },
  cook:       { name: 'Cook',       orderEvery: 11, patience: 60, shiftLength: 150, hearts: 3, desc: 'the real night market' },
  dragon:     { name: 'Dragon Master', orderEvery: 8, patience: 45, shiftLength: 180, hearts: 3, desc: 'a rush that never stops' },
};

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id);
}

export function guestById(id) {
  return GUESTS.find((g) => g.id === id);
}
