let autoPingInterval = null;
let lastSearchedNumber = "";
let lastInboundNumber = "";

// Retreaver credentials configuration
const RETREAVER_CONFIG = {
    baseUrl: "https://rtb.retreaver.com/rtbs.json",
    key: "890cbeae-d1df-4a85-bd34-e01151abb477",
    publisher_id: "288bd423",
    inbound_number: "18883259916"
};

function speakReserved() {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        let utterance = new SpeechSynthesisUtterance("Lead Reserved!");
        utterance.rate = 1.0;
        utterance.pitch = 1.1;
        utterance.volume = 1.0;
        window.speechSynthesis.speak(utterance);
    }
}

function formatCallerNumber(rawNum) {
    let cleaned = rawNum.replace(/[^0-9]/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
        return '+' + cleaned;
    } else if (cleaned.length === 10) {
        return '+1' + cleaned;
    }
    return rawNum.startsWith('+') ? rawNum : '+' + cleaned;
}

function stripPlusOne(numStr) {
    let clean = numStr.replace(/[^0-9]/g, '');
    if (clean.length === 11 && clean.startsWith('1')) {
        return clean.substring(1);
    }
    return clean;
}

function checkNewNumber() {
    let currentInput = document.getElementById('callerNumber').value.trim();
    let formattedCurrent = formatCallerNumber(currentInput);
    if (formattedCurrent !== lastSearchedNumber && lastSearchedNumber !== "") {
        stopAutoPing();
        document.getElementById('statusAlert').style.display = 'none';
        document.getElementById('jsonResponse').innerHTML = "Ready for new number: " + formattedCurrent;
    }
}

function sendPingRequest() {
    let rawInput = document.getElementById('callerNumber').value.trim();
    if (!rawInput) {
        alert('Please enter a valid client phone number.');
        stopAutoPing();
        return;
    }

    let formattedCaller = formatCallerNumber(rawInput);
    
    if (formattedCaller !== lastSearchedNumber) {
        lastSearchedNumber = formattedCaller;
        document.getElementById('jsonResponse').innerHTML = "";
    }

    // Build parameters dynamically for your Retreaver RTB endpoint
    let params = new URLSearchParams({
        key: RETREAVER_CONFIG.key,
        publisher_id: RETREAVER_CONFIG.publisher_id,
        inbound_number: RETREAVER_CONFIG.inbound_number,
        caller_number: formattedCaller,
        ad_id: ""
    });

    let targetUrl = `${RETREAVER_CONFIG.baseUrl}?${params.toString()}`;

    let alertBox = document.getElementById('statusAlert');
    let jsonBox = document.getElementById('jsonResponse');
    let timestamp = new Date().toLocaleTimeString();
    let pingLogHeader = `--- Sending ping for ${formattedCaller} [${timestamp}] ---\n`;

    fetch(targetUrl, {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        }
    })
    .then(response => response.text())
    .then(data => {
        let parsedData;
        try {
            parsedData = JSON.parse(data);
            jsonBox.innerHTML = pingLogHeader + JSON.stringify(parsedData, null, 2) + "\n\n" + jsonBox.innerHTML;
        } catch (e) {
            parsedData = {};
            jsonBox.innerHTML = pingLogHeader + data + "\n\n" + jsonBox.innerHTML;
        }

        let dataStr = data.toLowerCase();
        // Check Retreaver response conditions for match/reservation
        if (dataStr.includes('reserved') || dataStr.includes('match') || parsedData.dial_number || parsedData.target) {
            let rawInbound = parsedData.inbound_number || RETREAVER_CONFIG.inbound_number;
            lastInboundNumber = rawInbound;
            let displayDid = stripPlusOne(rawInbound);
            
            speakReserved();

            alertBox.className = 'alert-box alert-success';
            alertBox.style.display = 'flex';
            alertBox.innerHTML = `<span>SUCCESS: Lead Reserved! - <b>${displayDid}</b></span> <button class="copy-btn" onclick="copyDid()">Copy DID</button>`;
            stopAutoPing();
        } else if (dataStr.includes('no-target') || dataStr.includes('reject') || dataStr.includes('error')) {
            alertBox.className = 'alert-box alert-error';
            alertBox.style.display = 'flex';
            alertBox.innerHTML = `<span>STATUS: ${parsedData.status || 'No Target / Rejected'}</span>`;
        } else {
            alertBox.className = 'alert-box alert-success';
            alertBox.style.display = 'flex';
            alertBox.innerHTML = `<span>Response received successfully.</span>`;
        }
    })
    .catch(error => {
        alertBox.className = 'alert-box alert-error';
        alertBox.style.display = 'flex';
        alertBox.innerHTML = `<span>Error / CORS Block: Check console or proxy setup.</span>`;
        jsonBox.innerHTML = pingLogHeader + `Error: ${error.message}\n` + jsonBox.innerHTML;
    });
}

function copyDid() {
    if (lastInboundNumber) {
        let displayDid = stripPlusOne(lastInboundNumber);
        navigator.clipboard.writeText(displayDid).then(() => {
            alert("DID " + displayDid + " copied to clipboard!");
        });
    }
}

function copyJsonText() {
    let jsonText = document.getElementById('jsonResponse').innerText;
    navigator.clipboard.writeText(jsonText).then(() => {
        alert("Full JSON copied to clipboard!");
    });
}

function startPing() {
    let isAuto10 = document.getElementById('pingAuto10').checked;
    let isAuto5 = document.getElementById('pingAuto5').checked;
    
    sendPingRequest();

    if (isAuto10 || isAuto5) {
        document.getElementById('pingBtn').disabled = true;
        document.getElementById('stopBtn').style.display = 'block';
        
        if (autoPingInterval) clearInterval(autoPingInterval);
        
        let intervalTime = isAuto5 ? 5000 : 10000;
        
        autoPingInterval = setInterval(() => {
            sendPingRequest();
        }, intervalTime);
    }
}

function stopAutoPing() {
    if (autoPingInterval) {
        clearInterval(autoPingInterval);
        autoPingInterval = null;
    }
    document.getElementById('pingBtn').disabled = false;
    document.getElementById('stopBtn').style.display = 'none';
}
