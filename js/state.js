import { SAVE_VERSION, items } from './data.js';

export const state = {
    hero: {
        level: 1, xp: 0, xpToNext: 5000,
        hp: 200, maxHp: 200, damage: 100,
        critChance: 0, critDamage: 100, evade: 0,
        silver: 500, gold: 100, diamonds: 0, keys: 0,
        inventory: [], equipment: [], consumables: { potion: 3 },
        talents: { hp: 1, dmg: 1, def: 1, crit: 1, heal: 1 },
        pet: null, achievements: [], dailyClaimedDate: null,
        lastPlayed: Date.now(), towerFloor: 1, towerRecord: 0
    },
    defeatedBosses: []
};

export function saveGame() {
    state.hero.version = SAVE_VERSION;
    localStorage.setItem('hero', JSON.stringify(state.hero));
    localStorage.setItem('defeatedBosses', JSON.stringify(state.defeatedBosses));
}

export function loadGame() {
    const saved = localStorage.getItem('hero');
    if (saved) {
        try { Object.assign(state.hero, JSON.parse(saved)); } catch (e) {}
    }

    const h = state.hero;
    if (!Array.isArray(h.inventory)) h.inventory = [];
    if (!Array.isArray(h.equipment)) h.equipment = [];
    if (!Array.isArray(h.achievements)) h.achievements = [];
    if (!h.consumables) h.consumables = { potion: 3 };
    if (!h.talents) h.talents = { hp: 1, dmg: 1, def: 1, crit: 1, heal: 1 };
    if (typeof h.towerFloor !== 'number') h.towerFloor = 1;
    if (typeof h.towerRecord !== 'number') h.towerRecord = 0;

    const sb = localStorage.getItem('defeatedBosses');
    if (sb) {
        try { state.defeatedBosses = JSON.parse(sb) || []; }
        catch (e) { state.defeatedBosses = []; }
    }
}

// Расчет статов (без window.itemsData — импортируем напрямую)
export function calcStats() {
    const h = state.hero;
    const bonusHp = (h.talents.hp - 1) * 20;
    const bonusDmg = (h.talents.dmg - 1) * 6;
    const bonusDef = (h.talents.def - 1) * 2;
    const bonusCritDmg = (h.talents.crit - 1) * 8;

    const levelMult = 1 + (h.level - 1) * 0.05;

    const base = {
        maxHp: (200 * levelMult) + bonusHp,
        damage: (100 * levelMult) + bonusDmg + bonusCritDmg,
        critChance: 5,
        critDamage: 150,
        evade: 5,
        armor: bonusDef
    };

    const bonus = { hp: 0, damage: 0, evade: 0, critChance: 0 };
    h.equipment.forEach(id => {
        const it = items.find(i => i.id === id);
        if (!it) return;
        if (it.damageBonus) bonus.damage += it.damageBonus;
        if (it.hpBonus) bonus.hp += it.hpBonus;
        if (it.evadeBonus) bonus.evade += it.evadeBonus;
        if (it.critChanceBonus) bonus.critChance += it.critChanceBonus;
    });

    return {
        maxHp: base.maxHp + bonus.hp,
        damage: base.damage + bonus.damage,
        critChance: Math.min(base.critChance + bonus.critChance, 100),
        critDamage: base.critDamage,
        evade: Math.min(base.evade + bonus.evade, 100),
        armor: base.armor
    };
}

// Синхронизирует state.hero с calcStats (HP, maxHp, damage, crit, evade, armor)
export function syncHeroStats() {
    const s = calcStats();
    state.hero.maxHp = s.maxHp;
    state.hero.damage = s.damage;
    state.hero.critChance = s.critChance;
    state.hero.critDamage = s.critDamage;
    state.hero.evade = s.evade;
    state.hero.armor = s.armor;
    if (state.hero.hp > s.maxHp) state.hero.hp = s.maxHp;
    return s;
}

export function gainXP(amount) {
    const h = state.hero;
    h.xp += amount;
    while (h.xp >= h.xpToNext) {
        h.xp -= h.xpToNext;
        h.level++;
        h.xpToNext = Math.floor(5000 * Math.pow(1.5, h.level - 1));
        h.diamonds += 1;
    }
    syncHeroStats();
}