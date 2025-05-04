const mongoose = require("mongoose");
const User = require("./user");
const Post = require("./post")
const Message = require("./message")
const Conversation = require("./conversation");
const Comment = require("./comment"); 
//const Notification = require("./notification");
const db = {
  User,
  Post,
  Message,
  Conversation,
  Comment,
  //Notification
};

module.exports = db;
