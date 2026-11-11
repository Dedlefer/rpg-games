import { state, saveGame, gainXP } from './state.js';
import { makeTowerBoss } from './data.js';
import * as Battle from './battle.js';
import * as UI from './ui.js';
import { playSound } from './utils.js';

export function renderTower() {
    const floor = state.hero.towerFloor || 1;
    const record = state.hero.towerRecord || 0;
    const boss = makeTowerBoss(floor);

    document.getElementById('tower-floor').textContent = floor;
    document.getElementById('tower-record').textContent = record;
    document.getElementById('tower-boss-name').textContent = boss.name;

    const info = document.getElementById('tower-boss-info');
    if (info) {
        info.innerHTML = `
            <div class="tower-boss-row"><span>❤️ HP</span><b>${boss.hp}</b></div>
            <div class="tower-boss-row"><span>⚔️ УРОН</span><b>${boss.damage}</b></div>
            <div class="tower-boss-row"><span>🎭 ТИП</span><b>${boss.archetype}</b></div>
            <div class="tower-boss-row"><span>💰 НАГРАДА</span><b>${boss.reward.silver} сер. / ${boss.reward.gold} зол.</b></div>
        `;
    }
}

export function startTowerBattle() {
    const floor = state.hero.towerFloor || 1;
    const boss = makeTowerBoss(floor);
    Battle.beginBattle(boss, true);
    window.goToScreen('battle-screen');
    window.setupBattleUI(boss, {
        onWin: () => {
            // Награда
            state.hero.silver += boss.reward.silver;
            state.hero.gold += boss.reward.gold;
            const { gainXP } = window.__stateModule;
            gainXP(boss.reward.xp);
            // Рекорд
            if (floor > (state.hero.towerRecord || 0)) {
                state.hero.towerRecord = floor;
            }
            state.hero.towerFloor = floor + 1;
            saveGame();
            window.UI.updateHUD();
            window.alert(`Этаж ${floor} пройден!\nНаграда: ${boss.reward.silver} сер., ${boss.reward.gold} зол., ${boss.reward.xp} XP`);
            window.goToScreen('tower-screen');
            renderTower();
        },
        onLose: () => {
            // Откат на этаж-чекпоинт (каждый 5-й этаж)
            const checkpoint = Math.max(1, Math.floor((floor - 1) / 5) * 5 + 1);
            state.hero.towerFloor = checkpoint;
            saveGame();
            window.alert(`Поражение на этаже ${floor}.\nВозврат к этажу ${checkpoint}.`);
            window.goToScreen('tower-screen');
            renderTower();
        }
    });
    playSound('click');
}