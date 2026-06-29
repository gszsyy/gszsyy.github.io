# 多面码SDK联合开发专项群

这是给 GitHub Pages 托管的独立静态周报页。

- GitHub 仓库：<https://github.com/gszsyy/gszsyy.github.io>
- GitHub Pages：<https://gszsyy.github.io/>
- 页面标题：多面码SDK联合开发专项群
- 访问用户名：`gszsyy`
- 访问密码：`gszsyy1234`
- 周报内容不读取本地 `http://10.40.92.74:8092/` 的 SQLite 或上传文件
- 浏览器内编辑内容保存在当前浏览器 `localStorage`
- `下载 PDF` 使用浏览器端 `html2canvas + jsPDF`，CDN 不可用时退化到浏览器打印保存 PDF

## 本地预览

```bash
python3 -m http.server 8088
```

然后打开 `http://127.0.0.1:8088/`。

## GitHub Pages 部署

```bash
git push
```

仓库推送后，`.github/workflows/pages.yml` 会把 `main` 分支根目录发布到 GitHub Pages。

> 注意：GitHub Pages 是静态托管，不能提供真正的服务端 Basic Auth。当前用户名/密码是客户端访问门，适合阻挡随手访问，不适合存放敏感内容。
