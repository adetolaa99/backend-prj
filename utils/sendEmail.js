const nodemailer = require("nodemailer");
const emailConfig = require("../config/emailConfig.js");

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailConfig.EMAIL,
      pass: emailConfig.EMAIL_PASSWORD,
    },
    tls: {
      ciphers: "SSLv3",
    },
  });

  const mailOptions = {
    from: '"FUO Wallet" <noreply@FUOwallet.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
