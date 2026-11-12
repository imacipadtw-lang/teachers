/* =====================================================================
   Content for the six gates — every target word and sentence below comes
   from 《土城國小英語護照》(700 words, 25 levels). The number in "no"
   is the passport word number so teachers can check it against the book.
   Level 1 = 初級 Basic (grades 1–2), 2 = 中級 Intermediate (3–4),
   3 = 高級 Advanced (5–6).  keys = words the AI must hear for that level.
   ===================================================================== */
window.TC_CONTENT = {
  secret: "FRIEND",              // one letter per gate, in gate order
  finalLine: { say: "We are friends!", keys: [["friend", "friends"]], no: [40, 111] },

  gates: {
    /* ---------------- Gate 1 · Turbo Talk Kart ---------------- */
    1: {
      key: "kart", title: "Turbo Talk Kart", zh: "極速英語賽車", city: "Tokyo", color: "#4cc9ff",
      genre: "Kart racing 賽車遊戲", passport: "第1關 交通工具 · 第7關 序數 · 第10關 fast",
      teacher: "What is it?",
      items: [
        { w: "bus", no: 20, zh: "公車", img: "bus", s3: "I wait for the bus every day." },
        { w: "train", no: 17, zh: "火車", img: "train", s3: "The train is fast." },
        { w: "taxi", no: 18, zh: "計程車", img: "taxi", s3: "We take a taxi home." },
        { w: "plane", no: 19, zh: "飛機", img: "plane", s3: "The plane is in the sky." },
        { w: "bike", no: 16, zh: "腳踏車", img: "bike", s3: "I ride my bike to school." },
        { w: "boat", no: 15, zh: "船", img: "boat", s3: "This is a small boat." },
        { w: "truck", no: 23, zh: "卡車", img: "truck", s3: "The truck is big." },
        { w: "scooter", no: 21, zh: "摩托車", img: "scooter", s3: "He rides a scooter." }
      ],
      finale: { teacher: "Who is number one?", zh: "誰是第一名？",
        say: { 1: "First!", 2: "I'm first!", 3: "I'm first! Great! Let's go!" },
        keys: { 1: [["first"]], 2: [["first"]], 3: [["first"], ["great", "go"]] }, no: [169, 37, 265] }
    },

    /* ---------------- Gate 2 · Pixel Craft ---------------- */
    2: {
      key: "craft", title: "Pixel Craft", zh: "方塊創造家", city: "Sydney", color: "#2ee6b6",
      genre: "Block building 方塊建造", passport: "第19關 顏色 · 第22關 want · 第17關 color / favorite",
      teacher: "What color do you want?",
      colors: {
        red: { no: 505, zh: "紅色", hex: "#ff4b4b", s3: "The apple is red." },
        orange: { no: 525, zh: "橘色", hex: "#ff9a2e", s3: "The pumpkin is orange." },
        yellow: { no: 508, zh: "黃色", hex: "#ffd23d", s3: "The sun is yellow." },
        green: { no: 506, zh: "綠色", hex: "#35d35a", s3: "His pants are green." },
        blue: { no: 507, zh: "藍色", hex: "#3d8bff", s3: "The sky is blue." },
        purple: { no: 512, zh: "紫色", hex: "#9b5cff", s3: "The grape is purple." },
        pink: { no: 510, zh: "粉紅色", hex: "#ff7ac0", s3: "The flower is pink." },
        white: { no: 509, zh: "白色", hex: "#f4f7ff", s3: "The snow is white." },
        black: { no: 511, zh: "黑色", hex: "#26293a", s3: "The cat is black." },
        brown: { no: 523, zh: "棕色", hex: "#9a5b34", s3: "The bear is brown." }
      },
      finale: { teacher: "What color do you like?", zh: "你喜歡什麼顏色？", no: [440, 439],
        say: { 1: "[color]!", 2: "I like [color].", 3: "[Color] is my favorite color." } }
    },

    /* ---------------- Gate 3 · Word Monster Catch ---------------- */
    3: {
      key: "hatch", title: "Pet Hatch", zh: "英語寵物孵蛋", city: "Paris", color: "#ffc83d",
      genre: "Egg hatching & pets 孵蛋收集", passport: "第1關 動物 · 第9、10關 形容詞",
      teacher: "What is it?",
      items: [
        { w: "tiger", no: 11, zh: "老虎", img: "tiger", s3: "The tiger is strong.", k3: ["strong"], fin3: "It is strong!" , color: "orange" },
        { w: "elephant", no: 6, zh: "大象", img: "elephant", s3: "The elephant is big.", k3: ["big"], fin3: "It is big!", art: "an" },
        { w: "rabbit", no: 10, zh: "兔子", img: "rabbit", s3: "The rabbit is fast.", k3: ["fast"], fin3: "It is fast!" , color: "white" },
        { w: "turtle", no: 12, zh: "烏龜", img: "turtle", s3: "The turtle is slow.", k3: ["slow"], fin3: "It is slow!" , color: "green" },
        { w: "monkey", no: 8, zh: "猴子", img: "monkey", s3: "The monkey is eating bananas.", k3: ["banana", "bananas", "eating"], fin3: "It is cute!" , color: "brown" },
        { w: "pig", no: 9, zh: "豬", img: "pig", s3: "The pig is pink.", k3: ["pink"], fin3: "It is pink!" , color: "pink" },
        { w: "zebra", no: 13, zh: "斑馬", img: "zebra", s3: "The zebra has stripes.", k3: ["stripes", "stripe"], fin3: "It has stripes!" , color: "black and white" },
        { w: "duck", no: 5, zh: "鴨", img: "duck", s3: "The duck is swimming.", k3: ["swimming", "swim"], fin3: "It can swim!" , color: "yellow" },
        { w: "cat", no: 3, zh: "貓", img: "cat", s3: "The cat is cute.", k3: ["cute"], fin3: "It is cute!" , color: "orange" },
        { w: "horse", no: 7, zh: "馬", img: "horse", s3: "The horse is running.", k3: ["running", "run"], fin3: "It is fast!" , color: "brown" },
        { w: "lion", no: 14, zh: "獅子", img: "lion", s3: "The lion is the king.", k3: ["king"], fin3: "It is the king!" , color: "yellow" },
        { w: "dog", no: 4, zh: "狗", img: "dog", s3: "The dog is barking.", k3: ["barking", "bark"], fin3: "It is cute!" , color: "brown" },
        { w: "bear", no: 2, zh: "熊", img: "bear", s3: "The bear is big.", k3: ["big"], fin3: "It is big!" , color: "brown" },
        { w: "bird", no: 1, zh: "鳥", img: "bird", s3: "The bird is singing.", k3: ["singing", "sing"], fin3: "Birds can fly!" , color: "blue" }
      ],
      finale: { teacher: "Which one do you like?", zh: "你喜歡哪一個？", no: [667, 604],
        say: { 1: "[Animal]!", 2: "I like the [animal].", 3: "I like the [animal]. [fin3]" } }
    },

    /* ---------------- Gate 4 · Beat Party ---------------- */
    4: {
      key: "beat", title: "Beat Party", zh: "英語節奏派對", city: "Cairo", color: "#ff5fa2",
      genre: "Rhythm & dance 節奏舞蹈", passport: "第25關 教室用語 · 第6、22關 動詞",
      teacher: "You are the boss! Tell us!",
      // pose = what Ollie-Bot does on screen
      moves: {
        1: [ { say: "Jump!", keys: [["jump"]], pose: "jump", no: [607] },
             { say: "Clap!", keys: [["clap"]], pose: "clap", no: [680] },
             { say: "Dance!", keys: [["dance"]], pose: "dance", no: [116] },
             { say: "Sing!", keys: [["sing"]], pose: "sing", no: [115] },
             { say: "Run!", keys: [["run"]], pose: "run", no: [70] } ],
        2: [ { say: "Stand up!", keys: [["stand"]], pose: "stand", no: [669] },
             { say: "Clap your hands!", keys: [["clap"]], pose: "clap", no: [680] },
             { say: "Raise your hand!", keys: [["raise", "hand"]], pose: "raise", no: [671] },
             { say: "Jump!", keys: [["jump"]], pose: "jump", no: [607] },
             { say: "Sit down!", keys: [["sit"]], pose: "sit", no: [670] } ],
        3: [ { say: "Please stand up!", keys: [["stand"]], pose: "stand", no: [669] },
             { say: "Clap your hands with me!", keys: [["clap"]], pose: "clap", no: [680] },
             { say: "We dance together!", keys: [["dance"]], pose: "dance", no: [116] },
             { say: "Raise your hand, please!", keys: [["raise", "hand"]], pose: "raise", no: [671] },
             { say: "Please sit down!", keys: [["sit"]], pose: "sit", no: [670] } ]
      },
      finale: { teacher: "Photo time! 拍照囉！", zh: "大家看鏡頭", say: { 1: "Say cheese!", 2: "Say cheese!", 3: "Smile and say cheese!" },
        keys: { 1: [["cheese"]], 2: [["cheese"]], 3: [["cheese"]] }, no: [697] }
    },

    /* ---------------- Gate 5 · Mystery Box ---------------- */
    5: {
      key: "box", title: "Mystery Box", zh: "神秘盲盒", city: "Vancouver", color: "#9b6bff",
      genre: "Mystery box / unboxing 開箱驚喜", passport: "第19–21關 食物 · 第9關 sweet / sour",
      teacher: "Listen to the clues. What is it?",
      // q2 = intermediate question form, s3 = advanced sentence (passport sentence where possible)
      items: [
        { w: "apple", no: 518, zh: "蘋果", img: "apple", clues: ["It's red.", "It's sweet.", "It's a fruit."], q2: "Is it an apple?", s3: "Is it an apple? I like apples.", like: "apples" },
        { w: "banana", no: 542, zh: "香蕉", img: "banana", clues: ["It's yellow.", "It's sweet.", "Monkeys like it."], q2: "Is it a banana?", s3: "Is it a banana? I like bananas.", like: "bananas" },
        { w: "lemon", no: 526, zh: "檸檬", img: "lemon", clues: ["It's yellow.", "It's sour.", "It's a fruit."], q2: "Is it a lemon?", s3: "Is it a lemon? Lemons are sour.", like: "lemons" },
        { w: "watermelon", no: 544, zh: "西瓜", img: "watermelon", clues: ["It's big.", "It's green.", "It's red inside."], q2: "Is it a watermelon?", s3: "Is it a watermelon? I like watermelon.", like: "watermelon" },
        { w: "strawberry", no: 546, zh: "草莓", img: "strawberry", clues: ["It's small.", "It's red.", "It's sweet."], q2: "Is it a strawberry?", s3: "Is it a strawberry? Strawberries are sweet.", like: "strawberries" },
        { w: "cookie", no: 529, zh: "餅乾", img: "cookie", clues: ["It's small.", "It's sweet.", "Grandma bakes it."], q2: "Is it a cookie?", s3: "Is it a cookie? I like cookies.", like: "cookies" },
        { w: "cake", no: 517, zh: "蛋糕", img: "cake", clues: ["It's sweet.", "It has cream.", "I eat it on my birthday."], q2: "Is it a cake?", s3: "Is it a cake? The cake is delicious.", like: "cake" },
        { w: "hamburger", no: 516, zh: "漢堡", img: "hamburger", clues: ["It's round.", "It has bread.", "It has beef."], q2: "Is it a hamburger?", s3: "Is it a hamburger? I like hamburgers.", like: "hamburgers" },
        { w: "pizza", no: 532, zh: "披薩", img: "pizza", clues: ["It's round.", "It has cheese.", "It's from Italy."], q2: "Is it pizza?", s3: "Is it pizza? Pizza is my favorite food.", like: "pizza" },
        { w: "ice cream", no: 566, zh: "冰淇淋", img: "ice-cream", clues: ["It's cold.", "It's sweet.", "We eat it in summer."], q2: "Is it ice cream?", s3: "Is it ice cream? I love ice cream.", like: "ice cream", keys: [["ice cream"]] },
        { w: "egg", no: 515, zh: "蛋", img: "egg", clues: ["It's white.", "It's small.", "It's from a chicken."], q2: "Is it an egg?", s3: "Is it an egg? She cooks an egg.", like: "eggs" }
      ],
      finale: { teacher: "Are you hungry?", zh: "你餓了嗎？", no: [59, 364],
        say: { 1: "Yes!", 2: "Yes, I am hungry!", 3: "Yes! I am hungry. Great! Let's go!" },
        keys: { 1: [["yes", "yeah"]], 2: [["hungry"], ["am", "yes"]], 3: [["hungry"], ["am", "yes"]] } }
    },

    /* ---------------- Gate 6 · Sports Obby ---------------- */
    6: {
      key: "obby", title: "Sports Day Obby", zh: "運動會障礙跑酷", city: "San Diego", color: "#ff9a2e",
      genre: "Obby / runner 障礙跑酷", passport: "第4、6、22關 動詞 · 第19關 運動 · can",
      teacher: "What can you do?",
      moves: [
        { w: "jump", no: 607, zh: "跳", obstacle: "hurdle", t: "What can you do?", s2: "I can jump!", s3: "Yes! I can jump high!" },
        { w: "swim", no: 394, zh: "游泳", obstacle: "river", t: "What can you do?", s2: "I can swim!", s3: "Yes! I can swim fast!" },
        { w: "climb", no: 140, zh: "爬", obstacle: "wall", t: "What can you do?", s2: "I can climb!", s3: "Yes! I can climb trees!" },
        { w: "run", no: 70, zh: "跑", obstacle: "track", t: "What can you do?", s2: "I can run!", s3: "Yes! I can run fast!" },
        { w: "ride", no: 125, zh: "騎", obstacle: "bikeLane", t: "What can you do?", s2: "I can ride a bike!", s3: "Yes! I can ride a bike!", keys: [["ride", "bike"]] },
        { w: "fly", no: 139, zh: "飛", obstacle: "cliff", t: "What can you do?", s2: "I can fly!", s3: "Yes! I can fly high!" }
      ],
      sports: {
        basketball: { no: 501, zh: "籃球", img: "basketball" },
        baseball: { no: 502, zh: "棒球", img: "baseball" },
        tennis: { no: 503, zh: "網球", img: "tennis" }
      },
      finale: { teacher: "What sport do you like?", zh: "你喜歡什麼運動？", no: [311, 604],
        say: { 1: "Basketball!", 2: "I like basketball.", 3: "My favorite sport is basketball." } }
    }
  }
};

