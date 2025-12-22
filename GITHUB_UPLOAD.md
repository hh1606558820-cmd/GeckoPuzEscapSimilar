# GitHub 上传指南

本指南将帮助你将项目上传到 GitHub。

## 📋 前置准备

1. **安装 Git**（如果还没有）
   - 下载：https://git-scm.com/downloads
   - 安装后验证：`git --version`

2. **创建 GitHub 账号**（如果还没有）
   - 注册：https://github.com/signup

3. **配置 Git 用户信息**（首次使用需要）
   ```bash
   git config --global user.name "你的名字"
   git config --global user.email "你的邮箱"
   ```

## 🚀 上传步骤

### 步骤 1：提交当前更改

项目已经初始化了 Git 仓库，需要先提交所有更改：

```bash
# 查看当前状态
git status

# 添加所有更改的文件
git add .

# 提交更改
git commit -m "初始提交：关卡编辑器项目"
```

### 步骤 2：在 GitHub 创建仓库

1. **登录 GitHub**
   - 访问 https://github.com
   - 登录你的账号

2. **创建新仓库**
   - 点击右上角的 `+` 号 → `New repository`
   - 填写仓库信息：
     - **Repository name**: `GeckoPuzEscapSimilar`（或你喜欢的名字）
     - **Description**: `关卡编辑器 - Level Editor`（可选）
     - **Visibility**: 选择 `Public`（公开）或 `Private`（私有）
     - **不要**勾选 "Initialize this repository with a README"（因为本地已有代码）
   - 点击 `Create repository`

3. **复制仓库地址**
   - 创建后会显示仓库页面
   - 复制 HTTPS 或 SSH 地址，例如：
     - HTTPS: `https://github.com/你的用户名/GeckoPuzEscapSimilar.git`
     - SSH: `git@github.com:你的用户名/GeckoPuzEscapSimilar.git`

### 步骤 3：连接本地仓库到 GitHub

```bash
# 添加远程仓库（使用 HTTPS，推荐）
git remote add origin https://github.com/你的用户名/GeckoPuzEscapSimilar.git

# 或者使用 SSH（如果已配置 SSH 密钥）
# git remote add origin git@github.com:你的用户名/GeckoPuzEscapSimilar.git

# 验证远程仓库
git remote -v
```

### 步骤 4：推送到 GitHub

```bash
# 推送代码到 GitHub（首次推送）
git push -u origin main

# 如果遇到分支名问题，可能需要使用 master
# git push -u origin master
```

**注意**：如果提示需要身份验证：
- **HTTPS**: 输入 GitHub 用户名和 Personal Access Token（不是密码）
  - 创建 Token：GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token
  - 权限选择：至少勾选 `repo`
- **SSH**: 需要先配置 SSH 密钥

### 步骤 5：验证上传

1. 刷新 GitHub 仓库页面
2. 应该能看到所有文件已经上传
3. 可以查看代码、提交历史等

## 🔄 后续更新

以后每次修改代码后，使用以下命令更新 GitHub：

```bash
# 查看更改
git status

# 添加更改的文件
git add .

# 提交更改
git commit -m "描述你的更改"

# 推送到 GitHub
git push
```

## 📝 常用 Git 命令

```bash
# 查看状态
git status

# 查看提交历史
git log

# 查看远程仓库
git remote -v

# 拉取远程更新
git pull

# 创建新分支
git checkout -b 分支名

# 切换分支
git checkout 分支名
```

## ⚠️ 注意事项

1. **不要提交敏感信息**
   - 检查 `.gitignore` 文件，确保 `node_modules`、`dist` 等目录已被忽略
   - 不要提交 API 密钥、密码等敏感信息

2. **提交信息要清晰**
   - 使用有意义的提交信息，例如：
     - `修复：修复箭头方向问题`
     - `功能：添加离线打包支持`
     - `优化：改进性能`

3. **定期推送**
   - 建议经常推送代码，避免本地丢失

## 🆘 常见问题

### Q: 推送时提示 "remote: Support for password authentication was removed"
A: GitHub 不再支持密码认证，需要使用 Personal Access Token 或 SSH 密钥。

### Q: 如何创建 Personal Access Token？
A: 
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token (classic)
3. 选择权限（至少勾选 `repo`）
4. 生成后复制 Token（只显示一次）
5. 推送时使用 Token 作为密码

### Q: 如何配置 SSH 密钥？
A:
1. 生成 SSH 密钥：`ssh-keygen -t ed25519 -C "你的邮箱"`
2. 复制公钥：`cat ~/.ssh/id_ed25519.pub`（Windows: `type %USERPROFILE%\.ssh\id_ed25519.pub`）
3. GitHub → Settings → SSH and GPG keys → New SSH key
4. 粘贴公钥并保存

### Q: 推送时提示 "failed to push some refs"
A: 可能是远程仓库有本地没有的提交，先拉取：`git pull origin main --rebase`，然后再推送。

### Q: 如何删除远程仓库连接？
A: `git remote remove origin`

### Q: 如何更改远程仓库地址？
A: `git remote set-url origin 新的仓库地址`

## 🔗 相关资源

- [Git 官方文档](https://git-scm.com/doc)
- [GitHub 帮助文档](https://docs.github.com/zh)
- [Git 教程](https://www.liaoxuefeng.com/wiki/896043488029600)

