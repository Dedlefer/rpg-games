import { state, saveGame, syncHeroStats } from '../state.js';
import { items as itemData, consumables as consData } from '../data.js';
import { rarityColor, itemBonusText, SLOT_LABELS, playSound } from '../utils.js';
import { updateHUD, openEquipModal } from '../ui.js';

export function renderInventory() {
    const activeTab = document.querySelector('.inv-tab.active');
    const currentTab = activeTab ? activeTab.dataset.tab : 'equipment';
    const grid = document.getElementById('inventory-grid');
    const empty = document.getElementById('inventory-empty');
    grid.innerHTML = '';

    if (currentTab === 'equipment') {
        const inv = state.hero.inventory;
        if (inv.length === 0) {
            empty.classList.remove('hidden');
            return;
        }
        empty.classList.add('hidden');
        inv.forEach(id => {
            const it = itemData.find(i => i.id === id);
            if (!it) return;
            const d = document.createElement('div');
            d.className = 'inventory-item';
            d.style.borderColor = rarityColor(it.rarity);
            d.innerHTML = `
                <div class="inv-item-img-wrap">
                    <img src="${it.image}" class="item-img" onerror="this.style.display='none'">
                </div>
                <h3>${it.name}</h3>
                <p class="item-type">${SLOT_LABELS[it.type]}</p>
                <p class="item-bonus">${itemBonusText(it)}</p>
                <div class="inv-actions">
                    <button onclick="window.equipItem('${it.id}')">НАДЕТЬ</button>
                    <button class="sell-btn" onclick="window.sellItem('${it.id}')">ПРОДАТЬ</button>
                </div>`;
            grid.appendChild(d);
        });
    } else if (currentTab === 'consumable') {
        empty.classList.add('hidden');
        const entries = Object.entries(state.hero.consumables).filter(([, c]) => c > 0);
        if (entries.length === 0) {
            empty.classList.remove('hidden');
            return;
        }
        entries.forEach(([key, count]) => {
            const c = consData.find(x => x.key === key);
            if (!c) return;
            const d = document.createElement('div');
            d.className = 'inventory-item';
            d.innerHTML = `
                <div class="inv-item-img-wrap">
                    <img src="${c.image}" class="item-img" onerror="this.style.display='none'">
                </div>
                <h3>${c.name}</h3>
                <p class="item-bonus">В наличии: <b>${count}</b></p>`;
            grid.appendChild(d);
        });
    } else if (currentTab === 'keys') {
        empty.classList.add('hidden');
        const d = document.createElement('div');
        d.className = 'inventory-item key-item';
        d.innerHTML = `
            <div class="inv-item-img-wrap">
                <img src="images/key.png" class="item-img" onerror="this.style.display='none'">
            </div>
            <h3>Ключи: ${state.hero.keys}</h3>
            <p class="item-bonus">3 ключа = 1 предмет</p>
            <div class="inv-actions">
                <button onclick="window.openChest()" ${state.hero.keys < 3 ? 'disabled' : ''}>ОТКРЫТЬ СУНДУК</button>
            </div>`;
        grid.appendChild(d);
    }
}

export function equipItem(itemId) {
    const item = itemData.find(i => i.id === itemId);
    if (!item) return;
    const old = state.hero.equipment.find(id => {
        const it = itemData.find(i => i.id === id);
        return it && it.type === item.type;
    });
    if (old) state.hero.inventory.push(old);
    state.hero.equipment = state.hero.equipment.filter(id => id !== old);
    state.hero.inventory = state.hero.inventory.filter(id => id !== itemId);
    state.hero.equipment.push(itemId);
    syncHeroStats();
    saveGame();
    updateHUD();
    renderInventory();
    window.closeModal('equip-modal');
    playSound('crit');
}

export function unequipItem(type) {
    const id = state.hero.equipment.find(eid => {
        const it = itemData.find(i => i.id === eid);
        return it && it.type === type;
    });
    if (!id) return;
    state.hero.equipment = state.hero.equipment.filter(x => x !== id);
    state.hero.inventory.push(id);
    syncHeroStats();
    saveGame();
    updateHUD();
    renderInventory();
    window.closeModal('equip-modal');
}

export function sellItem(id) {
    const it = itemData.find(i => i.id === id);
    if (!it) return;
    const price = Math.floor(it.price.silver * 0.5);
    state.hero.silver += price;
    state.hero.inventory = state.hero.inventory.filter(x => x !== id);
    saveGame();
    updateHUD();
    renderInventory();
    playSound('click');
}