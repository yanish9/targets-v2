const WebSocket = require('ws');

const WEBSOCKET_URL = 'ws://10.240.242.96:8765';

function connectWebSocket() {
    console.log(`Connecting to WebSocket server at ${WEBSOCKET_URL}...`);

    ws = new WebSocket(WEBSOCKET_URL);

    // Handle WebSocket open event
    ws.on('open', () => {
        console.log('Connected to WebSocket server');
        ws.send('Hello!');
    });

    // Handle incoming messages
    ws.on('message', (message) => {
        console.log(`Received message from WebSocket server: ${message}`);
        var targetList = JSON.stringify(message);



    });

    // Handle errors
    ws.on('error', (error) => {
        console.error(`WebSocket error: ${error.message}`);
    });

    // Handle connection close and attempt to reconnect
    ws.on('close', () => {
        console.log('Disconnected from WebSocket server. Reconnecting in 5 seconds...');
        setTimeout(connectWebSocket, 5000); // Retry after 5 seconds
    });
}

// Start the WebSocket connection
connectWebSocket();