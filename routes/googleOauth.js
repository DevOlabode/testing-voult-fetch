const express = require('express');
const router = express.Router();

const controller = require('../controllers/googleOauth');

router.post('/google/login', controller.googleLogin);
router.post('/google/register', controller.googleRegister);

module.exports = router;
