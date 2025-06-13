// receiver.js

import dgram from 'node:dgram';
import os from 'os';

const RELAY_IP = '10.0.1.1';     // Relay IP
const RELAY_PORT = 9000;        // Relay's input port
const RECEIVE_PORT = 9001;      // Your fixed listen port
const MY_NAME = os.hostname();

const socket = dgram.createSocket('udp4'); // 👈 One socket does it all
let hasRegistered = false;

socket.on('message', (msg, rinfo) => {
  const text = msg.toString();

  if (text.startsWith('ACK')) {
    hasRegistered = true;
    console.log(`✅ Registered with relay ${RELAY_IP}:${RELAY_PORT}`);
  } else {
    console.log(`📥 From relay: "${text}"`);
  }
});

function register() {
  const msg = Buffer.from(`REGISTER ${RECEIVE_PORT}`);
  socket.send(msg, 0, msg.length, RELAY_PORT, RELAY_IP, (err) => {
    if (err) console.error('❌ REGISTER send error:', err);
    else console.log('📤 Sent REGISTER to relay, awaiting ACK...');
  });

  setTimeout(() => {
    if (!hasRegistered) {
      console.log('⏳ No ACK received, retrying registration...');
      register();
    }
  }, 2000);
}

socket.bind(RECEIVE_PORT, () => {
  console.log(`👂 Listening on ${RECEIVE_PORT} for messages`);
  register();
});