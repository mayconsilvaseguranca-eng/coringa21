// PvP: quem sai da loja primeiro espera os outros; a rodada seguinte começa para todos juntos.
import { setup, check, createRoom, joinRoom } from './lib.mjs';

export default async function () {
  const t = await setup();
  try {
    const A = await t.page('Ana'), B = await t.page('Beto');
    const code = await createRoom(A, 'Ana', 'pvp');
    await joinRoom(B, 'Beto', code);
    await A.waitForFunction(() => document.querySelectorAll('#panel .lb-p').length >= 2);
    await A.click('[data-act=startgame]');
    for (const p of [A, B]) await p.waitForFunction(() => window.__c21.S && window.__c21.S.mp);
    for (const p of [A, B]) await p.evaluate(() => { window.__c21.S.mp.mesa = false; window.__c21.S.deck = Array.from({ length: 80 }, (_, i) => ({ r: '2', s: '♣', id: 5000 + i })); });
    for (const p of [A, B]) await p.click('[data-act=pvpgo]');
    async function round(ha, hb) {
      for (const [p, h] of [[A, ha], [B, hb]]) {
        await p.waitForFunction(() => window.__c21.S.phase === 'play' && !window.__c21.S.busy, null, { timeout: 15000 });
        await p.evaluate(h => { const S = window.__c21.S; S.player = h.map((x, i) => ({ r: x[0], s: x[1], id: 9000 + i + Math.random() })); window.__c21.pvpSubmit(); }, h);
      }
      for (const p of [A, B]) await p.waitForFunction(() => window.__c21.S.phase === 'pshow' && !window.__c21.S.busy, null, { timeout: 15000 });
      await A.waitForTimeout(1500);
      for (const p of [A, B]) { await p.waitForFunction(() => window.__c21.pvpReadyNext(), null, { timeout: 15000 }); await p.evaluate(() => window.__c21.pvpNext()); }
    }
    for (let i = 0; i < 3; i++) await round([['10', '♠'], ['9', '♥']], [['10', '♦'], ['7', '♣']]);
    // os dois chegam à loja
    for (const p of [A, B]) {
      await p.waitForFunction(() => window.__c21.S.phase === 'cash', null, { timeout: 15000 });
      await p.click('[data-act=collect]');
      await p.waitForFunction(() => window.__c21.S.phase === 'shop');
    }
    // Ana sai primeiro: fica esperando a Beto
    await A.click('[data-act=leave]');
    await A.waitForTimeout(3000);
    const a1 = await A.evaluate(() => ({ ph: window.__c21.S.phase, r: window.__c21.S.round, txt: document.querySelector('#panel').textContent }));
    check(a1.ph === 'shopwait' && a1.r === 3, 'Ana deveria esperar a Beto sair da loja: ' + JSON.stringify({ ph: a1.ph, r: a1.r }));
    check(a1.txt.includes('Beto'), 'a tela de espera deveria mostrar quem ainda está na loja');
    // Beto sai: os dois começam a rodada 4
    await B.click('[data-act=leave]');
    for (const p of [A, B]) await p.waitForFunction(() => window.__c21.S.round === 4 && window.__c21.S.phase === 'play', null, { timeout: 8000 });
    check(t.errors.length === 0, 'erros na página: ' + t.errors.join(' | '));
    return 'loja espera todos ok';
  } finally { await t.close(); }
}
