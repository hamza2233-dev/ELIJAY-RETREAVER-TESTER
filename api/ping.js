document.getElementById('pingBtn').addEventListener('click', async () => {
    const callerNumber = document.getElementById('caller_number').value.trim();
    const adId = document.getElementById('ad_id').value.trim();
    const resultBox = document.getElementById('result');

    // Your base Retreaver RTB URL credentials
    const baseUrl = "https://rtb.retreaver.com/rtbs.json";
    const apiKey = "890cbeae-d1df-4a85-bd34-e01151abb477";
    const publisherId = "288bd423";
    const inboundNumber = "18883259916";

    // Construct query parameters
    const params = new URLSearchParams({
        key: apiKey,
        publisher_id: publisherId,
        inbound_number: inboundNumber,
        caller_number: callerNumber,
        ad_id: adId
    });

    const targetUrl = `${baseUrl}?${params.toString()}`;

    resultBox.textContent = "Sending RTB ping...";

    try {
        // Note: Depending on Retreaver's CORS configuration, browser-to-server fetches 
        // might trigger a CORS policy block. If that happens, run this via a backend script or server.
        const response = await fetch(targetUrl, {
            method: 'POST', // Retreaver RTB typically expects a POST request
            headers: {
                'Accept': 'application/json'
            }
        });

        const data = await response.json();
        resultBox.textContent = JSON.stringify(data, null, 2);
    } catch (error) {
        resultBox.textContent = `Error/CORS Block: ${error.message}\n\nTip: If you run into browser CORS restrictions, test this endpoint using cURL or a backend proxy.`;
    }
});
