import { state, syncHeroStats } from './state.js';

export const battleState = {
    currentBoss: null,
    bossHp: 0,
    bossMaxHp: 0,
    bossEnraged: false,
    defending: false,
    active: false,
    auto: false,
    timer: null,
    speed: 1,
    potions: 3,
    towerMode: false,
    isTower: false,
    // Таймер боя
    startTime: 0,
    timerInterval: null,
    // Кулдауны скиллов (в секундах)
    cooldowns: {
        attack: 0,
        heavy: 0,
        defend: 0,
        potion: 0
    },
    // Базовые кулдауны (сек)
    baseCooldowns: {
        attack: 0.6,
        heavy: 2.5,
        defend: 4,
        potion: 5
    },
    // Накопленный урон героя за бой
    totalDamage: 0,
    // Активные кулдаун-интервалы для обновления UI
    cdIntervals: []
};

export function beginBattle(boss, isTower = false) {
    const s = syncHeroStats();
    battleState.currentBoss = boss;
    battleState.bossMaxHp = boss.hp;
    battleState.bossHp = boss.hp;
    battleState.bossEnraged = false;
    battleState.defending = false;
    battleState.active = true;
    battleState.potions = 3;
    battleState.towerMode = isTower;
    battleState.isTower = isTower;
    battleState.totalDamage = 0;
    state.hero.hp = s.maxHp;

    // Сброс и запуск таймера
    battleState.startTime = Date.now();
    battleState.cooldowns = { attack: 0, heavy: 0, defend: 0, potion: 0 };
    clearBattleTimers();
    startBattleTimer();
}

export function startBattleTimer() {
    if (battleState.timerInterval) clearInterval(battleState.timerInterval);
    battleState.timerInterval = setInterval(() => {
        const el = document.getElementById('bt-timer');
        if (!el) return;
        if (!battleState.active) return;
        el.textContent = formatDuration(Date.now() - battleState.startTime);
    }, 500);
}

export function stopBattleTimer() {
    if (battleState.timerInterval) {
        clearInterval(battleState.timerInterval);
        battleState.timerInterval = null;
    }
}

export function clearBattleTimers() {
    stopBattleTimer();
    battleState.cdIntervals.forEach(i => clearInterval(i));
    battleState.cdIntervals = [];
}

export function formatDuration(ms) {
    const totalSec = Math.floor(ms / 1000);
    const h = String(Math.floor(totalSec / 3600)).padStart(2, '0');
    const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
    const s = String(totalSec % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
}

export function startCooldown(skill) {
    const base = battleState.baseCooldowns[skill];
    if (!base) return;
    battleState.cooldowns[skill] = base;

    const btn = document.querySelector(`.skill-btn[data-skill="${skill}"]`);
    const cdBar = document.getElementById(`cd-${skill}`);
    if (btn) btn.classList.add('on-cooldown');

    const start = Date.now();
    const interval = setInterval(() => {
        const elapsed = (Date.now() - start) / 1000;
        const remaining = Math.max(0, base - elapsed);
        battleState.cooldowns[skill] = remaining;

        if (cdBar) {
            const pct = Math.max(0, (remaining / base) * 100);
            cdBar.style.width = pct + '%';
        }

        if (remaining <= 0) {
            clearInterval(interval);
            if (btn) btn.classList.remove('on-cooldown');
            if (cdBar) cdBar.style.width = '0%';
            battleState.cooldowns[skill] = 0;
        }
    }, 100);
    battleState.cdIntervals.push(interval);
}

export function isSkillReady(skill) {
    return (battleState.cooldowns[skill] || 0) <= 0;
}

export function doAttack(multiplier, label, uiCallback) {
    if (!battleState.active) return;

    let dmg = state.hero.damage * multiplier;
    const isCrit = Math.random() * 100 < state.hero.critChance;
    if (isCrit) dmg *= (2 + state.hero.critDamage / 100);

    battleState.totalDamage += dmg;
    battleState.bossHp = Math.max(0, battleState.bossHp - dmg);

    uiCallback.onHit(dmg, isCrit, label);

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

    if (battleState.bossHp < battleState.bossMaxHp * 0.5 && !battleState.bossEnraged) {
        battleState.bossEnraged = true;
        uiCallback.onLog('<span class="crit">БОСС В ЯРОСТИ!</span>');
    }

    let bossDmg = boss.damage;
    if (battleState.bossEnraged) bossDmg *= 1.5;
    bossDmg = Math.max(1, bossDmg - (state.hero.armor || 0));

    const evadeChance = boss.archetype === 'mage'
        ? state.hero.evade * 0.5
        : state.hero.evade;

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