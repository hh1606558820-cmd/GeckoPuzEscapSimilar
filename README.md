# 关卡编辑器

一个基于 React + Vite + TypeScript 的模块化网页版关卡编辑器。

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

然后在浏览器中打开显示的本地地址（通常是 `http://localhost:5173`）。

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm preview
```

### 打包为单机网页版

想要打包成单机网页版，可以在没有网络的情况下使用？

**Windows 用户**：
```bash
# 双击运行或在命令行执行
package-offline.bat
```

**Linux/Mac 用户**：
```bash
chmod +x package-offline.sh
./package-offline.sh
```

打包脚本会自动：
1. 构建生产版本
2. 检查必要文件
3. 创建 ZIP 压缩包（包含所有文件）

打包完成后，将 ZIP 文件解压到任意目录，双击 `start.bat`（Windows）即可启动本地服务器，在浏览器中打开 `http://localhost:3000` 使用。

详细说明请查看：[离线打包说明](OFFLINE_BUILD.md)

### 部署到网页（分享给其他人使用）

想要将这个编辑器部署到网上让其他人使用？查看部署指南：

- 📖 [快速部署指南](QUICK_START_DEPLOY.md) - 3 分钟快速上手
- 📚 [完整部署文档](DEPLOY.md) - 详细的部署选项和说明

**推荐方案**：
- **Netlify** 或 **Vercel**：最简单，拖拽 `dist` 文件夹即可部署
- **GitHub Pages**：如果代码在 GitHub 上，可以使用自动化部署

## 项目结构

```
level-editor/
├── src/
│   ├── app/                    # 应用布局与入口
│   │   ├── App.tsx            # 主应用组件，管理状态和布局
│   │   └── App.css            # 应用样式
│   │
│   ├── modules/               # 功能模块（按模块拆分）
│   │   ├── map-generator/     # 模块1：关卡地图生成
│   │   │   ├── MapGeneratorPanel.tsx
│   │   │   ├── MapGeneratorPanel.css
│   │   │   ├── GridCanvas.tsx
│   │   │   ├── GridCanvas.css
│   │   │   └── selection.ts
│   │   ├── rope-editor/       # 模块2：Rope 路径编辑
│   │   │   ├── RopeEditorPanel.tsx
│   │   │   ├── RopeEditorPanel.css
│   │   │   └── ropeLogic.ts
│   │   ├── rope-manager/      # 模块3：Rope 管理
│   │   │   ├── RopeManagerPanel.tsx
│   │   │   ├── RopeManagerPanel.css
│   │   │   ├── ropeHitTest.ts
│   │   │   └── ropeMutations.ts
│   │   ├── rope-visualizer/   # 模块4：Rope 可视化
│   │   │   ├── RopeOverlay.tsx
│   │   │   ├── RopeOverlay.css
│   │   │   └── geometry.ts
│   │   ├── rope-color-pool/   # 模块5：Rope 颜色池
│   │   │   ├── colorPool.ts
│   │   │   ├── RopeColorPicker.tsx
│   │   │   ├── RopeColorPicker.css
│   │   │   └── index.ts
│   │   ├── level-io/          # 模块6：JSON 关卡文件管理
│   │   │   ├── LevelIOButtons.tsx
│   │   │   ├── LevelIOButtons.css
│   │   │   ├── validators.ts
│   │   │   └── io.ts
│   │   ├── JsonPreview/       # JSON 预览模块
│   │   │   ├── JsonPreview.tsx
│   │   │   └── JsonPreview.css
│   │   └── ActionsBar/        # 操作栏模块
│   │       ├── ActionsBar.tsx
│   │       └── ActionsBar.css
│   │
│   ├── shared/                # 通用工具
│   │   ├── mockData.ts        # Mock 数据
│   │   └── utils.ts           # 工具函数
│   │
│   ├── types/                 # 数据结构定义
│   │   └── Level.ts           # 关卡相关类型定义
│   │
│   ├── main.tsx               # React 入口文件
│   └── index.css              # 全局样式
│
├── index.html                 # HTML 入口
├── package.json               # 项目配置
├── tsconfig.json              # TypeScript 配置
├── vite.config.ts             # Vite 配置
└── README.md                  # 本文件
```

