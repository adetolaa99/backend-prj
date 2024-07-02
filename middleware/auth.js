const jwt = require("jsonwebtoken");
const tokenConfig = require("../config/tokenConfig.js");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    console.log("No token provided");
    return res.status(401).json({ message: "No token provided" });
  }

  jwt.verify(token, tokenConfig.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log("Invalid token");
      return res.status(403).json({ message: "Invalid token" });
    }
    console.log("Decoded token:", decoded);
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      email: decoded.email,
    };
     console.log("User attached to request:", req.user);
    next();
  });
};

module.exports = authenticateToken;
