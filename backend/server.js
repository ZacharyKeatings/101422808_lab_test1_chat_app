require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/db');
const path = require('path');
const Message = require('./models/Message');
const moment = require('moment');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let users = {};

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('joinRoom', async ({ username, room }) => {
        socket.join(room);
        users[socket.id] = { username, room };

        const messages = await Message.find({ room }).sort({ date_sent: -1 }).limit(10);
        socket.emit('loadMessages', messages.reverse());

        socket.broadcast.to(room).emit('message', {
            username: 'System',
            message: `${username} has joined the chat`,
        });
    });

    socket.on('sendMessage', async ({ message }) => {
        const user = users[socket.id];
        if (user) {
            const timestamp = moment().format('hh:mm A');

            const newMessage = new Message({
                from_user: user.username,
                room: user.room,
                message: message,
                date_sent: new Date()
            });

            await newMessage.save();

            io.to(user.room).emit('message', {
                username: user.username,
                message: message,
                time: timestamp
            });
        }
    });

    socket.on('leaveRoom', ({ username, room }) => {
        socket.leave(room);
        io.to(room).emit('message', {
            username: 'System',
            message: `${username} has left the chat`,
        });
        delete users[socket.id];
    });

    socket.on('disconnect', () => {
        const user = users[socket.id];
        if (user) {
            io.to(user.room).emit('message', {
                username: 'System',
                message: `${user.username} has left the chat`,
            });
            delete users[socket.id];
        }
        console.log('User disconnected:', socket.id);
    });
});

const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
