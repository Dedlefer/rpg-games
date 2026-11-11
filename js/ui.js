import { state, calcStats, saveGame } from './state.js';
import { items as itemData, consumables as consData, achievements as achData, bosses as bossData } from './data.js';
import { itemBonusText, rarityColor, todayStr, playSound, SLOT_LABELS } from './utils.js';

// Глобальные ссылки для state.js
window.itemsData = itemData;

export function updateHUD() {
    const h = state.hero;
    const s = calcStats();

    document.getElementById('hero-level').textContent = h.level;
    document.getElementById('left-hero-level').textContent = h.level;
    document.getElementById('hero-xp').textContent = h.xp;
    document.getElementById('hero-xp-to-next').textContent = h.xpToNext;
    document.getElementById('hero-xp-bar').style.width = (h.xp / h.xpToNext * 100) + '%';
    document.getElementById('hero-hp').textContent = s.maxHp.toFixed(0);
    document.getElementById('hero-damage').textContent = s.damage.toFixed(0);
    
    document.getElementById('hero-silver').textContent = h.silver;
    document.getElementById('hero-gold').textContent = h.gold;
    document.getElementById('hero-diamonds').textContent = h.diamonds;
    document.getElementById('hero-keys').textContent = h.keys;

    renderEquipment();
}

export function renderEquipment() {
    document.querySelectorAll('.equip-slot').forEach(slot => {
        const type = slot.dataset.slot;
        const equippedId = state.hero.equipment.find(id => {
            const it = itemData.find(i => i.id === id);
            return it && it.type === type;
        });

        if (equippedId) {
            const it = itemData.find(i => i.id === equippedId);
            slot.classList.remove('empty');
            slot.style.borderColor = rarityColor(it.rarity);
            slot.style.backgroundImage = `url('${it.image}')`;
            slot.innerHTML = `<div class="slot-bonus">${itemBonusText(it)}</div>`;
            slot.title = it.name;
        } else {
            slot.classList.add('empty');
            slot.style.borderColor = '#444';
            slot.style.backgroundImage = 'none';
            slot.innerHTML = '';
            slot.title = SLOT_LABELS[type];
        }
    });
}

// Функция переключения экранов
export function goToScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    playSound('click');
}

// Модалка Профиля
export function openProfileModal(tab) {
    document.getElementById('profile-modal').classList.remove('hidden');
    switchProfileTab(tab);
    updateProfileUI();
}

