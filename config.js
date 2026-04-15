// Application Configuration
window.appConfig = {
    geminiApiKey: typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : "YOUR_API_KEY_HERE",  // Set in Vercel dashboard
    supabaseUrl: typeof process !== 'undefined' ? process.env.SUPABASE_URL : "https://gdongikpqjvsgpqsrhay.supabase.co",
    supabaseAnonKey: typeof process !== 'undefined' ? process.env.SUPABASE_ANON_KEY : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdkb25naWtwcWp2c2dwcXNyaGF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNDA3MDUsImV4cCI6MjA5MTgxNjcwNX0.RhsQYyWQTfLJ6q3XnJTFBy-MkRSORJ1tENFjUaqedBw",
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

// Export if in a module environment, otherwise global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = appConfig;
}
