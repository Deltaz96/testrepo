// relay.js

import dgram from 'node:dgram';

const LISTEN_PORT = 9999; // relay listens for registration and messages
const SEND_PORT = 5001;   // port used to send out messages to receivers

const relay = dgram.createSocket('udp4');

const receivers = new Map(); // ip -> { name, port }

relay.on('message', (msg, rinfo) => {
  const text = msg.toString().trim();
  const [cmd, ...args] = text.split(' ');

  if (cmd === 'REGISTER') {
    const [name, portStr] = args;
    const port = parseInt(portStr, 10);

    if (!name || isNaN(port)) {
      console.warn(`⚠️ Invalid REGISTER from ${rinfo.address}`);
      return;
    }

    receivers.set(rinfo.address, { name, port });
    console.log(`✅ Registered: ${name} (${rinfo.address}:${port})`);
  }

  else if (cmd === 'MESSAGE') {
    const payload = args.join(' ');
    console.log(`📨 Message from ${rinfo.address}: "${payload}"`);

    for (const [ip, { name, port }] of receivers.entries()) {
      const buffer = Buffer.from(`[${name}@${ip}] ${payload}`);
      relay.send(buffer, 0, buffer.length, port, ip, (err) => {
        if (err) {
          console.error(`❌ Error sending to ${ip}:${port}`, err);
        } else {
          console.log(`📤 Sent to ${name} at ${ip}:${port}`);
        }
      });
    }
  }
});

relay.bind(LISTEN_PORT, () => {
  console.log(`🛰️ Relay listening on port ${LISTEN_PORT}`);
});