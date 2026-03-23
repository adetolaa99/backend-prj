const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const UserRouter = require("./routes/userRoutes.js");
const AdminRouter = require("./routes/adminRoutes.js");
const StellarRouter = require("./routes/stellarRoutes.js");
const PaystackRouter = require("./routes/paystackRoute.js");
require("dotenv").config();

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swaggerConfig.js");

const app = express();

app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({ extended: false }));

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : [];

  const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin
    if (!origin) return callback(null, true);
    
    // In development, allow all origins
    if (process.env.NODE_ENV !== "production") {
      return callback(null, true);
    }
    
    // In production, check against allowed origins
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api/docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

app.use("/api/users", UserRouter);
app.use("/api/admin", AdminRouter);
app.use("/api/stellar", StellarRouter);
app.use("/api/paystack", PaystackRouter);

app.get("/api", (req, res) => {
  res.send("Hello from the backend server -_-");
});

app.get("/", (req, res) => {
  res.send("You're on the homepage :)");
});

app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).json({
    error: err.message,
  });
});

const port = process.env.PORT || 9000;
const db = require("./models");

db.sequelize
  .authenticate()
  .then(() => {
    console.log("DB connection successful. Syncing and starting server...");
    return db.sequelize.sync();
  })
  .then(() => {
    app.listen(port, () => {
      console.log(`The server is running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to DB or sync models:", err.message);
    process.exit(1);
  });
