const jwt = require("jsonwebtoken");
const accessTokenSecret = process.env.JWT_ACCESS_TOKEN_SECRET;
const refreshTokenSecret = process.env.JWT_REFRESH_TOKEN_SECRET;
const refreshModal = require("../models/refresh-model");

class TokenService {
  generateTokens(payload) {
    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_TOKEN_SECRET, {
      expiresIn: "1m",
    });
    const refreshToken = jwt.sign(
      payload,
      process.env.JWT_REFRESH_TOKEN_SECRET,
      {
        expiresIn: "1h",
      }
    );
    return { accessToken, refreshToken };
  }
  async storeRefreshToken(token, userId) {
    try {
      await refreshModal.create({
        token,
        userId,
      });
    } catch (err) {
      console.log(err.message);
    }
  }
  async verifyToken(token) {
    return jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET);
  }
  async verifyRefreshToken(token) {
    return jwt.verify(token, process.env.JWT_REFRESH_TOKEN_SECRET);
  }
  async findRefreshToken(userId, refreshToken) {
    return await refreshModal.findOne({
      userId: userId,
      token: refreshToken,
    });
  }

  async updateRefreshToken(userId, refreshToken) {
    return await refreshModal.updateOne(
      { userId: userId },
      { token: refreshToken }
    );
  }

  async removeToken(refreshToken) {
    return await refreshModal.deleteOne({ token: refreshToken });
  }
}

module.exports = new TokenService();
