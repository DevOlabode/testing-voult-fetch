// Google OAuth Authorization Code Flow Frontend Implementation
class GoogleOAuthCodeFlow {
    constructor() {
        this.apiBaseUrl = window.location.origin;
        this.voultApiBaseUrl = 'https://voult.dev/api/auth/google';
        this.clientId = null;
        
        this.init();
    }

    async init() {
        // Fetch configuration from backend
        try {
            const configResponse = await fetch('/api/config');
            const config = await configResponse.json();
            this.clientId = config.googleClientId;
            if (config.apiBaseUrl) {
                this.apiBaseUrl = config.apiBaseUrl;
            }
        } catch (error) {
            console.warn('Could not fetch config, using defaults:', error);
        }
        
        // Check if this is a callback page
        this.handleCallbackIfApplicable();
        
        // Initialize buttons
        this.initializeButtons();
    }

    initializeButtons() {
        // Login button
        const loginButton = document.getElementById('google-login-btn');
        if (loginButton) {
            this.setupButton(loginButton, 'login');
        }

        // Register button
        const registerButton = document.getElementById('google-register-btn');
        if (registerButton) {
            this.setupButton(registerButton, 'register');
        }
    }

    setupButton(button, action) {
        // Clear existing content
        button.innerHTML = '';
        
        // Create a styled button
        const oauthButton = document.createElement('button');
        oauthButton.className = 'btn btn-google-oauth w-100';
        oauthButton.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" style="margin-right: 8px;">
                <path d="M17.64 9.20455c0-0.63636-0.05727-1.24364-0.16364-1.82727H9v3.45455h4.87636c-0.21091 1.12909-0.84409 2.08364-1.79455 2.71964v2.25h2.88545c1.69091-1.55455 2.67273-3.85091 2.67273-6.59691z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.46739-0.80727 5.95636-2.18455l-2.88545-2.25c-0.80455 0.54-1.83273 0.86364-3.07091 0.86364-2.37273 0-4.38409-1.60364-5.10409-3.75909H0.831818v2.32364C2.31273 15.93 5.44364 18 9 18z" fill="#34A853"/>
                <path d="M3.89591 10.6745C3.71273 10.1236 3.60636 9.53455 3.60636 9s0.10636-1.12364 0.28955-1.67455V4.99182H0.831818C0.331818 5.98636 0 7.12364 0 9s0.331818 3.01364 0.831818 4.00818l3.06409-2.33364z" fill="#FBBC05"/>
                <path d="M9 3.57818c1.32909 0 2.52273 0.456818 3.46364 1.35409l2.58909-2.58909C13.49091 0.840909 11.55 0 9 0 5.44364 0 2.31273 2.07 0.831818 4.99182l3.06409 2.33364C4.61591 5.17636 6.62727 3.57818 9 3.57818z" fill="#EA4335"/>
            </svg>
            Sign in with Google
        `;
        
        oauthButton.addEventListener('click', () => this.startOAuthFlow(action));
        button.appendChild(oauthButton);
    }

    async startOAuthFlow(action) {
        try {
            const redirectUri = `${this.apiBaseUrl}/oauth/google/callback`;
            
            // Call our server to get the authorization URL
            const response = await fetch('/api/oauth/google/authorize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    intent: action,
                    redirectUri
                })
            });

            const data = await response.json();

            if (data.success && data.authUrl) {
                // Redirect user to Google login
                window.location.href = data.authUrl;
            } else {
                this.showError(data.message || 'Failed to start OAuth flow');
            }

        } catch (error) {
            console.error('OAuth start error:', error);
            this.showError('An error occurred while starting authentication');
        }
    }

    handleCallbackIfApplicable() {
        // Check if we're on the callback page
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        if (error) {
            this.showError(`OAuth error: ${urlParams.get('error_description') || error}`);
            // Clear the URL
            window.history.replaceState({}, document.title, window.location.pathname);
            return;
        }

        if (code && state) {
            // We're on the callback page, process the code
            this.processCallback(code, state);
        }
    }

    async processCallback(code, state) {
        try {
            // Show loading state
            this.showLoading();

            // Send the code to our server to exchange for tokens
            const response = await fetch(`/api/oauth/google/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                // Store tokens
                if (data.data?.accessToken) {
                    localStorage.setItem('accessToken', data.data.accessToken);
                }
                if (data.data?.refreshToken) {
                    localStorage.setItem('refreshToken', data.data.refreshToken);
                }

                // Clear URL parameters
                window.history.replaceState({}, document.title, window.location.pathname);

                // Redirect based on intent (we can get this from state or just go to dashboard)
                window.location.href = '/dashboard';
            } else {
                this.showError(data.message || 'Authentication failed');
                window.history.replaceState({}, document.title, window.location.pathname);
            }

        } catch (error) {
            console.error('OAuth callback error:', error);
            this.showError('An error occurred during authentication');
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

    showLoading() {
        // Create loading overlay
        const overlay = document.createElement('div');
        overlay.id = 'oauth-loading-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        `;
        
        const spinner = document.createElement('div');
        spinner.style.cssText = `
            width: 50px;
            height: 50px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        `;
        
        overlay.appendChild(spinner);
        document.body.appendChild(overlay);

        // Add animation style
        const style = document.createElement('style');
        style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
        document.head.appendChild(style);
    }

    showError(message) {
        // Remove existing error
        const existingError = document.querySelector('.oauth-error-message');
        if (existingError) {
            existingError.remove();
        }

        // Create error element
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger oauth-error-message';
        errorDiv.style.cssText = 'margin-bottom: 1rem;';
        errorDiv.textContent = message;
        
        // Find form container or main content area
        const container = document.querySelector('.container') || document.body;
        container.insertBefore(errorDiv, container.firstChild);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    // Method to check if user is authenticated
    isAuthenticated() {
        return !!localStorage.getItem('accessToken');
    }

    // Method to logout
    logout() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
    }

    // Method to get user info from token
    getUserInfo() {
        const token = localStorage.getItem('accessToken');
        if (!token) return null;

        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Error decoding access token:', error);
            return null;
        }
    }

    // Method to make authenticated requests
    async makeAuthenticatedRequest(url, options = {}) {
        const token = localStorage.getItem('accessToken');
        
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            let response = await fetch(url, {
                ...options,
                headers
            });

            // If unauthorized, redirect to login
            if (response.status === 401) {
                this.logout();
                throw new Error('Session expired. Please login again.');
            }

            return response;
        } catch (error) {
            console.error('Authenticated request error:', error);
            throw error;
        }
    }
}

// Initialize Google OAuth when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on a page with Google OAuth buttons or on the callback page
    const hasOAuthButton = document.getElementById('google-login-btn') || document.getElementById('google-register-btn');
    const isCallbackPage = window.location.pathname === '/oauth/google/callback' || 
                           new URLSearchParams(window.location.search).has('code');
    
    if (hasOAuthButton || isCallbackPage) {
        window.googleOAuthCodeFlow = new GoogleOAuthCodeFlow();
    }
});