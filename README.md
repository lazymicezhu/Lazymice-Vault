# Lazymice-Vault

一个纯前端的本地/线上媒体归档浏览页，用 `data.js` 渲染目录树，支持音视频预览与下载。

## 项目结构

- `index.html`：页面入口
- `styles.css`：样式
- `app.js`：目录渲染、预览与下载逻辑
- `data.js`：静态目录数据
- `config.js`：本地/云端资源地址配置

## 本地运行

```bash
cd /Users/lazymice/Desktop/Lazymice-Vault
python3 -m http.server 5500
```

浏览器打开 `http://127.0.0.1:5500`。

## 媒体来源规则

- 本地开发（`localhost/127.0.0.1/file:`）优先使用 `./local-media`
- 若本地不可用，自动回退到 `window.ASSET_BASE_URL`（OSS）
- 线上（GitHub Pages）默认仅使用 OSS

## GitHub Pages 说明

- 不要把 `local-media` 软链接提交到远端（已在 `.gitignore` 忽略）
- Pages 无法访问你电脑本地文件，只能访问线上可公开资源
- 若媒体 404，请检查 OSS 对应对象是否已上传且路径与 `data.js` 一致
