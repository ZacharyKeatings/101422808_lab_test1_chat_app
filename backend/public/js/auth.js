async function signup(username, firstname, lastname, password) {
    try {
        const response = await fetch('/api/users/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, firstname, lastname, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Signup failed.');
        }

        alert('Signup successful! Please log in.');
        window.location.href = "login.html";
    } catch (error) {
        alert(error.message);
    }
}


async function login(username, password) {
    try {
        const response = await fetch('/api/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Login failed.');
        }

        localStorage.setItem('user', JSON.stringify(data));
        window.location.href = "chat.html";
    } catch (error) {
        alert(error.message);
    }
}

function checkUserSession() {
    const user = localStorage.getItem('user');

    if (!user) {
        window.location.href = "login.html"; 
    }
}

function getUser() {
    return JSON.parse(localStorage.getItem('user'));
}

async function logout() {
    localStorage.removeItem('user'); 

    await fetch('/api/users/logout', { method: 'POST' }); 
    
    window.location.href = "login.html"; 
}

document.addEventListener("DOMContentLoaded", () => {
    const signupForm = document.getElementById("signupForm");
    if (signupForm) {
        signupForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const username = document.getElementById("username").value;
            const firstname = document.getElementById("firstname").value;
            const lastname = document.getElementById("lastname").value;
            const password = document.getElementById("password").value;
            signup(username, firstname, lastname, password);
        });
    }

    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;
            login(username, password);
        });
    }

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function () {
            logout();
        });
    }
});
