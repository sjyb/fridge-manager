import { FoodItem, MealRecommendation } from '@/types/food';

export interface FoodCategory {
  category: string;
  subCategories: {
    name: string;
    types: {
      value: string;
      label: string;
      icon: string;
      defaultUnit: string;
      storage?: string;
      defaultExpiryDays?: {
        fridge: number;
        freezer?: number;
      };
    }[];
  }[];
}

export const foodCategories: FoodCategory[] = [
  {
    category: '乳制品',
    subCategories: [
      {
        name: '液体乳',
        types: [
          { 
            value: 'milk', 
            label: '牛奶', 
            icon: 'fa-solid fa-mug-hot', 
            defaultUnit: '瓶',
            defaultExpiryDays: { fridge: 3 }
          },
          { 
            value: 'yogurt', 
            label: '酸奶', 
            icon: 'fa-solid fa-jar', 
            defaultUnit: '瓶',
            defaultExpiryDays: { fridge: 14 }
          }
        ]
      },
      {
        name: '奶酪',
        types: [
          { 
            value: 'hard-cheese', 
            label: '硬质奶酪', 
            icon: 'fa-solid fa-cheese', 
            defaultUnit: '块',
            defaultExpiryDays: { fridge: 30 }
          },
          { 
            value: 'soft-cheese', 
            label: '软质奶酪', 
            icon: 'fa-solid fa-cheese', 
            defaultUnit: '块',
            defaultExpiryDays: { fridge: 7 }
          }
        ]
      }
    ]
  },
  {
    category: '肉类',
    subCategories: [
      {
        name: '生肉',
        types: [
          { 
            value: 'beef-raw', 
            label: '生牛肉', 
            icon: 'fa-solid fa-drumstick-bite', 
            storage: 'freezer', 
            defaultUnit: '斤',
            defaultExpiryDays: { fridge: 2, freezer: 365 }
          },
          { 
            value: 'pork-raw', 
            label: '生猪肉', 
            icon: 'fa-solid fa-bacon', 
            storage: 'freezer', 
            defaultUnit: '斤',
            defaultExpiryDays: { fridge: 2, freezer: 365 }
          },
          { 
            value: 'chicken-raw', 
            label: '生鸡肉', 
            icon: 'fa-solid fa-drumstick', 
            storage: 'freezer', 
            defaultUnit: '斤',
            defaultExpiryDays: { fridge: 2, freezer: 365 }
          }
        ]
      },
      {
        name: '熟肉',
        types: [
          { 
            value: 'beef-cooked', 
            label: '熟牛肉', 
            icon: 'fa-solid fa-utensils', 
            storage: 'fridge', 
            defaultUnit: '斤',
            defaultExpiryDays: { fridge: 4, freezer: 180 }
          },
          { 
            value: 'pork-cooked', 
            label: '熟猪肉', 
            icon: 'fa-solid fa-bacon', 
            storage: 'fridge', 
            defaultUnit: '斤',
            defaultExpiryDays: { fridge: 4, freezer: 180 }
          },
          { 
            value: 'sausage', 
            label: '香肠/腊肉', 
            icon: 'fa-solid fa-bacon', 
            storage: 'fridge', 
            defaultUnit: '包',
            defaultExpiryDays: { fridge: 7, freezer: 60 }
          }
        ]
      }
    ]
  },
  {
    category: '海鲜',
    subCategories: [
      {
        name: '鱼类',
        types: [
          { 
            value: 'fish-raw', 
            label: '生鱼肉', 
            icon: 'fa-solid fa-fish', 
            storage: 'freezer', 
            defaultUnit: '斤',
            defaultExpiryDays: { fridge: 2, freezer: 240 }
          }
        ]
      },
      {
        name: '甲壳类',
        types: [
          { 
            value: 'shrimp', 
            label: '虾', 
            icon: 'fa-solid fa-shrimp', 
            storage: 'freezer', 
            defaultUnit: '斤',
            defaultExpiryDays: { fridge: 2, freezer: 180 }
          },
          { 
            value: 'shellfish', 
            label: '贝类', 
            icon: 'fa-solid fa-crab', 
            storage: 'freezer', 
            defaultUnit: '斤',
            defaultExpiryDays: { fridge: 2, freezer: 180 }
          }
        ]
      }
    ]
  },
  {
    category: '蛋类',
    subCategories: [
      {
        name: '禽蛋',
        types: [
          { 
            value: 'egg', 
            label: '鸡蛋', 
            icon: 'fa-solid fa-egg', 
            storage: 'fridge', 
            defaultUnit: '颗',
            defaultExpiryDays: { fridge: 35 }
          }
        ]
      }
    ]
  },
  {
    category: '蔬菜',
    subCategories: [
      {
        name: '叶菜',
        types: [
          { 
            value: 'leafy-greens', 
            label: '叶菜类', 
            icon: 'fa-solid fa-leaf', 
            storage: 'fridge', 
            defaultUnit: '把',
            defaultExpiryDays: { fridge: 7 }
          }
        ]
      },
      {
        name: '根茎',
        types: [
          { 
            value: 'root-vegetable', 
            label: '根茎类', 
            icon: 'fa-solid fa-carrot', 
            storage: 'fridge', 
            defaultUnit: '斤',
            defaultExpiryDays: { fridge: 30 }
          }
        ]
      },
      {
        name: '瓜果',
        types: [
          { 
            value: 'cucumber', 
            label: '黄瓜', 
            icon: 'fa-solid fa-seedling', 
            storage: 'fridge', 
            defaultUnit: '个',
            defaultExpiryDays: { fridge: 7 }
          },
          { 
            value: 'tomato', 
            label: '番茄', 
            icon: 'fa-solid fa-seedling', 
            storage: 'fridge', 
            defaultUnit: '个',
            defaultExpiryDays: { fridge: 7 }
          },
          { 
            value: 'broccoli', 
            label: '西兰花', 
            icon: 'fa-solid fa-seedling', 
            storage: 'fridge', 
            defaultUnit: '颗',
            defaultExpiryDays: { fridge: 14 }
          }
        ]
      }
    ]
  },
  {
    category: '水果',
    subCategories: [
      {
        name: '常见水果',
        types: [
          { 
            value: 'apple', 
            label: '苹果', 
            icon: 'fa-solid fa-apple-whole', 
            storage: 'fridge', 
            defaultUnit: '个',
            defaultExpiryDays: { fridge: 7 }
          },
          { 
            value: 'banana', 
            label: '香蕉', 
            icon: 'fa-solid fa-banana', 
            storage: 'fridge', 
            defaultUnit: '根',
            defaultExpiryDays: { fridge: 7 }
          },
          { 
            value: 'grape', 
            label: '葡萄', 
            icon: 'fa-solid fa-grapes', 
            storage: 'fridge', 
            defaultUnit: '串',
            defaultExpiryDays: { fridge: 7 }
          },
          { 
            value: 'avocado', 
            label: '牛油果', 
            icon: 'fa-solid fa-seedling', 
            storage: 'fridge', 
            defaultUnit: '个',
            defaultExpiryDays: { fridge: 7 }
          }
        ]
      }
    ]
  },
  {
    category: '其他',
    subCategories: [
      {
        name: '主食',
        types: [
          { 
            value: 'bread', 
            label: '面包/馒头', 
            icon: 'fa-solid fa-bread-slice', 
            storage: 'fridge', 
            defaultUnit: '个',
            defaultExpiryDays: { fridge: 2, freezer: 60 }
          },
          { 
            value: 'rice', 
            label: '米饭', 
            icon: 'fa-solid fa-bowl-food', 
            storage: 'fridge', 
            defaultUnit: '碗',
            defaultExpiryDays: { fridge: 4, freezer: 90 }
          },
          { 
            value: 'noodle', 
            label: '面条', 
            icon: 'fa-solid fa-plate-wheat', 
            storage: 'fridge', 
            defaultUnit: '份',
            defaultExpiryDays: { fridge: 4, freezer: 90 }
          }
        ]
      }
    ]
  }
];

