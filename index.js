const { MongoClient, ServerApiVersion } = require("mongodb");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 8000;

app.get("/", (req, res) => {
  res.send("hello");
});

app.listen(port, () => {
  console.log("server is running.....");
});
