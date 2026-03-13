/**
 * Supabase 客户端初始化
 * 当 supabase-config.js 中配置了有效的 URL 和 anon key 时连接 Supabase
 * 否则使用本地 localStorage 模式
 */
(function() {
    var url = (window.SUPABASE_URL || '').trim();
    var key = (window.SUPABASE_ANON_KEY || '').trim();
    var isPlaceholder = !url || !key || url === 'https://your-project.supabase.co' || key === 'your-anon-key';

    if (isPlaceholder) {
        window.supabaseClient = null;
        return;
    }

    try {
        if (typeof supabase === 'undefined') {
            window.supabaseClient = null;
            return;
        }
        window.supabaseClient = supabase.createClient(url, key);
    } catch (e) {
        console.warn('Supabase init error:', e);
        window.supabaseClient = null;
    }
})();
