import dgram from 'node:dgram';

const RELAY_PORT_IN = 9000;
const RELAY_PORT_OUT = 9001;

const relay = dgram.createSocket('udp4');

const registeredReceivers = new Map();

relay.on('message', (msg, rinfo) => {
  const text = msg.toString().trim();

  if (text.startsWith('REGISTER')) {
    const port = parseInt(text.split(' ')[1], 10) || rinfo.port;
    registeredReceivers.set(rinfo.address, { port, lastSeen: Date.now() });

    console.log(`✅ Registered receiver: ${rinfo.address}:${port}`);
    return;
  }

  console.log(`📥 Message from sender ${rinfo.address}:${rinfo.port}: ${text}`);

  const payload = Buffer.from(text);
  for (const [ip, { port }] of registeredReceivers.entries()) {
    relay.send(payload, 0, payload.length, RELAY_PORT_OUT, ip, (err) => {
      if (err) {
        console.error(`❌ Error sending to ${ip}:${RELAY_PORT_OUT}`, err);
      } else {
        console.log(`📤 Relayed to ${ip}:${RELAY_PORT_OUT}`);
      }
    });
  }
});

relay.bind(RELAY_PORT_IN, () => {
  console.log(`🛰️ Relay is listening for senders on port ${RELAY_PORT_IN}`);
});