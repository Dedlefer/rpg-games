import { state, calcStats, saveGame, syncHeroStats } from './state.js';
import { items as itemData, consumables as consData, achievements as achData, bosses as bossData } from './data.js';
import { itemBonusText, rarityColor, todayStr, playSound, SLOT_LABELS } from './utils.js';

// --- Конфигурация для красивого рендера талантов ---
const TALENT_INFO = {
    hp:   { name: 'ВЫНОСЛИВОСТЬ',    icon: 'images/skill_hp.png' },
    dmg:  { name: 'СВИРЕПЫЙ УДАР',   icon: 'images/skill_dmg.png' },
    def:  { name: 'БЛОК ЩИТОМ',      icon: 'images/skill_def.png' },
    crit: { name: 'НЕВИДИМЫЙ УДАР',  icon: 'images/skill_crit.png' },
    heal: { name: 'МАСТЕР ЦЕЛИТЕЛЬ', icon: 'images/skill_heal.png' }
};

// --- ДАННЫЕ КОЛЛЕКЦИЙ ---
// id - уникальный id коллекции, rewardItemId - id предмета из data.js, который она открывает
export const COLLECTIONS_DATA = {
    weapon: [
        { id: 'coll-w1', name: 'Меч Гвардейца', rewardItemId: 'w10', parts: 5 },
        { id: 'coll-w2', name: 'Кровавая Заря', rewardItemId: 'w15', parts: 5 }
    ],
    helmet: [
        { id: 'coll-h1', name: 'Шлем Хитина', rewardItemId: 'h10', parts: 5 }
    ],
    chest: [
        { id: 'coll-c1', name: 'Броня Мембраны', rewardItemId: 'c10', parts: 5 }
    ],
    gloves: [
        { id: 'coll-g1', name: 'Хватка Богов', rewardItemId: 'g10', parts: 5 }
    ]
};

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
    if (tabId === 'talents') updateProfileUI();
}

function getTalentPrice(id, lvl) {
    const CONFIG = {
        dmg:  { base: 201, step: 2.1,   currency: 'silver' },
        def:  { base: 21,  step: 3.8,   currency: 'silver' },
        crit: { base: 281, step: 12.55, currency: 'silver' },
        heal: { base: 151, step: 7.93,  currency: 'gold'   },
        hp:   { base: 18,  step: 3.32,  currency: 'gold'   }
    };

    const cfg = CONFIG[id];
    if (!cfg) return { silver: 0, gold: 0 };

    const cost = Math.floor(cfg.base + (lvl - 1) * cfg.step);

    return cfg.currency === 'gold' 
        ? { silver: 0, gold: cost } 
        : { silver: cost, gold: 0 };
}