## 模块清单与职责

### 1. 应用入口 (`src/app/`)

- **App.tsx**: 
  - 管理整个应用的状态（当前关卡数据、选中的瓦片类型）
  - 组合各个模块组件，构建 3 栏布局
  - 处理模块间的数据传递和事件回调

### 2. 模块1：关卡地图生成 (`src/modules/map-generator/`)

- **MapGeneratorPanel.tsx**: 地图生成器面板
  - 显示和编辑 MapX/MapY（地图尺寸，范围 0~100）
  - 提供步进器控制地图大小
  - 显示编号规则说明

- **GridCanvas.tsx**: 网格画布（地图生成器版本）
  - 渲染 MapX × MapY 的网格
  - 在每个格子里显示 index 编号（小字）
  - 处理格子选择交互（单击、Ctrl 多选、拖拽框选）
  - 高亮显示选中的格子

- **selection.ts**: 选择逻辑封装
  - 封装格子选择的交互逻辑
  - 提供 index 计算函数：`index = y * MapX + x`
  - 处理单击、Ctrl 多选、拖拽框选等操作

- **交互规则**:
  - **单击格子**：切换选中（如果已选中则取消，未选中则选中）
  - **Ctrl + 单击**：多选/取消（不清空已有选择）
  - **不按 Ctrl 单击**：只选中当前（清空其他）
  - **鼠标拖拽框选**：选中矩形范围内所有格子
  - **Ctrl + 拖拽**：追加到已有选择

- **编号规则**:
  - 固定公式：`index = y * MapX + x`（左下角为原点，x 向右，y 向上）
  - 最底一行显示 0~MapX-1，向上递增
  - 例如：MapX=5, MapY=3 时
    - 左下角 (0,0)=0, (1,0)=1, ..., (4,0)=4（右下角）
    - 中间行 (0,1)=5, (1,1)=6, ..., (4,1)=9
    - 最顶行 (0,2)=10, (1,2)=11, ..., (4,2)=14（右上角）

- **输入**: MapX、MapY、selectedIndices、回调函数
- **输出**: 地图生成器 UI 和选择变更事件

### 3. 模块2：Rope 路径编辑 (`src/modules/rope-editor/`)

- **RopeEditorPanel.tsx**: Rope 编辑器面板
  - 显示 Rope 列表（Rope #1 / Rope #2 / ...）
  - 选择当前编辑的 Rope
  - "开始/结束 Rope 路径配置"切换按钮
  - Rope 属性配置（ColorIdx）

- **ropeLogic.ts**: Rope 路径编辑逻辑
  - 路径追加/撤销函数
  - 校验相邻格子规则
  - 自动计算 D、H、BendCount 等字段

- **编辑流程**:
  1. 用户在 Rope 列表中选中一条 Rope
  2. 点击按钮 → 进入「路径编辑模式」
  3. 编辑模式下：用户在 GridCanvas 中按顺序点击格子
  4. 再次点击按钮 → 结束路径编辑，自动计算并写回所有字段

- **路径编辑规则**:
  - **相邻规则**：新点击的格子必须与当前路径最后一个格子上下左右相邻
    - 相邻判定：delta = +1 / -1 或 +MapX / -MapX
    - 不允许斜向、不允许跳格
  - **撤销规则**：如果用户点击的是"当前路径最后一个格子"，视为撤销一步
  - **重复规则**：不允许重复格子（Index 中已存在的格子不可再次加入）

