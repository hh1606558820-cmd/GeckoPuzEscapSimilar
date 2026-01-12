# 🚀 快速部署指南

## 最简单的方法（推荐新手）

### 方法 1: Netlify（3 分钟搞定）

1. 构建项目：
   ```bash
   npm install
   npm run build
   ```

2. 访问 [netlify.com](https://www.netlify.com) 注册登录

3. 点击 "Add new site" → "Deploy manually"

4. 将 `dist` 文件夹拖拽到页面上

5. 完成！你会得到一个网址，比如 `https://your-site.netlify.app`

---

### 方法 2: Vercel（2 分钟搞定）

1. 访问 [vercel.com](https://vercel.com) 注册登录

2. 点击 "Add New Project"

3. 连接你的 GitHub 仓库（如果没有，可以先用上面的方法上传代码）

4. 点击 "Deploy"，Vercel 会自动构建

5. 完成！你会得到一个网址

---

### 方法 3: GitHub Pages（需要 GitHub 账号）

1. 将代码推送到 GitHub

2. 进入仓库 Settings → Pages

3. Source 选择 "GitHub Actions"

4. 推送到 `main` 分支，会自动部署

5. 访问 `https://你的用户名.github.io/仓库名/`

---

## 本地测试

在分享给别人之前，可以先在本地测试：

### Windows:
```bash
# 双击运行
serve.bat
```

### 或手动运行:
```bash
npm run build
npm run preview
```

然后在浏览器访问 `http://localhost:5173`

---

## 推荐流程

1. ✅ **本地测试**：运行 `serve.bat` 确保一切正常
2. ✅ **选择平台**：Netlify 或 Vercel（最简单）
3. ✅ **部署**：按照上面的步骤操作
4. ✅ **分享链接**：把得到的网址分享给其他人

---

## 需要帮助？

查看 `DEPLOY.md` 获取详细的部署说明和故障排除。














