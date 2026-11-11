import { state, gainXP, saveGame, syncHeroStats } from './state.js';
import * as Battle from './battle.js';
import * as UI from './ui.js';
import { playSound } from './utils.js';

export function setupBattleUI(boss, overrides = {}) {
    // Настройка имен, картинок и баров
    document.getElementById('boss-name-battle').textContent = boss.name;
    const img = document.getElementById('boss-img-battle');
    img.src = boss.image;
    img.onerror = () => { img.style.display = 'none'; };
    img.style.display = '';
    
    document.getElementById('hero-battle-max-hp').textContent = state.hero.maxHp.toFixed(0);
    document.getElementById('hero-battle-hp').textContent = state.hero.hp.toFixed(0);
    document.getElementById('hero-hp-bar').style.width = '100%';
    
    document.getElementById('boss-hp-bar').style.width = '100%';
    document.getElementById('boss-battle-max-hp').textContent = boss.hp;
    document.getElementById('boss-battle-hp').textContent = boss.hp;
    
    document.getElementById('battle-log').innerHTML = '<div>Бой начался!</div>';
    document.getElementById('potion-count').textContent = Battle.battleState.potions;

    // Сброс эффектов
    document.getElementById('boss-img-battle').classList.remove('hit');
    document.getElementById('hero-img-battle').classList.remove('hit');

    window.battleUI = {
        onHit: (dmg, isCrit, label) => {
            document.getElementById('boss-battle-hp').textContent = Math.max(0, Battle.battleState.bossHp).toFixed(0);
            document.getElementById('boss-hp-bar').style.width = Math.max(0, (Battle.battleState.bossHp / boss.hp * 100)) + '%';
            document.getElementById('battle-log').innerHTML += `<div>${label}: ${dmg.toFixed(0)} ${isCrit ? '<span class="crit">(КРИТ!)</span>' : ''}</div>`;
            
            // Эффект удара
            const bossImg = document.getElementById('boss-img-battle');
            bossImg.classList.add('hit');
            setTimeout(() => bossImg.classList.remove('hit'), 200);
            
            showDamagePopup(dmg, isCrit);
            playSound(isCrit ? 'crit' : 'hit');
        },
        onBossHit: (dmg) => {
            document.getElementById('hero-battle-hp').textContent = Math.max(0, state.hero.hp).toFixed(0);
            document.getElementById('hero-hp-bar').style.width = Math.max(0, (state.hero.hp / state.hero.maxHp * 100)) + '%';
            document.getElementById('battle-log').innerHTML += `<div>Босс бьет: ${dmg.toFixed(0)}</div>`;
            
            // Эффект удара по герою
            const heroImg = document.getElementById('hero-img-battle');
            heroImg.classList.add('hit');
            setTimeout(() => heroImg.classList.remove('hit'), 200);
            
            playSound('hit');
        },
        onLog: (msg) => { document.getElementById('battle-log').innerHTML += `<div>${msg}</div>`; },
        onWin: overrides.onWin || (() => {
            state.hero.silver += boss.reward.silver;
            state.hero.gold += boss.reward.gold;
            gainXP(boss.reward.xp);
            if (!state.defeatedBosses.includes(boss.id)) state.defeatedBosses.push(boss.id);
            saveGame(); UI.updateHUD();
            
            // Показываем экран победы
            showVictoryScreen(boss);
        }),
        onLose: overrides.onLose || (() => {
            showDefeatScreen();
        })
    };
}

// Функция для всплывающих цифр урона
function showDamagePopup(dmg, isCrit) {
    const container = document.getElementById('damage-popups');
    if (!container) return;
    const el = document.createElement('div');
    el.className = 'damage-popup' + (isCrit ? ' crit' : '');
    el.textContent = Math.round(dmg);
    // Рандомим немного позицию по X, чтобы цифры не накладывались
    el.style.left = `calc(50% + ${(Math.random() - 0.5) * 60}px)`;
    container.appendChild(el);
    setTimeout(() => el.remove(), 800);
}

// Экран победы
export function showVictoryScreen(boss) {
    const winScreen = document.getElementById('victory-screen');
    winScreen.classList.remove('hidden');
    
    document.getElementById('victory-boss-name').textContent = boss.name;
    document.getElementById('victory-hero-dmg').textContent = state.hero.damage.toFixed(0); // Заглушка, можно считать общий урон
    
    // Заполняем трофеи
    const trophyBox = document.getElementById('victory-trophies');
    trophyBox.innerHTML = `
        <div class="trophy-item"><span>💰</span> +${boss.reward.silver}</div>
        <div class="trophy-item"><span>🪙</span> +${boss.reward.gold}</div>
        <div class="trophy-item"><span>✨</span> +${boss.reward.xp} XP</div>
    `;
    
    // Кнопка "Собрать трофеи"
    document.getElementById('btn-collect-trophies').onclick = () => {
        winScreen.classList.add('hidden');
        UI.goToScreen('map-screen');
        playSound('click');
    };
}

export function showDefeatScreen() {
    // Просто показываем модалку поражения
    const modal = document.getElementById('custom-modal');
    document.getElementById('cm-title').textContent = 'ПОРАЖЕНИЕ';
    document.getElementById('cm-title').style.color = 'var(--accent)';
    document.getElementById('cm-text').textContent = 'Вы пали в бою... Возвращаемся на базу.';
    modal.classList.remove('hidden');
    
    document.getElementById('cm-ok').onclick = () => {
        modal.classList.add('hidden');
        UI.goToScreen('main-screen');
    };
}