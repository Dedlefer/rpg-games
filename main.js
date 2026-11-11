import { state, loadGame, saveGame, calcStats, gainXP, syncHeroStats } from './js/state.js';
import { items, bosses } from './js/data.js';
import * as Battle from './js/battle.js';
import * as UI from './js/ui.js';
import { renderInventory, equipItem, unequipItem, sellItem } from './js/screens/inventory.js';
import { openBossModal, closeBossModal, startBossFight } from './js/screens/boss-modal.js';
import { renderTower, startTowerBattle } from './js/screens/tower.js';
import { playSound } from './js/utils.js';

window.UI = UI;

document.addEventListener('DOMContentLoaded', () => {
    loadGame();
    syncHeroStats();
    UI.updateHUD();
    UI.renderBosses();
    UI.renderShop();

    // --- Навигация ---
    window.goToScreen = (id) => {
        UI.goToScreen(id);
        if (id === 'map-screen') UI.renderBosses();
        if (id === 'shop-screen') UI.renderShop();
        if (id === 'inventory-screen') renderInventory();
        if (id === 'tower-screen') renderTower();
    };

    window.openProfileModal = (tab) => UI.openProfileModal(tab);
    window.switchProfileTab = (tab) => UI.switchProfileTab(tab);
    window.upgradeTalent = (id) => UI.upgradeTalent(id);
    window.closeModal = (id) => document.getElementById(id).classList.add('hidden');

    // --- Магазин ---
    window.buyItem = (id) => {
        const item = items.find(i => i.id === id);
        if (!item) return;
        const price = item.price;
        if (state.hero.silver < (price.silver || 0)) return alert('Мало серебра!');
        if (state.hero.gold < (price.gold || 0)) return alert('Мало золота!');
        state.hero.silver -= price.silver || 0;
        state.hero.gold -= price.gold || 0;
        state.hero.inventory.push(item.id);
        saveGame(); UI.updateHUD(); UI.renderShop();
        playSound('click');
    };

    window.buyConsumable = (key, price) => {
        if (state.hero.silver >= price) {
            state.hero.silver -= price;
            state.hero.consumables[key] = (state.hero.consumables[key] || 0) + 1;
            saveGame(); UI.updateHUD(); UI.renderShop();
            playSound('click');
        } else alert('Мало серебра!');
    };

    // --- Инвентарь ---
    window.equipItem = equipItem;
    window.unequipItem = unequipItem;
    window.sellItem = sellItem;

    window.openChest = () => {
        if (state.hero.keys < 3) return;
        state.hero.keys -= 3;
        const pool = items.filter(i => !state.hero.inventory.includes(i.id) && !state.hero.equipment.includes(i.id));
        if (pool.length === 0) { alert('Все предметы собраны!'); state.hero.keys += 3; return; }
        const reward = pool[Math.floor(Math.random() * pool.length)];
        state.hero.inventory.push(reward.id);
        alert(`Из сундука выпал: ${reward.name}!`);
        saveGame(); UI.updateHUD(); renderInventory();
        playSound('crit');
    };

    // --- Окно босса ---
    window.openBossModal = openBossModal;
    window.closeBossModal = closeBossModal;
    window.startBossFight = startBossFight;

    // --- Универсальный setup боя ---
    window.setupBattleUI = (boss, overrides = {}) => {
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
        document.getElementById('battle-log').innerHTML = '';
        document.getElementById('potion-count').textContent = Battle.battleState.potions;

        window.battleUI = {
            onHit: (dmg, isCrit, label) => {
                document.getElementById('boss-battle-hp').textContent = Math.max(0, Battle.battleState.bossHp).toFixed(0);
                document.getElementById('boss-hp-bar').style.width = Math.max(0, (Battle.battleState.bossHp / boss.hp * 100)) + '%';
                document.getElementById('battle-log').innerHTML += `<div>${label}: ${dmg.toFixed(0)} ${isCrit ? '(КРИТ!)' : ''}</div>`;
                playSound(isCrit ? 'crit' : 'hit');
            },
            onBossHit: (dmg) => {
                document.getElementById('hero-battle-hp').textContent = Math.max(0, state.hero.hp).toFixed(0);
                document.getElementById('hero-hp-bar').style.width = Math.max(0, (state.hero.hp / state.hero.maxHp * 100)) + '%';
                document.getElementById('battle-log').innerHTML += `<div>Босс: ${dmg.toFixed(0)}</div>`;
                playSound('hit');
            },
            onLog: (msg) => { document.getElementById('battle-log').innerHTML += `<div>${msg}</div>`; },
            onWin: overrides.onWin || (() => {
                state.hero.silver += boss.reward.silver;
                state.hero.gold += boss.reward.gold;
                gainXP(boss.reward.xp);
                if (!state.defeatedBosses.includes(boss.id)) state.defeatedBosses.push(boss.id);
                saveGame(); UI.updateHUD();
                alert(`Победа! Получено ${boss.reward.silver} сер., ${boss.reward.gold} зол., ${boss.reward.xp} XP.`);
                UI.goToScreen('map-screen');
            }),
            onLose: overrides.onLose || (() => {
                alert('Поражение...');
                UI.goToScreen('main-screen');
            })
        };
    };

    window.startFight = (index) => {
        const boss = bosses[index];
        if (!boss) return;
        if (state.hero.level < boss.levelRequired) return;
        Battle.beginBattle(boss, false);
        UI.goToScreen('battle-screen');
        window.setupBattleUI(boss);
    };

    window.playerAction = (action) => {
        if (!Battle.battleState.active) return;
        if (action === 'attack') Battle.doAttack(1, 'АТАКА', window.battleUI);
        if (action === 'heavy') {
            if (Math.random() < 0.25) {
                window.battleUI.onLog('Промах!');
                Battle.bossTurn(window.battleUI);
            } else Battle.doAttack(1.8, 'ТЯЖЁЛЫЙ УДАР', window.battleUI);
        }
        if (action === 'defend') {
            Battle.battleState.defending = true;
            window.battleUI.onLog('Герой в защите.');
            Battle.bossTurn(window.battleUI);
        }
        if (action === 'potion') {
            if (Battle.battleState.potions <= 0) return;
            const heal = state.hero.maxHp * 0.3;
            state.hero.hp = Math.min(state.hero.maxHp, state.hero.hp + heal);
            Battle.battleState.potions--;
            document.getElementById('potion-count').textContent = Battle.battleState.potions;
            document.getElementById('hero-battle-hp').textContent = state.hero.hp.toFixed(0);
            document.getElementById('hero-hp-bar').style.width = (state.hero.hp / state.hero.maxHp * 100) + '%';
            window.battleUI.onLog(`Зелье: +${heal.toFixed(0)} HP`);
            playSound('heal');
            Battle.bossTurn(window.battleUI);
        }
    };

    window.fleeBattle = () => {
        Battle.battleState.active = false;
        if (Battle.battleState.isTower) {
            UI.goToScreen('tower-screen');
            renderTower();
        } else {
            UI.goToScreen('map-screen');
        }
    };

    window.startDaily = () => alert('Ежедневный босс пока в разработке!');
    window.startTowerBattle = startTowerBattle;

    // --- Вкладки ---
    document.querySelectorAll('.shop-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            UI.renderShop();
            playSound('click');
        });
    });

    document.querySelectorAll('.inv-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.inv-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderInventory();
            playSound('click');
        });
    });

    document.querySelectorAll('.equip-slot').forEach(slot => {
        slot.addEventListener('click', () => {
            UI.openEquipModal(slot.dataset.slot);
            playSound('click');
        });
    });
});