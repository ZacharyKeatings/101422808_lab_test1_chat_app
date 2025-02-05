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

        io.emit('updateUserList', Object.values(users).map(user => user.username));

        const messages = await Message.find({ room }).sort({ date_sent: -1 }).limit(10);
        socket.emit('loadMessages', messages.reverse());

        const timestamp = moment().format('hh:mm A');
        socket.broadcast.to(room).emit('message', {
            username: 'System',
            message: `${username} has joined the chat`,
            time: timestamp
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
            });

            await newMessage.save();

            io.to(user.room).emit('message', {
                username: user.username,
                message: message,
                time: timestamp
            });
        }
    });

    socket.on('sendPrivateMessage', async ({ to_user, message }) => {
        const from_user = users[socket.id]?.username;
        if (!from_user) return;

        const timestamp = moment().format('hh:mm A');

        const newMessage = new Message({
            from_user,
            to_user,
            message: message
        });

        await newMessage.save();

        const recipientSocket = Object.keys(users).find(
            key => users[key].username === to_user
        );

        if (recipientSocket) {
            io.to(recipientSocket).emit('privateMessage', {
                from_user,
                message,
                time: timestamp
            });
        }
    });

    socket.on('typing', ({ username, room }) => {
        socket.broadcast.to(room).emit('userTyping', { username });
    });
    
    socket.on('stopTyping', ({ room }) => {
        socket.broadcast.to(room).emit('userStoppedTyping');
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
        io.emit('updateUserList', Object.values(users).map(user => user.username));
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
