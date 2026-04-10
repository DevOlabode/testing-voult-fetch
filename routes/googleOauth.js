const express = require('express');
const router = express.Router();

const controller = require('../controllers/googleOauth');
const catchAsync = require('../utils/catchAsync');

// Authorization Code Flow Routes
// POST /api/oauth/google/authorize - Generate Google OAuth authorization URL
router.post('/api/oauth/google/authorize', catchAsync(controller.generateAuthUrl));

// GET /api/oauth/google/callback - Handle Google OAuth callback
router.get('/api/oauth/google/callback', catchAsync(controller.handleCallback));

// Legacy ID Token Flow Routes (kept for backward compatibility)
router.post('/google/login', controller.googleLogin);
router.post('/google/register', controller.googleRegister);

module.exports = router;
