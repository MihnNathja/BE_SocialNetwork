const mongoose = require("mongoose");
const User = require("./user");
const Post = require("./post")
const Message = require("./message")
const Conversation = require("./conversation")
const db = {
  User,
  Post,
  Message,
  Conversation,
  Post
};

module.exports = db;
