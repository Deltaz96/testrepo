import dgram from 'node:dgram';

const RELAY_IP = '10.0.1.1';
const RELAY_PORT = 9000;

const socket = dgram.createSocket('udp4');
const msg = Buffer.from('🔥 Message from sender!');

socket.send(msg, 0, msg.length, RELAY_PORT, RELAY_IP, (err) => {
  if (err) console.error('❌ Error sending:', err);
  else console.log('✅ Message sent to relay');
  socket.close();
});