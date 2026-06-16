#!/usr/bin/env node
/**
 * Battle for the Crown — Simulateur de progression de construction (v1.5).
 *
 * Simule la wall-clock vécue par un joueur pour atteindre un état cible de
 * village, en tenant compte de :
 *   - le multiplier `tempo.global` (cf. docs/gameplay/23-world-tempo-and-multipliers.md)
 *   - la file de 3 constructions parallèles (`MAX_CONSTRUCTION_QUEUE`)
 *   - le bonus Château (CASTLE_CONSTRUCTION_SPEED_BONUS) appliqué au démarrage
 *   - les pré-requis Château (`unlockCastleLevel`) par bâtiment
 *   - un profil joueur (sommeil + intervalle de check)
 *   - **(v1.5)** le stock de ressources (Wood/Stone/Iron) : production passive
 *     des mines (`RESOURCE_PRODUCTION_PER_MINUTE`), plafonné par l'Entrepôt
 *     (`getWarehouseStorageLimit`), débité au lancement de chaque upgrade.
 *     Une upgrade reste en file d'attente tant que le stock n'a pas atteint
 *     son coût.
 *
 * Toutes les constantes proviennent de `@battleforthecrown/shared`
 * (`packages/shared/src/village/buildings.ts`, `resources/production.ts`,
 * `resources/storage.ts`) — source de vérité unique (cf. ADR-14).
 *
 * Hors scope (v2 hypothétique, cf. discussion ADR-14) :
 *   - Recrutement d'unités (caserne, coût en pop + ressources, temps)
 *   - Couronnes et coût Seigneur
 *   - Combat de conquête
 *   - Tracking pop (consommée à l'upgrade, libérée à l'annulation/mort)
 *
 * → "READY_FOR_CONQUEST" affiché par le sim = Château 6 + Salle du Trône
 *   construits. **Ce n'est pas la première conquête réelle**, qui demande
 *   en plus une armée + un Seigneur. Cf. doc `00-game-flow.md` § 5.
 *
 * Usage rapide
 * ------------
 *   node scripts/build-simulator.js                           # tempo 1.0 défaut
 *   node scripts/build-simulator.js --tempo 0.25
 *   node scripts/build-simulator.js --tryhard --target full
 *   node scripts/build-simulator.js --compare 1.0 0.5 0.25 0.1
 *   node scripts/build-simulator.js --tempo 0.25 --verbose
 *
 * Note : si vous modifiez `packages/shared/src/`, rebuild
 * (`yarn workspace @battleforthecrown/shared build`) — le script lit le
 * `dist/` compilé.
 */

"use strict";

const {
  BUILDING_DEFINITIONS,
  BUILDING_UNLOCK_REQUIREMENTS,
  CASTLE_CONSTRUCTION_SPEED_BONUS,
  MAX_CONSTRUCTION_QUEUE,
  getBuildingMaxLevel,
} = require("@battleforthecrown/shared/village/buildings");
const {
  RESOURCE_PRODUCTION_PER_MINUTE,
  getWarehouseStorageLimit,
} = require("@battleforthecrown/shared/resources");

const SECONDS_PER_DAY = 86_400;

// Ordre de priorité pour départager les égalités du round-robin.
// Économie d'abord, militaire ensuite.
const PRIORITY_ORDER = [
  "WOOD", "STONE", "IRON", "QUARTER", "WAREHOUSE",
  "BARRACKS", "WATCHTOWER", "COUNCIL_HALL", "THRONE_HALL",
];

// Courbe de bonus Château. Par défaut = constante shared (source de vérité).
// Override pour tester une courbe alternative sans rebuild shared :
//   BFTC_CASTLE_BONUS="1.0,0.92,0.82,0.70,0.55,0.42,0.31,0.23,0.15,0.12" (niv1→niv10)
const CASTLE_BONUS = (() => {
  const raw = process.env.BFTC_CASTLE_BONUS;
  if (!raw) return CASTLE_CONSTRUCTION_SPEED_BONUS;
  const curve = {};
  raw.split(",").forEach((s, i) => { curve[i + 1] = parseFloat(s.trim()); });
  return curve;
})();

