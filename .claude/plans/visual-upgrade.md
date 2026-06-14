# 温润书卷风 · 前端视觉升级 + 移动端适配

## 核心策略

项目使用**单一全局 CSS 文件** (`src/style.css`, ~1030行) 控制全站样式，所有页面依赖 CSS 变量。升级方案：

1. **重写 CSS 变量** → 全站色彩/圆角/阴影一步到位
2. **重写 style.css 组件样式** → 逐段升级卡片、按钮、表单、导航等
3. **覆盖 Element Plus 主题变量** → 统一 UI 框架风格
4. **优化响应式断点** → 768px/1200px 替代现有 5 断点体系
5. **修复 inline style** → DashboardPage 等页面的内联样式转为 class

## 修改文件清单

| 文件 | 改动内容 |
|------|---------|
| `src/style.css` | **主战场**：CSS 变量 + 全部组件样式 + 响应式 + 纸张肌理 |
| `src/main.js` | 添加 Element Plus 主题变量覆盖 |
| `src/pages/DashboardPage.vue` | inline style → class（部分） |
| `src/pages/LocalCasePage.vue` | inline style → class（如有大量内联） |
| `src/pages/CoursePage.vue` | inline style → class（如有大量内联） |
| `src/components/SoloAppShell.vue` | 微调 scoped 样式 |

## 实施步骤

### Step 1: CSS 变量体系重构（style.css `:root`）

**色彩替换**：
- `--primary`: `#E3925C` → `#B86F50`（低饱和赭石茶橘）
- `--primary-strong`: `#D37A42` → `#A35E42`
- `--accent`: `#A4C27E` → `#7A9E9F`（青瓷灰绿）
- `--accent-soft`: `#EDF5E2` → `#EDF3F3`
- `--bg`: `#FFF9F0` → `#F7F3ED`（浅米杏色）
- `--bg-soft`: `#FDF5E6` → `#F0EBE3`
- `--surface`: `#FFFEFB` → `#FDFCF9`（奶白色）
- `--text`: `#4B3B2F` → `#3A3632`（深棕灰）
- `--text-soft`: `#6B5840` → `#6B6158`
- `--text-faint`: `#9B8A75` → `#9A9189`
- `--border`: `#E6D5B8` → `#E8E0D6`
- `--border-strong`: `#D4C0A0` → `#D4C9BC`
- `--danger`: `#D36B5B` → `#C2645A`
- `--gold`: `#F7D27D` → `#D4B896`
- `--blackboard`: `#3D5A43` → `#5A7A6A`

**新增变量**：
- `--radius-sm/md/lg`: 8/10/12 → 6/8/10
- `--shadow`: 柔化，降低 opacity
- `--paper-noise`: 纸张噪点纹理（SVG data URI）
- `--el-*`: Element Plus 主题覆盖

### Step 2: 基础样式重构

- `body` 背景：添加纸张噪点纹理叠加
- `h1-h4`：字重 500（非 600），行高 1.6-1.7
- `p`：行高 1.65
- 滚动条：更细（4px），暖灰色

### Step 3: 导航栏升级

- `.social-topbar`：半透明奶白磨砂玻璃 + `backdrop-filter: blur(12px)`
- 底部边框：3px → 1px，极淡色
- `.social-nav-item.active`：底部细指示条 + 极淡底色
- 移动端：Tab 横向滑动，触控区域 ≥44px

### Step 4: 卡片体系升级

- 统一内描边：`border: 1px solid rgba(...)` 替代 1.5px
- 阴影：漫射柔光，低透明度
- `.editor-card`：圆角 8px，内描边
- `.data-card:hover`：轻微上浮 + 阴影柔化

### Step 5: 按钮体系重构

- 主按钮：低饱和主色实心，`font-weight: 500`
- 次按钮：细描边 + 透明底色
- 文本按钮：纯文字
- `.choice-btn`：胶囊样式

### Step 6: 表单控件升级

- `input/textarea`：弱化边框，聚焦时主色细描边 + 极淡外发光
- `::placeholder`：浅灰柔和
- 触控高度 ≥44px

### Step 7: 分页面样式优化

- 首页 `.ysd-ref-*`：角色卡片书卷质感，三步引导优化
- 登录页 `.login-*`：磨砂玻璃效果
- 备课/反思：麦克风按钮呼吸动效
- 视频平台：暖调渐变封面
- 社区问答：卡片化
- 档案热力图：暖棕渐变
- 诊断表格：表头暖色底
- 数字人：边框柔化

### Step 8: 响应式断点重构

新断点体系：
- `≤768px`：移动端（替代原 860px/640px）
- `≤1200px`：平板（替代原 1100px）
- 保留 `≤400px` 小屏优化

关键改动：
- 左侧栏 → 768px 以下隐藏
- 底部导航 → 768px 以下显示
- 多列布局 → 768px 以下单列
- 统计卡片 → 768px 以下 2 列
- 表格 → 768px 以下横向滚动

### Step 9: Element Plus 主题覆盖

在 `main.js` 中添加 CSS 变量覆盖 Element Plus 默认主题：
```css
:root {
  --el-color-primary: #B86F50;
  --el-border-radius-base: 8px;
  /* ... */
}
```

### Step 10: 动效原则

- 过渡：`0.3s ease-out`
- hover 上移：`translateY(-2px)`（PC 端）
- 移动端：移除 hover，改为点击态反馈
- 动画：舒缓柔和，不弹跳

## 验证方式

1. 启动前端 `npm run dev`，浏览器打开查看
2. 检查 PC 端（1366px-1920px）布局正常
3. 浏览器 DevTools 切换移动端（375px-430px）检查适配
4. 逐页检查：首页、登录、备课、反思、诊断、数字人、课题、视频、答疑、档案
5. 检查 Element Plus 组件（按钮、对话框等）风格统一
