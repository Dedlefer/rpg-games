import { state, loadGame, saveGame, calcStats, gainXP, syncHeroStats } from './js/state.js';
import { items, bosses } from './js/data.js';
import * as Battle from './js/battle.js';
import * as UI from './js/ui.js';
import { COLLECTIONS_DATA } from './js/ui.js'; // <-- ВОТ ЭТО БЫЛО ПРОПУЩЕНО
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
        if (id === 'tower-screen') renderTower();
        if (id === 'collections-screen') UI.renderCollections();
    };

    window.openProfileModal = (tab) => UI.openProfileModal(tab);
    window.switchProfileTab = (tab) => UI.switchProfileTab(tab);
    window.upgradeTalent = (id) => UI.upgradeTalent(id);
    window.closeModal = (id) => document.getElementById(id).classList.add('hidden');

    // --- Магазин ---
    window.buyItem = (id) => {
        const item = items.find(i => i.id === id);
        if (!item) return;

        if (state.hero.purchased.includes(item.id)) return;

        const price = item.price;
        if (state.hero.silver < (price.silver || 0)) return alert('Мало серебра!');
        if (state.hero.gold < (price.gold || 0)) return alert('Мало золота!');

        state.hero.silver -= price.silver || 0;
        state.hero.gold -= price.gold || 0;
        
        state.hero.purchased.push(item.id);
        
        if (!state.hero.equipped[item.type]) {
            state.hero.equipped[item.type] = item.id;
        }

        syncHeroStats(); 
        saveGame(); 
        UI.updateHUD(); 
        UI.renderShop();
        playSound('click');
    };

    window.equipFromShop = (id) => {
        const item = items.find(i => i.id === id);
        if (!item) return;
        
        state.hero.equipped[item.type] = item.id;
        
        if (item.type === 'weapon') {
            const attackBtnIcon = document.querySelector('.skill-btn[data-skill="attack"] .skill-icon');
            if (attackBtnIcon) {
                attackBtnIcon.innerHTML = `<img src="${item.image}" style="width: 40px; height: 40px; object-fit: contain; filter: drop-shadow(0 2px 4px #000);">`;
            }
        }
        
        saveGame();
        UI.renderShop();
        playSound('crit');
    };

    window.buyConsumable = (key, price) => {
        if (state.hero.silver >= price) {
            state.hero.silver -= price;
            state.hero.consumables[key] = (state.hero.consumables[key] || 0) + 1;
            saveGame(); UI.updateHUD(); UI.renderShop();
            playSound('click');
        } else alert('Мало серебра!');
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

        document.querySelectorAll('.skill-btn').forEach(btn => {
            btn.onclick = () => {
                const action = btn.dataset.action || btn.dataset.skill;
                if (action) window.playerAction(action);
            };
        });

        const equippedWeaponId = state.hero.equipped['weapon'];
        if (equippedWeaponId) {
            const weapon = items.find(i => i.id === equippedWeaponId);
            if (weapon) {
                const attackBtnIcon = document.querySelector('.skill-btn[data-skill="attack"] .skill-icon');
                if (attackBtnIcon) {
                    attackBtnIcon.innerHTML = `<img src="${weapon.image}" style="width: 40px; height: 40px; object-fit: contain; filter: drop-shadow(0 2px 4px #000);">`;
                }
            }
        }

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
                
                // Шанс на выпадение части коллекции (20%)
                let droppedParts = [];
                if (Math.random() < 0.20) {
                    let allParts = [];
                    for (let type in COLLECTIONS_DATA) {
                        COLLECTIONS_DATA[type].forEach(c => {
                            for(let i=1; i<=c.parts; i++) {
                                allParts.push({ id: `${c.id}-part${i}`, name: c.name });
                            }
                        });
                    }
                    
                    const missingParts = allParts.filter(p => !state.hero.collectionParts.includes(p.id));
                    
                    if (missingParts.length > 0) {
                        const randomPart = missingParts[Math.floor(Math.random() * missingParts.length)];
                        state.hero.collectionParts.push(randomPart.id);
                        droppedParts.push({ icon: '🧩', amount: 1, label: `Часть: ${randomPart.name}` });
                    }
                }

                saveGame(); 
                UI.updateHUD();

                UI.showVictoryModal({
                    silver: silverReward,
                    xp: xpReward,
                    items: droppedParts
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
            case 'attack': {
                Battle.doAttack(1, 'АТАКА', window.battleUI);
                break;
            }
            case 'frenzy': {
                if (!Battle.isSkillReady('frenzy')) return;
                Battle.startCooldown('frenzy');
                const bonus = 6 * (lvl.dmg - 1);
                Battle.doAttackFlat(bonus, 'СВИРЕПЫЙ УДАР', window.battleUI);
                break;
            }
            case 'shieldblock': {
                if (!Battle.isSkillReady('shieldblock')) return;
                Battle.startCooldown('shieldblock');
                Battle.battleState.bossDamageReduction = 2 * (lvl.def - 1);
                Battle.doAttack(1, 'БЛОК ЩИТОМ', window.battleUI);
                break;
            }
            case 'stealth': {
                if (!Battle.isSkillReady('stealth')) return;
                Battle.startCooldown('stealth');
                Battle.battleState.silentStrike = true;
                const bonus = 8 * (lvl.crit - 1);
                Battle.doAttackFlat(bonus, 'НЕВИДИМЫЙ УДАР', window.battleUI);
                break;
            }
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

    // --- Вкладки коллекций ---
    document.querySelectorAll('.coll-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.coll-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            UI.renderCollections();
            playSound('click');
        });
    });
});