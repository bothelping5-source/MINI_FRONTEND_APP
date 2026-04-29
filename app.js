// At the top, in DOM elements area, replace current dropdown logic
let selectedPair = "";
let selectedTimeframe = "1 MIN";
const apiURL = "https://mini-app-one.onrender.com"; // Set this placeholder correctly

// Timeframe button logic
document.querySelectorAll('.time-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedTimeframe = btn.dataset.time;
    });
});

// Dual Market Dropdown logic (Ensure only one dropdown selection at a time)
const liveSelect = document.getElementById('live-pairs');
const otcSelect = document.getElementById('otc-pairs');

liveSelect.addEventListener('change', () => {
    if(liveSelect.value) {
        selectedPair = liveSelect.value;
        otcSelect.value = ""; // De-select OTC
    }
});
otcSelect.addEventListener('change', () => {
    if(otcSelect.value) {
        selectedPair = otcSelect.value;
        liveSelect.value = ""; // De-select Live
    }
});

// Populating dropdowns on init (Needs new API endpoint /init_data in bot.py)
async function populateMarkets() {
    try {
        const res = await fetch(`${apiURL}/api/init_data`);
        const data = await res.json();
        
        data.live_pairs.forEach(pair => {
            const op = document.createElement('option');
            op.value = pair; op.textContent = "🇺🇸 " + pair; // Add flags in JS, or backend. Simple US flag example.
            liveSelect.appendChild(op);
        });
        data.otc_pairs.forEach(pair => {
            const op = document.createElement('option');
            op.value = pair; op.textContent = "🇺🇸 " + pair;
            otcSelect.appendChild(op);
        });
        
        document.getElementById('admin-contact').textContent = data.admin_contact; // Update VIP contact

    } catch (e) { console.log("Market init failed"); }
}

// TAB NAVIGATION LOGIC
document.getElementById('nav-scanner').addEventListener('click', () => {
    document.getElementById('nav-scanner').classList.add('active');
    document.getElementById('nav-education').classList.remove('active');
    document.getElementById('tab-scanner').classList.remove('hidden');
    document.getElementById('tab-education').classList.add('hidden');
});
document.getElementById('nav-education').addEventListener('click', () => {
    document.getElementById('nav-scanner').classList.remove('active');
    document.getElementById('nav-education').classList.add('active');
    document.getElementById('tab-scanner').classList.add('hidden');
    document.getElementById('tab-education').classList.remove('hidden');
});

// Update the scan button logic to send timeframe and pair correctly
document.getElementById('btn-scan').addEventListener('click', async () => {
    if(!selectedPair) return showAlert("SELECT PROTOCOL: Live or OTC Market required.");
    
    // ... Radar spin logic same as before but uses "selectedTimeframe" and "selectedPair" ...
    // Update API call:
    const res = await fetch(`${apiURL}/api/signal`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({user_id: userId, pair: selectedPair, timeframe: selectedTimeframe})
    });
    const data = await res.json();
    
    // Final result logic (Accuracy and Colors) needs update in app.js
    if (data.success) {
        document.getElementById('result-direction').textContent = data.direction;
        document.getElementById('result-accuracy').textContent = data.accuracy + "%";
        
        const resultPopup = document.getElementById('signal-result');
        if(data.direction.includes("BUY")) {
            resultPopup.style.color = "#00ff00"; // Green
        } else {
            resultPopup.style.color = "#ff4d4f"; // Red
        }
        // ... rest of logic to hide/show and disabled same as before ...
    }
});

// On load, update status and markets
checkStatus();
populateMarkets();
