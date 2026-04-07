require('dotenv').config();

const express = require('express');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

const path = require('path');
const ejsMate = require('ejs-mate');

const session = require('express-session');
const flash = require('connect-flash');

const sessionConfig = require('../config/session');

const manualAuthRoutes = require('../routes/manualAuth');
const userRoutes  = require('../routes/user');
const googleOauthRoutes = require('../routes/googleOauth');

const tokenManager = require('../utils/tokenManager');

// Make it available to all routes
app.set('tokenManager', tokenManager);

app.use(express.json());

app.use(session(sessionConfig));
app.use(flash());

app.use('/', manualAuthRoutes);
app.use('/', userRoutes);
app.use('/', googleOauthRoutes);

app.get('/', (req, res) => {
  res.json('Hello World!');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
