export const achievements = [
    { id:'first_blood', name:'Первая зачистка', desc:'Убей первого босса', reward:{silver:200}, check:(state) => state.defeatedBosses.length >= 1 },
    { id:'collector', name:'Экипирован', desc:'Надень 3 предмета', reward:{diamonds:1}, check:(state) => state.hero.equipment.length >= 3 },
    { id:'titan_slayer', name:'Убийца титанов', desc:'Убей Титана-слизня', reward:{diamonds:5}, check:(state) => state.defeatedBosses.includes('boss-8') },
    { id:'rich', name:'Кредитный рейтинг', desc:'Накопи 10 000 серебра', reward:{diamonds:2}, check:(state) => state.hero.silver >= 10000 }
];