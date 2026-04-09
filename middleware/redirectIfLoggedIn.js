const axios = require('axios');

module.exports = async (req, res, next) => {
  try {
    const tokenManager = req.app.get('tokenManager');
    const accessToken = tokenManager.getCurrentToken();
    
    if (!accessToken) {
      return next(); 
    }

    const response = await axios.get(
      `${process.env.API_URL}/user/me`,
      {
        headers: {
          'x-client-token': `Bearer ${accessToken}`
        }
      }
    );

    req.user = response.data;
    return res.redirect('/'); 
    
  } catch (error) {
    return next();
  }
};