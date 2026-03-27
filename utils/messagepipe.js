const axios = require("axios");

const MESSAGEPIPE_URL = process.env.MESSAGEPIPE_URL;
const MESSAGEPIPE_API_KEY = process.env.MESSAGEPIPE_API_KEY;

const registerDevice = async (userId, deviceToken, platform) => {
  await axios.post(
    `${MESSAGEPIPE_URL}/push/register-device`,
    { userId, deviceToken, provider: "fcm", platform },
    {
      headers: {
        "x-api-key": MESSAGEPIPE_API_KEY,
        "Content-Type": "application/json",
      },
    },
  );
};

const sendPushNotification = async (userId, title, body) => {
  if (!MESSAGEPIPE_URL || !MESSAGEPIPE_API_KEY) {
    console.warn("MessagePipe not configured, skipping push notification");
    return;
  }

  try {
    await axios.post(
      `${MESSAGEPIPE_URL}/push/send`,
      { userId, title, body },
      {
        headers: {
          "x-api-key": MESSAGEPIPE_API_KEY,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("Failed to send push notification:", error?.message);
  }
};

module.exports = { registerDevice, sendPushNotification };
