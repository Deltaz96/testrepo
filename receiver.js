import dgram from 'node:dgram';
import os from 'os';

const RELAY_IP = '10.0.1.1';
const RELAY_PORT = 9000;
const RECEIVE_PORT = 9001;
const MY_NAME = os.hostname();

const socket = dgram.createSocket('udp4');
let hasRegistered = false;
let heartbeatTimer = null;

function register() {
  const msg = Buffer.from(`REGISTER ${RECEIVE_PORT} ${MY_NAME}`);
  socket.send(msg, 0, msg.length, RELAY_PORT, RELAY_IP, (err) => {
    if (err) console.error('❌ REGISTER failed:', err);
    else console.log('📤 Sent REGISTER to relay...');
  });

  setTimeout(() => {
    if (!hasRegistered) {
      console.log('⏳ No ACK, retrying...');
      register();
    }
  }, 2000);
}

function startHeartbeat() {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(() => {
    hasRegistered = false;
    register();
  }, 2 * 60 * 1000);
}

function unregister() {
  const msg = Buffer.from(`UNREGISTER ${MY_NAME}`);
  socket.send(msg, 0, msg.length, RELAY_PORT, RELAY_IP, () => {
    console.log('🚪 Sent UNREGISTER to relay. Exiting...');
    socket.close();
    process.exit(0);
  });
}

socket.on('message', (msg) => {
  const text = msg.toString();
  if (text.startsWith('ACK')) {
    if (!hasRegistered) {
      console.log('✅ Registered with relay');
      startHeartbeat();
    }
    hasRegistered = true;
  } else {
    console.log(`📥 From relay: "${text}"`);
  }
});

socket.bind(RECEIVE_PORT, () => {
  console.log(`👂 Listening on ${RECEIVE_PORT}`);
  register();
});

process.on('SIGINT', unregister);
process.on('SIGTERM', unregister);