export const SAVE_VERSION = 6;

export const bosses = [
    { id:'boss-1', name:'Споровик-разведчик', levelRequired:1, hp:500, damage:5, archetype:'mage',
      reward:{xp:50,silver:50,gold:5}, image:'images/boss_spore.png',
      description:'Ядовитый гриб из Нижнего Яруса.', intro:'Споровик выпускает облако спор.' },
    { id:'boss-2', name:'Грибной матёрый', levelRequired:5, hp:1200, damage:8, archetype:'tank',
      reward:{xp:150,silver:150,gold:15}, image:'images/boss_fungus.png',
      description:'Притворяется мёртвым, пока не подойдёшь.', intro:'Куча гниющих листьев начинает шевелиться.' },
    { id:'boss-3', name:'Жук-броненосец', levelRequired:10, hp:2000, damage:12, archetype:'tank',
      reward:{xp:300,silver:300,gold:30}, image:'images/boss_beetle.png',
      description:'Панцирь отражает 80% урона.', intro:'Лязг хитина эхом разносится по туннелю.' },
    { id:'boss-4', name:'Слизень-металлоед', levelRequired:15, hp:3000, damage:15, archetype:'berserk',
      reward:{xp:500,silver:500,gold:50}, image:'images/boss_slime.png',
      description:'Пожирает металл и снаряжение.', intro:'Слизень переваривает чей-то экзоскелет.' },
    { id:'boss-5', name:'Мать-паучиха', levelRequired:20, hp:4000, damage:18, archetype:'berserk',
      reward:{xp:800,silver:800,gold:80}, image:'images/boss_spider.png',
      description:'Спавнит паучат, неуязвима, пока они живы.', intro:'Из темноты доносится шорох тысяч лап.' },
    { id:'boss-6', name:'Небоскрёб-улей', levelRequired:25, hp:6000, damage:22, archetype:'mage',
      reward:{xp:1200,silver:1200,gold:120}, image:'images/boss_hive.png',
      description:'Здание, проросшее грибницей.', intro:'Огромная тень накрывает сектор.' },
    { id:'boss-7', name:'Заражённый Титан', levelRequired:30, hp:10000, damage:30, archetype:'tank',
      reward:{xp:3000,silver:3000,gold:300}, image:'images/boss_infected.png',
      description:'Полубосс-катастрофа. Смывает всё на пути.', intro:'Земля дрожит. Приближается гигант.' },
    { id:'boss-8', name:'Титан-слизень', levelRequired:35, hp:15000, damage:45, archetype:'berserk',
      reward:{xp:5000,silver:5000,gold:500}, image:'images/boss_titan.png',
      description:'Слизистая гора, поглощающая свет.', intro:'Прилив слизи накрывает арену.' }
];

