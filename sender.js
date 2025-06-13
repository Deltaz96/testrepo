// receiver.js

import dgram from 'node:dgram';
import os from 'os';

const RELAY_IP = '10.0.1.2'; // 🔁 Update with relay's actual IP
const RELAY_PORT = 9999;
const MY_PORT = 41234;
const MY_NAME = os.hostname();

const receiver = dgram.createSocket('udp4');

// Register with relay
function register() {
  const msg = Buffer.from(`REGISTER ${MY_NAME} ${MY_PORT}`);
  receiver.send(msg, 0, msg.length, RELAY_PORT, RELAY_IP, (err) => {
    if (err) console.error('❌ Registration failed:', err);
    else console.log('✅ Registered with relay');
  });
}

receiver.on('message', (msg, rinfo) => {
  console.log(`📥 Received: "${msg.toString()}" from ${rinfo.address}:${rinfo.port}`);
});

receiver.bind(MY_PORT, () => {
  console.log(`👂 Receiver listening on port ${MY_PORT}`);
  register();
});