import { state, gainXP, saveGame } from './state.js';

export const battleState = {
    currentBoss: null,
    bossHp: 0,
    bossMaxHp: 0,
    defending: false,
    active: false,
    auto: false,
    timer: null,
    speed: 1,
    potions: 3,
    towerMode: false
};

// Вызывается из UI при старте
export function beginBattle(boss, isTower = false) {
    battleState.currentBoss = boss;
    battleState.bossMaxHp = boss.hp;
    battleState.bossHp = boss.hp;
    battleState.defending = false;
    battleState.active = true;
    battleState.potions = 3;
    battleState.towerMode = isTower;
    state.hero.hp = state.hero.maxHp;
}

// Логика атаки
export function doAttack(multiplier, label, uiCallback) {
    if (!battleState.active) return;
    
    let dmg = state.hero.damage * multiplier;
    const isCrit = Math.random() * 100 < state.hero.critChance;
    if (isCrit) dmg *= (2 + state.hero.critDamage / 100);

    uiCallback.onHit(dmg, isCrit, label);
    
    battleState.bossHp = Math.max(0, battleState.bossHp - dmg);
    if (battleState.bossHp <= 0) {
        battleState.active = false;
        uiCallback.onWin();
        return;
    }
    bossTurn(uiCallback);
}

export function bossTurn(uiCallback) {
    const boss = battleState.currentBoss;
    if (!boss || battleState.bossHp <= 0) return;

    // Ярость босса
    if (battleState.bossHp < battleState.bossMaxHp * 0.5 && !boss.enraged) {
        boss.enraged = true;
        uiCallback.onLog('<span class="crit">БОСС В ЯРОСТИ!</span>');
    }

    let bossDmg = boss.damage;
    if (boss.enraged) bossDmg *= 1.5;
    
    // Броня героя
    bossDmg = Math.max(1, bossDmg - state.hero.talents.def * 2);

    // Уклонение
    const evadeChance = boss.archetype === 'mage' ? state.hero.evade * 0.5 : state.hero.evade;
    if (Math.random() * 100 < evadeChance) {
        uiCallback.onLog('<span class="win">Уклонение!</span>');
        return;
    }

    if (battleState.defending) {
        bossDmg *= 0.3;
        battleState.defending = false;
        uiCallback.onLog('Защита поглотила часть урона.');
    }

    state.hero.hp = Math.max(0, state.hero.hp - bossDmg);
    uiCallback.onBossHit(bossDmg);

    if (state.hero.hp <= 0) {
        battleState.active = false;
        uiCallback.onLose();
    }
}