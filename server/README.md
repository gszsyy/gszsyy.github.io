# 本机审核发布后端

这个服务常驻在你的电脑上，负责把网页里的本机草稿项目发布到 `gszsyy/gszsyy.github.io`。

前端页面不再保存 GitHub Token；Token 只放在本机 `server/.env`。

## 1. 配置

创建 `server/.env`：

```bash
HOST=0.0.0.0
PORT=8787
GITHUB_OWNER=gszsyy
GITHUB_REPO=gszsyy.github.io
GITHUB_BRANCH=main
GITHUB_TOKEN=你的 GitHub fine-grained token
PUBLISH_PASSWORD=你设置的发布密码
ALLOWED_ORIGIN=https://gszsyy.github.io
```

Token 权限要求：

- Fine-grained personal access token
- Repository access: only select repositories，选择 `gszsyy.github.io`
- Permissions: Contents = Read and write
- Metadata 保持 Read-only

## 2. 手动启动

```bash
node server/publish-server.js
```

健康检查：

```bash
curl http://127.0.0.1:8787/health
```

## 3. 常驻启动

```bash
mkdir -p ~/.config/systemd/user
cp server/publish-server.service ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now publish-server.service
systemctl --user status publish-server.service
```

如果需要开机后无人登录也运行用户服务：

```bash
loginctl enable-linger "$USER"
```

## 4. 前端使用

项目详情页里填：

- 发布服务地址：`http://10.40.92.74:8787`
- 发布密码：`server/.env` 中的 `PUBLISH_PASSWORD`

点击“审核发布”后，后端会自动：

1. 检查项目字段完整性。
2. 创建 `/projects/项目ID/index.html`。
3. 更新 `assets/projects.json`。
4. 提交到 GitHub Pages 仓库。
