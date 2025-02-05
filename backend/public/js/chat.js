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

    socket.on('message', (data) => {
        $('#chatMessages').append(`
            <li class="list-group-item">
                <small class="text-muted">${data.time}</small><br>
                <strong>${data.username}:</strong> ${data.message}
            </li>
        `);
    });

    socket.on('loadMessages', (messages) => {
        $('#chatMessages').empty(); // Clear existing messages
        messages.forEach((msg) => {
            const time = moment(msg.date_sent).format('hh:mm A'); // Format stored timestamp
            $('#chatMessages').append(`
                <li class="list-group-item">
                    <small class="text-muted">${time}</small><br>
                    <strong>${msg.from_user}:</strong> ${msg.message}
                </li>
            `);
        });
    });

    $('#logoutBtn').on('click', function () {
        logout();
    });
});
