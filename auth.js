// Authentication Logic
function login(email, password) {
    if (typeof appConfig === 'undefined') {
        console.error("Configuration file (config.js) not found.");
        return false;
    }

    const user = appConfig.users.find(u => u.email === email && u.password === password);
    
    if (user) {
        localStorage.setItem('qa_assist_auth', 'true');
        localStorage.setItem('qa_assist_user', email);
        return true;
    }
    return false;
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
    if (!isAuthenticated() && !window.location.pathname.endsWith('login.html')) {
        window.location.href = 'login.html';
    }
}

// Make functions global
window.login = login;
window.logout = logout;
window.isAuthenticated = isAuthenticated;

console.log("Auth.js initialized at " + new Date().toLocaleTimeString());

// Automatically check auth on include
if (!window.location.pathname.endsWith('login.html')) {
    checkAuthRedirect();

    // Attach logout via delegation (more robust)
    document.addEventListener('click', (e) => {
        const logoutBtn = e.target.closest('#logout-btn');
        if (logoutBtn) {
            console.log("Logout triggered through delegated click listener");
            e.preventDefault();
            logout();
        }
    });

    // Also check for the button immediately
    const btn = document.getElementById('logout-btn');
    if (btn) {
        console.log("Logout button verified in DOM at script runtime");
    } else {
        console.warn("Logout button not found at script runtime (might load later)");
    }
}
