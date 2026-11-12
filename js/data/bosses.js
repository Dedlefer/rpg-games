// js/data/bosses.js

export const bosses = [
    // ==========================================
    // БЛОК 1-10 (Начало игры)
    // ==========================================
    { 
        id:'boss-1', name:'Споровик-разведчик', levelRequired:1, hp:30, damage:15, archetype:'mage', 
        reward:{xp:75, silver:20, gold:0}, image:'images/boss_spore.png', 
        description:'Ядовитый гриб из Нижнего Яруса.', 
        intro:'Споровик выпускает облако спор.' 
    },
    { 
        id:'boss-2', name:'Грибной матёрый', levelRequired:2, hp:80, damage:36, archetype:'tank', 
        reward:{xp:125, silver:30, gold:0}, image:'images/boss_fungus.png', 
        description:'Притворяется мёртвым, пока не подойдёшь.', 
        intro:'Куча гниющих листьев начинает шевелиться.' 
    },
    { 
        id:'boss-3', name:'Жук-броненосец', levelRequired:3, hp:275, damage:40, archetype:'tank', 
        reward:{xp:150, silver:60, gold:0}, image:'images/boss_beetle.png', 
        description:'Панцирь отражает 80% урона.', 
        intro:'Лязг хитина эхом разносится по туннелю.' 
    },
    { 
        id:'boss-4', name:'Слизень-металлоед', levelRequired:4, hp:850, damage:30, archetype:'berserk', 
        reward:{xp:175, silver:90, gold:0}, image:'images/boss_slime.png', 
        description:'Пожирает металл и снаряжение.', 
        intro:'Слизень переваривает чей-то экзоскелет.' 
    },
    { 
        id:'boss-5', name:'Мать-паучиха', levelRequired:5, hp:2500, damage:30, archetype:'berserk', 
        reward:{xp:275, silver:100, gold:0}, image:'images/boss_spider.png', 
        description:'Спавнит паучат, неуязвима, пока они живы.', 
        intro:'Из темноты доносится шорох тысяч лап.' 
    },
    { 
        id:'boss-6', name:'Небоскрёб-улей', levelRequired:6, hp:4000, damage:45, archetype:'mage', 
        reward:{xp:300, silver:110, gold:0}, image:'images/boss_hive.png', 
        description:'Здание, проросшее грибницей.', 
        intro:'Огромная тень накрывает сектор.' 
    },
    { 
        id:'boss-7', name:'Заражённый Титан', levelRequired:7, hp:5250, damage:25, archetype:'tank', 
        reward:{xp:537, silver:130, gold:0}, image:'images/boss_infected.png', 
        description:'Полубосс-катастрофа. Смывает всё на пути.', 
        intro:'Земля дрожит. Приближается гигант.' 
    },
    { 
        id:'boss-8', name:'Титан-слизень', levelRequired:8, hp:6500, damage:30, archetype:'berserk', 
        reward:{xp:600, silver:140, gold:0}, image:'images/boss_titan.png', 
        description:'Слизистая гора, поглощающая свет.', 
        intro:'Прилив слизи накрывает арену.' 
    },
    { 
        id:'boss-9', name:'Споровый колосс', levelRequired:9, hp:9500, damage:32, archetype:'mage', 
        reward:{xp:1250, silver:180, gold:0}, image:'images/boss_spore.png', 
        description:'Огромное скопление грибницы.', 
        intro:'Воздух наполняется густой взвесью.' 
    },
    { 
        id:'boss-10', name:'Мембранный страж', levelRequired:10, hp:16000, damage:32, archetype:'tank', 
        reward:{xp:1300, silver:190, gold:0}, image:'images/boss_fungus.png', 
        description:'Древний защитник ярусов.', 
        intro:'Мембрана пульсирует, призывая стража.' 
    },
    
    // ==========================================
    // БЛОК 11-20 (Середина)
    // ==========================================
    { 
        id:'boss-11', name:'Кислотный червь', levelRequired:11, hp:16500, damage:50, archetype:'berserk', 
        reward:{xp:1600, silver:230, gold:0}, image:'images/boss_beetle.png', 
        description:'Разъедает даже экзоскелеты.', 
        intro:'Из щелей сочится зеленая кислота.' 
    },
    { 
        id:'boss-12', name:'Грибной дракон', levelRequired:12, hp:23000, damage:55, archetype:'mage', 
        reward:{xp:1850, silver:280, gold:0}, image:'images/boss_slime.png', 
        description:'Легенда нижних ярусов.', 
        intro:'Тень крыльев накрывает арену.' 
    },
    { 
        id:'boss-13', name:'Хитиновый ужас', levelRequired:13, hp:50000, damage:65, archetype:'tank', 
        reward:{xp:2150, silver:330, gold:0}, image:'images/boss_spider.png', 
        description:'Непробиваемая броня.', 
        intro:'Лязг панциря оглушает.' 
    },
    { 
        id:'boss-14', name:'Слизистый гигант', levelRequired:14, hp:115000, damage:125, archetype:'berserk', 
        reward:{xp:2450, silver:390, gold:0}, image:'images/boss_hive.png', 
        description:'Поглощает всё на своем пути.', 
        intro:'Стены начинают плавиться.' 
    },
    { 
        id:'boss-15', name:'Опухоль-мутант', levelRequired:15, hp:165000, damage:220, archetype:'tank', 
        reward:{xp:2750, silver:450, gold:0}, image:'images/boss_infected.png', 
        description:'Растет прямо на глазах.', 
        intro:'Воздух становится тяжелым.' 
    },
    { 
        id:'boss-16', name:'Хищная лиана', levelRequired:16, hp:230000, damage:280, archetype:'mage', 
        reward:{xp:3050, silver:510, gold:0}, image:'images/boss_titan.png', 
        description:'Опутывает всё вокруг.', 
        intro:'Пол прогибается под весом стеблей.' 
    },
    { 
        id:'boss-17', name:'Железный гриб', levelRequired:17, hp:300000, damage:410, archetype:'tank', 
        reward:{xp:3350, silver:560, gold:0}, image:'images/boss_spore.png', 
        description:'Металл сросся с грибницей.', 
        intro:'Скрежет металла режет слух.' 
    },
    { 
        id:'boss-18', name:'Слизень-разрушитель', levelRequired:18, hp:460000, damage:470, archetype:'berserk', 
        reward:{xp:3650, silver:620, gold:0}, image:'images/boss_fungus.png', 
        description:'Оставляет за собой только пустоту.', 
        intro:'Земля уходит из-под ног.' 
    },
    { 
        id:'boss-19', name:'Королева улья', levelRequired:19, hp:600000, damage:580, archetype:'mage', 
        reward:{xp:3950, silver:680, gold:0}, image:'images/boss_beetle.png', 
        description:'Правит миллионами спор.', 
        intro:'Гул стоит в самом основании башни.' 
    },
    { 
        id:'boss-20', name:'Идеальный симбионт', levelRequired:20, hp:670000, damage:720, archetype:'tank', 
        reward:{xp:4250, silver:710, gold:0}, image:'images/boss_slime.png', 
        description:'Слияние человека и биосферы.', 
        intro:'Он выглядит почти как человек... почти.' 
    },

    // ==========================================
    // БЛОК 21-30 (Энд-гейм)
    // ==========================================
    { 
        id:'boss-21', name:'Мутировавший титан', levelRequired:21, hp:950000, damage:850, archetype:'berserk', 
        reward:{xp:4600, silver:780, gold:0}, image:'images/boss_spider.png', 
        description:'Потерял человеческий облик.', 
        intro:'Рев сотрясает мембрану.' 
    },
    { 
        id:'boss-22', name:'Пожиратель мембран', levelRequired:22, hp:1350000, damage:1000, archetype:'tank', 
        reward:{xp:5000, silver:860, gold:0}, image:'images/boss_hive.png', 
        description:'Ест даже защитные поля.', 
        intro:'Стены сектора рушатся.' 
    },
    { 
        id:'boss-23', name:'Слизистый бог', levelRequired:23, hp:1900000, damage:1200, archetype:'mage', 
        reward:{xp:5400, silver:950, gold:0}, image:'images/boss_infected.png', 
        description:'Ему поклоняются низшие формы.', 
        intro:'Ты слышишь шепот в своей голове.' 
    },
    { 
        id:'boss-24', name:'Заражённый исполин', levelRequired:24, hp:2700000, damage:1400, archetype:'tank', 
        reward:{xp:5900, silver:1050, gold:0}, image:'images/boss_titan.png', 
        description:'Гора гниющей плоти.', 
        intro:'Тень закрывает весь ярус.' 
    },
    { 
        id:'boss-25', name:'Симбиоз-абсолют', levelRequired:25, hp:3800000, damage:1650, archetype:'berserk', 
        reward:{xp:6400, silver:1150, gold:0}, image:'images/boss_spore.png', 
        description:'Идеальная форма жизни.', 
        intro:'Он не оставляет шансов.' 
    },
    { 
        id:'boss-26', name:'Гнилостный колосс', levelRequired:26, hp:5400000, damage:1950, archetype:'tank', 
        reward:{xp:6950, silver:1260, gold:0}, image:'images/boss_fungus.png', 
        description:'Разлагается, но не умирает.', 
        intro:'Запах смерти невыносим.' 
    },
    { 
        id:'boss-27', name:'Пожиратель света', levelRequired:27, hp:7600000, damage:2300, archetype:'mage', 
        reward:{xp:7550, silver:1380, gold:0}, image:'images/boss_beetle.png', 
        description:'В его присутствии гаснут лампы.', 
        intro:'Наступает абсолютная тьма.' 
    },
    { 
        id:'boss-28', name:'Разрушитель ярусов', levelRequired:28, hp:10800000, damage:2700, archetype:'berserk', 
        reward:{xp:8200, silver:1510, gold:0}, image:'images/boss_slime.png', 
        description:'Крушит перекрытия голыми руками.', 
        intro:'Пол уходит из-под ног.' 
    },
    { 
        id:'boss-29', name:'Биомеханический ужас', levelRequired:29, hp:15000000, damage:3200, archetype:'tank', 
        reward:{xp:8900, silver:1650, gold:0}, image:'images/boss_spider.png', 
        description:'Сплав технологий и биологии.', 
        intro:'Слышен звук заводских шестерен.' 
    },
    { 
        id:'boss-30', name:'Сердце Мембраны', levelRequired:30, hp:21000000, damage:3800, archetype:'mage', 
        reward:{xp:9700, silver:1800, gold:0}, image:'images/boss_hive.png', 
        description:'Источник всей жизни в башне.', 
        intro:'Ты чувствуешь его пульс.' 
    }
];