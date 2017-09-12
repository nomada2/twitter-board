const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8000');

ws.on('open', function open() {
  ws.send('javascript');
  console.log('connected');
});

ws.on('message', function incoming(data) {
  console.log(JSON.parse(data));
});

ws.on('close', function close() {
    console.log('disconnected');
});
  