/* Sentence Builder puzzles: passport example sentences (number = passport word number) */
window.TC_CONTENT.sentences = {
 "1": [
  {
   "no": 17,
   "s": "The train is fast.",
   "zh": "火車很快。",
   "keys": [
    [
     "train"
    ],
    [
     "fast"
    ]
   ]
  },
  {
   "no": 19,
   "s": "The plane is in the sky.",
   "zh": "飛機在天上。",
   "keys": [
    [
     "plane"
    ],
    [
     "sky"
    ]
   ]
  },
  {
   "no": 16,
   "s": "I ride my bike to school.",
   "zh": "我騎腳踏車上學。",
   "keys": [
    [
     "ride",
     "bike"
    ],
    [
     "school"
    ]
   ]
  },
  {
   "no": 18,
   "s": "We take a taxi home.",
   "zh": "我們搭計程車回家。",
   "keys": [
    [
     "taxi"
    ],
    [
     "home"
    ]
   ]
  },
  {
   "no": 248,
   "s": "The turtle is slow.",
   "zh": "烏龜很慢。",
   "keys": [
    [
     "turtle"
    ],
    [
     "slow"
    ]
   ]
  }
 ],
 "2": [
  {
   "no": 507,
   "s": "The sky is blue.",
   "zh": "天空是藍色的。",
   "keys": [
    [
     "sky"
    ],
    [
     "blue"
    ]
   ]
  },
  {
   "no": 508,
   "s": "The sun is yellow.",
   "zh": "太陽是黃色的。",
   "keys": [
    [
     "sun"
    ],
    [
     "yellow"
    ]
   ]
  },
  {
   "no": 505,
   "s": "The apple is red.",
   "zh": "蘋果是紅色的。",
   "keys": [
    [
     "apple"
    ],
    [
     "red"
    ]
   ]
  },
  {
   "no": 439,
   "s": "Blue is my favorite color.",
   "zh": "藍色是我最喜歡的顏色。",
   "keys": [
    [
     "blue"
    ],
    [
     "favorite"
    ]
   ]
  },
  {
   "no": 523,
   "s": "The bear is brown.",
   "zh": "熊是棕色的。",
   "keys": [
    [
     "bear"
    ],
    [
     "brown"
    ]
   ]
  }
 ],
 "3": [
  {
   "no": 11,
   "s": "The tiger is strong.",
   "zh": "老虎很強壯。",
   "keys": [
    [
     "tiger"
    ],
    [
     "strong"
    ]
   ]
  },
  {
   "no": 10,
   "s": "The rabbit has long ears.",
   "zh": "兔子有長耳朵。",
   "keys": [
    [
     "rabbit"
    ],
    [
     "ears",
     "long"
    ]
   ]
  },
  {
   "no": 8,
   "s": "The monkey is eating bananas.",
   "zh": "猴子在吃香蕉。",
   "keys": [
    [
     "monkey"
    ],
    [
     "banana",
     "bananas",
     "eating"
    ]
   ]
  },
  {
   "no": 5,
   "s": "The duck is swimming.",
   "zh": "鴨子在游泳。",
   "keys": [
    [
     "duck"
    ],
    [
     "swimming",
     "swim"
    ]
   ]
  },
  {
   "no": 12,
   "s": "The turtle is slow.",
   "zh": "烏龜很慢。",
   "keys": [
    [
     "turtle"
    ],
    [
     "slow"
    ]
   ]
  }
 ],
 "4": [
  {
   "no": 680,
   "s": "Clap your hands with me.",
   "zh": "跟我一起拍手。",
   "keys": [
    [
     "clap"
    ],
    [
     "hands",
     "hand"
    ]
   ]
  },
  {
   "no": 671,
   "s": "Raise your hand if you know.",
   "zh": "如果你知道答案，請舉手。",
   "keys": [
    [
     "raise"
    ],
    [
     "hand",
     "know"
    ]
   ]
  },
  {
   "no": 673,
   "s": "Let's line up quietly.",
   "zh": "我們安靜排隊。",
   "keys": [
    [
     "line"
    ],
    [
     "quietly",
     "quiet",
     "up"
    ]
   ]
  },
  {
   "no": 669,
   "s": "Please stand up.",
   "zh": "請站起來。",
   "keys": [
    [
     "stand"
    ]
   ]
  },
  {
   "no": 116,
   "s": "We dance together.",
   "zh": "我們一起跳舞。",
   "keys": [
    [
     "dance"
    ],
    [
     "together"
    ]
   ]
  }
 ],
 "5": [
  {
   "no": 604,
   "s": "I like apples.",
   "zh": "我喜歡蘋果。",
   "keys": [
    [
     "like"
    ],
    [
     "apple",
     "apples"
    ]
   ]
  },
  {
   "no": 526,
   "s": "Lemons are sour.",
   "zh": "檸檬是酸的。",
   "keys": [
    [
     "lemon",
     "lemons"
    ],
    [
     "sour"
    ]
   ]
  },
  {
   "no": 532,
   "s": "Pizza is my favorite food.",
   "zh": "披薩是我最喜歡的食物。",
   "keys": [
    [
     "pizza"
    ],
    [
     "favorite",
     "food"
    ]
   ]
  },
  {
   "no": 546,
   "s": "Strawberries are sweet.",
   "zh": "草莓是甜的。",
   "keys": [
    [
     "strawberry",
     "strawberries"
    ],
    [
     "sweet"
    ]
   ]
  },
  {
   "no": 566,
   "s": "I love ice cream.",
   "zh": "我愛冰淇淋。",
   "keys": [
    [
     "love",
     "like"
    ],
    [
     "ice",
     "cream"
    ]
   ]
  }
 ],
 "6": [
  {
   "no": 134,
   "s": "I can run fast.",
   "zh": "我可以跑得很快。",
   "keys": [
    [
     "run"
    ],
    [
     "fast"
    ]
   ]
  },
  {
   "no": 394,
   "s": "I can swim fast.",
   "zh": "我游得很快。",
   "keys": [
    [
     "swim"
    ],
    [
     "fast"
    ]
   ]
  },
  {
   "no": 139,
   "s": "Birds can fly.",
   "zh": "鳥會飛。",
   "keys": [
    [
     "birds",
     "bird"
    ],
    [
     "fly"
    ]
   ]
  },
  {
   "no": 607,
   "s": "She jumps high.",
   "zh": "她跳得很高。",
   "keys": [
    [
     "jump",
     "jumps"
    ],
    [
     "high"
    ]
   ]
  },
  {
   "no": 311,
   "s": "My favorite sport is soccer.",
   "zh": "我最喜歡的運動是足球。",
   "keys": [
    [
     "favorite"
    ],
    [
     "sport",
     "soccer"
    ]
   ]
  }
 ]
};

/* Warm-up chat at the start of each gate (teacher ↔ child), rotating passport patterns.
   Answer words never appear in the teacher's question, so the AI cannot hear the teacher. */
window.TC_CONTENT.greetings = {
  name: { teacher: "Hello! What's your name?", tzh: "你叫什麼名字？", no: [662, 405, 37],
    say: { 1: "[Name]!", 2: "My name is [Name].", 3: "Hello! My name is [Name]." }, keys: [["my", "i", "am", "[name]"]] },
  feel: { teacher: "How are you today?", tzh: "你今天好嗎？", no: [255, 258, 259, 37],
    say: { 1: "Happy!", 2: "I'm happy!", 3: "I'm happy and excited!" }, keys: [["happy", "fine", "good", "great", "excited", "ok", "okay", "tired", "sad", "hungry"]] },
  age: { teacher: "How old are you?", tzh: "你幾歲？", no: [148, 661],
    say: { 1: "[Age]!", 2: "I am [age].", 3: "I am [age] years old." }, keys: [["six", "seven", "eight", "nine", "ten", "eleven", "twelve", "years", "old"]] }
};
window.TC_CONTENT.greetingOrder = { 1: "name", 2: "feel", 3: "age", 4: "name", 5: "feel", 6: "age" };
