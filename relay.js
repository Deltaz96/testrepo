import dgram from 'node:dgram';

const RELAY_PORT_IN = 9000;
const RELAY_PORT_OUT = 9001;

const relay = dgram.createSocket('udp4');

const registeredReceivers = new Map();

function logPeers() {
  console.log('📋 Current receivers:');
  for (const [ip, data] of registeredReceivers.entries()) {
    console.log(`   - ${ip}:${data.port} (last seen ${Math.floor((Date.now() - data.lastSeen) / 1000)}s ago)`);
  }
  if (registeredReceivers.size === 0) {
    console.log('   (none registered)');
  }
}

relay.on('message', (msg, rinfo) => {
  const text = msg.toString().trim();
  const [command, arg] = text.split(' ');

  if (command === 'REGISTER') {
    const port = parseInt(arg, 10) || rinfo.port;
    registeredReceivers.set(rinfo.address, {
      port,
      lastSeen: Date.now(),
    });

    console.log(`✅ Registered receiver: ${rinfo.address}:${port}`);

    const ack = Buffer.from('ACK Registered');
    relay.send(ack, 0, ack.length, rinfo.port, rinfo.address, (err) => {
      if (err) {
        console.error(`❌ Error sending ACK to ${rinfo.address}:${rinfo.port}`, err);
      } else {
        console.log(`📨 ACK sent to ${rinfo.address}:${rinfo.port}`);
      }
    });

    return;
  }

  const message = Buffer.from(text);
  console.log(`📥 Message from sender ${rinfo.address}:${rinfo.port}: "${text}"`);
  logPeers();

  const now = Date.now();
  for (const [ip, { port, lastSeen }] of registeredReceivers.entries()) {
    if (now - lastSeen > 1 * 10 * 1000) {
      console.log(`🗑️ Removing stale receiver: ${ip}`);
      registeredReceivers.delete(ip);
      continue;
    }

    relay.send(message, 0, message.length, RELAY_PORT_OUT, ip, (err) => {
      if (err) {
        console.error(`❌ Error sending to ${ip}:${RELAY_PORT_OUT}`, err);
      } else {
        console.log(`📤 Relayed to ${ip}:${RELAY_PORT_OUT}`);
      }
    });
  }
});

relay.bind(RELAY_PORT_IN, () => {
  console.log(`🛰️ Relay server is listening on port ${RELAY_PORT_IN}`);
});