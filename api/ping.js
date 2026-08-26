const fetch = require('node-fetch');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const callerNumber = req.query.caller_number;

    if (!callerNumber) {
        return res.status(400).json({ error: "Missing caller_number parameter" });
    }

    const baseUrl = "https://rtb.retreaver.com/rtbs.json";
    const apiKey = "890cbeae-d1df-4a85-bd34-e01151abb477";
    const publisherId = "288bd423";

    // Build query parameters (omitting inbound_number)
    const params = new URLSearchParams({
        key: apiKey,
        publisher_id: publisherId,
        caller_number: callerNumber,
        ad_id: ""
    });

    const targetUrl = `${baseUrl}?${params.toString()}`;

    try {
        // Retreaver RTB expects a POST request
        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        const textData = await response.text();
        
        if (textData.includes("sign in") || textData.includes("sign up") || textData.includes("<!DOCTYPE html>")) {
            return res.status(401).json({ 
                error: "Authentication Error: Retreaver rejected the Postback Key or required a POST method. Please verify your RTB Postback Key permissions." 
            });
        }

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
