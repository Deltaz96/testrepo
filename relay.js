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
    console.log(`✅ CONNECT: ${name} @ ${rinfo.address}:${port}`);

    const ack = Buffer.from('ACK Registered');
    relay.send(ack, 0, ack.length, rinfo.port, rinfo.address);
    return;
  }

  if (command === 'UNREGISTER') {
    const name = parts[1] || 'unknown';
    if (registeredReceivers.has(rinfo.address)) {
      registeredReceivers.delete(rinfo.address);
      console.log(`🚪 DISCONNECT: ${name} @ ${rinfo.address}`);
    }
    return;
  }

  const payload = Buffer.from(text);
  console.log(`📥 Message from sender ${rinfo.address}:${rinfo.port}: "${text}"`);

  for (const [ip, {name}] of registeredReceivers.entries()) {
    relay.send(payload, 0, payload.length, RELAY_PORT_OUT, ip, (err) => {
      if (err) console.error(`❌ Send error to ${ip}:${RELAY_PORT_OUT}`, err);
      else console.log(`📤 Relayed to ${name} @ ${ip}:${RELAY_PORT_OUT}`);
    });
  }
});

relay.bind(RELAY_PORT_IN, () => {
  console.log(`🛰️ Relay listening on ${RELAY_PORT_IN}`);
});