// Application Configuration
window.appConfig = Object.assign(
    {
        // IMPORTANT: Do not commit real credentials.
        // These values are intended to be injected at runtime from the server (see `server.js` + `.env`).
        supabaseUrl: "https://gdongikpqjvsgpqsrhay.supabase.co",
        supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdkb25naWtwcWp2c2dwcXNyaGF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNDA3MDUsImV4cCI6MjA5MTgxNjcwNX0.RhsQYyWQTfLJ6q3XnJTFBy-MkRSORJ1tENFjUaqedBw",

        // AI settings
        geminiEnabled: false, // Set true only when using the server proxy endpoint.
        testMode: true,
        fallbackToMockOnApiError: true,

        developer: {
            name: "Ameen Huzain",
            portfolioUrl: "https://ameensr.github.io/ameenqa_portfolio/"
        },
        footer: {
            text: "&copy; 2026 Qaly &bull; Where AI meets QA, Built with <span class='heart'>&hearts;</span> by Ameen Huzain",
            link: "https://www.linkedin.com/in/ameensr/", // Example link
            enableLink: true
        }
    },
    // Optional runtime injection (served by `server.js`):
    // window.RUNTIME_APP_CONFIG = { supabaseUrl, supabaseAnonKey, geminiEnabled, testMode, ... }
    (typeof window !== 'undefined' && window.RUNTIME_APP_CONFIG) ? window.RUNTIME_APP_CONFIG : {}
);

// Export if in a module environment, otherwise global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = appConfig;
}
