/**
 * Idle Timeout Security Manager
 * Automatically logs out users after configured period of inactivity
 * Features:
 * - Configurable timeout from config.js
 * - Warning popup before logout
 * - Multi-tab synchronization
 * - Activity tracking (mouse, keyboard, scroll, click)
 */

class IdleTimeoutManager {
    constructor() {
        this.config = this.getConfig();
        this.idleTimer = null;
        this.warningTimer = null;
        this.lastActivity = Date.now();
        this.isWarningShown = false;
        this.warningModal = null;
        this.countdownInterval = null;
        
        // Storage keys for multi-tab sync
        this.STORAGE_KEYS = {
            LAST_ACTIVITY: 'qaly_last_activity',
            LOGOUT_TRIGGER: 'qaly_logout_trigger',
            ACTIVITY_PING: 'qaly_activity_ping'
        };

        // Events to track for user activity
        this.ACTIVITY_EVENTS = [
            'mousedown',
            'mousemove',
            'keypress',
            'scroll',
            'touchstart',
            'click'
        ];

        this.init();
    }

    /**
     * Get configuration from config.js
     */
    getConfig() {
        const appConfig = window.appConfig || {};
        const sessionConfig = appConfig.session || {};
        
        return {
            idleTimeout: (sessionConfig.idleTimeout || 300) * 1000, // Convert to milliseconds
            warningTime: (sessionConfig.warningTime || 60) * 1000,  // Convert to milliseconds
            enabled: true
        };
    }

    /**
     * Initialize idle timeout manager
     */
    init() {
        // Only run on authenticated pages
        if (!this.isAuthenticatedPage()) {
            return;
        }

        console.log('🔒 Idle Timeout Manager initialized', {
            idleTimeout: `${this.config.idleTimeout / 1000}s`,
            warningTime: `${this.config.warningTime / 1000}s`
        });

        this.setupActivityListeners();
        this.setupStorageListener();
        this.startIdleTimer();
        this.syncLastActivity();
    }

    /**
     * Check if current page requires authentication
     */
    isAuthenticatedPage() {
        const page = window.location.pathname.split('/').pop();
        const authPages = ['login.html', 'signup.html', 'reset-password.html'];
        return !authPages.includes(page);
    }

    /**
     * Setup activity event listeners
     */
    setupActivityListeners() {
        this.ACTIVITY_EVENTS.forEach(event => {
            document.addEventListener(event, this.handleActivity.bind(this), { passive: true });
        });
    }

    /**
     * Setup localStorage listener for multi-tab sync
     */
    setupStorageListener() {
        window.addEventListener('storage', (e) => {
            // Sync logout across tabs
            if (e.key === this.STORAGE_KEYS.LOGOUT_TRIGGER && e.newValue) {
                console.log('🔒 Logout triggered from another tab');
                this.performLogout(false); // Don't trigger storage event again
            }

            // Sync activity across tabs
            if (e.key === this.STORAGE_KEYS.ACTIVITY_PING && e.newValue) {
                this.handleActivity();
            }
        });
    }

    /**
     * Handle user activity
     */
    handleActivity() {
        const now = Date.now();
        
        // Throttle activity updates (max once per second)
        if (now - this.lastActivity < 1000) {
            return;
        }

        this.lastActivity = now;
        this.syncLastActivity();
        
        // Reset timers
        this.resetTimers();
        
        // Close warning if shown
        if (this.isWarningShown) {
            this.closeWarning();
        }
    }

    /**
     * Sync last activity time to localStorage for multi-tab support
     */
    syncLastActivity() {
        try {
            localStorage.setItem(this.STORAGE_KEYS.LAST_ACTIVITY, this.lastActivity.toString());
            localStorage.setItem(this.STORAGE_KEYS.ACTIVITY_PING, Date.now().toString());
        } catch (e) {
            console.warn('Failed to sync activity to localStorage:', e);
        }
    }

    /**
     * Start idle timer
     */
    startIdleTimer() {
        this.resetTimers();
    }

    /**
     * Reset all timers
     */
    resetTimers() {
        // Clear existing timers
        if (this.idleTimer) clearTimeout(this.idleTimer);
        if (this.warningTimer) clearTimeout(this.warningTimer);
        if (this.countdownInterval) clearInterval(this.countdownInterval);

        // Calculate when to show warning
        const timeUntilWarning = this.config.idleTimeout - this.config.warningTime;
        
        // Set warning timer
        this.warningTimer = setTimeout(() => {
            this.showWarning();
        }, timeUntilWarning);

        // Set logout timer
        this.idleTimer = setTimeout(() => {
            this.performLogout(true);
        }, this.config.idleTimeout);
    }

    /**
     * Show warning modal
     */
    showWarning() {
        if (this.isWarningShown) return;

        this.isWarningShown = true;
        this.createWarningModal();
        this.startCountdown();
    }

