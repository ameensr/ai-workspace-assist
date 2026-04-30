// Application Configuration
const baseConfig = {
    // IMPORTANT: Do not commit real credentials.
    // These values are intended to be injected at runtime from the server (see `server.js` + `.env`).
    supabaseUrl: "https://gdongikpqjvsgpqsrhay.supabase.co",
    supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdkb25naWtwcWp2c2dwcXNyaGF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNDA3MDUsImV4cCI6MjA5MTgxNjcwNX0.RhsQYyWQTfLJ6q3XnJTFBy-MkRSORJ1tENFjUaqedBw",

    // AI settings
    aiServiceEnabled: false, // True when server has any live AI provider configured.
    testMode: true,
    fallbackToMockOnApiError: true,

    // Session & Security Configuration
    session: {
        idleTimeout: 300, // Idle timeout in seconds (5 minutes)
        warningTime: 60   // Show warning X seconds before logout (1 minute)
    },

    developer: {
        name: "Ameen Huzain",
        portfolioUrl: "https://ameensr.github.io/ameenqa_portfolio/"
    },
    footer: {
        text: "&copy; 2026 Qaly &bull; Where AI meets QA, Built with <span class='heart'>&hearts;</span> by Ameen Huzain",
        link: "https://www.linkedin.com/in/ameensr/", // Example link
        enableLink: true
    }
};

const runtimeConfig = (typeof window !== 'undefined' && window.RUNTIME_APP_CONFIG) ? window.RUNTIME_APP_CONFIG : {};

const mergedConfig = {
    ...baseConfig,
    ...runtimeConfig
};

// Prevent empty runtime values from wiping configured Supabase credentials.
if (!runtimeConfig.supabaseUrl && baseConfig.supabaseUrl) {
    mergedConfig.supabaseUrl = baseConfig.supabaseUrl;
}
if (!runtimeConfig.supabaseAnonKey && baseConfig.supabaseAnonKey) {
    mergedConfig.supabaseAnonKey = baseConfig.supabaseAnonKey;
}

// Apply persisted appearance theme globally for all pages.
(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const theme = (localStorage.getItem('qaly_theme') || 'light').toLowerCase() === 'dark' ? 'dark' : 'light';
    const html = document.documentElement;
    const body = document.body;
    html.classList.remove('light', 'dark');
    html.classList.add(theme);
    if (body) {
        body.classList.toggle('dark', theme === 'dark');
        body.classList.toggle('bg-slate-900', theme === 'dark');
    }
})();

window.appConfig = mergedConfig;

// Export if in a module environment, otherwise global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = mergedConfig;
}
