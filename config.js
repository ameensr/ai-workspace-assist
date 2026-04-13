// Application Configuration
window.appConfig = {
    geminiApiKey: typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : "YOUR_API_KEY_HERE",  // Set in Vercel dashboard

    users: [
        {
            email: "testqa121@gmail.com",
            password: "testqa"
        }
        // Future users can be added here
    ],
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
