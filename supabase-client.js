// supabase-client.js - shared Supabase client bootstrap
(function initSupabaseClient() {
    const config = window.appConfig || {};
    const url = config.supabaseUrl;
    const anonKey = config.supabaseAnonKey;

    const hasSupabaseGlobal = typeof window.supabase !== 'undefined';
    const isConfigured = url && anonKey &&
        url !== "YOUR_SUPABASE_URL_HERE" &&
        anonKey !== "YOUR_SUPABASE_ANON_KEY_HERE";

    if (!hasSupabaseGlobal || !isConfigured) {
        window.supabaseClient = null;
        return;
    }

    window.supabaseClient = window.supabase.createClient(url, anonKey);
})();
