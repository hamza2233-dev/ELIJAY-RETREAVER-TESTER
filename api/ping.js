const fetch = require('node-fetch');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

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
    const inboundNumber = "18883259916";

    const params = new URLSearchParams({
        key: apiKey,
        publisher_id: publisherId,
        inbound_number: inboundNumber,
        caller_number: callerNumber,
        ad_id: ""
    });

    const targetUrl = `${baseUrl}?${params.toString()}`;

    try {
        const response = await fetch(targetUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
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