// On ne simule que les bâtiments enabled (les DISABLED comme HIDEOUT/WALL sont ignorés).
const ENABLED_BUILDINGS = Object.entries(BUILDING_DEFINITIONS)
  .filter(([, def]) => def.enabled)
  .map(([type]) => type);

// État initial d'un nouveau village joueur (cf. backend
// `PLAYER_VILLAGE_BUILDING_LIFECYCLE`). 4 mines + Entrepôt déjà à L1 ; Castle
// à L1 ; Farm/Caserne/Watchtower/Conseil/Trône à L0 (à construire).
const INITIAL_BUILDING_LEVELS = {
  CASTLE: 1, WOOD: 1, STONE: 1, IRON: 1, WAREHOUSE: 1,
  QUARTER: 0, BARRACKS: 0, WATCHTOWER: 0, COUNCIL_HALL: 0, THRONE_HALL: 0,
};

// Stock de départ aligné avec `.env` du backend (WOOD/STONE/IRON_STARTING_AMOUNT=1000).
const DEFAULT_STARTING_STOCK = 1000;

// Production par seconde pour un mine au niveau donné. La constante shared est
// par minute — on divise par 60.
function productionPerSecond(level) {
  const perMinute = RESOURCE_PRODUCTION_PER_MINUTE[level];
  return perMinute != null ? perMinute / 60 : 0;
}

// Capacité d'entrepôt pour un niveau donné (les 3 ressources partagent la même).
function warehouseCap(level) {
  const limits = getWarehouseStorageLimit(level);
  return limits.wood; // les 3 ressources ont la même cap par niveau
}

// ============================================================
// Profil joueur
// ============================================================

class PlayerProfile {
  constructor({ sleepStartH = 23, sleepEndH = 7, checkIntervalMin = 60, tryhard = false } = {}) {
    this.sleepStartH = sleepStartH;
    this.sleepEndH = sleepEndH;
    this.checkIntervalMin = checkIntervalMin;
    this.tryhard = tryhard;
  }

  isAwake(t) {
    if (this.tryhard) return true;
    const h = (t / 3600) % 24;
    if (this.sleepStartH < this.sleepEndH) {
      return !(this.sleepStartH <= h && h < this.sleepEndH);
    }
    // Sommeil qui traverse minuit (cas usuel 23h→7h)
    return !(h >= this.sleepStartH || h < this.sleepEndH);
  }

  nextCheckT(t) {
    // En mode tryhard, le joueur "check" en continu — donc le seul événement qui
    // peut débloquer la queue est une fin de construction, jamais un check futur.
    // On renvoie Infinity pour court-circuiter `nextPlayer` dans le simulateur
    // (sinon nextPlayer = t → boucle infinie quand prérequis bloquant).
    if (this.tryhard) return Infinity;
    if (this.isAwake(t)) return t + this.checkIntervalMin * 60;
    // Endormi → prochain réveil
    const h = (t / 3600) % 24;
    const dayStart = t - h * 3600;
    let wake = dayStart + this.sleepEndH * 3600;
    if (wake <= t) wake += SECONDS_PER_DAY;
    return wake;
  }
}

// ============================================================
// Génération du plan auto (round-robin équilibré)
// ============================================================

function generatePlan(target = "full") {
  // Démarre avec l'état initial réel d'un nouveau village joueur (cf. backend
  // `PLAYER_VILLAGE_BUILDING_LIFECYCLE`) : 4 mines + Entrepôt à L1, Château L1,
  // reste à L0. Le plan ne réinclut donc pas WOOD/STONE/IRON/WAREHOUSE L1.
  const state = { ...INITIAL_BUILDING_LEVELS };
  const plan = [];

  const targetCastle = target === "conquest" ? 6 : 10;
  const targetOther = target === "conquest" ? 5 : 10;

  const maxLvl = (b) => Math.min(getBuildingMaxLevel(b), targetOther);
  const unlock = (b) => BUILDING_UNLOCK_REQUIREMENTS[b] ?? 1;

  let safety = 0;
  while (true) {
    if (++safety > 1000) throw new Error("Boucle infinie generatePlan");

    const eligibles = PRIORITY_ORDER.filter((b) => {
      if (!ENABLED_BUILDINGS.includes(b)) return false;
      if (state[b] >= maxLvl(b)) return false;
      if (unlock(b) > state.CASTLE) return false;
      // Règle MMORTS courante : non-Château ne dépasse pas le Château.
      // À retirer si vous voulez tester sans ce cap.
      if (state[b] >= state.CASTLE) return false;
      return true;
    });

    if (eligibles.length > 0) {
      eligibles.sort((a, b) => {
        if (state[a] !== state[b]) return state[a] - state[b];
        return PRIORITY_ORDER.indexOf(a) - PRIORITY_ORDER.indexOf(b);
      });
      const b = eligibles[0];
      state[b] += 1;
      plan.push([b, state[b]]);
    } else if (state.CASTLE < targetCastle) {
      state.CASTLE += 1;
      plan.push(["CASTLE", state.CASTLE]);
    } else {
      break;
    }
  }
  return plan;
}

