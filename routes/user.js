const express = require('express');
const router = express.Router();

const controller = require('../controllers/user');

router.get('/profile', controller.getProfile);

router.patch('/profile', controller.editProfile);

module.exports = router;