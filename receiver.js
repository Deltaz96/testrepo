// sender.js

import dgram from 'node:dgram';

const RELAY_IP = '10.0.1.2'; // 🔁 Replace with actual relay IP
const RELAY_PORT = 9999;

const socket = dgram.createSocket('udp4');
const message = 'MESSAGE Hello to all registered receivers! 🚀';

socket.send(message, 0, message.length, RELAY_PORT, RELAY_IP, (err) => {
  if (err) {
    console.error('❌ Failed to send message:', err);
  } else {
    console.log('✅ Message sent to relay');
  }
  socket.close();
});