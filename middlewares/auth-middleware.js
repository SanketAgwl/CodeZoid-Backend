const tokenService = require("../services/token-service");

module.exports = async function (req, res, next) {
  try {
    const { accessToken } = req.cookies;
    console.log(accessToken);
    if (!accessToken) {
      throw new Error();
    }
    const userData = await tokenService.verifyToken(accessToken);
    if (!userData) {
      throw new Error();
    }
    console.log(userData);
    req.user = userData;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid Access Token" });
  }
};
