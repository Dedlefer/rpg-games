import { state, calcStats, saveGame, syncHeroStats } from './state.js';
import { items as itemData, consumables as consData, achievements as achData, bosses as bossData } from './data.js';
import { itemBonusText, rarityColor, todayStr, playSound, SLOT_LABELS } from './utils.js';

export function updateHUD() {
    const h = state.hero;
    const s = syncHeroStats();

    document.getElementById('hero-level').textContent = h.level;
    document.getElementById('left-hero-level').textContent = h.level;
    document.getElementById('hero-xp').textContent = h.xp;
    document.getElementById('hero-xp-to-next').textContent = h.xpToNext;
    document.getElementById('hero-xp-bar').style.width = Math.min(100, (h.xp / h.xpToNext * 100)) + '%';
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

export function goToScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    playSound('click');
}

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

    syncHeroStats();
    updateHUD();
    updateProfileUI();
    saveGame();
    playSound('crit');
}

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
            <div class="node-marker" onclick="window.openBossModal(${index})">
                <img src="${boss.image}" class="boss-thumb" onerror="this.style.display='none'">
            </div>
            <div class="node-info" onclick="window.openBossModal(${index})">
                <h3>${boss.name}</h3><p>УР. ${boss.levelRequired}</p>
            </div>
            ${locked ? '<span class="badge locked-badge">🔒</span>' : defeated ? '<span class="badge defeated-badge">✔</span>' : ''}`;
        list.appendChild(row);
    });
}

export function renderShop() {
    const tabs = document.querySelectorAll('.shop-tab');
    let currentType = 'weapon';
    tabs.forEach(t => { if (t.classList.contains('active')) currentType = t.dataset.type; });

    const grid = document.getElementById('shop-grid');
    grid.innerHTML = '';
    document.getElementById('daily-deal').innerHTML = '';

    if (currentType === 'potion') {
        consData.forEach(c => {
            const owned = state.hero.consumables[c.key] || 0;
            const d = document.createElement('div');
            d.className = 'shop-item';
            d.innerHTML = `
                <img src="${c.image}" class="item-img" onerror="this.style.display='none'">
                <h3>${c.name}</h3>
                <div class="price"><img src="images/coin_silver.png" class="price-icon" onerror="this.style.display='none'">${c.price.silver}</div>
                <p class="owned-label">В наличии: ${owned}</p>
                <button onclick="window.buyConsumable('${c.key}', ${c.price.silver})">КУПИТЬ</button>`;
            grid.appendChild(d);
        });
        return;
    }

    itemData.filter(i => i.type === currentType).forEach(item => {
        const owned = state.hero.inventory.includes(item.id) || state.hero.equipment.includes(item.id);
        const equipped = state.hero.equipment.includes(item.id);
        const d = document.createElement('div');
        d.className = 'shop-item' + (owned ? ' bought' : '');
        d.style.borderColor = rarityColor(item.rarity);
        d.innerHTML = `
            <img src="${item.image}" class="item-img" onerror="this.style.display='none'">
            <h3>${item.name}</h3>
            <p>${itemBonusText(item)}</p>
            <div class="price">
                <img src="images/coin_silver.png" class="price-icon" onerror="this.style.display='none'">${item.price.silver || 0}
                <img src="images/coin_gold.png" class="price-icon" onerror="this.style.display='none'">${item.price.gold || 0}
            </div>
            ${owned
                ? `<div class="owned-label">${equipped ? 'НАДЕТО' : 'В СУМКЕ'}</div>`
                : `<button onclick="window.buyItem('${item.id}')">КУПИТЬ</button>`}`;
        grid.appendChild(d);
    });
}

export function openEquipModal(type) {
    document.getElementById('equip-modal').classList.remove('hidden');
    document.getElementById('modal-slot-name').textContent = SLOT_LABELS[type] || type.toUpperCase();
    renderModalItems(type);
}

export function renderModalItems(type) {
    const box = document.getElementById('modal-items');
    box.innerHTML = '';

    const equippedId = state.hero.equipment.find(id => {
        const it = itemData.find(i => i.id === id); return it && it.type === type;
    });

    if (equippedId) {
        const it = itemData.find(i => i.id === equippedId);
        const d = document.createElement('div');
        d.className = 'modal-item';
        d.style.borderColor = rarityColor(it.rarity);
        d.innerHTML = `
            <img src="${it.image}" class="item-img" onerror="this.style.display='none'">
            <h3>${it.name}</h3>
            <p>${itemBonusText(it)}</p>
            <button onclick="window.unequipItem('${type}')">СНЯТЬ</button>`;
        box.appendChild(d);
    }

    const available = state.hero.inventory.filter(id => {
        const it = itemData.find(i => i.id === id); return it && it.type === type;
    });

    if (!equippedId && available.length === 0) {
        box.innerHTML += '<p style="color:#666; text-align:center; width:100%;">Нет предметов этого типа</p>';
        return;
    }

    available.forEach(id => {
        const it = itemData.find(i => i.id === id);
        const d = document.createElement('div');
        d.className = 'modal-item';
        d.style.borderColor = rarityColor(it.rarity);
        d.innerHTML = `
            <img src="${it.image}" class="item-img" onerror="this.style.display='none'">
            <h3>${it.name}</h3>
            <p>${itemBonusText(it)}</p>
            <button onclick="window.equipItem('${id}')">НАДЕТЬ</button>`;
        box.appendChild(d);
    });
}

/* ============================================================
   НОВЫЕ ФУНКЦИИ ДЛЯ БОЕВОГО ЭКРАНА
   ============================================================ */

// Заполняет новый боевой интерфейс данными
export function renderBattleUI(boss, isTower = false) {
    const hero = state.hero;

    document.getElementById('bt-hero-name').textContent = 'ГЕРОЙ';
    document.getElementById('bt-boss-name').textContent = boss.name;

    document.getElementById('bt-hero-max-hp').textContent = hero.maxHp.toFixed(0);
    document.getElementById('bt-hero-hp').textContent = hero.hp.toFixed(0);
    document.getElementById('bt-hero-mana').textContent = '100';
    document.getElementById('bt-hero-max-mana').textContent = '100';

    document.getElementById('bt-hero-hp-fill').style.width = '100%';
    document.getElementById('bt-hero-mana-fill').style.width = '100%';

    document.getElementById('bt-boss-max-hp').textContent = boss.hp;
    document.getElementById('bt-boss-hp').textContent = boss.hp;
    document.getElementById('bt-boss-hp-fill').style.width = '100%';

    const bossImg = document.getElementById('bt-boss-img');
    bossImg.src = boss.image;
    bossImg.onerror = () => { bossImg.src = 'https://via.placeholder.com/260x340/1a1a2e/e94560?text=Boss'; };

    const heroImg = document.getElementById('bt-hero-img');
    heroImg.src = 'images/hero_full.png';

    document.getElementById('battle-log').innerHTML = '';
    document.getElementById('bt-potion-count').textContent = '3';

    document.getElementById('bt-timer').textContent = '00:00:00';

    // Очистка кулдаунов
    ['attack', 'heavy', 'defend', 'potion'].forEach(s => {
        const btn = document.querySelector(`.skill-btn[data-skill="${s}"]`);
        const cd = document.getElementById(`cd-${s}`);
        if (btn) btn.classList.remove('on-cooldown');
        if (cd) cd.style.width = '100%';
    });

    // Быстрые слоты (зелья) слева
    renderQuickSlots();
}

// Обновляет HP-бары и цифры в новом бою
export function updateBattleHP() {
    const hero = state.hero;
    const bs = window.Battle && window.Battle.battleState
        ? window.Battle.battleState
        : null;

    const heroHp = Math.max(0, hero.hp);
    document.getElementById('bt-hero-hp').textContent = heroHp.toFixed(0);
    document.getElementById('bt-hero-max-hp').textContent = hero.maxHp.toFixed(0);
    document.getElementById('bt-hero-hp-fill').style.width =
        Math.max(0, Math.min(100, (heroHp / hero.maxHp) * 100)) + '%';

    if (bs) {
        const bossHp = Math.max(0, bs.bossHp);
        const bossMax = bs.bossMaxHp || 1;
        document.getElementById('bt-boss-hp').textContent = bossHp.toFixed(0);
        document.getElementById('bt-boss-max-hp').textContent = bossMax;
        document.getElementById('bt-boss-hp-fill').style.width =
            Math.max(0, Math.min(100, (bossHp / bossMax) * 100)) + '%';
        document.getElementById('bt-potion-count').textContent = bs.potions;
    }
}

// Рендер левой панели быстрых слотов (зелья)
export function renderQuickSlots() {
    const wrap = document.getElementById('quick-slots');
    if (!wrap) return;
    wrap.innerHTML = '';

    const slots = [
        { icon: '🧪', key: 'potion', count: (state.hero.consumables && state.hero.consumables.potion) || 0, label: 'Зелье' },
        { icon: '💊', key: 'elixir', count: (state.hero.consumables && state.hero.consumables.elixir) || 0, label: 'Эликсир' },
        { icon: '🔮', key: 'orb',    count: (state.hero.consumables && state.hero.consumables.orb) || 0,    label: 'Сфера' }
    ];

    slots.forEach((s, i) => {
        const div = document.createElement('div');
        div.className = 'quick-slot';
        div.title = s.label;
        div.innerHTML = `
            <div class="qs-icon">${s.icon}</div>
            <div class="qs-count">${s.count > 999 ? '999+' : s.count}</div>`;
        div.addEventListener('click', () => {
            if (s.key === 'potion') window.playerAction('potion');
        });
        wrap.appendChild(div);
    });
}

// Показ модалки победы с трофеями и уроном
export function showVictoryModal(rewards) {
    const modal = document.getElementById('victory-modal');
    if (!modal) return;

    const dmg = (window.Battle && window.Battle.battleState)
        ? Math.round(window.Battle.battleState.totalDamage)
        : 0;
    document.getElementById('victory-dmg').textContent = dmg.toLocaleString('ru-RU');

    const trophiesBox = document.getElementById('victory-trophies');
    trophiesBox.innerHTML = '';

    const items = rewards.items || [];
    items.forEach(it => {
        const d = document.createElement('div');
        d.className = 'vt-item';
        d.innerHTML = `
            <div class="vt-icon">${it.icon || '🎁'}</div>
            <div class="vt-amount">×${it.amount || 1}</div>
            <div class="vt-label">${it.label || 'Трофей'}</div>`;
        trophiesBox.appendChild(d);
    });

    if (rewards.gold) {
        const d = document.createElement('div');
        d.className = 'vt-item';
        d.innerHTML = `
            <div class="vt-icon">💰</div>
            <div class="vt-amount">+${rewards.gold}</div>
            <div class="vt-label">Золото</div>`;
        trophiesBox.appendChild(d);
    }

    if (rewards.stars) {
        const d = document.createElement('div');
        d.className = 'vt-item';
        d.innerHTML = `
            <div class="vt-icon">⭐</div>
            <div class="vt-amount">+${rewards.stars}</div>
            <div class="vt-label">Звёзды</div>`;
        trophiesBox.appendChild(d);
    }

    // Боковые панели
    const rating = document.getElementById('victory-rating');
    rating.innerHTML = `
        <li><span>1. Тень</span><b>12 480</b></li>
        <li><span>2. Клык</span><b>11 320</b></li>
        <li><span>3. Пепел</span><b>10 990</b></li>
        <li><span>Вы</span><b>${dmg.toLocaleString('ru-RU')}</b></li>`;

    const trophyList = document.getElementById('victory-trophy-list');
    trophyList.innerHTML = `
        <li><span>Золото</span><b>+${rewards.gold || 0}</b></li>
        <li><span>Звёзды</span><b>+${rewards.stars || 0}</b></li>
        <li><span>Предметы</span><b>${(rewards.items || []).length}</b></li>`;

    modal.classList.remove('hidden');
}

// Закрыть модалку победы
export function closeVictoryModal() {
    const modal = document.getElementById('victory-modal');
    if (modal) modal.classList.add('hidden');

    // Останавливаем таймер
    if (window.Battle) window.Battle.clearBattleTimers();

    // Возврат на карту / башню
    if (window.Battle && window.Battle.battleState.isTower) {
        goToScreen('tower-screen');
        if (window.renderTower) window.renderTower();
    } else {
        goToScreen('map-screen');
    }
}