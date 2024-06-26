const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const UserRouter = require("./routes/userRoutes.js");
const AdminRouter = require("./routes/adminRoutes.js");
const StellarRouter = require("./routes/stellarRoutes.js")
require("dotenv").config();

const app = express();

app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({ extended: false })); //to parse body object
app.use(cors());

app.use("/api/users", UserRouter);
app.use("/api/admin", AdminRouter);
app.use("/api/stellar", StellarRouter)

app.get("/api", (req, res) => {
  res.send("Heyyy from my FY project's backend server -_-");
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
app.listen(port, () => {
  console.log(`The backend server is running on port ${port}`);
});
