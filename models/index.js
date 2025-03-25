const mongoose = require("mongoose");
const User = require("./user");
const Post = require("./post")
const db = {
  User,
  Post,
};

module.exports = db;
