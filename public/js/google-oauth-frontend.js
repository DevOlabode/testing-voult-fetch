// Google OAuth Frontend Implementation for External API
class GoogleOAuthFrontend {
    constructor() {
        this.clientId = null;
        this.authApiBaseUrl = 'https://voult.dev/api/auth/google';
        
        this.init();
    }

    async init() {
        // Fetch configuration from backend
        try {
            const configResponse = await fetch('/api/config');
            const config = await configResponse.json();
            this.clientId = config.googleClientId;
        } catch (error) {
            console.warn('Could not fetch config, using defaults:', error);
            this.clientId = 'YOUR_GOOGLE_CLIENT_ID';
        }
        
        // Initialize Google Identity Services
        this.loadGoogleScript();
    }

    loadGoogleScript() {
        // Load Google Identity Services script
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => this.initializeGoogleButton();
        document.head.appendChild(script);
    }

    initializeGoogleButton() {
        // Initialize Google Sign-In button
        if (window.google && window.google.accounts) {
            // Login page button
            const loginButton = document.getElementById('google-login-btn');
            if (loginButton) {
                this.renderGoogleButton(loginButton, 'login');
            }

            // Register page button
            const registerButton = document.getElementById('google-register-btn');
            if (registerButton) {
                this.renderGoogleButton(registerButton, 'register');
            }
        }
    }

    renderGoogleButton(element, action) {
        if (!window.google?.accounts?.id) {
            console.error('Google Identity Services not loaded');
            return;
        }

        window.google.accounts.id.initialize({
            client_id: this.clientId,
            callback: (response) => this.handleCredentialResponse(response, action)
        });

        window.google.accounts.id.renderButton(element, {
            theme: 'outline',
            size: 'large',
            text: action === 'login' ? 'signin_with' : 'signup_with',
            shape: 'rectangular',
            logo_alignment: 'center'
        });
    }

    async handleCredentialResponse(response, action) {
        try {
            // Decode the JWT to get user info
            const userInfo = this.decodeJwt(response.credential);
            
            // Prepare data for external auth API
            const oauthData = {
                idToken: response.credential,
                email: userInfo.email,
                name: userInfo.name,
                picture: userInfo.picture
            };

            // Call external auth API
            const endpoint = action === 'login' 
                ? `${this.authApiBaseUrl}/login`
                : `${this.authApiBaseUrl}/register`;

            const result = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Client-Id': 'app_dbcba8e9f7bd14f5ba7320fa' // From your .env
                },
                body: JSON.stringify(oauthData)
            });

            const data = await result.json();

            if (data.success) {
                // Store tokens if returned
                if (data.data?.accessToken) {
                    localStorage.setItem('accessToken', data.data.accessToken);
                }
                if (data.data?.refreshToken) {
                    localStorage.setItem('refreshToken', data.data.refreshToken);
                }

                // Redirect based on action
                if (action === 'login') {
                    window.location.href = '/dashboard';
                } else {
                    window.location.href = '/login';
                }
            } else {
                this.showError(data.message || 'Authentication failed');
            }

        } catch (error) {
            console.error('Google OAuth error:', error);
            this.showError('An error occurred during authentication');
        }
    }

    decodeJwt(token) {
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
            console.error('Error decoding JWT:', error);
            return null;
        }
    }

    showError(message) {
        // Show error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger';
        errorDiv.textContent = message;
        
        // Find form container and add error
        const form = document.querySelector('form');
        if (form) {
            form.parentNode.insertBefore(errorDiv, form);
        }

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

    // Method to refresh token
    async refreshToken() {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }

            const response = await fetch(`${this.authApiBaseUrl}/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Client-Id': 'app_dbcba8e9f7bd14f5ba7320fa'
                },
                body: JSON.stringify({ refreshToken })
            });

            const data = await response.json();

            if (data.success && data.data?.accessToken) {
                localStorage.setItem('accessToken', data.data.accessToken);
                return data.data.accessToken;
            } else {
                throw new Error(data.message || 'Token refresh failed');
            }
        } catch (error) {
            console.error('Token refresh error:', error);
            this.logout();
            throw error;
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

            // If unauthorized, try to refresh token
            if (response.status === 401) {
                try {
                    await this.refreshToken();
                    const newToken = localStorage.getItem('accessToken');
                    
                    headers['Authorization'] = `Bearer ${newToken}`;
                    
                    response = await fetch(url, {
                        ...options,
                        headers
                    });
                } catch (refreshError) {
                    // Refresh failed, redirect to login
                    this.logout();
                    throw new Error('Session expired. Please login again.');
                }
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
    if (document.getElementById('google-login-btn') || document.getElementById('google-register-btn')) {
        window.googleOAuthFrontend = new GoogleOAuthFrontend();
    }
});