// Utilidades comuns dos testes do Coringa 21.
import { chromium, devices } from 'playwright';
import { startBroker } from './broker.mjs';

export async function setup() {
  const port = 9000 + Math.floor(Math.random() * 900);
  const server = await startBroker(port);
  const browser = await chromium.launch();
  const url = `http://127.0.0.1:${port}/?broker=ws://127.0.0.1:${port}/mqtt&test=1`;
  const errors = [];
  const pages = [];
  async function page(name, device = 'iPhone 13', extra = '') {
    const ctx = await browser.newContext({ ...devices[device], reducedMotion: 'reduce' });
    const p = await ctx.newPage();
    p.on('pageerror', e => errors.push(`${name}: ${e.message}`));
    await p.goto(url + extra);
    pages.push(p);
    return p;
  }
  async function close() { await browser.close(); server.close(); }
  return { page, close, errors };
}

export function check(cond, msg) { if (!cond) throw new Error(msg); }

// Lê o estado do jogo de uma página.
export const S = (p, fn) => p.evaluate(fn);

// Total de uma mão a partir das cartas do jogador.
export const handState = p => p.evaluate(() => {
  const S = window.__c21.S; let t = 0, a = 0;
  for (const c of S.player) { if (c.r === 'A') { t += 11; a++ } else t += (['J', 'Q', 'K'].includes(c.r) ? 10 : +c.r) }
  while (t > 21 && a) { t -= 10; a-- }
  return { ph: S.phase, busy: S.busy, t, next: S.awaitNext, ok: window.__c21.pvpReadyNext ? window.__c21.pvpReadyNext() : true };
});

export async function createRoom(p, nick, mode) {
  await p.click('[data-act=mphome]'); await p.fill('#nick', nick); await p.click('[data-act=create]');
  await p.waitForSelector('.code');
  if (mode) { await p.click(`[data-act=mode][data-m=${mode}]`); }
  return (await p.textContent('.code')).trim();
}
export async function joinRoom(p, nick, code) {
  await p.click('[data-act=mphome]'); await p.fill('#nick', nick); await p.fill('#codein', code); await p.click('[data-act=join]');
  await p.waitForSelector('.code');
}

// Um passo de jogo automático no PvP: joga, avança a rodada, passa pela loja.
export async function pvpStep(p, stop = 16) {
  const st = await handState(p);
  try {
    if (st.ph === 'play' && !st.busy) await p.click(st.t < stop ? '[data-act=hit]' : '[data-act=stand]', { timeout: 1500 });
    else if (st.ph === 'pshow' && !st.busy && st.ok && await p.$('#pvpnext:not([disabled])')) await p.click('#pvpnext', { timeout: 1500 });
    else if (st.ph === 'cash') await p.click('[data-act=collect]', { timeout: 1500 });
    else if (st.ph === 'shop') { await buyFirst(p); await p.click('[data-act=leave]', { timeout: 1500 }); }
    else if (st.ph === 'select') await p.click('[data-act=pvpgo]', { timeout: 1500 }).catch(() => {});
  } catch (e) { /* a tela mudou no meio do clique; o próximo passo tenta de novo */ }
  return st.ph;
}

// Na loja: abre a primeira carta, confirma a compra se der e volta.
export async function buyFirst(p) {
  const item = await p.$('#panel [data-act=shopitem]');
  if (!item) return;
  await item.click({ timeout: 1500 }).catch(() => {});
  const sheet = !!(await p.$('[data-act=buyok]'));
  const ok = await p.$('[data-act=buyok]:not([disabled])');
  if (ok) await ok.click({ timeout: 1500 }).catch(() => {});
  else await p.click('[data-act=toshop]', { timeout: 1500 }).catch(() => {});
  return sheet;
}
