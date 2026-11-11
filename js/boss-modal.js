import { bosses } from '../data.js';
import { state, calcStats } from '../state.js';
import { playSound } from '../utils.js';

let currentBossIndex = -1;

export function openBossModal(index) {
    const boss = bosses[index];
    if (!boss) return;
    currentBossIndex = index;

    const modal = document.getElementById('boss-modal');
    modal.classList.remove('hidden');

    // Заголовок и портрет
    document.getElementById('bm-name').textContent = boss.name;
    document.getElementById('bm-level').textContent = 'УР. ' + boss.levelRequired;
    document.getElementById('bm-desc').textContent = boss.description;
    document.getElementById('bm-intro').textContent = boss.intro || '';
    const img = document.getElementById('bm-img');
    img.src = boss.image;
    img.onerror = () => { img.style.display = 'none'; };
    img.style.display = '';

    // Статы
    const locked = state.hero.level < boss.levelRequired;
    const defeated = state.defeatedBosses.includes(boss.id);
    const heroS = calcStats();
    const power = Math.round(heroS.damage * (1 + heroS.critChance / 100 * 1.5) * (1 + heroS.evade / 200));
    document.getElementById('bm-stats').innerHTML = `
        <div class="bm-stat"><span>❤️ HP</span><b>${boss.hp}</b></div>
        <div class="bm-stat"><span>⚔️ УРОН</span><b>${boss.damage}</b></div>
        <div class="bm-stat"><span>🎭 ТИП</span><b>${boss.archetype.toUpperCase()}</b></div>
        <div class="bm-stat"><span>📊 СИЛА ГЕРОЯ</span><b>${power}</b></div>
    `;

    // Награда
    document.getElementById('bm-reward').innerHTML = `
        <div class="bm-reward-row"><span>✨ Опыт</span><b>+${boss.reward.xp}</b></div>
        <div class="bm-reward-row"><span>💰 Серебро</span><b>+${boss.reward.silver}</b></div>
        <div class="bm-reward-row"><span>🪙 Золото</span><b>+${boss.reward.gold}</b></div>
    `;

    // Кнопка боя
    const btn = document.getElementById('bm-fight');
    if (locked) {
        btn.textContent = `🔒 НУЖЕН УР. ${boss.levelRequired}`;
        btn.disabled = true;
    } else {
        btn.textContent = defeated ? 'СРАЗИТЬСЯ СНОВА' : 'В БОЙ';
        btn.disabled = false;
    }

    playSound('click');
}

export function closeBossModal() {
    document.getElementById('boss-modal').classList.add('hidden');
}

export function startBossFight() {
    if (currentBossIndex < 0) return;
    closeBossModal();
    window.startFight(currentBossIndex);
}