// ============================================================
// Simulateur
// ============================================================

function simulate(plan, tempo, profile, startingStock = DEFAULT_STARTING_STOCK) {
  let t = 0;
  const active = []; // { building, level, endT }
  const completed = { ...INITIAL_BUILDING_LEVELS };
  const stock = { wood: startingStock, stone: startingStock, iron: startingStock };
  const timeline = [];
  let planIdx = 0;
  let asleepFreeT = 0;
  let awakeBlockedT = 0;
  let resourceBlockedT = 0; // temps où on a un slot + plan + ressources insuffisantes
  const milestones = {};

  const timeOf = (b, lvl, castleLvl) =>
    BUILDING_DEFINITIONS[b].levels[lvl].timeSeconds *
    tempo *
    CASTLE_BONUS[castleLvl];

  // Production par seconde, **par ressource**. Chaque mine produit
  // exclusivement sa propre ressource (WOOD mine → bois uniquement, etc.).
  // Une mine en cours d'upgrade continue de produire à son niveau actuel.
  // Tempo appliqué selon doc 23 § 5.1.1 : débit = absolu / tempo
  // (tempo < 1 = plus rapide → produit plus vite).
  const productionRates = () => ({
    wood: completed.WOOD > 0 ? productionPerSecond(completed.WOOD) / tempo : 0,
    stone: completed.STONE > 0 ? productionPerSecond(completed.STONE) / tempo : 0,
    iron: completed.IRON > 0 ? productionPerSecond(completed.IRON) / tempo : 0,
  });

  const currentCap = () => warehouseCap(completed.WAREHOUSE);

  // Avance le stock de `dt` secondes, capé par l'entrepôt.
  const advanceStock = (dt) => {
    const rates = productionRates();
    const cap = currentCap();
    stock.wood = Math.min(cap, stock.wood + rates.wood * dt);
    stock.stone = Math.min(cap, stock.stone + rates.stone * dt);
    stock.iron = Math.min(cap, stock.iron + rates.iron * dt);
  };

  // Coût d'une upgrade.
  const costOf = (b, lvl) => {
    const def = BUILDING_DEFINITIONS[b].levels[lvl];
    return { wood: def.wood, stone: def.stone, iron: def.iron };
  };

  const canAfford = (cost) =>
    stock.wood >= cost.wood && stock.stone >= cost.stone && stock.iron >= cost.iron;

  // Temps nécessaire (depuis t) pour accumuler `cost` (en supposant la production
  // constante). Renvoie Infinity si production = 0 ou cap < cost.
  const timeToAfford = (cost) => {
    const rates = productionRates();
    const cap = currentCap();
    let maxWait = 0;
    for (const r of ["wood", "stone", "iron"]) {
      if (cost[r] > cap) return Infinity; // jamais finançable, l'entrepôt est trop petit
      const missing = cost[r] - stock[r];
      if (missing > 0) {
        if (rates[r] <= 0) return Infinity; // mine de cette ressource pas encore construite
        maxWait = Math.max(maxWait, missing / rates[r]);
      }
    }
    return maxWait;
  };

  const tryLaunch = () => {
    if (!profile.isAwake(t)) return;
    while (planIdx < plan.length && active.length < MAX_CONSTRUCTION_QUEUE) {
      const [b, lvl] = plan[planIdx];
      if ((BUILDING_UNLOCK_REQUIREMENTS[b] ?? 1) > completed.CASTLE) return;
      if (completed[b] + 1 !== lvl) return;
      if (active.some((c) => c.building === b)) return;
      const cost = costOf(b, lvl);
      if (!canAfford(cost)) return; // bloqué par ressources — attendre l'accumulation
      // Débit immédiat des ressources
      stock.wood -= cost.wood;
      stock.stone -= cost.stone;
      stock.iron -= cost.iron;
      const dur = timeOf(b, lvl, completed.CASTLE);
      active.push({ building: b, level: lvl, endT: t + dur });
      timeline.push({ t, evt: "start", building: b, level: lvl, dur });
      planIdx++;
    }
  };

  tryLaunch();

  while (planIdx < plan.length || active.length > 0) {
    const wasAwake = profile.isAwake(t);
    const hadFreeSlot = active.length < MAX_CONSTRUCTION_QUEUE;
    const planRemaining = planIdx < plan.length;

    const nextActive = active.reduce((min, c) => Math.min(min, c.endT), Infinity);
    const nextPlayer = planRemaining && hadFreeSlot ? profile.nextCheckT(t) : Infinity;

    // (v1.5) Si on a un slot + un plan item bloqué uniquement par ressources,
    // on calcule quand on aura assez. Sinon Infinity.
    let nextResource = Infinity;
    let blockedByResources = false;
    if (planRemaining && hadFreeSlot && wasAwake) {
      const [b, lvl] = plan[planIdx];
      const prereqOk = (BUILDING_UNLOCK_REQUIREMENTS[b] ?? 1) <= completed.CASTLE;
      const sameBuildingActive = active.some((c) => c.building === b);
      if (prereqOk && !sameBuildingActive && completed[b] + 1 === lvl) {
        const cost = costOf(b, lvl);
        if (!canAfford(cost)) {
          blockedByResources = true;
          const wait = timeToAfford(cost);
          if (isFinite(wait)) nextResource = t + wait + 0.001; // +1ms pour éviter ties
        }
      }
    }

    const nextT = Math.min(nextActive, nextPlayer, nextResource);

    if (!isFinite(nextT)) break;

    const delta = nextT - t;
    if (hadFreeSlot && planRemaining) {
      if (!wasAwake) asleepFreeT += delta;
      else if (blockedByResources) resourceBlockedT += delta;
      else awakeBlockedT += delta;
    }

    // Avance la production pour la fenêtre [t, nextT]
    advanceStock(delta);
    t = nextT;

    // Résolutions
    for (let i = active.length - 1; i >= 0; i--) {
      if (active[i].endT <= t + 1e-6) {
        const c = active[i];
        completed[c.building] = c.level;
        timeline.push({ t, evt: "end", building: c.building, level: c.level, dur: 0 });
        if (c.building === "CASTLE") milestones[`CASTLE_L${c.level}`] = t;
        if (c.building === "THRONE_HALL") milestones.READY_FOR_CONQUEST = t;
        active.splice(i, 1);
      }
    }

    tryLaunch();
  }

  return {
    totalTime: t,
    timeline,
    asleepFreeT,
    awakeBlockedT,
    resourceBlockedT,
    planSize: plan.length,
    milestones,
    finalStock: { ...stock },
    finalCap: currentCap(),
    finalProductionPerHour: (() => {
      const r = productionRates();
      return { wood: r.wood * 3600, stone: r.stone * 3600, iron: r.iron * 3600 };
    })(),
  };
}