    /**
     * Create warning modal HTML
     */
    createWarningModal() {
        // Create modal backdrop
        const backdrop = document.createElement('div');
        backdrop.id = 'idle-timeout-backdrop';
        backdrop.className = 'fixed inset-0 bg-black bg-opacity-50 z-[9998] flex items-center justify-center';
        backdrop.style.cssText = 'animation: fadeIn 0.3s ease;';

        // Create modal
        const modal = document.createElement('div');
        modal.id = 'idle-timeout-modal';
        modal.className = 'bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 relative z-[9999]';
        modal.style.cssText = 'animation: slideUp 0.3s ease;';

        modal.innerHTML = `
            <div class="text-center">
                <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
                    <span class="material-symbols-outlined text-yellow-600 text-4xl">schedule</span>
                </div>
                
                <h3 class="text-2xl font-bold text-slate-900 mb-2">
                    Session Timeout Warning
                </h3>
                
                <p class="text-slate-600 mb-6">
                    You will be logged out in <span id="idle-countdown" class="font-bold text-red-600">60</span> seconds due to inactivity.
                </p>

                <div class="flex flex-col gap-3">
                    <button 
                        id="stay-logged-in-btn" 
                        class="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all duration-300 flex items-center justify-center gap-2">
                        <span class="material-symbols-outlined">check_circle</span>
                        <span>Stay Logged In</span>
                    </button>
                    
                    <button 
                        id="logout-now-btn" 
                        class="w-full bg-slate-100 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all duration-300 flex items-center justify-center gap-2">
                        <span class="material-symbols-outlined">logout</span>
                        <span>Logout Now</span>
                    </button>
                </div>

                <p class="text-xs text-slate-400 mt-4">
                    Click anywhere or move your mouse to stay logged in
                </p>
            </div>
        `;

        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);

        this.warningModal = backdrop;

        // Add event listeners
        document.getElementById('stay-logged-in-btn').addEventListener('click', () => {
            this.handleActivity();
        });

        document.getElementById('logout-now-btn').addEventListener('click', () => {
            this.performLogout(true);
        });

        // Close on any activity
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                this.handleActivity();
            }
        });

        // Add CSS animations
        this.addModalStyles();
    }

    /**
     * Add modal animation styles
     */
    addModalStyles() {
        if (document.getElementById('idle-timeout-styles')) return;

        const style = document.createElement('style');
        style.id = 'idle-timeout-styles';
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            #idle-timeout-modal {
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Start countdown timer
     */
    startCountdown() {
        let secondsLeft = Math.floor(this.config.warningTime / 1000);
        const countdownEl = document.getElementById('idle-countdown');

        if (!countdownEl) return;

        this.countdownInterval = setInterval(() => {
            secondsLeft--;
            
            if (countdownEl) {
                countdownEl.textContent = secondsLeft;
                
                // Change color as time runs out
                if (secondsLeft <= 10) {
                    countdownEl.className = 'font-bold text-red-600 animate-pulse';
                }
            }

            if (secondsLeft <= 0) {
                clearInterval(this.countdownInterval);
            }
        }, 1000);
    }

    /**
     * Close warning modal
     */
    closeWarning() {
        if (this.warningModal) {
            this.warningModal.remove();
            this.warningModal = null;
        }
        
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }

        this.isWarningShown = false;
    }

    /**
     * Perform logout
     */
    async performLogout(triggerStorage = true) {
        console.log('🔒 Performing idle timeout logout');

        // Clear all timers
        if (this.idleTimer) clearTimeout(this.idleTimer);
        if (this.warningTimer) clearTimeout(this.warningTimer);
        if (this.countdownInterval) clearInterval(this.countdownInterval);

        // Close warning if shown
        this.closeWarning();

        // Trigger logout in other tabs
        if (triggerStorage) {
            try {
                localStorage.setItem(this.STORAGE_KEYS.LOGOUT_TRIGGER, Date.now().toString());
            } catch (e) {
                console.warn('Failed to trigger logout in other tabs:', e);
            }
        }

        // Clear all session data
        this.clearSessionData();

        // Call logout function
        if (window.logout) {
            try {
                await window.logout();
            } catch (error) {
                console.error('Logout failed:', error);
                // Force redirect even if logout fails
                window.location.href = 'login.html';
            }
        } else {
            // Fallback if logout function not available
            window.location.href = 'login.html';
        }
    }

    /**
     * Clear all session data
     */
    clearSessionData() {
        try {
            // Clear specific keys
            const keysToRemove = [
                'username',
                'user_role',
                'qa_assist_auth',
                'qa_assist_user',
                'qaly_saved_testcases',
                'qaly_ai_provider',
                this.STORAGE_KEYS.LAST_ACTIVITY,
                this.STORAGE_KEYS.LOGOUT_TRIGGER,
                this.STORAGE_KEYS.ACTIVITY_PING
            ];

            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
            });

            // Clear session storage
            sessionStorage.clear();

            // Clear cookies (if any)
            document.cookie.split(";").forEach(c => {
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            });

        } catch (e) {
            console.warn('Failed to clear session data:', e);
        }
    }

    /**
     * Destroy idle timeout manager
     */
    destroy() {
        // Remove event listeners
        this.ACTIVITY_EVENTS.forEach(event => {
            document.removeEventListener(event, this.handleActivity.bind(this));
        });

        // Clear timers
        if (this.idleTimer) clearTimeout(this.idleTimer);
        if (this.warningTimer) clearTimeout(this.warningTimer);
        if (this.countdownInterval) clearInterval(this.countdownInterval);

        // Close warning
        this.closeWarning();
    }
}

// Initialize idle timeout manager when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.idleTimeoutManager = new IdleTimeoutManager();
    });
} else {
    window.idleTimeoutManager = new IdleTimeoutManager();
}

// Export for module environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IdleTimeoutManager;
}
