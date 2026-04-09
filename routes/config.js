const express = require('express');
const router = express.Router();

// Route to get Google OAuth client ID
router.get('/api/config', (req, res) => {
    res.json({
        googleClientId: process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
        apiBaseUrl: process.env.API_BASE_URL || ''
    });
});

module.exports = router;