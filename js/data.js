import { weapons } from './data/weapons.js';
import { chests } from './data/chests.js';
import { helmets } from './data/helmets.js';
import { legs } from './data/legs.js';
import { boots } from './data/boots.js';
import { shields } from './data/shields.js';
import { gloves } from './data/gloves.js';
import { rings } from './data/rings.js';
import { bracers } from './data/bracers.js';
import { amulets } from './data/amulets.js';
import { consumables as consData } from './data/consumables.js';
import { achievements as achData } from './data/achievements.js';

export const SAVE_VERSION = 7;

export { bosses } from './data/bosses.js';

export const items = [
    ...weapons,
    ...chests,
    ...helmets,
    ...legs,
    ...boots,
    ...shields,
    ...gloves,
    ...rings,
    ...bracers,
    ...amulets
];

export const consumables = consData;
export const achievements = achData;

// Генерация босса башни по этажу
export function makeTowerBoss(floor) {
    const archetypes = ['tank', 'berserk', 'mage'];
    const names = ['Страж этажа', 'Эхо яруса', 'Мембранный урод', 'Гнилой гигант', 'Споровый колосс'];
    
    const baseHp = 500 * Math.pow(1.4, floor - 1); 
    const baseDmg = 20 * Math.pow(1.25, floor - 1);
    const baseSilver = 50 * Math.pow(1.2, floor - 1);
    const baseXp = 100 * Math.pow(1.22, floor - 1);

    return {
        id: 'tower-' + floor,
        name: `${names[(floor - 1) % names.length]} ${floor}`,
        levelRequired: floor,
        hp: Math.floor(baseHp),
        damage: Math.floor(baseDmg),
        archetype: archetypes[(floor - 1) % archetypes.length],
        reward: {
            xp: Math.floor(baseXp),
            silver: Math.floor(baseSilver),
            gold: Math.floor(floor * 2)
        },
        image: 'images/boss_spore.png',
        description: `Этаж ${floor} башни.`,
        intro: 'Тьма сгущается...',
        isTower: true
    };
}