$(document).ready(() => {
    const socket = io();
    let currentRoom = null;
    const user = getUser();

    if (!user) {
        window.location.href = "login.html";
    }

    $('#joinRoomBtn').on('click', function () {
        const room = $('#roomSelect').val();
        if (currentRoom) {
            alert("You must leave the current room before joining another.");
            return;
        }
        currentRoom = room;
        socket.emit('joinRoom', { username: user.username, room });
    
        $('#chatMessages').empty(); 
        $('#chatMessages').append(`<li class="list-group-item">You joined ${room}</li>`);
        $('#messageInput').prop("disabled", false);
        $('#sendMessageBtn').prop("disabled", false);
        $('#leaveRoomBtn').show();
        $('#joinRoomBtn').hide();
    });

    $('#leaveRoomBtn').on('click', function () {
        if (currentRoom) {
            socket.emit('leaveRoom', { username: user.username, room: currentRoom });
            $('#chatMessages').empty(); 
            $('#chatMessages').append(`<li class="list-group-item">You left ${currentRoom}</li>`);
            currentRoom = null;
        }
    
        $('#messageInput').prop("disabled", true);
        $('#sendMessageBtn').prop("disabled", true);
        $('#leaveRoomBtn').hide();
        $('#joinRoomBtn').show();
    });
    

    $('#sendMessageBtn').on('click', function () {
        const message = $('#messageInput').val().trim();
        if (message && currentRoom) {
            socket.emit('sendMessage', { message });
            $('#messageInput').val('');
        }
    });

    function scrollToBottom() {
        $('#chatContainer').animate({ scrollTop: $('#chatContainer')[0].scrollHeight }, 300);
    }

    socket.on('message', (data) => {
        $('#chatMessages').append(`
            <li class="list-group-item">
                <small class="text-muted">${data.time}</small><br>
                <strong>${data.username}:</strong> ${data.message}
            </li>
        `);
        scrollToBottom();
    });

    socket.on('loadMessages', (messages) => {
        $('#chatMessages').empty();
        messages.forEach((msg) => {
            const time = moment(msg.date_sent).format('hh:mm A'); 
            $('#chatMessages').append(`
                <li class="list-group-item">
                    <small class="text-muted">${time}</small><br>
                    <strong>${msg.from_user}:</strong> ${msg.message}
                </li>
            `);
        });
        scrollToBottom();
    });

    $('#sendPrivateMessageBtn').on('click', function () {
        const to_user = $('#privateUserSelect').val();
        const message = $('#privateMessageInput').val().trim();
        if (to_user && message) {
            socket.emit('sendPrivateMessage', { to_user, message });
            $('#privateMessageInput').val('');
        }
    });

    socket.on('privateMessage', (data) => {
        $('#chatMessages').append(`
            <li class="list-group-item bg-light">
                <small class="text-muted">${data.time} (Private)</small><br>
                <strong>${data.from_user}:</strong> ${data.message}
            </li>
        `);
    });

    socket.on('updateUserList', (userList) => {
        $('#privateUserSelect').empty().append('<option value="">Select a user to message privately</option>');
        
        userList.forEach((username) => {
            if (username !== user.username) { 
                $('#privateUserSelect').append(`<option value="${username}">${username}</option>`);
            }
        });
    
        if (userList.length > 1) {
            $('#privateMessageInput, #sendPrivateMessageBtn').prop("disabled", false);
        } else {
            $('#privateMessageInput, #sendPrivateMessageBtn').prop("disabled", true);
        }
    });

        let typingTimeout;

    $('#messageInput').on('input', function () {
        socket.emit('typing', { username: user.username, room: currentRoom });

        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            socket.emit('stopTyping', { room: currentRoom });
        }, 2000); 
    });

    socket.on('userTyping', (data) => {
        $('#typingIndicator').text(`${data.username} is typing...`);
    });

    socket.on('userStoppedTyping', () => {
        $('#typingIndicator').text('');
    });

    $('#logoutBtn').on('click', function () {
        logout();
    });
});
