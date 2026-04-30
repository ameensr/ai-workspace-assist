/**
 * Code Typing Animation Engine
 * Specifically designed for the Login page background.
 */

const QA_SNIPPETS = [
    "// Initializing AI workspace...",
    "await provider.connect('qaly-v2');",
    "analyzing 'requirement_spec_001'...",
    "checking for logical gaps in flow...",
    "Test Passed ✅",
    "inspecting component 'login_form'...",
    "expect(button.label).toBe('Sign In');",
    "Test Passed ✅",
    "Bug Found ❌ - selector 'email_input' is not persistent",
    "fixing DOM reference leak...",
    "Test Passed ✅",
    "running regression suite 'core-logic'...",
    "checking 'auth_token' expiration logic...",
    "Test Passed ✅",
    "const report = await ai.analyze(bug_data);",
    "Bug Found ❌ - unexpected 401 on valid retry",
    "generating fix suggestion...",
    "assert(response.body.success === true);",
    "Test Passed ✅",
    "optimizing test throughput...",
    "scanning 'user_story_auth' for missing cases...",
    "Bug Found ❌ - password recovery flow is missing edge cases",
    "Test Passed ✅"
];

class CodeTypingEngine {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentSnippetIndex = 0;
        this.currentCharIndex = 0;
        this.typingSpeed = 40; // ms per character
        this.lineDelay = 1200; // ms between lines
        this.maxLines = 15;
        this.lines = [];

        this.initStyles();
        this.startTyping();
    }

    initStyles() {
        this.container.style.fontFamily = "'JetBrains Mono', 'Roboto Mono', monospace";
        this.container.style.fontSize = "14px";
        this.container.style.lineHeight = "1.8";
        this.container.style.color = "rgba(148, 163, 184, 0.4)";
        this.container.style.padding = "40px";
        this.container.style.pointerEvents = "none";
        this.container.style.whiteSpace = "pre";
    }

    createLineElement(content) {
        const line = document.createElement('div');
        line.style.marginBottom = "4px";
        line.style.opacity = "0";
        line.style.transition = "opacity 0.3s ease";

        let processedContent = content;
        if (content.includes("Test Passed ✅")) {
            line.style.color = "#4ade80"; // Bright green
            line.style.textShadow = "0 0 10px rgba(74, 222, 128, 0.5)";
            line.style.fontWeight = "700";
        } else if (content.includes("Bug Found ❌")) {
            line.style.color = "#f87171"; // Bright red
            line.style.textShadow = "0 0 10px rgba(248, 113, 113, 0.5)";
            line.style.fontWeight = "700";
        } else if (content.startsWith("//")) {
            line.style.color = "rgba(100, 116, 139, 0.8)"; // Muted comment
        }

        return line;
    }

    async startTyping() {
        while (true) {
            const snippet = QA_SNIPPETS[Math.floor(Math.random() * QA_SNIPPETS.length)];
            const lineElement = this.createLineElement(snippet);
            this.container.appendChild(lineElement);
            this.lines.push(lineElement);

            // Fade in line and type
            lineElement.style.opacity = "1";

            for (let i = 0; i <= snippet.length; i++) {
                lineElement.textContent = "> " + snippet.substring(0, i) + (i < snippet.length ? "_" : "");
                await new Promise(r => setTimeout(r, this.typingSpeed + Math.random() * 20));
            }

            // Cleanup old lines
            if (this.lines.length > this.maxLines) {
                const oldLine = this.lines.shift();
                oldLine.style.opacity = "0";
                setTimeout(() => oldLine.remove(), 300);
            }

            await new Promise(r => setTimeout(r, this.lineDelay));
        }
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    new CodeTypingEngine('code-bg');
});
