import dgram from 'node:dgram';
import os from 'os';

const RELAY_IP = '10.0.1.1';
const RELAY_PORT = 9000;
const RECEIVE_PORT = 9001;
const MY_NAME = os.hostname();

const socket = dgram.createSocket('udp4');

function register() {
  const msg = Buffer.from(`REGISTER ${RECEIVE_PORT}`);
  socket.send(msg, 0, msg.length, RELAY_PORT, RELAY_IP, (err) => {
    if (err) console.error('❌ Registration failed:', err);
    else console.log(`✅ Registered with relay ${RELAY_IP}:${RELAY_PORT}`);
  });
}

socket.on('message', (msg, rinfo) => {
  console.log(`📥 Received from relay: "${msg.toString()}"`);
});

socket.bind(RECEIVE_PORT, () => {
  console.log(`👂 Listening on ${RECEIVE_PORT}`);
  register();
});