export function updateProfileUI() {
    const h = state.hero;
    const container = document.getElementById('talents-container');
    if (!container) return;

    container.innerHTML = ''; 

    Object.keys(TALENT_INFO).forEach(id => {
        const info = TALENT_INFO[id];
        const lvl = h.talents[id];
        const price = getTalentPrice(id, lvl);
        
        const isGold = price.gold > 0;
        const coinImg = isGold ? 'images/coin_gold.png' : 'images/coin_silver.png';
        const priceValue = isGold ? price.gold : price.silver;

        const card = document.createElement('div');
        card.className = 'talent-card';
        card.innerHTML = `
            <div class="talent-img-box" style="background-image:url('${info.icon}')">
                <span class="talent-lvl" id="lvl-${id}">${lvl}</span>
            </div>
            <div class="talent-name">${info.name}</div>
            <div class="talent-info">
                <div class="talent-price" style="display:flex; align-items:center; justify-content:center; gap:5px;">
                    <img src="${coinImg}" style="width:16px; height:16px;" onerror="this.style.display='none'">
                    ${priceValue}
                </div>
                <button class="btn-upgrade" onclick="window.upgradeTalent('${id}')">ПОДНЯТЬ УРОВЕНЬ</button>
            </div>
        `;
        container.appendChild(card);
    });

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

// ==========================================
// МАГАЗИН (С УЧЕТОМ КОЛЛЕКЦИЙ)
// ==========================================
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
        const isPurchased = state.hero.purchased.includes(item.id);
        const isEquipped = state.hero.equipped[item.type] === item.id;
        
        // ПРОВЕРКА: Привязан ли предмет к коллекции?
        let collectionInfo = null;
        for (let type in COLLECTIONS_DATA) {
            const coll = COLLECTIONS_DATA[type].find(c => c.rewardItemId === item.id);
            if (coll) { collectionInfo = coll; break; }
        }

        // Если привязан, проверяем, собрана ли коллекция
        let isCollectionComplete = false;
        if (collectionInfo) {
            isCollectionComplete = Array.from({length: collectionInfo.parts}, (_, i) => `${collectionInfo.id}-part${i+1}`)
                                         .every(id => state.hero.collectionParts.includes(id));
        }

        const d = document.createElement('div');
        d.className = 'shop-item' + (isPurchased ? ' bought' : '');
        d.style.borderColor = rarityColor(item.rarity);
        
        // Формируем кнопку
        let actionButton = '';
        
        if (collectionInfo && !isCollectionComplete) {
            // Если предмет из коллекции и она не собрана — блокируем
            actionButton = `<button style="background:#555; cursor:not-allowed;" disabled>🔒 В КОЛЛЕКЦИИ</button>`;
        } else if (!isPurchased) {
            actionButton = `<button onclick="window.buyItem('${item.id}')">КУПИТЬ</button>`;
        } else if (isEquipped) {
            actionButton = `<button style="background:#555; cursor:default;" disabled>НАДЕТО</button>`;
        } else {
            actionButton = `<button style="background:#8bc34a;" onclick="window.equipFromShop('${item.id}')">НАДЕТЬ</button>`;
        }

        d.innerHTML = `
            <img src="${item.image}" class="item-img" onerror="this.style.display='none'">
            <h3>${item.name}</h3>
            <p>${itemBonusText(item)}</p>
            <div class="price">
                <img src="images/coin_silver.png" class="price-icon" onerror="this.style.display='none'">${item.price.silver || 0}
                <img src="images/coin_gold.png" class="price-icon" onerror="this.style.display='none'">${item.price.gold || 0}
            </div>
            ${actionButton}
        `;
        grid.appendChild(d);
    });
}

// ==========================================
// ЭКРАН КОЛЛЕКЦИЙ
// ==========================================
export function renderCollections() {
    const tabs = document.querySelectorAll('.coll-tab');
    let currentType = 'weapon';
    tabs.forEach(t => { if (t.classList.contains('active')) currentType = t.dataset.type; });

    const grid = document.getElementById('collections-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const collections = COLLECTIONS_DATA[currentType] || [];
    
    if (collections.length === 0) {
        grid.innerHTML = '<p style="color:#888; text-align:center;">В этой категории пока нет коллекций.</p>';
        return;
    }

    collections.forEach(coll => {
        const block = document.createElement('div');
        block.className = 'collection-block';
        
        let slotsHtml = '';
        // Рисуем 5 слотов
        for (let i = 1; i <= coll.parts; i++) {
            const partId = `${coll.id}-part${i}`;
            const isCollected = state.hero.collectionParts.includes(partId);
            
            slotsHtml += `
                <div class="coll-slot ${isCollected ? 'collected' : ''}">
                    ${isCollected ? '✅' : '❓'}
                    <div class="part-num">${i}</div>
                </div>
            `;
        }

        const isComplete = Array.from({length: coll.parts}, (_, i) => `${coll.id}-part${i+1}`)
                                 .every(id => state.hero.collectionParts.includes(id));

        block.innerHTML = `
            <h3 class="collection-title">${coll.name}</h3>
            <div class="collection-items">
                ${slotsHtml}
            </div>
            <div style="text-align:center; margin-top:10px; color:${isComplete ? 'var(--hp)' : '#888'}; font-size:14px;">
                ${isComplete ? '✨ КОЛЛЕКЦИЯ СОБРАНА (Открыто в магазине)' : 'Соберите все 5 частей, чтобы разблокировать предмет'}
            </div>
        `;
        grid.appendChild(block);
    });
}

/* ============================================================
   БОЕВОЙ ЭКРАН
   ============================================================ */

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
    document.getElementById('bt-timer').textContent = '00:00:00';

    document.querySelectorAll('.skill-btn').forEach(btn => {
        btn.classList.remove('on-cooldown');
        btn.disabled = false;
        const bar = btn.querySelector('.skill-cd');
        if (bar) bar.style.width = '0%';
    });

    renderQuickSlots();
    updateSkillCooldowns();
}

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
        
        const potionCountEl = document.getElementById('skill-potion-count');
        if (potionCountEl) potionCountEl.textContent = bs.potions;
    }
}

