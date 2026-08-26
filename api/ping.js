const fetch = require('node-fetch');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    let callerNumber = req.query.caller_number;

    if (!callerNumber) {
        return res.status(400).json({ error: "Missing caller_number parameter" });
    }

    // Ensure proper E.164 format (+1XXXXXXXXXX) to prevent malformed errors
    let cleaned = callerNumber.replace(/[^0-9]/g, '');
    if (cleaned.length === 10) {
        callerNumber = '+1' + cleaned;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
        callerNumber = '+' + cleaned;
    } else if (!callerNumber.startsWith('+')) {
        callerNumber = '+' + cleaned;
    }

    const baseUrl = "https://rtb.retreaver.com/rtbs.json";
    const apiKey = "890cbeae-d1df-4a85-bd34-e01151abb477";
    const publisherId = "288bd423";

    const params = new URLSearchParams({
        key: apiKey,
        publisher_id: publisherId,
        caller_number: callerNumber,
        ad_id: ""
    });

    const targetUrl = `${baseUrl}?${params.toString()}`;

    try {
        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        const textData = await response.text();
        
        try {
            const jsonData = JSON.parse(textData);
            return res.status(200).json(jsonData);
        } catch (err) {
            return res.status(200).send(textData);
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
