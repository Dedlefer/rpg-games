export const SLOT_LABELS = {
    weapon:'ОРУЖИЕ', helmet:'ШЛЕМ', chest:'БРОНЯ',
    legs:'ПОНОЖИ', boots:'БОТИНКИ', shield:'ЩИТ'
};

export function itemBonusText(item) {
    const p = [];
    if (item.damageBonus) p.push(`+${item.damageBonus} УРН`);
    if (item.hpBonus) p.push(`+${item.hpBonus} HP`);
    if (item.evadeBonus) p.push(`+${item.evadeBonus}% УКЛ`);
    if (item.critChanceBonus) p.push(`+${item.critChanceBonus}% КРИТ`);
    return p.length ? p.join(', ') : '—';
}

export function rarityColor(r) {
    return { common:'#9a9a9a', rare:'#3b82f6', epic:'#a855f7', legendary:'#f59e0b' }[r] || '#9a9a9a';
}

export function todayStr() { return new Date().toISOString().slice(0,10); }

let audioCtx = null;
export function playSound(type) {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(audioCtx.destination);
        const now = audioCtx.currentTime;
        if (type === 'hit') {
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, now); osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
            gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            osc.start(now); osc.stop(now + 0.1);
        } else if (type === 'crit') {
            osc.type = 'square'; osc.frequency.setValueAtTime(400, now); osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
            gain.gain.setValueAtTime(0.15, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            osc.start(now); osc.stop(now + 0.2);
        } else if (type === 'heal') {
            osc.type = 'sine'; osc.frequency.setValueAtTime(600, now); osc.frequency.exponentialRampToValueAtTime(800, now + 0.2);
            gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            osc.start(now); osc.stop(now + 0.2);
        } else if (type === 'click') {
            osc.type = 'sine'; osc.frequency.setValueAtTime(800, now);
            gain.gain.setValueAtTime(0.05, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            osc.start(now); osc.stop(now + 0.05);
        }
    } catch (e) {}
}