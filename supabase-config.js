/**
 * Supabase 配置
 * 部署到 Netlify 前：请将下面的 URL 和 anon key 替换为你的 Supabase 项目值
 * 获取方式：Supabase Dashboard → Project Settings → API
 *
 * Netlify 环境变量注入（可选）：
 * 在 Netlify 构建命令中添加脚本，将 SUPABASE_URL、SUPABASE_ANON_KEY 注入到此文件
 */
(function() {
    // 优先从 Netlify 注入的全局变量读取（构建时可选注入）
    window.SUPABASE_URL = window.SUPABASE_URL || 'https://your-project.supabase.co';
    window.SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'your-anon-key';
})();
