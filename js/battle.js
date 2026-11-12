// js/battle.js
import { state, syncHeroStats } from './state.js';

export const battleState = {
    currentBoss: null,
    bossHp: 0,
    bossMaxHp: 0,
    bossEnraged: false,
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

    // Кулдауны скиллов — timestamp окончания (мс). Чистый объект.
    cooldowns: { attack: 0, frenzy: 0, shieldblock: 0, stealth: 0, potion: 0 },

    // Базовые кулдауны (сек). attack = 0 → без КД.
    baseCooldowns: {
        attack:      0,
        frenzy:      2.5,
        shieldblock: 4,
        stealth:     3.5,
        potion:      5
    },

    // Накопленный урон героя за бой
    totalDamage: 0,

    // Флаги механик
    silentStrike: false,          // «невидимый удар»: босс не отвечает
    bossDamageReduction: 0,       // плоское снижение урона босса (блок щитом)

    // Активные кулдаун-интервалы
    cdIntervals: []
};

// ============================================================
// СТАРТ / ТАЙМЕР
// ============================================================

export function beginBattle(boss, isTower = false) {
    const s = syncHeroStats();

    battleState.currentBoss = boss;
    battleState.bossMaxHp = boss.hp;
    battleState.bossHp = boss.hp;
    battleState.bossEnraged = false;
    battleState.active = true;
    battleState.potions = 3;
    battleState.towerMode = isTower;
    battleState.isTower = isTower;
    battleState.totalDamage = 0;

    battleState.silentStrike = false;
    battleState.bossDamageReduction = 0;

    state.hero.hp = s.maxHp;

    // Сброс таймера и кулдаунов
    battleState.startTime = Date.now();
    battleState.cooldowns = { attack: 0, frenzy: 0, shieldblock: 0, stealth: 0, potion: 0 };
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

// ============================================================
// КУЛДАУНЫ
// ============================================================

/**
 * Запуск кулдауна. Если base === 0 (attack) — выходим сразу,
 * интервал не крутим.
 */
export function startCooldown(skill) {
    const base = battleState.baseCooldowns[skill];
    if (!base) return;

    const endTime = Date.now() + base * 1000;
    battleState.cooldowns[skill] = endTime;

    const btn = document.querySelector(`.skill-btn[data-action="${skill}"]`);
    const bar = document.getElementById(`cd-${skill}`);
    if (btn) btn.classList.add('on-cooldown');

    const interval = setInterval(() => {
        const remaining = Math.max(0, endTime - Date.now());
        if (bar) bar.style.width = ((remaining / (base * 1000)) * 100) + '%';

        if (remaining <= 0) {
            clearInterval(interval);
            if (btn) btn.classList.remove('on-cooldown');
            if (bar) bar.style.width = '0%';
            battleState.cooldowns[skill] = 0;
        }
    }, 50);
    battleState.cdIntervals.push(interval);
}

export function isSkillReady(skill) {
    return Date.now() >= (battleState.cooldowns[skill] || 0);
}

export function getCooldownProgress(skill) {
    const end = battleState.cooldowns[skill] || 0;
    const base = battleState.baseCooldowns[skill] || 1;
    if (Date.now() >= end) return 0;
    return Math.max(0, Math.min(1, (end - Date.now()) / (base * 1000)));
}

// ============================================================
// АТАКИ
// ============================================================

/**
 * Обычная атака с множителем. Критов нет.
 * После удара — ответка босса, кроме случая silentStrike.
 */
export function doAttack(multiplier, label, uiCallback) {
    if (!battleState.active) return;

    const dmg = state.hero.damage * multiplier;
    battleState.totalDamage += dmg;
    battleState.bossHp = Math.max(0, battleState.bossHp - dmg);

    uiCallback.onHit(dmg, false, label);

    if (battleState.bossHp <= 0) {
        battleState.active = false;
        uiCallback.onWin();
        return;
    }

    if (battleState.silentStrike) {
        battleState.silentStrike = false;
        return;
    }
    bossTurn(uiCallback);
}

/**
 * Плоская прибавка к урону (свирепый / невидимый удар).
 * dmg = hero.damage + flatBonus
 */
export function doAttackFlat(flatBonus, label, uiCallback) {
    if (!battleState.active) return;

    const dmg = state.hero.damage + flatBonus;
    battleState.totalDamage += dmg;
    battleState.bossHp = Math.max(0, battleState.bossHp - dmg);

    uiCallback.onHit(dmg, false, label);

    if (battleState.bossHp <= 0) {
        battleState.active = false;
        uiCallback.onWin();
        return;
    }

    if (battleState.silentStrike) {
        battleState.silentStrike = false;
        return;
    }
    bossTurn(uiCallback);
}

// ============================================================
// ХОД БОССА
// ============================================================

/**
 * Босс бьёт в ответ.
 * Единственная модификация урона — плоский bossDamageReduction
 * (от «Блока щитом»), применяется один раз и сбрасывается.
 */
export function bossTurn(uiCallback) {
    const boss = battleState.currentBoss;
    if (!boss || battleState.bossHp <= 0) return;

    // Ярость при < 50% HP
    if (battleState.bossHp < battleState.bossMaxHp * 0.5 && !battleState.bossEnraged) {
        battleState.bossEnraged = true;
        uiCallback.onLog('<span class="crit">БОСС В ЯРОСТИ!</span>');
    }

    let bossDmg = boss.damage;
    if (battleState.bossEnraged) bossDmg *= 1.5;

    // Плоское снижение от «Блока щитом»
    bossDmg = bossDmg - battleState.bossDamageReduction;
    
    // Если блок поглотил весь урон (или урон ушел в минус) — босс бьет на 0
    if (bossDmg < 0) {
        bossDmg = 0;
    }
    
    battleState.bossDamageReduction = 0; // сбрасываем блок

    state.hero.hp = Math.max(0, state.hero.hp - bossDmg);
    uiCallback.onBossHit(bossDmg);

    if (state.hero.hp <= 0) {
        battleState.active = false;
        uiCallback.onLose();
    }
}