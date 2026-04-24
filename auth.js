// auth.js - Supabase authentication logic
const AUTH_PAGES = ['login.html', 'signup.html', 'reset-password.html'];
const DEFAULT_ROLE = 'user';

function getCurrentPageName() {
    const path = window.location.pathname;
    return path.substring(path.lastIndexOf('/') + 1) || 'index.html';
}

function redirectToLoginIfProtectedPage() {
    const page = getCurrentPageName();
    if (!AUTH_PAGES.includes(page)) {
        window.location.href = 'login.html';
    }
}

function getSupabaseClient() {
    if (!window.supabaseClient) {
        throw new Error('Supabase is not configured. Add SUPABASE_URL and SUPABASE_ANON_KEY in config.js.');
    }
    return window.supabaseClient;
}

async function login(email, password) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
        email: (email || '').trim().toLowerCase(),
        password: (password || '').trim()
    });

    if (error) {
        throw error;
    }

    // Enforce email verification (Supabase must have "Confirm email" enabled).
    // If email is not confirmed, immediately sign out to prevent access.
    const confirmedAt = data?.user?.email_confirmed_at || data?.user?.confirmed_at;
    if (!confirmedAt) {
        await supabase.auth.signOut({ scope: 'local' });
        const err = new Error('Please verify your email before signing in.');
        err.code = 'EMAIL_NOT_VERIFIED';
        throw err;
    }

    const profileName = data?.user?.user_metadata?.full_name;
    const fallbackName = (data?.user?.email || '').split('@')[0];
    const username = (profileName || fallbackName || 'User').trim();
    localStorage.setItem('username', username);
    await syncUserRole(data?.user?.id);

    return true;
}

async function signup(email, password, fullName) {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signUp({
        email: (email || '').trim().toLowerCase(),
        password: (password || '').trim(),
        options: {
            data: {
                full_name: (fullName || '').trim()
            }
        }
    });

    if (error) {
        throw error;
    }

    const username = ((fullName || '').trim() || (email || '').split('@')[0] || 'User').trim();
    localStorage.setItem('username', username);
    localStorage.setItem('user_role', DEFAULT_ROLE);

    return true;
}

async function requestPasswordReset(email) {
    const supabase = getSupabaseClient();
    const safeEmail = (email || '').trim().toLowerCase();
    if (!safeEmail) {
        throw new Error('Please enter your email address.');
    }

    const redirectTo = `${window.location.origin}/reset-password.html`;
    const { error } = await supabase.auth.resetPasswordForEmail(safeEmail, { redirectTo });
    if (error) {
        throw error;
    }
    return true;
}

async function updatePassword(newPassword) {
    const supabase = getSupabaseClient();
    const password = (newPassword || '').trim();
    if (password.length < 6) {
        throw new Error('Password must be at least 6 characters.');
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
        throw error;
    }
    return true;
}

async function syncUserRole(userId) {
    const supabase = getSupabaseClient();
    if (!userId) {
        localStorage.setItem('user_role', DEFAULT_ROLE);
        return DEFAULT_ROLE;
    }

    const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

    if (error || !data?.role) {
        localStorage.setItem('user_role', DEFAULT_ROLE);
        return DEFAULT_ROLE;
    }

    const role = data.role === 'admin' ? 'admin' : DEFAULT_ROLE;
    localStorage.setItem('user_role', role);
    return role;
}

function getCurrentUserRole() {
    const role = (localStorage.getItem('user_role') || DEFAULT_ROLE).toLowerCase();
    return role === 'admin' ? 'admin' : DEFAULT_ROLE;
}

async function logout() {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    const isSessionMissing = error && /session|jwt|not found|missing/i.test(error.message || '');
    if (error && !isSessionMissing) {
        throw error;
    }

    localStorage.removeItem('username');
    localStorage.removeItem('user_role');
    localStorage.removeItem('qa_assist_auth');
    localStorage.removeItem('qa_assist_user');
    window.location.href = 'login.html';
}

async function getCurrentSession() {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getSession();
    if (error) {
        throw error;
    }
    return data.session;
}

async function isAuthenticated() {
    const session = await getCurrentSession();
    return Boolean(session);
}

async function checkAuthRedirect() {
    const page = getCurrentPageName();
    const isAuthPage = AUTH_PAGES.includes(page);
    const session = await getCurrentSession();

    if (!session && !isAuthPage) {
        window.location.href = 'login.html';
        return;
    }

    if (session && isAuthPage && page !== 'reset-password.html') {
        window.location.href = 'index.html';
    }
}

function initLogoutDelegation() {
    document.addEventListener('click', async (e) => {
        const logoutBtn = e.target.closest('#logout-btn') ||
            e.target.closest('#header-logout-btn') ||
            e.target.closest('[href="login.html"]');
        if (!logoutBtn) return;

        const text = (logoutBtn.textContent || '').toLowerCase();
        if (logoutBtn.id !== 'logout-btn' && !text.includes('logout')) return;

        e.preventDefault();
        try {
            await logout();
        } catch (error) {
            console.error('Logout failed:', error.message);
        }
    });
}

window.login = login;
window.signup = signup;
window.requestPasswordReset = requestPasswordReset;
window.updatePassword = updatePassword;
window.logout = logout;
window.isAuthenticated = isAuthenticated;
window.getCurrentSession = getCurrentSession;
window.syncUserRole = syncUserRole;
window.getCurrentUserRole = getCurrentUserRole;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await checkAuthRedirect();
        const session = await getCurrentSession();
        if (session?.user?.id) {
            await syncUserRole(session.user.id);
        }
    } catch (error) {
        console.error('Auth initialization failed:', error.message);
        // Fail closed: if auth bootstrap fails on protected pages, force login.
        redirectToLoginIfProtectedPage();
    }

    // Keep UI safe on session expiry / logout in other tabs.
    try {
        const supabase = getSupabaseClient();
        supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_OUT') {
                localStorage.removeItem('username');
                localStorage.removeItem('user_role');
            }
        });
    } catch (_) { }

    initLogoutDelegation();
});
