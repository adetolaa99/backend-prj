const axios = require("axios");

const MESSAGEPIPE_URL = process.env.MESSAGEPIPE_URL;
const MESSAGEPIPE_API_KEY = process.env.MESSAGEPIPE_API_KEY;

const registerDevice = async (userId, deviceToken, platform) => {
  const provider = platform === "ios" ? "apns" : "fcm";

  await axios.post(
    `${MESSAGEPIPE_URL}/push/register-device`,
    { userId, deviceToken, provider, platform },
    {
      headers: {
        "x-api-key": MESSAGEPIPE_API_KEY,
        "Content-Type": "application/json",
      },
    },
  );
};

const sendPushNotification = async (userId, templateId, variables) => {
  if (!MESSAGEPIPE_URL || !MESSAGEPIPE_API_KEY) {
    console.warn("MessagePipe not configured, skipping push notification");
    return;
  }

  console.log(
    "OneSignal/MessagePipe: attempting to send notification to userId:",
    userId,
  );
  console.log("OneSignal/MessagePipe: templateId:", templateId);
  console.log("OneSignal/MessagePipe: variables:", variables);

  try {
    const response = await axios.post(
      `${MESSAGEPIPE_URL}/push/send`,
      { userId, templateId, variables },
      {
        headers: {
          "x-api-key": MESSAGEPIPE_API_KEY,
          "Content-Type": "application/json",
        },
      },
    );
    console.log("MessagePipe response:", response.data);
  } catch (error) {
    console.error("Failed to send push notification:", error?.message);
    console.error(
      "Failed to send push notification response:",
      error?.response?.data,
    );
  }
};

module.exports = { registerDevice, sendPushNotification };
