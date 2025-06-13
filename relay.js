// relay.js

import dgram from 'node:dgram';

const RELAY_PORT_IN = 9000;
const RELAY_PORT_OUT = 9001;

const relay = dgram.createSocket('udp4');

const registeredReceivers = new Map();

relay.on('message', (msg, rinfo) => {
  const text = msg.toString().trim();
  const parts = text.split(' ');
  const command = parts[0];

  if (command === 'REGISTER') {
    const port = parseInt(parts[1], 10) || rinfo.port;
    const name = parts[2] || 'unknown';

    registeredReceivers.set(rinfo.address, {
      port,
      name,
      lastSeen: Date.now()
    });

    console.log(`✅ Registered receiver: ${name} @ ${rinfo.address}:${port}`);

    const ack = Buffer.from('ACK Registered');
    relay.send(ack, 0, ack.length, rinfo.port, rinfo.address, (err) => {
      if (err) console.error(`❌ Error sending ACK to ${rinfo.address}:${rinfo.port}`, err);
      else console.log(`📨 ACK sent to ${rinfo.address}:${rinfo.port}`);
    });
    return;
  }

  const now = Date.now();
  const payload = Buffer.from(text);
  console.log(`📥 Message from sender ${rinfo.address}:${rinfo.port}: "${text}"`);

  for (const [ip, { port, name, lastSeen }] of registeredReceivers.entries()) {
    if (now - lastSeen > 60 * 1000) {
      console.log(`🗑️ Pruned stale receiver: ${name} @ ${ip}`);
      registeredReceivers.delete(ip);
      continue;
    }

    relay.send(payload, 0, payload.length, RELAY_PORT_OUT, ip, (err) => {
      if (err) console.error(`❌ Failed to send to ${ip}:${RELAY_PORT_OUT}`, err);
      else console.log(`📤 Relayed to ${name} @ ${ip}:${RELAY_PORT_OUT}`);
    });
  }
});

relay.bind(RELAY_PORT_IN, () => {
  console.log(`🛰️ Relay is listening on port ${RELAY_PORT_IN}`);
});