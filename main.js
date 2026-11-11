import { state, loadGame, saveGame, calcStats, gainXP, syncHeroStats } from './js/state.js';
import { items, bosses } from './js/data.js';
import * as Battle from './js/battle.js';
import * as UI from './js/ui.js';
import { renderInventory, equipItem, unequipItem, sellItem } from './js/inventory.js';
import { openBossModal, closeBossModal, startBossFight } from './js/boss-modal.js';
import { renderTower, startTowerBattle } from './js/tower.js';
import { setupBattleUI, showVictoryScreen } from './js/battle-ui.js'; // Импорт UI боя
import { playSound } from './js/utils.js';

window.UI = UI;

// Универсальная функция показа модалки (замена alert)
window.showModal = (title, text, onOk, isDanger = false) => {
    const modal = document.getElementById('custom-modal');
    document.getElementById('cm-title').textContent = title;
    document.getElementById('cm-title').style.color = isDanger ? 'var(--accent)' : 'var(--gold)';
    document.getElementById('cm-text').textContent = text;
    modal.classList.remove('hidden');
    
    document.getElementById('cm-ok').onclick = () => {
        modal.classList.add('hidden');
        if (onOk) onOk();
    };
};

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

    // --- Магазин (с кастомными модалками) ---
    window.buyItem = (id) => {
        const item = items.find(i => i.id === id);
        if (!item) return;
        const price = item.price;
        if (state.hero.silver < (price.silver || 0)) return window.showModal('ОШИБКА', 'Недостаточно серебра!', null, true);
        if (state.hero.gold < (price.gold || 0)) return window.showModal('ОШИБКА', 'Недостаточно золота!', null, true);
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
        } else window.showModal('ОШИБКА', 'Недостаточно серебра!', null, true);
    };

    // --- Инвентарь ---
    window.equipItem = equipItem;
    window.unequipItem = unequipItem;
    window.sellItem = sellItem;

    window.openChest = () => {
        if (state.hero.keys < 3) return;
        state.hero.keys -= 3;
        const pool = items.filter(i => !state.hero.inventory.includes(i.id) && !state.hero.equipment.includes(i.id));
        if (pool.length === 0) {
            state.hero.keys += 3;
            return window.showModal('СУНДУК', 'Вы уже собрали все предметы!');
        }
        const reward = pool[Math.floor(Math.random() * pool.length)];
        state.hero.inventory.push(reward.id);
        saveGame(); UI.updateHUD(); renderInventory();
        playSound('crit');
        window.showModal('СУНДУК ОТКРЫТ', `Вы получили: ${reward.name}!`);
    };

    // --- Окно босса ---
    window.openBossModal = openBossModal;
    window.closeBossModal = closeBossModal;
    window.startBossFight = startBossFight;

    // --- Бой ---
    window.setupBattleUI = setupBattleUI;

    window.startFight = (index) => {
        const boss = bosses[index];
        if (!boss) return;
        if (state.hero.level < boss.levelRequired) return;
        Battle.beginBattle(boss, false);
        UI.goToScreen('battle-screen');
        setupBattleUI(boss);
    };

    window.playerAction = (action) => {
        if (!Battle.battleState.active) return;
        
        const btn = document.getElementById(`btn-action-${action}`);
        if (btn) {
            btn.style.transform = 'scale(0.9)';
            setTimeout(() => btn.style.transform = '', 100);
        }

        if (action === 'attack') Battle.doAttack(1, 'АТАКА', window.battleUI);
        if (action === 'heavy') {
            if (Math.random() < 0.25) {
                window.battleUI.onLog('<span class="lose">Промах!</span>');
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
            window.battleUI.onLog(`<span class="win">Зелье: +${heal.toFixed(0)} HP</span>`);
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

    window.startDaily = () => window.showModal('В РАЗРАБОТКЕ', 'Ежедневный босс пока в разработке!');
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