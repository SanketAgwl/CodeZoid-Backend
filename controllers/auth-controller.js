const otpService = require("../services/otp-service");
const hashService = require("../services/hash-service");
const userService = require("../services/user-service");
const tokenService = require("../services/token-service");
const UserDto = require("../dtos/user-dto");

class AuthController {
  async sendOtp(req, res) {
    console.log(req.body);
    const { phone, email } = req.body;
    console.log(phone);
    console.log(email);

    if (!phone && !email) {
      res.status(400).json({ message: "Phone or Email field is required" });
    }

    const otp = await otpService.generateOtp();
    const ttl = 1000 * 60 * 2; //2 min
    const expires = Date.now() + ttl;
    const data = `${phone}.${email}.${otp}.${expires}`;
    const hash = await hashService.hashOtp(data);

    try {
      // if(phone) await otpService.sendBySms(phone, otp);
      if (email) await otpService.sendByEmail(email, otp);
      res.json({
        hash: `${hash}.${expires}`,
        email,
        phone,
        otp,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({
        message: err.message,
      });
    }
  }

  async verifyOtp(req, res) {
    const { otp, hash, phone, email } = req.body;
    if (!otp || !hash || !(phone || email)) {
      res.status(400).json({ message: "All fields are required" });
    }

    const [hashedOtp, expires] = hash.split(".");
    if (Date.now() > +expires) {
      res.status(400).json({ message: "Otp expired" });
    }
    const data = `${phone}.${email}.${otp}.${expires}`;

    const isValid = otpService.verifyOtp(data, hashedOtp);
    console.log("Valid");
    if (!isValid) res.status(400).json({ message: "Invalid OTP" });

    let user;
    if (phone) {
      try {
        user = await userService.findUser({ phone });
        if (!user) user = await userService.createUser({ phone });
      } catch (err) {
        console.log(err);
        res.status(500).json({ message: err.message });
      }
    } else {
      try {
        user = await userService.findUser({ email });
        if (!user) user = await userService.createUser({ email });
      } catch (err) {
        console.log(err);
        res.status(500).json({ message: err.message });
      }
    }

    const { accessToken, refreshToken } = tokenService.generateTokens({
      _id: user._id,
      activated: false,
    });

    tokenService.storeRefreshToken(refreshToken, user._id);

    res.cookie("refreshToken", refreshToken, {
      sameSite: "none", // Set sameSite attribute to 'none'
      secure: req.headers["x-forwarded-proto"] === "https", // Set secure flag based on the protocol
      maxAge: 1000 * 60 * 60 * 24 * 30,
      httpOnly: true,
    });

    res.cookie("accessToken", accessToken, {
      sameSite: "none", // Set sameSite attribute to 'none'
      secure: req.headers["x-forwarded-proto"] === "https", // Set secure flag based on the protocol
      maxAge: 1000 * 60 * 60 * 24 * 30,
      httpOnly: true,
    });

    const userDto = new UserDto(user);

    res.json({ user: userDto, auth: true });
  }

  async refresh(req, res) {
    // get refresh token from cookie
    const { refreshToken: refreshTokenFromCookie } = req.cookies;
    // check if token is valid
    let userData;
    try {
      userData = await tokenService.verifyRefreshToken(refreshTokenFromCookie);
    } catch (err) {
      return res.status(401).json({ message: "Invalid Token" });
    }
    // Check if token is in db
    try {
      const token = await tokenService.findRefreshToken(
        userData._id,
        refreshTokenFromCookie
      );
      if (!token) {
        return res.status(401).json({ message: "Invalid token" });
      }
    } catch (err) {
      return res.status(500).json({ message: "Internal error" });
    }
    // check if valid user
    const user = await userService.findUser({ _id: userData._id });
    if (!user) {
      return res.status(404).json({ message: "No user" });
    }
    // Generate new tokens
    const { refreshToken, accessToken } = tokenService.generateTokens({
      _id: userData._id,
    });

    // Update refresh token
    try {
      await tokenService.updateRefreshToken(userData._id, refreshToken);
    } catch (err) {
      return res.status(500).json({ message: "Internal error" });
    }
    // put in cookie
    res.cookie("refreshToken", refreshToken, {
      sameSite: "none", // Set sameSite attribute to 'none'
      secure: req.headers["x-forwarded-proto"] === "https", // Set secure flag based on the protocol
      maxAge: 1000 * 60 * 60 * 24 * 30,
      httpOnly: true,
    });

    res.cookie("accessToken", accessToken, {
      sameSite: "none", // Set sameSite attribute to 'none'
      secure: req.headers["x-forwarded-proto"] === "https", // Set secure flag based on the protocol
      maxAge: 1000 * 60 * 60 * 24 * 30,
      httpOnly: true,
    });
    // response
    const userDto = new UserDto(user);
    res.json({ user: userDto, auth: true });
  }

  async logout(req, res) {
    //delete refresh token from db
    const { refreshToken } = req.cookies;
    await tokenService.removeToken(refreshToken);
    console.log("refreshToken: ", refreshToken);
    //delete tokens from cookie
    res.clearCookie("refreshToken");
    res.clearCookie("accessToken");
    res.json({ user: null, auth: false });
  }
}

module.exports = new AuthController();
