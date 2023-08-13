const crypto = require("crypto");
const hashService = require("./hash-service");

const smsSid = process.env.SMS_SID;
const smsAuthToken = process.env.SMS_AUTH_TOKEN;
const twilio = require("twilio")(smsSid, smsAuthToken, {
  lazyLoading: true,
});

const nodemailer = require("nodemailer");
const transport = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.MAILUSER,
    pass: process.env.MAILPASS,
  },
});

console.log(process.env.MAILUSER);
console.log(process.env.MAILPASS);

class OtpService {
  generateOtp() {
    const otp = crypto.randomInt(1000, 9999);
    return otp;
  }

  async sendBySms(phone, otp) {
    await twilio.messages.create({
      to: phone,
      from: process.env.SMS_FROM_NUMBER,
      body: `Your Codershouse OTP is ${otp}. Happy coding!`,
    });
  }

  sendByEmail(email, otp) {
    transport
      .sendMail({
        from: process.env.MAILUSER,
        to: email,
        subject: "Please confirm your account",
        html: `<h1>Email Confirmation</h1>
          <h2>Hello</h2>
          <p>Your CodeZoid OTP is ${otp}. Happy coding!</p>
          </div>`,
      })
      .catch((err) => console.log(err));
  }

  verifyOtp(data, hashedOtp) {
    let computedHash = hashService.hashOtp(data);
    return computedHash === hashedOtp;
  }
}

module.exports = new OtpService();
