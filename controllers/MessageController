const Message = require('../models/message');
const User = require('../models/user');
const Conversation = require('../models/conversation');
const cloudinary = require('../config/cloudinary');
const mongoose = require("mongoose");
const moment = require('moment-timezone');

class MessageController {
    // Lấy tin nhắn của một conversation
    async getMessages(req, res) {
        try {
            const { conversation_id } = req.params;
            const { page = 1, limit = 20 } = req.query;

            const messages = await Message.find({
                conversation_id,
                is_deleted: false
            })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate({
                path: 'sender_id',
                select: '_id username profile.avatar profile.name',
            })
            .populate('reply_to');

            const total = await Message.countDocuments({
                conversation_id,
                is_deleted: false
            });

            // Map lại sender_id để đưa name và avatar ra ngoài
            const formattedMessages = messages.map(msg => {
                const sender = msg.sender_id;
                const formattedTimestamp = moment(msg.createdAt)
                    .tz('Asia/Ho_Chi_Minh') // Chuyển sang múi giờ Asia/Ho_Chi_Minh
                    .format('HH:mm - DD/MM/YYYY'); // Định dạng thời gian theo ý muốn
                return {
                    ...msg.toObject(),
                    sender_id: {
                        _id: sender._id,
                        username: sender.username,
                        name: sender.profile?.name || "",
                        avatar: sender.profile?.avatar || ""
                    },
                    timestamp: formattedTimestamp
                };
            });

            res.status(200).json({
                messages: formattedMessages.reverse(),
                total,
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit)
            });
        } catch (error) {
            console.error('Get messages error:', error);
            res.status(500).json({ message: 'Lỗi server' });
        }
    }

    // Gửi tin nhắn text
    async sendMessage(req, res) {
        try {
            const { conversation_id, sender_id, content, reply_to } = req.body;

            const newMessage = await Message.create({
                conversation_id,
                sender_id,
                content,
                reply_to,
                message_type: 'text'
            });

            // Update last message trong conversation
            await Conversation.findByIdAndUpdate(conversation_id, {
                last_message: {
                    content,
                    sender_id,
                    timestamp: new Date(),
                    message_type: 'text'
                }
            });

            // Populate sender info
            await newMessage.populate('sender_id', 'username avatar');
            if (reply_to) {
                await newMessage.populate('reply_to');
            }

            // Emit socket event nếu có socket
            if (req.io) {
                req.io.to(conversation_id).emit('new_message', newMessage);
            }

            res.status(201).json(newMessage);
        } catch (error) {
            console.error('Send message error:', error);
            res.status(500).json({ message: 'Lỗi server' });
        }
    }

    async sendImageMessage(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'Vui lòng chọn ảnh' });
            }
    
            const { conversation_id, sender_id } = req.body;
    
            // Upload ảnh lên Cloudinary
            const result = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: 'chat_images',
                        resource_type: 'auto'
                    },
                    (error, result) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(result);
                        }
                    }
                );
    
                // Pipe buffer vào stream
                const bufferStream = require('stream').Readable.from(req.file.buffer);
                bufferStream.pipe(stream);
            });
    
            // Lấy thông tin sender
            const sender = await User.findById(sender_id)
                .select('_id username profile.name profile.avatar');

            // Lưu message vào database
            const newMessage = await Message.create({
                conversation_id,
                sender_id: sender._id,
                content: result.secure_url,
                message_type: 'image'
            });
            const senderInfo = await User.findById(sender.id).select('_id username profile.name profile.avatar');
            // Update last message trong conversation
            await Conversation.findByIdAndUpdate(conversation_id, {
                last_message: {
                    content: 'Đã gửi một hình ảnh',
                    sender_id: sender._id,
                    timestamp: new Date(),
                    message_type: 'image'
                }
            });

            // Populate sender info với đầy đủ thông tin
            await newMessage.populate({
                path: 'sender_id',
                select: '_id username profile.name profile.avatar'
            });

          
            const messageObj = {
                id: newMessage._id,
                conversation_id: newMessage.conversation_id,
                sender_id: {
                    _id: senderInfo._id,
                    username: senderInfo.username,
                    name: senderInfo.profile.name,    
                    avatar: senderInfo.profile.avatar 
                },
                content: newMessage.content,
                message_type: newMessage.message_type,
                timestamp: formatTimestamp(newMessage.createdAt),
                createdAt: newMessage.createdAt
            };
           
            if (req.io) {
                req.io.of('/message').to(conversation_id).emit('new_message', messageObj);
            
            }

            res.status(201).json({
                success: true,
                data: messageObj
            });
        
        } catch (error) {
            console.error('Send image message error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Lỗi upload ảnh: ' + error.message 
        });
        }
    }

    // Xóa tin nhắn
    async deleteMessage(req, res) {
        try {
            const { message_id } = req.params;

            const message = await Message.findByIdAndUpdate(
                message_id,
                { is_deleted: true },
                { new: true }
            );

            if (!message) {
                return res.status(404).json({ message: 'Không tìm thấy tin nhắn' });
            }

            if (req.io) {
                req.io.to(message.conversation_id).emit('message_deleted', message_id);
            }

            res.status(200).json({ message: 'Đã xóa tin nhắn' });
        } catch (error) {
            console.error('Delete message error:', error);
            res.status(500).json({ message: 'Lỗi server' });
        }
    }
}

const formatTimestamp = (date) => {
    return moment(date)
        .tz('Asia/Ho_Chi_Minh')
        .format('HH:mm - DD/MM/YYYY');
};

module.exports = new MessageController();