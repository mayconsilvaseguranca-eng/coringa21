// Broker MQTT 3.1.1 mínimo sobre WebSocket + servidor do index.html. Usado só nos testes,
// para as salas funcionarem sem depender dos servidores públicos.
import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HTML = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'index.html');

export function startBroker(port) {

const retained = new Map();
const clients = new Set();

function match(filter, topic) {
  const f = filter.split('/'), t = topic.split('/');
  for (let i = 0; i < f.length; i++) {
    if (f[i] === '#') return true;
    if (i >= t.length) return false;
    if (f[i] !== '+' && f[i] !== t[i]) return false;
  }
  return f.length === t.length;
}
function rl(n) { const o = []; do { let d = n % 128; n = Math.floor(n / 128); if (n > 0) d |= 128; o.push(d); } while (n > 0); return o; }
function pkt(h, body) { return Buffer.concat([Buffer.from([h, ...rl(body.length)]), Buffer.from(body)]); }
function str(s) { const b = Buffer.from(s); return Buffer.concat([Buffer.from([b.length >> 8, b.length & 255]), b]); }
function wsFrame(data) {
  const len = data.length; let hdr;
  if (len < 126) hdr = Buffer.from([0x82, len]);
  else if (len < 65536) hdr = Buffer.from([0x82, 126, len >> 8, len & 255]);
  else { hdr = Buffer.alloc(10); hdr[0] = 0x82; hdr[1] = 127; hdr.writeBigUInt64BE(BigInt(len), 2); }
  return Buffer.concat([hdr, data]);
}
function publishOut(topic, payload, retainFlag) { return pkt(0x30 | (retainFlag ? 1 : 0), Buffer.concat([str(topic), payload])); }
function route(topic, payload, from) {
  for (const c of clients) if (c.subs.some(f => match(f, topic))) c.send(publishOut(topic, payload, false));
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/index.html') || req.url === '/' || req.url.startsWith('/?')) {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(fs.readFileSync(HTML));
  } else { res.writeHead(404); res.end(); }
});
server.on('upgrade', (req, sock) => {
  const key = req.headers['sec-websocket-key'];
  const accept = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  const proto = (req.headers['sec-websocket-protocol'] || '').split(',').map(s => s.trim());
  sock.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n${proto.includes('mqtt') ? 'Sec-WebSocket-Protocol: mqtt\r\n' : ''}\r\n`);
  const c = { subs: [], will: null, clean: false, send: d => { try { sock.write(wsFrame(d)); } catch (e) {} } };
  clients.add(c);
  let wsBuf = Buffer.alloc(0), mq = Buffer.alloc(0);
  sock.on('data', chunk => {
    wsBuf = Buffer.concat([wsBuf, chunk]);
    for (;;) {
      if (wsBuf.length < 2) break;
      const op = wsBuf[0] & 15, masked = wsBuf[1] & 128; let len = wsBuf[1] & 127, off = 2;
      if (len === 126) { if (wsBuf.length < 4) break; len = wsBuf.readUInt16BE(2); off = 4; }
      else if (len === 127) { if (wsBuf.length < 10) break; len = Number(wsBuf.readBigUInt64BE(2)); off = 10; }
      const mk = masked ? wsBuf.subarray(off, off + 4) : null; if (masked) off += 4;
      if (wsBuf.length < off + len) break;
      const data = Buffer.from(wsBuf.subarray(off, off + len)); wsBuf = wsBuf.subarray(off + len);
      if (mk) for (let i = 0; i < data.length; i++) data[i] ^= mk[i & 3];
      if (op === 8) { sock.end(); return; }
      if (op === 2 || op === 0) { mq = Buffer.concat([mq, data]); handleMq(); }
    }
  });
  function handleMq() {
    for (;;) {
      if (mq.length < 2) return;
      let mult = 1, len = 0, i = 1, b;
      do { if (i >= mq.length) return; b = mq[i++]; len += (b & 127) * mult; mult *= 128; } while (b & 128);
      if (mq.length < i + len) return;
      const h = mq[0], body = mq.subarray(i, i + len); mq = mq.subarray(i + len);
      const type = h >> 4;
      if (type === 1) {
        let p = 0; const pl = body.readUInt16BE(p); p += 2 + pl; p += 1; const flags = body[p++]; p += 2;
        const cl = body.readUInt16BE(p); p += 2 + cl;
        if (flags & 4) { const tl = body.readUInt16BE(p); const wt = body.subarray(p + 2, p + 2 + tl).toString(); p += 2 + tl; const ml = body.readUInt16BE(p); const wm = Buffer.from(body.subarray(p + 2, p + 2 + ml)); c.will = { topic: wt, msg: wm, retain: !!(flags & 0x20) }; }
        c.send(pkt(0x20, [0, 0]));
      } else if (type === 8) {
        const id = body.subarray(0, 2); let p = 2; const granted = [];
        while (p < body.length) { const tl = body.readUInt16BE(p); const f = body.subarray(p + 2, p + 2 + tl).toString(); p += 2 + tl + 1; c.subs.push(f); granted.push(0);
          for (const [t, m] of retained) if (match(f, t)) c.send(publishOut(t, m, true)); }
        c.send(pkt(0x90, [...id, ...granted]));
      } else if (type === 3) {
        const tl = body.readUInt16BE(0); const topic = body.subarray(2, 2 + tl).toString(); const qos = (h >> 1) & 3;
        const payload = Buffer.from(body.subarray(2 + tl + (qos ? 2 : 0)));
        if (h & 1) { if (payload.length) retained.set(topic, payload); else retained.delete(topic); }
        route(topic, payload, c);
      } else if (type === 12) c.send(Buffer.from([0xD0, 0]));
      else if (type === 14) { c.clean = true; sock.end(); }
    }
  }
  sock.on('close', () => {
    clients.delete(c);
    if (!c.clean && c.will) { if (c.will.retain) { if (c.will.msg.length) retained.set(c.will.topic, c.will.msg); else retained.delete(c.will.topic); } route(c.will.topic, c.will.msg, c); }
  });
  sock.on('error', () => {});
});
  return new Promise(r => server.listen(port, () => r(server)));
}