export const DEFAULT_FOODS: FoodItem[] = [];

export const mockFoods: FoodItem[] = [];

export const seasonalRecommendations: MealRecommendation[] = [
  {
    season: 'spring',
    meals: [
      {
        type: 'breakfast',
        name: '春季早餐',
        items: [
          { name: '燕麦粥', ingredients: ['燕麦'] },
          { name: '新鲜草莓', ingredients: [] },
          { name: '核桃', ingredients: [] }
        ]
      },
      {
        type: 'lunch',
        name: '春季午餐',
        items: [
          { name: '清蒸鱼', ingredients: ['鲈鱼或鳕鱼'] },
          { name: '炒时蔬', ingredients: ['菠菜', '胡萝卜', '蒜末'] },
          { name: '糙米饭', ingredients: [] }
        ]
      },
      {
        type: 'dinner',
        name: '春季晚餐',
        items: [
          { name: '豆腐汤', ingredients: ['嫩豆腐', '香菇', '青菜'] },
          { name: '凉拌黄瓜', ingredients: ['黄瓜', '蒜末', '醋'] }
        ]
      }
    ]
  },
  {
    season: 'summer',
    meals: [
      {
        type: 'breakfast',
        name: '夏季早餐',
        items: [
          { name: '绿豆汤', ingredients: ['绿豆'] },
          { name: '西瓜', ingredients: [] },
          { name: '煮鸡蛋', ingredients: ['鸡蛋'] }
        ]
      },
      {
        type: 'lunch',
        name: '夏季午餐',
        items: [
          { name: '冬瓜排骨汤', ingredients: ['冬瓜', '猪排骨'] },
          { name: '凉拌西红柿', ingredients: ['西红柿', '糖'] },
          { name: '凉面', ingredients: ['面条', '黄瓜丝', '芝麻酱'] }
        ]
      },
      {
        type: 'dinner',
        name: '夏季晚餐',
        items: [
          { name: '苦瓜炒蛋', ingredients: ['苦瓜', '鸡蛋'] },
          { name: '凉拌海带丝', ingredients: ['海带丝', '辣椒油'] },
          { name: '绿豆粥', ingredients: ['绿豆'] }
        ]
      }
    ]
  },
  {
    season: 'autumn',
    meals: [
      {
        type: 'breakfast',
        name: '秋季早餐',
        items: [
          { name: '南瓜粥', ingredients: ['南瓜', '大米'] },
          { name: '梨子', ingredients: [] },
          { name: '杏仁', ingredients: [] }
        ]
      },
      {
        type: 'lunch',
        name: '秋季午餐',
        items: [
          { name: '胡萝卜炖牛肉', ingredients: ['胡萝卜', '牛腩肉'] },
          { name: '蒸紫薯', ingredients: ['紫薯'] },
          { name: '青菜汤', ingredients: ['小白菜', '盐'] }
        ]
      },
      {
        type: 'dinner',
        name: '秋季晚餐',
        items: [
          { name: '银耳莲子羹', ingredients: ['银耳', '莲子', '红枣'] },
          { name: '烤红薯', ingredients: ['红薯'] },
          { name: '清炒西兰花', ingredients: ['西兰花', '蒜末'] }
        ]
      }
    ]
  },
  {
    season: 'winter',
    meals: [
      {
        type: 'breakfast',
        name: '冬季早餐',
        items: [
          { name: '黑米粥', ingredients: ['黑米'] },
          { name: '橙子', ingredients: [] },
          { name: '坚果', ingredients: ['杏仁', '核桃'] }
        ]
      },
      {
        type: 'lunch',
        name: '冬季午餐',
        items: [
          { name: '羊肉萝卜汤', ingredients: ['羊肉', '白萝卜'] },
          { name: '韭菜盒子', ingredients: ['韭菜', '鸡蛋', '面粉'] },
          { name: '白米饭', ingredients: [] }
        ]
      },
      {
        type: 'dinner',
        name: '冬季晚餐',
        items: [
          { name: '红烧肉', ingredients: ['五花肉', '酱油', '糖'] },
          { name: '酸菜炖粉条', ingredients: ['酸菜', '红薯粉条'] },
          { name: '热牛奶', ingredients: ['牛奶'] }
        ]
      }
    ]
  }
];