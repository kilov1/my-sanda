# MY SANDA 校园论坛 - GitHub Pages 部署版

本版本专为 GitHub Pages 优化，**无 base 标签**、**无 Supabase CDN**，避免 404 与 Tracking Prevention 问题。

## 部署步骤

1. **在 GitHub 创建仓库**（如 `my-sanda`）
2. **上传本目录所有文件**到仓库根目录，确保结构为：
   ```
   my-sanda/
   ├── index.html
   ├── 404.html
   ├── css/
   │   └── style.css
   └── js/
       ├── local-api.js
       ├── supabase-api.js
       ├── content-filter.js
       ├── home-carousel.js
       ├── materials.js
       ├── campus-life.js
       ├── community-data.js
       ├── community.js
       ├── my-posts.js
       ├── feedback.js
       ├── profile.js
       └── app.js
   ```
3. **开启 GitHub Pages**：Settings → Pages → Source 选 `main` 分支
4. 访问：`https://你的用户名.github.io/my-sanda/`

## 功能说明

- 纯前端、纯本地模式，数据存于 localStorage
- 假邮箱登录：任意格式即可注册、登录、找回密码
- 示例内容：校园生活、学习资料、失物招领等均含示例数据
- 动画与样式与原版一致

## 资源路径

- 所有资源使用相对路径 `./css/`、`./js/`
- 不再使用 base 标签，避免 GitHub Pages 子路径下的 404
- 未使用 Supabase CDN，避免浏览器 Tracking Prevention 拦截
