const axios = require('axios');

// Generate Google OAuth authorization URL
module.exports.generateAuthUrl = async(req, res) => {
    try {
        const { intent = 'login', redirectUri } = req.body;
        const clientId = process.env.GOOGLE_CLIENT_ID;
        
        if (!clientId) {
            return res.status(500).json({
                success: false,
                message: 'Google Client ID not configured'
            });
        }

        // Create state with intent and app ID for security
        const state = Buffer.from(JSON.stringify({
            intent,
            appId: process.env.CLIENT_ID,
            redirectUri,
            timestamp: Date.now()
        })).toString('base64');

        // Build Google OAuth authorization URL
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${clientId}&` +
            `redirect_uri=${encodeURIComponent(redirectUri || `${process.env.API_BASE_URL || 'http://localhost:5050'}/oauth/google/callback`)}&` +
            `response_type=code&` +
            `scope=${encodeURIComponent('openid email profile')}&` +
            `state=${encodeURIComponent(state)}&` +
            `access_type=offline&` +
            `prompt=consent`;

        res.json({
            success: true,
            authUrl
        });

    } catch (error) {
        console.error('Error generating auth URL:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate authorization URL'
        });
    }
};

// Handle Google OAuth callback
module.exports.handleCallback = async(req, res) => {
    try {
        const { code, state } = req.query;
        
        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'No authorization code provided'
            });
        }

        // Decode and validate state
        let stateData;
        try {
            stateData = JSON.parse(Buffer.from(state, 'base64').toString());
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: 'Invalid state parameter'
            });
        }

        const redirectUri = stateData.redirectUri || `${process.env.API_BASE_URL || 'http://localhost:5050'}/oauth/google/callback`;

        // Exchange authorization code for tokens
        const tokenResponse = await axios.post(
            'https://oauth2.googleapis.com/token',
            {
                code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code'
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        const { access_token: googleAccessToken, id_token: idToken } = tokenResponse.data;

        // Get user info from Google
        const userInfoResponse = await axios.get(
            'https://www.googleapis.com/oauth2/v3/userinfo',
            {
                headers: {
                    'Authorization': `Bearer ${googleAccessToken}`
                }
            }
        );

        const userInfo = userInfoResponse.data;

        // Determine if this is login or register based on state
        const intent = stateData.intent || 'login';

        // Forward to Voult API for login/register
        const voultEndpoint = intent === 'register' 
            ? 'https://voult.dev/api/auth/google/register'
            : 'https://voult.dev/api/auth/google/login';

        const voultResponse = await axios.post(
            voultEndpoint,
            {
                idToken,
                email: userInfo.email,
                name: userInfo.name,
                picture: userInfo.picture
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Client-Id': process.env.CLIENT_ID
                }
            }
        );

        const voultData = voultResponse.data;

        // Return success with tokens
        res.json({
            success: true,
            data: voultData,
            userInfo
        });

    } catch (error) {
        console.error('OAuth callback error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            success: false,
            message: error.response?.data || 'OAuth callback failed'
        });
    }
};

module.exports.googleLogin = async(req, res)=>{
    try {
        const response = await axios.post(
            'https://voult.dev/api/auth/google/login',
            req.body,
            {
                headers : {
                    'Content-Type': 'application/json',
                    'X-Client-Id': process.env.CLIENT_ID
                }
            }
        );
           
        console.log(response.data);

        res.json({
            success: true,
            data: response.data
        })

    }catch(error) {
        console.error(error.response.data);
  
        res.status(error.response?.status || 500).json({
          success: false,
          message: error.response?.data || "Something went wrong"
        });
    }
}

module.exports.googleRegister = async(req, res)=>{
    try {
        const response = await axios.post(
            'https://voult.dev/api/auth/google/register',
            req.body,
            {
                headers : {
                    'Content-Type': 'application/json',
                    'X-Client-Id': process.env.CLIENT_ID
                }
            }
        );

        console.log(response.data);

        res.json({
            success: true,
            data: response.data
        })

    }catch(error) {
        console.error(error.response.data);
  
        res.status(error.response?.status || 500).json({
          success: false,
          message: error.response?.data || "Something went wrong"
        });
    }
}