- **自动计算规则**:
  - **Index**：按用户点击顺序生成 `number[]`
  - **H（头部）**：`H = Index[0]`（最先点击的格子），若 Index 为空则 `H = 0`
  - **D（头部朝向）**：表示 Rope 的头部朝向，与第一段移动方向相反
    - 第一段移动方向：`Index[0] → Index[1]` 的方向
    - D = opposite(第一段移动方向)
    - 方向枚举：
      - `1` = 上（y 增大，delta = +MapX）
      - `2` = 下（y 减小，delta = -MapX）
      - `3` = 右（x 增大，delta = +1）
      - `4` = 左（x 减小，delta = -1）
    - opposite 映射：1上 ↔ 2下，3右 ↔ 4左
    - 若 `Index.length < 2` 或不相邻 → `D = 0`
    - 示例（MapX=5）：
      - 路径 `[27,22,17]`（依次点击，向下移动）：
        - 第一段：`27→22`，delta = -5 = -MapX，方向 = 下(2)
        - `H = 27`，`D = 上(1)`（头部朝向，与移动方向相反）
      - 路径 `[0,1,2]`（向右移动）：
        - 第一段：`0→1`，delta = +1，方向 = 右(3)
        - `H = 0`，`D = 左(4)`（头部朝向，与移动方向相反）
  - **BendCount（拐弯次数）**：
    - 从 `Index[1] → Index[2]` 开始判断
    - 每一段计算方向 delta
    - 若当前段方向 ≠ 上一段方向 → `BendCount +1`
    - 初始直线不算拐弯

- **Rope 属性**:
  - **ColorIdx**：number 类型，颜色索引
    - `-1` = 无颜色
    - `1~10` = 颜色池中的颜色

- **输入**: ropes、currentRopeIndex、isEditing、回调函数
- **输出**: Rope 编辑器 UI 和 Rope 数据更新事件

### 4. 模块3：Rope 管理 (`src/modules/rope-manager/`)

- **RopeManagerPanel.tsx**: Rope 管理面板
  - 展示当前选中 Rope 的管理操作
  - 显示只读信息（Index 长度、H、BendCount、D）
  - 提供可编辑字段（ColorIdx）
  - 提供删除 Rope 功能

- **ropeHitTest.ts**: Rope 命中检测
  - 根据点击的格子 index 判断命中哪条 Rope（纯函数）
  - 处理多 Rope 命中的情况（一个格子属于多条 Rope）
  - 规则：优先选中"Index 中包含该格子且长度最短的 Rope"

- **ropeMutations.ts**: Rope 数据变更
  - 更新 Rope 属性的纯函数（ColorIdx）
  - 删除 Rope 的纯函数
  - 确保数据不可变性

- **点击命中规则**:
  - 在 GridCanvas 中点击已配置完成的 Rope 路径（某个格子属于某条 Rope.Index）
  - 仅在非 Rope 路径编辑模式下执行（避免与模块2冲突）
  - 如果一个格子同时属于多条 Rope：
    - 优先选中"Index 中包含该格子且长度最短的 Rope"（更贴近用户直觉）
    - 如果长度相同，则选中第一个命中的 Rope
  - 命中后：设置 selectedRopeIndex，打开 RopeManagerPanel，高亮该 Rope 的整条路径

- **管理功能**:
  - **修改 ColorIdx**：颜色选择器，立即写回 levelData.Rope
  - **删除 Rope**：带确认提示，删除后自动调整选中状态

- **与模块2的联动**:
  - 若当前 Rope 正在路径编辑（isEditing=true 且 editingRopeIndex==selectedRopeIndex）：
    - 禁止删除（按钮 disabled 并提示"请先结束路径编辑"）
    - 允许修改 ColorIdx
  - 若 Rope.Index 为空（未配置路径），点击网格无法命中它

- **输入**: selectedRopeIndex、ropes、isEditingRopePath、editingRopeIndex、回调函数
- **输出**: Rope 管理面板 UI 和 Rope 数据更新事件

### 5. 模块4：Rope 可视化（线段/箭头叠加）(`src/modules/rope-visualizer/`)

- **RopeOverlay.tsx**: Rope 可视化叠加层
  - 在网格上方叠加显示 Rope 的线段和箭头
  - 使用 SVG 绘制红色线段连接相邻格子中心点
  - 在每条 Rope 的末端绘制箭头（指示方向）
  - 支持显示/隐藏切换

- **geometry.ts**: 几何工具函数
  - index 到行列坐标的转换
  - 行列坐标到像素中心点的转换
  - 角度计算（用于箭头方向）

- **可视化规则**:
  - 仅对 `rope.Index.length >= 2` 的 Rope 绘制（至少需要两个点才能画线段）
  - 线段颜色：红色（默认）
  - 选中 Rope 的线条更粗（strokeWidth: 5，普通: 4）
  - 箭头显示在头部格子 H（Index[0]），方向按 D（头部朝向）
  - SVG overlay 使用 `pointer-events: none`，不影响点击格子

