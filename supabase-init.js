/**
 * Supabase 客户端初始化
 */
(function() {
    const SUPABASE_URL = 'https://hsgvzrnvahkeujragiaz.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_sshwQph2PwOgFgbsUdbcJQ_FIrwTCvD';

    try {
        if (typeof supabase !== 'undefined' && SUPABASE_URL && SUPABASE_ANON_KEY) {
            window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        }
    } catch (e) {
        console.warn('Supabase init:', e);
    }
})();
