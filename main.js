import { state, loadGame, saveGame, calcStats } from './js/state.js';
import { items, bosses, consumables } from './js/data.js';
import * as Battle from './js/battle.js';
import * as UI from './js/ui.js';
import { rarityColor, itemBonusText, todayStr, playSound } from './js/utils.js';

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    loadGame();
    UI.updateHUD();
    UI.renderBosses();
    UI.renderShop();

    // Переключение экранов
    window.goToScreen = (id) => {
        UI.goToScreen(id);
        if (id === 'map-screen') UI.renderBosses();
        if (id === 'shop-screen') UI.renderShop();
    };

    // Профиль
    window.openProfileModal = (tab) => UI.openProfileModal(tab);
    window.switchProfileTab = (tab) => UI.switchProfileTab(tab);
    window.upgradeTalent = (id) => UI.upgradeTalent(id);

    // Магазин
    window.buyItem = (id) => {
        const item = items.find(i => i.id === id);
        if (state.hero.silver >= item.price.silver) {
            state.hero.silver -= item.price.silver;
            state.hero.inventory.push(item.id);
            saveGame();
            UI.updateHUD();
            UI.renderShop();
            playSound('click');
        } else alert('Мало серебра');
    };
    
    // Бой
    window.startFight = (index) => {
        const boss = bosses[index];
        if (state.hero.level < boss.levelRequired) return;
        
        Battle.beginBattle(boss, false);
        UI.goToScreen('battle-screen');
        
        // Настройка UI боя
        document.getElementById('boss-name-battle').textContent = boss.name;
        document.getElementById('boss-img-battle').src = boss.image;
        document.getElementById('hero-battle-max-hp').textContent = state.hero.maxHp.toFixed(0);
        document.getElementById('hero-battle-hp').textContent = state.hero.hp.toFixed(0);
        document.getElementById('hero-hp-bar').style.width = '100%';
        document.getElementById('boss-hp-bar').style.width = '100%';
        document.getElementById('boss-battle-max-hp').textContent = boss.hp;
        document.getElementById('boss-battle-hp').textContent = boss.hp;
        document.getElementById('battle-log').innerHTML = '';
        
        // Callbacks для боя
        window.battleUI = {
            onHit: (dmg, isCrit, label) => {
                document.getElementById('boss-battle-hp').textContent = Battle.battleState.bossHp.toFixed(0);
                document.getElementById('boss-hp-bar').style.width = (Battle.battleState.bossHp / boss.hp * 100) + '%';
                document.getElementById('battle-log').innerHTML += `<div>${label}: ${dmg.toFixed(0)}</div>`;
            },
            onBossHit: (dmg) => {
                document.getElementById('hero-battle-hp').textContent = state.hero.hp.toFixed(0);
                document.getElementById('hero-hp-bar').style.width = (state.hero.hp / state.hero.maxHp * 100) + '%';
                document.getElementById('battle-log').innerHTML += `<div>Босс: ${dmg.toFixed(0)}</div>`;
            },
            onLog: (msg) => { document.getElementById('battle-log').innerHTML += `<div>${msg}</div>`; },
            onWin: () => {
                state.hero.silver += boss.reward.silver;
                state.hero.gold += boss.reward.gold;
                state.defeatedBosses.push(boss.id);
                saveGame(); UI.updateHUD();
                alert('Победа!');
                UI.goToScreen('map-screen');
            },
            onLose: () => { alert('Поражение'); UI.goToScreen('main-screen'); }
        };
    };

    window.playerAction = (action) => {
        if (action === 'attack') Battle.doAttack(1, 'АТАКА', window.battleUI);
        if (action === 'defend') { Battle.battleState.defending = true; Battle.bossTurn(window.battleUI); }
    };

    window.closeModal = (id) => document.getElementById(id).classList.add('hidden');

    // Подсветка активной вкладки магазина
    document.querySelectorAll('.shop-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            UI.renderShop();
        });
    });
});