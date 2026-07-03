# 🎮 Mini Game Hub

> 轻松玩一局 —— 适合碎片时间随手打开的小游戏合集

## ✨ 在线体验

打开即玩，无需下载，随时随地来一局！

## 🕹️ 游戏列表

| 游戏 | 类型 | 描述 |
|------|------|------|
| ⬢ **2048** | `单人` `益智` | 滑动合并数字，挑战更高分数 |
| ⚫ **五子棋** | `双人` `策略` | 双人对弈，先连成五子者胜 |
| 🧠 **MBTI 测试** | `测试` `性格` | 28 道题目探索你的性格类型，发现你是哪种 MBTI 人格 |
| 🐺 **狼人杀** | `多人` `推理` | 多人推理，找出隐藏的狼人 |

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建产物
npm run preview
```

## 🛠️ 技术栈

- **Vue 3** - 渐进式 JavaScript 框架
- **Vite** - 下一代前端构建工具
- **Vue Router** - 官方路由管理器

## 📂 项目结构

```
src/
├── views/          # 页面组件
│   ├── HomeView.vue       # 首页 - 游戏大厅
│   ├── Game2048View.vue   # 2048 游戏
│   ├── GomokuView.vue     # 五子棋游戏
│   ├── MBTIView.vue       # MBTI 性格测试
│   └── WerewolfView.vue   # 狼人杀游戏
├── router/         # 路由配置
├── App.vue         # 根组件
├── main.js         # 入口文件
└── style.css       # 全局样式
```

## 📝 License

MIT
