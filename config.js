// Application Configuration
const appConfig = {
    geminiApiKey: "AIzaSyBOnFpM9n4yygf9DnG0m1AFjQs4VxD3sYg", // Paste your Gemini API Key here
    users: [
        {
            email: "testqa121@gmail.com",
            password: "testqa"
        }
        // Future users can be added here
    ],
    footer: {
        text: "&copy; 2026 Qaly &bull; Where AI meets QA, Built with <span class='heart'>&hearts;</span> by Ameen Huzain",
        link: "https://www.linkedin.com/in/ameen-huzain-qa/", // Example link
        enableLink: true
    }
};

// Export if in a module environment, otherwise global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = appConfig;
}
