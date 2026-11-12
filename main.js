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
    // УНИВЕРСАЛЬНЫЙ SETUP БОЯ
    // ============================================================
    window.setupBattleUI = (boss, overrides = {}) => {
        UI.renderBattleUI(boss, Battle.battleState.isTower);

        // КРИТИЧНО: вешаем обработчики на кнопки скиллов
        document.querySelectorAll('.skill-btn').forEach(btn => {
            btn.onclick = () => {
                const action = btn.dataset.action || btn.dataset.skill;
                if (action) window.playerAction(action);
            };
        });

        window.battleUI = {
            onHit: (dmg, isCrit, label) => {
                UI.updateBattleHP();
                document.getElementById('battle-log').innerHTML +=
                    `<div>${label}: ${dmg.toFixed(0)} ${isCrit ? '<span class="crit">(КРИТ!)</span>' : ''}</div>`;

                spawnDamagePopup('bt-damage-popups-boss', dmg, isCrit);

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

                const goldReward = boss.reward.gold || 0;
                const silverReward = boss.reward.silver || 0;
                const xpReward = boss.reward.xp || 0;

                state.hero.silver += silverReward;
                state.hero.gold += goldReward;
                gainXP(xpReward);
                if (!state.defeatedBosses.includes(boss.id)) state.defeatedBosses.push(boss.id);
                saveGame(); UI.updateHUD();

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

        // После setup — синхронизируем кнопки с текущими кулдаунами
        UI.updateSkillCooldowns();
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
    // ДЕЙСТВИЯ ИГРОКА
    // ============================================================
    window.playerAction = (action) => {
        if (!Battle.battleState.active) return;
        const lvl = state.hero.talents;

        switch (action) {

            // АТАКА — без КД, спамится сколько угодно
            case 'attack': {
                Battle.doAttack(1, 'АТАКА', window.battleUI);
                break;
            }

            // СВИРЕПЫЙ УДАР — плоская прибавка 6×(lvl-1), босс отвечает
            case 'frenzy': {
                if (!Battle.isSkillReady('frenzy')) return;
                Battle.startCooldown('frenzy');
                const bonus = 6 * (lvl.dmg - 1);
                Battle.doAttackFlat(bonus, 'СВИРЕПЫЙ УДАР', window.battleUI);
                break;
            }

            // БЛОК ЩИТОМ — базовый удар, ответ босса минус 2×(lvl-1)
            case 'shieldblock': {
                if (!Battle.isSkillReady('shieldblock')) return;
                Battle.startCooldown('shieldblock');
                Battle.battleState.bossDamageReduction = 2 * (lvl.def - 1);
                Battle.doAttack(1, 'БЛОК ЩИТОМ', window.battleUI);
                break;
            }

            // НЕВИДИМЫЙ УДАР — плоская прибавка 8×(lvl-1), босс НЕ отвечает
            case 'stealth': {
                if (!Battle.isSkillReady('stealth')) return;
                Battle.startCooldown('stealth');
                Battle.battleState.silentStrike = true;
                const bonus = 8 * (lvl.crit - 1);
                Battle.doAttackFlat(bonus, 'НЕВИДИМЫЙ УДАР', window.battleUI);
                break;
            }

            // ЗЕЛЬЕ — из левой панели, хил 250 + 5×(lvl-1), босс отвечает
            case 'potion': {
                if (!Battle.isSkillReady('potion')) return;
                const bs = Battle.battleState;
                if (bs.potions <= 0) {
                    window.battleUI.onLog('<span class="lose">Зелья закончились!</span>');
                    return;
                }
                Battle.startCooldown('potion');
                const heal = 250 + 5 * (lvl.heal - 1);
                state.hero.hp = Math.min(state.hero.maxHp, state.hero.hp + heal);
                bs.potions--;
                UI.updateBattleHP();
                window.battleUI.onLog(`<span class="win">Зелье: +${heal} HP</span>`);
                playSound('heal');
                Battle.bossTurn(window.battleUI);
                break;
            }
        }
        UI.updateSkillCooldowns();
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

    // Повторить бой — перезапуск с тем же боссом
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