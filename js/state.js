import { SAVE_VERSION, items } from './data.js';

export const state = {
    hero: {
        level: 1, 
        xp: 0, 
        xpToNext: 200,
        hp: 50, 
        maxHp: 50, 
        damage: 5,
        silver: 100000, gold: 100000, diamonds: 0, keys: 0, // TODO: Для теста. Вернуть 500/100.
        
        // НОВАЯ СИСТЕМА:
        purchased: [], // Все купленные предметы (от них идут статы)
        equipped: {},  // Надетые предметы (для иконок, например { weapon: 'w1' })

        collectionParts: [], 
        
        consumables: { potion: 3 },
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
    
    // Миграция со старой системы (если остались старые сейвы с инвентарем)
    if (!Array.isArray(h.purchased)) {
        h.purchased = [];
        // Если был инвентарь или экипировка — переносим всё в purchased
        if (Array.isArray(h.inventory)) h.purchased.push(...h.inventory);
        if (Array.isArray(h.equipment)) h.purchased.push(...h.equipment);
        h.inventory = [];
        h.equipment = [];
    }
    
    // Убираем дубликаты в купленных (на всякий случай)
    h.purchased = [...new Set(h.purchased)];

    if (typeof h.equipped !== 'object' || h.equipped === null) h.equipped = {};
    if (!Array.isArray(h.achievements)) h.achievements = [];
    if (!h.consumables) h.consumables = { potion: 3 };
    if (!h.talents) h.talents = { hp: 1, dmg: 1, def: 1, crit: 1, heal: 1 };
    if (typeof h.towerFloor !== 'number') h.towerFloor = 1;
    if (typeof h.towerRecord !== 'number') h.towerRecord = 0;
    if (typeof h.xpToNext !== 'number' || h.xpToNext > 5000) h.xpToNext = 200;

    const sb = localStorage.getItem('defeatedBosses');
    if (sb) {
        try { state.defeatedBosses = JSON.parse(sb) || []; }
        catch (e) { state.defeatedBosses = []; }
    }
}

export function calcStats() {
    const h = state.hero;
    const levelMult = 1 + (h.level - 1) * 0.1; 

    let maxHp = 50 * levelMult;
    let damage = 5 * levelMult;

    // Статы считаются от ВСЕХ купленных предметов
    h.purchased.forEach(id => {
        const it = items.find(i => i.id === id);
        if (!it) return;
        if (it.hpBonus)     maxHp  += it.hpBonus;
        if (it.damageBonus) damage += it.damageBonus;
    });

    return { maxHp, damage };
}

export function syncHeroStats() {
    const s = calcStats();
    state.hero.maxHp = Math.floor(s.maxHp);
    state.hero.damage = Math.floor(s.damage);
    if (state.hero.hp > s.maxHp) state.hero.hp = s.maxHp;
    return s;
}

export function gainXP(amount) {
    const h = state.hero;
    h.xp += amount;
    
    while (h.xp >= h.xpToNext) {
        h.xp -= h.xpToNext;
        h.level++;
        
        // Формула: 200 * (Уровень ^ 2.35)
        h.xpToNext = Math.floor(200 * Math.pow(h.level, 2.35));
        
        h.diamonds += 1;
    }
    syncHeroStats();
}