// ============================================================
// Format & CLI
// ============================================================

function fmtSeconds(s) {
  s = Math.round(s);
  const d = Math.floor(s / 86400); s -= d * 86400;
  const h = Math.floor(s / 3600);  s -= h * 3600;
  const m = Math.floor(s / 60);    s -= m * 60;
  if (d) return `${d}j${String(h).padStart(2, "0")}h${String(m).padStart(2, "0")}m`;
  if (h) return `${h}h${String(m).padStart(2, "0")}m`;
  if (m) return `${m}m${String(s).padStart(2, "0")}s`;
  return `${s}s`;
}

function parseArgs(argv) {
  const args = {
    tempo: 1.0,
    compare: null,
    sleepStart: 23,
    sleepEnd: 7,
    checkIntervalMin: 60,
    tryhard: false,
    target: "full",
    verbose: false,
    startingStock: DEFAULT_STARTING_STOCK,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    switch (a) {
      case "--tempo": args.tempo = parseFloat(next()); break;
      case "--compare": {
        args.compare = [];
        while (i + 1 < argv.length && !argv[i + 1].startsWith("--")) {
          args.compare.push(parseFloat(argv[++i]));
        }
        break;
      }
      case "--sleep-start": args.sleepStart = parseFloat(next()); break;
      case "--sleep-end": args.sleepEnd = parseFloat(next()); break;
      case "--check-interval-min": args.checkIntervalMin = parseFloat(next()); break;
      case "--tryhard": args.tryhard = true; break;
      case "--target": args.target = next(); break;
      case "--starting-stock": args.startingStock = parseFloat(next()); break;
      case "--verbose":
      case "-v": args.verbose = true; break;
      case "--help":
      case "-h":
        console.log(require("fs").readFileSync(__filename, "utf8").split("*/")[0].slice(3));
        process.exit(0);
      default:
        console.error(`Argument inconnu : ${a}`);
        process.exit(1);
    }
  }
  return args;
}