export function updateSkillCooldowns() {
    document.querySelectorAll('.skill-btn').forEach(btn => {
        const action = btn.dataset.action || btn.dataset.skill;
        if (!action) return;

        if (action === 'attack') {
            btn.disabled = false;
            btn.classList.remove('on-cooldown');
            const bar = btn.querySelector('.skill-cd');
            if (bar) bar.style.width = '0%';
            return;
        }

        const ready = window.Battle ? window.Battle.isSkillReady(action) : true;
        const progress = window.Battle ? window.Battle.getCooldownProgress(action) : 0;

        const bar = btn.querySelector('.skill-cd');
        if (bar) bar.style.width = (progress * 100) + '%';

        btn.disabled = !ready;
        btn.classList.toggle('on-cooldown', !ready);
    });
}

export function renderQuickSlots() {
    const wrap = document.getElementById('quick-slots');
    if (!wrap) return;
    wrap.innerHTML = '';

    const slots = [
        { icon: '🧪', key: 'potion', count: (state.hero.consumables && state.hero.consumables.potion) || 0, label: 'Зелье' },
        { icon: '💊', key: 'elixir', count: (state.hero.consumables && state.hero.consumables.elixir) || 0, label: 'Эликсир' },
        { icon: '🔮', key: 'orb',    count: (state.hero.consumables && state.hero.consumables.orb) || 0,    label: 'Сфера' }
    ];

    slots.forEach((s) => {
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

export function showVictoryModal(rewards) {
    const modal = document.getElementById('victory-modal');
    if (!modal) return;

    const dmg = (window.Battle && window.Battle.battleState)
        ? Math.round(window.Battle.battleState.totalDamage)
        : 0;
    document.getElementById('victory-dmg').textContent = dmg.toLocaleString('ru-RU');

    const trophiesBox = document.getElementById('victory-trophies');
    trophiesBox.innerHTML = '';

    // Предметы / Части коллекций
    const items = rewards.items || [];
    items.forEach(it => {
        const d = document.createElement('div');
        d.className = 'vt-item';
        d.innerHTML = `
            <div class="vt-icon" style="font-size:20px;">${it.icon || '🎁'}</div>
            <div class="vt-amount" style="font-size:12px;">${it.label || 'Часть'}</div>`;
        trophiesBox.appendChild(d);
    });

    // Серебро
    if (rewards.silver) {
        const d = document.createElement('div');
        d.className = 'vt-item';
        d.innerHTML = `
            <div class="vt-icon"><img src="images/coin_silver.png" style="width: 36px; height: 36px;" onerror="this.style.display='none'"></div>
            <div class="vt-amount">+${rewards.silver.toLocaleString('ru-RU')}</div>
            <div class="vt-label">Серебро</div>`;
        trophiesBox.appendChild(d);
    }

    // Опыт
    if (rewards.xp) {
        const d = document.createElement('div');
        d.className = 'vt-item';
        d.innerHTML = `
            <div class="vt-icon">✨</div>
            <div class="vt-amount">+${rewards.xp.toLocaleString('ru-RU')}</div>
            <div class="vt-label">Опыт</div>`;
        trophiesBox.appendChild(d);
    }

    // Боковые панели (Рейтинг и Трофеи)
    const rating = document.getElementById('victory-rating');
    rating.innerHTML = `
        <li><span>1. Тень</span><b>12 480</b></li>
        <li><span>2. Клык</span><b>11 320</b></li>
        <li><span>3. Пепел</span><b>10 990</b></li>
        <li><span>Вы</span><b>${dmg.toLocaleString('ru-RU')}</b></li>`;

    const trophyList = document.getElementById('victory-trophy-list');
    trophyList.innerHTML = `
        <li><span>Серебро</span><b>+${(rewards.silver || 0).toLocaleString('ru-RU')}</b></li>
        <li><span>Опыт</span><b>+${(rewards.xp || 0).toLocaleString('ru-RU')}</b></li>
        <li><span>Предметы</span><b>${(rewards.items || []).length}</b></li>`;

    modal.classList.remove('hidden');
}

export function closeVictoryModal() {
    const modal = document.getElementById('victory-modal');
    if (modal) modal.classList.add('hidden');

    if (window.Battle) window.Battle.clearBattleTimers();

    if (window.Battle && window.Battle.battleState.isTower) {
        goToScreen('tower-screen');
        if (window.renderTower) window.renderTower();
    } else {
        goToScreen('map-screen');
    }
}