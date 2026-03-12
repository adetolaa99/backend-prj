const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "FUO Wallet API",
      version: "1.0.0",
      description:
        "API documentation for FUO Wallet. A blockchain-based financial system built on the Stellar network.",
    },
    servers: [
      {
        url: process.env.BASE_URL,
        description:
          process.env.NODE_ENV === "production"
            ? "Production server"
            : "Local server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  tags: [
    {
      name: "Users",
      description: "User Authentication and Profile Management",
    },
    {
      name: "Stellar",
      description:
        "Stellar Wallet Operations: Balances, Transfers and Asset management",
    },
    {
      name: "Paystack",
      description: "Payment Processing and Token Minting via Paystack",
    },
    {
      name: "Admin",
      description: "Admin Authentication, User and Transactions management",
    },
  ],
  apis: [
    "./routes/userRoutes.js",
    "./routes/stellarRoutes.js",
    "./routes/paystackRoute.js",
    "./routes/adminRoutes.js",
  ],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