function runOne(args, tempo) {
  const profile = new PlayerProfile({
    sleepStartH: args.sleepStart,
    sleepEndH: args.sleepEnd,
    checkIntervalMin: args.checkIntervalMin,
    tryhard: args.tryhard,
  });
  const plan = generatePlan(args.target);
  return simulate(plan, tempo, profile, args.startingStock);
}

function printResult(label, result, args) {
  console.log(`\n=== ${label} ===`);
  console.log(`Plan         : ${result.planSize} upgrades`);
  console.log(`Temps total  : ${fmtSeconds(result.totalTime)}  (~${(result.totalTime / 86400).toFixed(1)} jours wall-clock)`);
  const total = Math.max(result.totalTime, 1);
  console.log(`Idle endormi : ${fmtSeconds(result.asleepFreeT)}  (${(100 * result.asleepFreeT / total).toFixed(1)}%)`);
  console.log(`Idle prereq  : ${fmtSeconds(result.awakeBlockedT)}  (${(100 * result.awakeBlockedT / total).toFixed(1)}%)  (awake + slot libre + prérequis Château manquant)`);
  console.log(`Idle ressrc  : ${fmtSeconds(result.resourceBlockedT)}  (${(100 * result.resourceBlockedT / total).toFixed(1)}%)  (awake + slot libre + ressources insuffisantes)`);
  console.log(`Stock final  : wood ${Math.round(result.finalStock.wood)} / stone ${Math.round(result.finalStock.stone)} / iron ${Math.round(result.finalStock.iron)}  (cap ${result.finalCap})`);
  console.log(`Prod finale  : wood ${Math.round(result.finalProductionPerHour.wood)} /h, stone ${Math.round(result.finalProductionPerHour.stone)} /h, iron ${Math.round(result.finalProductionPerHour.iron)} /h`);
  if (Object.keys(result.milestones).length > 0) {
    console.log("Jalons :");
    for (const k of ["CASTLE_L2", "CASTLE_L4", "CASTLE_L6", "READY_FOR_CONQUEST", "CASTLE_L8", "CASTLE_L10"]) {
      if (result.milestones[k] != null) {
        console.log(`  - ${k.padEnd(22)} ${fmtSeconds(result.milestones[k])}`);
      }
    }
  }
  if (args.verbose) {
    console.log("\nTimeline :");
    for (const e of result.timeline) {
      const tag = e.evt === "start" ? "→" : "✓";
      const extra = e.evt === "start" ? `  (durée ${fmtSeconds(e.dur)})` : "";
      console.log(`  [${fmtSeconds(e.t).padStart(12)}] ${tag} ${e.building.padEnd(12)} L${e.level}${extra}`);
    }
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  const profileLabel = args.tryhard
    ? "TRYHARD 24/7"
    : `sommeil ${args.sleepStart}h-${args.sleepEnd}h, check toutes les ${args.checkIntervalMin} min`;
  console.log(`Profil joueur : ${profileLabel}`);
  console.log(`Cible         : ${args.target}`);

  if (args.compare) {
    for (const tempo of args.compare) {
      const result = runOne(args, tempo);
      printResult(`tempo = ${tempo}`, result, args);
    }
  } else {
    const result = runOne(args, args.tempo);
    printResult(`tempo = ${args.tempo}`, result, args);
  }
}

main();
