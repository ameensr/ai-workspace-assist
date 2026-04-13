// auth.js - Browser compatible authentication logic
// Removed Node.js modules (jwt, bcrypt) for frontend compatibility

function login(email, password) {
    const config = window.appConfig || (typeof appConfig !== 'undefined' ? appConfig : null);
    
    if (!config) {
        console.error("Configuration not loaded!");
        return false;
    }

    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPassword = (password || "").trim();

    console.log("Attempting login for:", cleanEmail);

    // Check against hardcoded users in config.js
    const user = config.users.find(u => 
        u.email.trim().toLowerCase() === cleanEmail && 
        u.password.trim() === cleanPassword
    );
    
    if (user) {
        console.log("Login successful for:", email);
        localStorage.setItem('qa_assist_auth', 'true');
        localStorage.setItem('qa_assist_user', JSON.stringify({ email: user.email }));
        return true;
    } else {
        console.warn("Invalid credentials for:", email);
        return false;
    }
}

function logout() {
    console.log("Logout triggered");
    localStorage.removeItem('qa_assist_auth');
    localStorage.removeItem('qa_assist_user');
    window.location.href = 'login.html';
}

function isAuthenticated() {
    return localStorage.getItem('qa_assist_auth') === 'true';
}

function checkAuthRedirect() {
    const isLoginPage = window.location.pathname.endsWith('login.html') || window.location.pathname.endsWith('signup.html');
    
    if (!isAuthenticated() && !isLoginPage) {
        window.location.href = 'login.html';
    } else if (isAuthenticated() && isLoginPage) {
        window.location.href = 'index.html';
    }
}

// Make functions global for access from HTML
window.login = login;
window.logout = logout;
window.isAuthenticated = isAuthenticated;

// Automatically check auth on include
document.addEventListener('DOMContentLoaded', () => {
    checkAuthRedirect();

    // Attach logout via delegation
    document.addEventListener('click', (e) => {
        const logoutBtn = e.target.closest('#logout-btn') || e.target.closest('[href="login.html"]');
        if (logoutBtn && isAuthenticated()) {
            // Only capture if it's explicitly a logout action
            if (logoutBtn.textContent.toLowerCase().includes('logout') || logoutBtn.id === 'logout-btn') {
                e.preventDefault();
                logout();
            }
        }
    });
});

console.log("Auth module initialized.");
