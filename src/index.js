require('dotenv').config();

const express = require('express');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

const manualAuthRoutes = require('../routes/manualAuth');
const userRoutes  = require('../routes/user');
const googleOauthRoutes = require('../routes/googleOauth');

app.use(express.json());

app.use('/', manualAuthRoutes);
app.use('/', userRoutes);
app.use('/', googleOauthRoutes);

app.get('/', (req, res) => {
  res.json('Hello World!');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
