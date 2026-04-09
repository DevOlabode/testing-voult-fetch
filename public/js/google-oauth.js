// Google OAuth Frontend Implementation
class GoogleOAuth {
    constructor() {
        this.clientId = null;
        this.apiBaseUrl = 'http://localhost:3000';
        this.voultApiUrl = 'https://voult.dev/api/auth/google';
        
        this.init();
    }

    async init() {
        // Fetch configuration from backend
        try {
            const configResponse = await fetch('/api/config');
            const config = await configResponse.json();
            this.clientId = config.googleClientId;
            this.apiBaseUrl = config.apiBaseUrl || this.apiBaseUrl;
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
            
            // Prepare data for backend
            const oauthData = {
                idToken: response.credential,
                email: userInfo.email,
                name: userInfo.name,
                picture: userInfo.picture
            };

            // Call our backend endpoint
            const endpoint = action === 'login' 
                ? `${this.apiBaseUrl}/auth/google/login`
                : `${this.apiBaseUrl}/auth/google/register`;

            const result = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
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
}

// Initialize Google OAuth when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('google-login-btn') || document.getElementById('google-register-btn')) {
        window.googleOAuth = new GoogleOAuth();
    }
});