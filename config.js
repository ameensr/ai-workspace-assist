// Application Configuration
const appConfig = {
    users: [
        {
            email: "testqa121@gmail.com",
            password: "testqa"
        }
        // Future users can be added here
    ]
};

// Export if in a module environment, otherwise global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = appConfig;
}
