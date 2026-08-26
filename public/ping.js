let autoPingInterval = null;
let lastSearchedNumber = "";
let lastInboundNumber = "";
const DEFAULT_INBOUND = "18883259916";

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

    let url = `/api/ping?caller_number=${encodeURIComponent(formattedCaller)}`;

    let alertBox = document.getElementById('statusAlert');
    let jsonBox = document.getElementById('jsonResponse');
    let timestamp = new Date().toLocaleTimeString();
    let pingLogHeader = `--- Sending ping for ${formattedCaller} [${timestamp}] ---\n`;

    fetch(url)
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
        if (dataStr.includes('reserved') || dataStr.includes('match') || parsedData.dial_number || parsedData.target) {
            let rawInbound = parsedData.inbound_number || DEFAULT_INBOUND;
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
        alertBox.innerHTML = `<span>Error: ${error.message}</span>`;
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
