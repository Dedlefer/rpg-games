import { state, loadGame, saveGame, calcStats, gainXP, syncHeroStats } from './js/state.js';
import { items, bosses } from './js/data.js';
import * as Battle from './js/battle.js';
import * as UI from './js/ui.js';
import { renderInventory, equipItem, unequipItem, sellItem } from './js/inventory.js';
import { openBossModal, closeBossModal, startBossFight } from './js/boss-modal.js';
import { renderTower, startTowerBattle } from './js/tower.js';
import { playSound } from './js/utils.js';

window.UI = UI;
window.Battle = Battle;

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

    // ============================================================
    // УНИВЕРСАЛЬНЫЙ SETUP БОЯ (новый интерфейс)
    // ============================================================
    window.setupBattleUI = (boss, overrides = {}) => {
        // Заполняем новый боевой интерфейс
        UI.renderBattleUI(boss, Battle.battleState.isTower);

        window.battleUI = {
            onHit: (dmg, isCrit, label) => {
                Battle.battleState.totalDamage += 0; // уже учтено в doAttack
                UI.updateBattleHP();
                document.getElementById('battle-log').innerHTML +=
                    `<div>${label}: ${dmg.toFixed(0)} ${isCrit ? '<span class="crit">(КРИТ!)</span>' : ''}</div>`;

                // Попап урона над боссом
                spawnDamagePopup('bt-damage-popups-boss', dmg, isCrit);

                // Анимация "hit" на боссе
                const bossImg = document.getElementById('bt-boss-img');
                bossImg.classList.remove('hit');
                void bossImg.offsetWidth;
                bossImg.classList.add('hit');

                playSound(isCrit ? 'crit' : 'hit');
                scrollLog();
            },
            onBossHit: (dmg) => {
                UI.updateBattleHP();
                document.getElementById('battle-log').innerHTML +=
                    `<div><span class="lose">Босс: ${dmg.toFixed(0)}</span></div>`;

                spawnDamagePopup('bt-damage-popups-hero', dmg, false);

                const heroImg = document.getElementById('bt-hero-img');
                heroImg.classList.remove('hit');
                void heroImg.offsetWidth;
                heroImg.classList.add('hit');

                playSound('hit');
                scrollLog();
            },
            onLog: (msg) => {
                document.getElementById('battle-log').innerHTML += `<div>${msg}</div>`;
                scrollLog();
            },
            onWin: overrides.onWin || (() => {
                Battle.stopBattleTimer();

                // Награды
                const goldReward = boss.reward.gold || 0;
                const silverReward = boss.reward.silver || 0;
                const xpReward = boss.reward.xp || 0;

                state.hero.silver += silverReward;
                state.hero.gold += goldReward;
                gainXP(xpReward);
                if (!state.defeatedBosses.includes(boss.id)) state.defeatedBosses.push(boss.id);
                saveGame(); UI.updateHUD();

                // Показываем модалку победы
                UI.showVictoryModal({
                    gold: goldReward,
                    stars: xpReward > 0 ? Math.round(xpReward * 0.99) : 1980,
                    items: []
                });

                playSound('crit');
            }),
            onLose: overrides.onLose || (() => {
                Battle.clearBattleTimers();
                playSound('lose');
                document.getElementById('battle-log').innerHTML +=
                    '<div class="lose">ПОРАЖЕНИЕ...</div>';
                setTimeout(() => {
                    alert('Поражение...');
                    if (Battle.battleState.isTower) {
                        UI.goToScreen('tower-screen');
                        renderTower();
                    } else {
                        UI.goToScreen('main-screen');
                    }
                }, 600);
            })
        };
    };

    function scrollLog() {
        const log = document.getElementById('battle-log');
        if (log) log.scrollTop = log.scrollHeight;
    }

    function spawnDamagePopup(containerId, dmg, isCrit) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const p = document.createElement('div');
        p.className = 'damage-popup' + (isCrit ? ' crit' : '');
        p.textContent = (isCrit ? 'КРИТ ' : '') + '-' + Math.round(dmg);
        p.style.left = (40 + Math.random() * 20) + '%';
        container.appendChild(p);
        setTimeout(() => p.remove(), 900);
    }

    // ============================================================
    // СТАРТ БОЯ С БОССОМ КАРТЫ
    // ============================================================
    window.startFight = (index) => {
        const boss = bosses[index];
        if (!boss) return;
        if (state.hero.level < boss.levelRequired) return;
        Battle.beginBattle(boss, false);
        UI.goToScreen('battle-screen');
        window.setupBattleUI(boss);
    };

    // ============================================================
    // ДЕЙСТВИЯ ИГРОКА (новые кнопки)
    // ============================================================
    window.playerAction = (action) => {
        if (!Battle.battleState.active) return;

        // Проверка кулдауна
        if (['attack', 'heavy', 'defend', 'potion'].includes(action)) {
            if (!Battle.isSkillReady(action)) {
                window.battleUI.onLog('<span class="lose">Скилл ещё не готов!</span>');
                return;
            }
        }

        switch (action) {
            case 'attack': {
                Battle.startCooldown('attack');
                Battle.doAttack(1, 'АТАКА', window.battleUI);
                break;
            }
            case 'heavy': {
                Battle.startCooldown('heavy');
                if (Math.random() < 0.25) {
                    window.battleUI.onLog('Тяжёлый удар промахнулся!');
                    Battle.bossTurn(window.battleUI);
                } else {
                    Battle.doAttack(1.8, 'ТЯЖЁЛЫЙ УДАР', window.battleUI);
                }
                break;
            }
            case 'defend': {
                Battle.startCooldown('defend');
                Battle.battleState.defending = true;
                window.battleUI.onLog('<span class="win">Герой в защите.</span>');
                Battle.bossTurn(window.battleUI);
                break;
            }
            case 'potion': {
                if (Battle.battleState.potions <= 0) {
                    window.battleUI.onLog('<span class="lose">Зелья закончились!</span>');
                    return;
                }
                Battle.startCooldown('potion');
                const heal = state.hero.maxHp * 0.3;
                state.hero.hp = Math.min(state.hero.maxHp, state.hero.hp + heal);
                Battle.battleState.potions--;
                UI.updateBattleHP();
                window.battleUI.onLog(`<span class="win">Зелье: +${heal.toFixed(0)} HP</span>`);
                playSound('heal');
                Battle.bossTurn(window.battleUI);
                break;
            }
            case 'ok': {
                // ОК = обычная атака (подтверждение)
                if (!Battle.isSkillReady('attack')) return;
                Battle.startCooldown('attack');
                Battle.doAttack(1, 'АТАКА', window.battleUI);
                break;
            }
        }
    };

    // ============================================================
    // ПОБЕГ / ЗАВЕРШЕНИЕ
    // ============================================================
    window.fleeBattle = () => {
        Battle.battleState.active = false;
        Battle.clearBattleTimers();
        document.getElementById('victory-modal').classList.add('hidden');
        if (Battle.battleState.isTower) {
            UI.goToScreen('tower-screen');
            renderTower();
        } else {
            UI.goToScreen('map-screen');
        }
    };

    window.closeVictoryModal = () => UI.closeVictoryModal();

    // Повторить бой (из модалки победы)
    window.repeatBattle = () => {
        document.getElementById('victory-modal').classList.add('hidden');
        const boss = Battle.battleState.currentBoss;
        if (boss) {
            Battle.beginBattle(boss, Battle.battleState.isTower);
            window.setupBattleUI(boss);
            UI.goToScreen('battle-screen');
        }
    };

    window.startDaily = () => alert('Ежедневный босс пока в разработке!');
    window.startTowerBattle = startTowerBattle;

    // --- Вкладки магазина ---
    document.querySelectorAll('.shop-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            UI.renderShop();
            playSound('click');
        });
    });

    // --- Вкладки инвентаря ---
    document.querySelectorAll('.inv-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.inv-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderInventory();
            playSound('click');
        });
    });

    // --- Слоты экипировки ---
    document.querySelectorAll('.equip-slot').forEach(slot => {
        slot.addEventListener('click', () => {
            UI.openEquipModal(slot.dataset.slot);
            playSound('click');
        });
    });
});