export const items = [
    { id:'w1', name:'Ржавый тесак', type:'weapon', damageBonus:15, price:{silver:800,gold:0}, rarity:'common', image:'images/w_rusty.png' },
    { id:'w2', name:'Шокер-резак', type:'weapon', damageBonus:30, price:{silver:1500,gold:300}, rarity:'common', image:'images/w_shocker.png' },
    { id:'w3', name:'Игломёт', type:'weapon', damageBonus:40, critChanceBonus:3, price:{silver:2500,gold:500}, rarity:'rare', image:'images/w_needler.png' },
    { id:'w4', name:'Плазменный тесак', type:'weapon', damageBonus:60, price:{silver:5000,gold:1000}, rarity:'rare', image:'images/w_plasma.png' },
    { id:'w5', name:'Симбиотический хлыст', type:'weapon', damageBonus:75, critChanceBonus:5, price:{silver:7500,gold:1500}, rarity:'epic', image:'images/w_whip.png' },
    { id:'w6', name:'Кислотный распылитель', type:'weapon', damageBonus:85, price:{silver:10000,gold:2000}, rarity:'epic', image:'images/w_acid.png' },
    { id:'w7', name:'Рельсотрон', type:'weapon', damageBonus:120, critChanceBonus:10, price:{silver:25000,gold:5000}, rarity:'legendary', image:'images/w_rail.png' },
    { id:'h1', name:'Тканевая маска', type:'helmet', hpBonus:15, price:{silver:500,gold:0}, rarity:'common', image:'images/h_cloth.png' },
    { id:'h2', name:'Фильтр-маска', type:'helmet', hpBonus:30, price:{silver:1500,gold:300}, rarity:'common', image:'images/h_filter.png' },
    { id:'h3', name:'Шлем "Хитин"', type:'helmet', hpBonus:50, evadeBonus:2, price:{silver:3500,gold:700}, rarity:'rare', image:'images/h_chitin.png' },
    { id:'h4', name:'Тактический визор', type:'helmet', hpBonus:70, critChanceBonus:3, price:{silver:6000,gold:1200}, rarity:'rare', image:'images/h_visor.png' },
    { id:'h5', name:'Шлем "Грибница"', type:'helmet', hpBonus:120, evadeBonus:5, price:{silver:15000,gold:3000}, rarity:'epic', image:'images/h_fungus.png' },
    { id:'c1', name:'Кевларовый жилет', type:'chest', hpBonus:40, price:{silver:2000,gold:400}, rarity:'common', image:'images/c_kevlar.png' },
    { id:'c2', name:'Кольчуга из чешуи', type:'chest', hpBonus:70, evadeBonus:2, price:{silver:4000,gold:800}, rarity:'rare', image:'images/c_scales.png' },
    { id:'c3', name:'Симбиотическая броня', type:'chest', hpBonus:100, price:{silver:6000,gold:1200}, rarity:'rare', image:'images/c_symbiont.png' },
    { id:'c4', name:'Броня "Мембрана"', type:'chest', hpBonus:150, price:{silver:12000,gold:2400}, rarity:'epic', image:'images/c_membrane.png' },
    { id:'c5', name:'Экзоскелет "Титан"', type:'chest', hpBonus:250, price:{silver:30000,gold:6000}, rarity:'legendary', image:'images/c_titan.png' },
    { id:'l1', name:'Штаны выжившего', type:'legs', hpBonus:20, price:{silver:1000,gold:200}, rarity:'common', image:'images/l_survivor.png' },
    { id:'l2', name:'Поножи "Броненосец"', type:'legs', hpBonus:45, price:{silver:3000,gold:600}, rarity:'rare', image:'images/l_beetle.png' },
    { id:'l3', name:'Механические протезы', type:'legs', hpBonus:80, evadeBonus:2, price:{silver:8000,gold:1600}, rarity:'epic', image:'images/l_mech.png' },
    { id:'b1', name:'Тканевые обмотки', type:'boots', evadeBonus:1, price:{silver:500,gold:0}, rarity:'common', image:'images/b_wraps.png' },
    { id:'b2', name:'Ботинки-присоски', type:'boots', evadeBonus:3, price:{silver:2000,gold:400}, rarity:'common', image:'images/b_suction.png' },
    { id:'b3', name:'Прыжковые ботинки', type:'boots', evadeBonus:6, price:{silver:6000,gold:1200}, rarity:'rare', image:'images/b_jump.png' },
    { id:'s1', name:'Барьер-пластина', type:'shield', hpBonus:30, evadeBonus:1, price:{silver:1500,gold:300}, rarity:'common', image:'images/s_barrier.png' },
    { id:'s2', name:'Панцирь черепахи', type:'shield', hpBonus:60, evadeBonus:1, price:{silver:3500,gold:700}, rarity:'rare', image:'images/s_shell.png' },
    { id:'s3', name:'Энергощит', type:'shield', hpBonus:100, evadeBonus:5, price:{silver:10000,gold:2000}, rarity:'epic', image:'images/s_energy.png' }
];

export const consumables = [
    { id:'potion-small', name:'Антидот', key:'potion_small', heal:0.3, price:{silver:300}, image:'images/potion_green.png' },
    { id:'potion-big', name:'Стимулятор', key:'potion_big', heal:0.7, price:{silver:1000}, image:'images/potion_red.png' },
    { id:'potion-stim', name:'Стим-пак', key:'potion_stim', heal:1.0, price:{silver:2500}, image:'images/potion_blue.png' }
];

export const achievements = [
    { id:'first_blood', name:'Первая зачистка', desc:'Убей первого босса', reward:{silver:200}, check:(state) => state.defeatedBosses.length >= 1 },
    { id:'collector', name:'Экипирован', desc:'Надень 3 предмета', reward:{diamonds:1}, check:(state) => state.hero.equipment.length >= 3 },
    { id:'titan_slayer', name:'Убийца титанов', desc:'Убей Титана-слизня', reward:{diamonds:5}, check:(state) => state.defeatedBosses.includes('boss-8') },
    { id:'rich', name:'Кредитный рейтинг', desc:'Накопи 10 000 серебра', reward:{diamonds:2}, check:(state) => state.hero.silver >= 10000 }
];

// Генерация босса башни по этажу
export function makeTowerBoss(floor) {
    const archetypes = ['tank', 'berserk', 'mage'];
    const names = ['Страж этажа', 'Эхо яруса', 'Мембранный урод', 'Гнилой гигант', 'Споровый колосс'];
    const baseHp = 400 + floor * 250;
    const baseDmg = 6 + floor * 3;
    return {
        id: 'tower-' + floor,
        name: `${names[(floor - 1) % names.length]} ${floor}`,
        levelRequired: floor,
        hp: Math.floor(baseHp * (1 + floor * 0.05)),
        damage: Math.floor(baseDmg),
        archetype: archetypes[(floor - 1) % archetypes.length],
        reward: {
            xp: 40 + floor * 20,
            silver: 60 + floor * 30,
            gold: 5 + floor * 2
        },
        image: 'images/boss_spore.png',
        description: `Этаж ${floor} башни.`,
        intro: 'Тьма сгущается...',
        isTower: true
    };
}