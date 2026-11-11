import { state, loadGame, saveGame, calcStats, gainXP } from './state.js';
import { items, bosses, consumables } from './data.js';
import * as Battle from './battle.js';
import * as UI from './ui.js';
import { rarityColor, itemBonusText, todayStr, playSound, SLOT_LABELS } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    loadGame();
    UI.updateHUD();
    UI.renderBosses();
    UI.renderShop();

    // --- Глобальные функции для HTML (onclick) ---
    window.goToScreen = (id) => {
        UI.goToScreen(id);
        if (id === 'map-screen') UI.renderBosses();
        if (id === 'shop-screen') UI.renderShop();
        if (id === 'inventory-screen') UI.renderInventory();
    };

    window.openProfileModal = (tab) => UI.openProfileModal(tab);
    window.switchProfileTab = (tab) => UI.switchProfileTab(tab);
    window.upgradeTalent = (id) => UI.upgradeTalent(id);
    window.closeModal = (id) => document.getElementById(id).classList.add('hidden');

    // --- Магазин ---
    window.buyItem = (id) => {
        const item = items.find(i => i.id === id);
        if (state.hero.silver >= item.price.silver) {
            state.hero.silver -= item.price.silver;
            state.hero.inventory.push(item.id);
            saveGame(); UI.updateHUD(); UI.renderShop();
            playSound('click');
        } else alert('Мало серебра!');
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
    window.equipItem = (itemId) => {
        const item = items.find(i => i.id === itemId);
        const old = state.hero.equipment.find(id => {
            const it = items.find(i => i.id === id); return it && it.type === item.type;
        });
        if (old) state.hero.inventory.push(old);
        state.hero.equipment = state.hero.equipment.filter(id => id !== old);
        state.hero.inventory = state.hero.inventory.filter(id => id !== itemId);
        state.hero.equipment.push(itemId);
        saveGame(); UI.updateHUD(); UI.renderInventory();
        window.closeModal('equip-modal');
        playSound('crit');
    };

    window.unequipItem = (type) => {
        const id = state.hero.equipment.find(eid => {
            const it = items.find(i => i.id === eid); return it && it.type === type;
        });
        if (!id) return;
        state.hero.equipment = state.hero.equipment.filter(x => x !== id);
        state.hero.inventory.push(id);
        saveGame(); UI.updateHUD(); UI.renderInventory();
        window.closeModal('equip-modal');
    };

    window.sellItem = (id) => {
        const it = items.find(i => i.id === id);
        if (!it) return;
        const price = Math.floor(it.price.silver * 0.5);
        state.hero.silver += price;
        state.hero.inventory = state.hero.inventory.filter(x => x !== id);
        saveGame(); UI.updateHUD(); UI.renderInventory();
        playSound('click');
    };

    window.openChest = () => {
        if (state.hero.keys < 3) return;
        state.hero.keys -= 3;
        const pool = items.filter(i => !state.hero.inventory.includes(i.id) && !state.hero.equipment.includes(i.id));
        if (pool.length === 0) { alert('Все предметы собраны!'); state.hero.keys += 3; return; }
        const reward = pool[Math.floor(Math.random() * pool.length)];
        state.hero.inventory.push(reward.id);
        alert(`Из сундука выпал: ${reward.name}!`);
        saveGame(); UI.updateHUD(); UI.renderInventory();
        playSound('crit');
    };

    // --- Карта и Бой ---
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
        
        // Callbacks
        window.battleUI = {
            onHit: (dmg, isCrit, label) => {
                document.getElementById('boss-battle-hp').textContent = Math.max(0, Battle.battleState.bossHp).toFixed(0);
                document.getElementById('boss-hp-bar').style.width = Math.max(0, (Battle.battleState.bossHp / boss.hp * 100)) + '%';
                document.getElementById('battle-log').innerHTML += `<div>${label}: ${dmg.toFixed(0)} ${isCrit?'(КРИТ!)':''}</div>`;
            },
            onBossHit: (dmg) => {
                document.getElementById('hero-battle-hp').textContent = Math.max(0, state.hero.hp).toFixed(0);
                document.getElementById('hero-hp-bar').style.width = Math.max(0, (state.hero.hp / state.hero.maxHp * 100)) + '%';
                document.getElementById('battle-log').innerHTML += `<div>Босс: ${dmg.toFixed(0)}</div>`;
            },
            onLog: (msg) => { document.getElementById('battle-log').innerHTML += `<div>${msg}</div>`; },
            onWin: () => {
                state.hero.silver += boss.reward.silver;
                state.hero.gold += boss.reward.gold;
                if (!state.defeatedBosses.includes(boss.id)) state.defeatedBosses.push(boss.id);
                saveGame(); UI.updateHUD();
                alert(`Победа! Получено ${boss.reward.silver} сер. и ${boss.reward.gold} зол.`);
                UI.goToScreen('map-screen');
            },
            onLose: () => { alert('Поражение...'); UI.goToScreen('main-screen'); }
        };
    };

    window.startDaily = () => {
        // Заглушка для ежедневного босса
        alert("Ежедневный босс пока в разработке!");
    };

    window.playerAction = (action) => {
        if (!Battle.battleState.active) return;
        if (action === 'attack') Battle.doAttack(1, 'АТАКА', window.battleUI);
        if (action === 'heavy') {
            if (Math.random() < 0.25) { window.battleUI.onLog('Промах!'); Battle.bossTurn(window.battleUI); }
            else Battle.doAttack(1.8, 'ТЯЖЁЛЫЙ УДАР', window.battleUI);
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
            Battle.bossTurn(window.battleUI);
        }
    };

    window.fleeBattle = () => {
        Battle.battleState.active = false;
        UI.goToScreen('map-screen');
    };

    window.startTowerBattle = () => {
        alert("Башня пока в разработке!");
    };

    // Слушатели вкладок магазина и инвентаря
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
            UI.renderInventory();
            playSound('click');
        });
    });

    // Слоты экипировки
    document.querySelectorAll('.equip-slot').forEach(slot => {
        slot.addEventListener('click', () => {
            UI.openEquipModal(slot.dataset.slot);
            playSound('click');
        });
    });
});