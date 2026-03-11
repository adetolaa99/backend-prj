const { Resend } = require("resend");
const emailConfig = require("../config/emailConfig.js");

const resend = new Resend(emailConfig.RESEND_API_KEY);

const sendEmail = async (options) => {
  await resend.emails.send({
    from: "FUO Wallet <noreply@hello.nafeesah.online>",
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  });
};

module.exports = sendEmail;