- **显示/隐藏控制**:
  - 在底部 ActionsBar 提供切换按钮
  - 按钮文案：显示线段 / 隐藏线段
  - 默认显示（showRopeOverlay = true）

- **与编辑模式的联动**:
  - 路径编辑模式（isEditing=true）时，overlay 仍可显示
  - 不影响点击交互（pointer-events: none）

- **输入**: levelData、cellSize、showRopeOverlay、selectedRopeIndex
- **输出**: SVG overlay 渲染

### 6. 模块5：Rope 颜色池 (`src/modules/rope-color-pool/`)

- **colorPool.ts**: 颜色池定义
  - 集中管理 ColorIdx 与颜色名称的映射关系
  - 提供颜色选项数组（ColorOption[]）
  - 后续修改颜色池只需修改此文件即可全局生效

- **RopeColorPicker.tsx**: 颜色选择器组件
  - 替换原来的 number 输入框
  - 每个选项显示色块预览（小圆点）+ 文本（如 "1 橘色"）
  - 使用下拉选择器（原生 select）

- **颜色映射表**（固定枚举）:
  - `-1` = 无颜色（透明，带棋盘格预览）
  - `1` = 橘色 (#FF9800)
  - `2` = 蓝色 (#2196F3)
  - `3` = 黄色 (#FFEB3B)
  - `4` = 绿色 (#4CAF50)
  - `5` = 黑色 (#212121)
  - `6` = 褐色 (#795548)
  - `7` = 紫色 (#9C27B0)
  - `8` = 粉色 (#E91E63)
  - `9` = 嫩绿色 (#8BC34A)
  - `10` = 天蓝色 (#03A9F4)

- **默认值与防呆**:
  - 新 Rope 默认 ColorIdx = -1（无颜色）
  - 如果 ColorIdx 不在 [-1, 1~10]，回退到默认值（-1）
  - 选择器显示"未知颜色(XX)"选项（禁用状态）

- **接入点**:
  - 模块2 RopeEditorPanel：ColorIdx 配置使用 RopeColorPicker
  - 模块3 RopeManagerPanel：ColorIdx 配置使用 RopeColorPicker
  - 数据输出仍然只写 ColorIdx:number（不写颜色字符串）

- **如何修改颜色池**:
  - 只需修改 `src/modules/rope-color-pool/colorPool.ts` 中的 COLOR_POOL 数组
  - 修改后全局生效（模块2和模块3都会自动使用新颜色）

- **输入**: value (ColorIdx)、onChange 回调、disabled
- **输出**: 颜色选择器 UI 和颜色变更事件

### 7. 模块6：JSON 关卡文件管理 (`src/modules/level-io/`)

- **TopBar**: 顶部栏组件
  - 提供"生成关卡"、"清空"、"读取关卡"等按钮
  - 位于编辑器顶部（header 区域）
  - 处理文件选择、下载和清空操作

- **validators.ts**: 关卡校验规则
  - 纯函数，返回错误信息数组
  - Rule A：校验所有 Rope 的 ColorIdx（允许 -1, 1~10，-1=无颜色）
  - Rule B：校验 Rope 路径是否连续（相邻格子必须上下左右相邻）
  - Rule C：校验初始状态是否存在"全部绳子都不可消"的情况

- **io.ts**: 关卡文件 IO
  - `downloadLevelJson()`: 下载关卡 JSON 文件
  - `readLevelJson()`: 读取并解析关卡 JSON 文件

- **生成关卡功能**:
  - 点击"生成关卡"按钮
  - 执行所有校验规则（Rule A、B、C）
  - 校验通过：生成 JSON 文件并下载（文件名：level_MapXxMapY.json）
  - 校验失败：显示错误提示，阻止生成

- **清空功能**:
  - 点击"清空"按钮
  - 弹出确认框："确定清空当前关卡配置吗？该操作不可撤销"
  - 用户确认后：清空当前编辑器配置并回到初始新建关卡状态
  - 重置内容：
    - levelData 重置为默认值（MapX: 10, MapY: 10, Rope: []）
    - 清空所有 UI 状态（selectedRopeIndex、isRopeEditing、currentEditingPath、selectedIndices 等）
  - 保持不变的状态：UI 偏好设置（showJsonPanel、showRopeOverlay、sidebarWidth、zoom 等）

- **读取关卡功能**:
  - 点击"读取关卡"按钮
  - 打开文件选择器（只接受 .json）
  - 解析并校验 JSON 结构
  - 校验通过：加载数据并刷新界面，清空选择状态
  - 校验失败：显示错误提示，不覆盖当前数据

- **校验规则说明**:
  - **Rule A（颜色校验）**: ColorIdx 允许为 -1, 1~10（-1=无颜色，1~10=有颜色）
    - 只检查越界（<-1 或 >10 或非数字），ColorIdx=-1 不会阻止生成
  - **Rule B（路径校验）**: 
    - Index.length >= 2
    - 相邻两格必须上下左右相邻（delta = ±1 或 ±MapX）
    - Index 内不能重复格子
    - Index 中每个 index 必须在有效范围内
  - **Rule C（可移动性校验）**:
    - 计算每条 Rope 的"下一格"（根据方向 D（头部朝向）和 H（头部））
    - 使用 H（头部，Index[0]）和 D（头部朝向）计算下一格：
      - D=1 上：H + MapX（y 增大）
      - D=2 下：H - MapX（y 减小）
      - D=3 右：H + 1（x 增大）
      - D=4 左：H - 1（x 减小）
    - 判定是否被挡：
      - 若 nextIndex 越界（<0 或 >= MapX*MapY） => 视为"可消/可动"（不被挡）
      - 若 nextIndex 在地图内 => 若 nextIndex 被任意 Rope 的 Index 占用（包括自己身体、也包括其他 Rope） => 被挡
      - 否则 => 不被挡
    - 关卡级判定：
      - 如果每一条 Rope 都被挡 => 报错
      - 只要存在一条不被挡 => 通过

- **JSON 格式**:
  ```json
  {
    "MapX": number,
    "MapY": number,
    "Rope": [
      {
        "D": number,
        "H": number,
        "Index": number[],
        "BendCount": number,
        "ColorIdx": number
      }
    ]
  }
  ```

- **输入**: levelData、onLevelDataLoad 回调
- **输出**: 按钮 UI 和文件操作事件

### 8. JSON 预览模块 (`src/modules/JsonPreview/`)

- **职责**:
  - 实时显示当前关卡数据的 JSON 格式
  - 支持复制 JSON 数据
  - 支持格式化显示

- **输入**: 关卡数据
- **输出**: JSON 预览 UI

### 9. 操作栏模块 (`src/modules/ActionsBar/`)

- **职责**:
  - 提供关卡编辑的常用操作按钮（保存、加载、清空、撤销/重做等）
  - 显示操作提示和状态信息

- **输入**: 关卡数据、各种操作回调函数
- **输出**: 操作栏 UI 和操作事件

### 10. 类型定义 (`src/types/`)

- **Level.ts**: 
  - 定义 `TileType` 枚举（瓦片类型）
  - 定义 `Level` 接口（关卡数据结构）
  - 定义 `LevelIO` 接口（导入导出结构）
  - 定义 `LevelData` 接口（最终 JSON 格式：MapX、MapY、Rope）
  - 定义 `RopeData` 接口（绳索数据：D、H、Index、BendCount、ColorIdx）

### 11. 共享工具 (`src/shared/`)

- **mockData.ts**: 提供默认的测试数据
- **utils.ts**: 通用工具函数（JSON 格式化、文件下载等）

## 当前状态

✅ **已完成**:
- 项目骨架搭建
- 目录结构模块化
- 类型定义（包括 LevelData、RopeData 完整字段）
- **模块1：关卡地图生成** ✅
  - MapGeneratorPanel：MapX/MapY 输入和步进器
  - GridCanvas：网格渲染和选择交互
  - selection.ts：选择逻辑封装
  - 支持单击、Ctrl 多选、拖拽框选
  - 显示每个格子的 index 编号
  - 选中格子高亮显示
- **模块2：Rope 路径编辑** ✅
  - RopeEditorPanel：Rope 列表、编辑模式控制、属性配置
  - ropeLogic.ts：路径追加/撤销、相邻校验、自动计算 D/H/BendCount
  - GridCanvas 集成：显示所有 Rope 路径、编辑模式响应
  - 支持按顺序点击编辑路径
  - 自动计算所有字段（D、H、Index、BendCount）
  - 属性配置（ColorIdx）
- **模块3：Rope 管理** ✅
  - RopeManagerPanel：管理面板（颜色/随机/删除）
  - ropeHitTest.ts：点击命中检测（支持多 Rope 命中处理）
  - ropeMutations.ts：数据变更纯函数（更新/删除）
  - GridCanvas 集成：点击 Rope 路径进入管理、高亮选中 Rope
  - 与模块2联动：编辑中禁止删除、允许修改属性
  - 实时更新：修改/删除立即反映到 JSON 预览
- **模块4：Rope 可视化（线段/箭头叠加）** ✅
  - RopeOverlay：SVG overlay 绘制线段和箭头
  - geometry.ts：坐标转换工具函数
  - GridCanvas 集成：叠加显示在网格上方
  - 红色线段连接相邻格子中心点
  - 箭头在末端指示方向
  - 显示/隐藏按钮（ActionsBar）
  - 选中 Rope 线条更粗
- **模块5：Rope 颜色池** ✅
  - colorPool.ts：集中管理颜色定义（-1, 1~10 映射，-1=无颜色）
  - RopeColorPicker：颜色选择器组件（色块预览 + 文本）
  - 模块2/模块3集成：替换 ColorIdx 输入为颜色选择器
  - 默认值：新 Rope 使用 ColorIdx = -1（无颜色）
  - 防呆：无效 ColorIdx 回退到默认值（-1）
  - 可扩展：修改 colorPool.ts 即可全局生效
- **模块6：JSON 关卡文件管理** ✅
  - LevelIOButtons：右上角按钮（生成/读取关卡）
  - validators.ts：3条校验规则（颜色、路径、可移动性）
  - io.ts：文件下载和读取功能
  - 生成关卡：校验通过后下载 JSON 文件
  - 读取关卡：文件选择器读取并加载关卡数据
  - 错误提示：友好的错误信息（面向零基础）
- 3 栏布局（左：地图生成器面板 + Rope 编辑器，中：网格画布，右：JSON 预览）
- 底部操作栏（导出功能已实现）
- JSON 预览实时显示 LevelData（包含完整 Rope 字段）
- 当 MapX/MapY 改变时自动重置 selectedIndices

🚧 **待实现**:
- 其他模块的具体功能实现
- 操作栏的保存/加载/导入功能

## 技术栈

- **React 18**: UI 框架
- **Vite 5**: 构建工具
- **TypeScript**: 类型系统
- **CSS**: 样式（未使用 CSS-in-JS，保持简单）

## 开发说明

- 状态管理：使用 React `useState` + props 传递，未引入复杂状态库
- 代码风格：每个模块都有详细的注释说明职责、输入输出
- 扩展性：模块化设计，便于后续逐个补充功能

## 开发者自检说明

### D（头部朝向）和 H（头部）字段计算验证

- **H（头部）**：表示 Rope 路径的头部格子，等于 `Index[0]`（最先点击的格子）
- **D（头部朝向）**：表示 Rope 的头部朝向，与第一段移动方向相反

验证示例（MapX=5，左下角原点，y 向上递增）：

- **竖直向上路径**：`[27,22,17]`（依次点击，向下移动）
  - 第一段：`27→22`，delta = -5 = -MapX，方向 = 下(2)
  - 预期结果：`H = 27`，`D = 上(1)`（头部朝向，与移动方向相反）
  - 箭头出现在 27 且朝上

- **水平向右路径**：`[0,1,2]`（向右移动）
  - 第一段：`0→1`，delta = +1，方向 = 右(3)
  - 预期结果：`H = 0`，`D = 左(4)`（头部朝向，与移动方向相反）
  - 箭头出现在 0 且朝左

验证方法：在编辑器中创建上述路径，检查 JSON 预览中的 H 和 D 值是否符合预期，并确认箭头显示在头部格子 H 且方向按 D。

## 许可证

MIT