export function switchProfileTab(tabId) {
    document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.profile-tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector(`.profile-tab[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(`tab-${tabId}`).classList.add('active');
    
    if (tabId === 'achievements') renderAchievements();
}

// Логика Талантов
function getTalentPrice(id, lvl) {
    if (id === 'heal') return { gold: Math.floor(5 * Math.pow(1.5, lvl - 1)), silver: 0 };
    const basePrice = { hp: 10, dmg: 15, def: 20, crit: 20 };
    return { silver: Math.floor(basePrice[id] * Math.pow(1.4, lvl - 1)), gold: 0 };
}

export function updateProfileUI() {
    const h = state.hero;
    document.getElementById('lvl-hp').textContent = h.talents.hp;
    document.getElementById('lvl-dmg').textContent = h.talents.dmg;
    document.getElementById('lvl-def').textContent = h.talents.def;
    document.getElementById('lvl-crit').textContent = h.talents.crit;
    document.getElementById('lvl-heal').textContent = h.talents.heal;
    
    document.getElementById('price-hp').innerHTML = `💰 ${getTalentPrice('hp', h.talents.hp).silver}`;
    document.getElementById('price-dmg').innerHTML = `💰 ${getTalentPrice('dmg', h.talents.dmg).silver}`;
    document.getElementById('price-def').innerHTML = `💰 ${getTalentPrice('def', h.talents.def).silver}`;
    document.getElementById('price-crit').innerHTML = `💰 ${getTalentPrice('crit', h.talents.crit).silver}`;
    document.getElementById('price-heal').innerHTML = `🪙 ${getTalentPrice('heal', h.talents.heal).gold}`;
    
    document.getElementById('talent-silver').textContent = h.silver;
    document.getElementById('talent-gold').textContent = h.gold;
}

export function upgradeTalent(id) {
    const lvl = state.hero.talents[id];
    const price = getTalentPrice(id, lvl);
    
    if (price.silver > 0 && state.hero.silver < price.silver) return alert('Мало серебра!');
    if (price.gold > 0 && state.hero.gold < price.gold) return alert('Мало золота!');
    
    state.hero.silver -= price.silver;
    state.hero.gold -= price.gold;
    state.hero.talents[id]++;
    
    updateHUD();
    updateProfileUI();
    saveGame();
    playSound('crit');
}

// Рендер Достижений
export function renderAchievements() {
    const grid = document.getElementById('ach-grid');
    grid.innerHTML = '';
    achData.forEach(a => {
        const unlocked = state.hero.achievements.includes(a.id);
        const d = document.createElement('div');
        d.className = 'ach-card' + (unlocked ? ' unlocked' : '');
        d.innerHTML = `
            <h3>${a.name}</h3>
            <p>${a.desc}</p>
            <p class="ach-reward">${a.reward.silver ? '+' + a.reward.silver + ' сер.' : ''}${a.reward.diamonds ? '+' + a.reward.diamonds + ' 💎' : ''}</p>
            <p>${unlocked ? 'ПОЛУЧЕНО' : 'НЕ ПОЛУЧЕНО'}</p>`;
        grid.appendChild(d);
    });
}

// Карта
export function renderBosses() {
    const list = document.getElementById('boss-list');
    list.innerHTML = '';
    const daily = document.getElementById('daily-boss-banner');
    const claimedToday = state.hero.dailyClaimedDate === todayStr();
    
    if (!claimedToday) {
        daily.innerHTML = `<div class="daily-banner"><b>АНОМАЛИЯ ДНЯ</b> — ×3 награда!<button onclick="window.startDaily()">СРАЗИТЬСЯ</button></div>`;
    } else {
        daily.innerHTML = '<div class="daily-banner claimed">Аномалия зачищена.</div>';
    }

    bossData.forEach((boss, index) => {
        const locked = state.hero.level < boss.levelRequired;
        const defeated = state.defeatedBosses.includes(boss.id);
        const row = document.createElement('div');
        row.className = 'boss-node' + (locked ? ' locked' : '') + (defeated ? ' defeated' : '');
        row.style.left = (15 + (index % 3) * 30) + '%';
        row.style.top = (20 + Math.floor(index / 3) * 35) + '%';
        row.innerHTML = `
            <div class="node-marker"><img src="${boss.image}" class="boss-thumb" onerror="this.style.display='none'"></div>
            <div class="node-info"><h3>${boss.name}</h3><p>УР. ${boss.levelRequired}</p></div>
            ${locked ? '<span class="badge locked-badge">🔒</span>' : defeated ? '<span class="badge defeated-badge">✔</span>' : `<button class="btn-fight" onclick="window.startFight(${index})">БОЙ</button>`}`;
        list.appendChild(row);
    });
}

// Магазин
export function renderShop() {
    const tabs = document.querySelectorAll('.shop-tab');
    let currentType = 'weapon';
    tabs.forEach(t => { if(t.classList.contains('active')) currentType = t.dataset.type; });

    const grid = document.getElementById('shop-grid');
    grid.innerHTML = '';
    
    document.getElementById('daily-deal').innerHTML = ''; // Убрали товар дня для простоты

    if (currentType === 'potion') {
        consData.forEach(c => {
            const owned = state.hero.consumables[c.key] || 0;
            grid.innerHTML += `
                <div class="shop-item">
                    <img src="${c.image}" class="item-img" onerror="this.style.display='none'">
                    <h3>${c.name}</h3>
                    <div class="price"><img src="images/coin_silver.png" class="price-icon" onerror="this.style.display='none'">${c.price.silver}</div>
                    <p class="owned-label">В наличии: ${owned}</p>
                    <button onclick="window.buyConsumable('${c.key}', ${c.price.silver})">КУПИТЬ</button>
                </div>`;
        });
        return;
    }

    itemData.filter(i => i.type === currentType).forEach(item => {
        const owned = state.hero.inventory.includes(item.id) || state.hero.equipment.includes(item.id);
        const equipped = state.hero.equipment.includes(item.id);
        grid.innerHTML += `
            <div class="shop-item ${owned ? 'bought' : ''}" style="border-color:${rarityColor(item.rarity)}">
                <img src="${item.image}" class="item-img" onerror="this.style.display='none'">
                <h3>${item.name}</h3>
                <p>${itemBonusText(item)}</p>
                <div class="price">
                    <img src="images/coin_silver.png" class="price-icon" onerror="this.style.display='none'">${item.price.silver}
                    <img src="images/coin_gold.png" class="price-icon" onerror="this.style.display='none'">${item.price.gold}
                </div>
                ${owned ? `<div class="owned-label">${equipped ? 'НАДЕТО' : 'КУПЛЕНО'}</div>` : `<button onclick="window.buyItem('${item.id}')">КУПИТЬ</button>`}
            </div>`;
    });
}