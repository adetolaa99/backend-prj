const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const UserRouter = require("./routes/userRoutes.js");
const AdminRouter = require("./routes/adminRoutes.js");
const StellarRouter = require("./routes/stellarRoutes.js");
const PaystackRouter = require("./routes/paystackRoute.js");
require("dotenv").config();

const app = express();

app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({ extended: false })); //to parse body object
app.use(cors());

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

//error handler
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
