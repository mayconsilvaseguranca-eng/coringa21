// PvP: efeitos dos baralhos durante o jogo (Vidro, Miúdo, Apostador, Fantasma).
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
    await A.evaluate(() => { window.__c21.S.jokers = []; });
    await B.evaluate(() => { window.__c21.S.jokers = []; });
    // baralho só com 2 para nenhuma mão inicial virar blackjack sozinha antes do roteiro
    for (const p of [A, B]) await p.evaluate(() => { window.__c21.S.deck = Array.from({ length: 80 }, (_, i) => ({ r: '2', s: '♣', id: 5000 + i })); });
    // sem carta de mesa: este teste confere contas exatas de dano
    for (const p of [A, B]) await p.evaluate(() => { window.__c21.S.mp.mesa = false; });
    for (const p of [A, B]) await p.click('[data-act=pvpgo]');
    const hp = () => Promise.all([A, B].map(p => p.evaluate(() => window.__c21.pvpHP())));
    async function round(ha, hb) {
      for (const [p, h] of [[A, ha], [B, hb]]) {
        await p.waitForFunction(() => window.__c21.S.phase === 'play' && !window.__c21.S.busy, null, { timeout: 15000 }).catch(async e => { throw new Error('esperando a vez ' + (p === A ? 'Ana' : 'Beto') + ': ' + await p.evaluate(() => JSON.stringify({ ph: window.__c21.S.phase, busy: window.__c21.S.busy, r: window.__c21.S.round, hp: window.__c21.pvpHP(), msg: window.__c21.S.msg, cards: window.__c21.S.player.map(c=>c.r+c.s).join(' ') }))) });
        await p.evaluate(h => { const S = window.__c21.S; S.player = h.map((x, i) => ({ r: x[0], s: x[1], id: 9000 + i + Math.random() })); window.__c21.pvpSubmit(); }, h);
      }
      for (const p of [A, B]) await p.waitForFunction(() => window.__c21.S.phase === 'pshow' && !window.__c21.S.busy, null, { timeout: 15000 }).catch(async e => { throw new Error('esperando revelação: ' + await p.evaluate(() => JSON.stringify({ ph: window.__c21.S.phase, busy: window.__c21.S.busy, r: window.__c21.S.round, w: document.querySelector('#actions').textContent }))) });
      await A.waitForTimeout(2500);
      const r = await hp();
      for (const p of [A, B]) { await p.waitForFunction(() => window.__c21.pvpReadyNext(), null, { timeout: 15000 }); await p.evaluate(() => window.__c21.pvpNext()); }
      return r;
    }
    const h0 = (await hp())[0];
    const deck = k => A.evaluate(k => { window.__c21.S.mp.deck = k; }, k);
    // Vidro: Ana 20 contra 18, 15 de dano +3
    await deck('vidro');
    const r1 = await round([['K', '♠'], ['Q', '♥']], [['10', '♣'], ['8', '♦']]);
    check(r1[1] === h0 - 18, `Vidro: Beto deveria ter ${h0 - 18} PV, tem ${r1[1]}`);
    // Miúdo: Ana fecha 20 com 3 cartas, 15 de dano +1
    await deck('miudo');
    const r2 = await round([['5', '♠'], ['5', '♥'], ['10', '♣']], [['10', '♣'], ['8', '♦']]);
    check(r2[1] === h0 - 34, `Miúdo: Beto deveria ter ${h0 - 34} PV, tem ${r2[1]}`);
    // Apostador: Ana estoura e perde 2 PV a mais (Beto 18 causa 14)
    await deck('apostador');
    const r3 = await round([['K', '♠'], ['Q', '♥'], ['5', '♣']], [['10', '♣'], ['8', '♦']]);
    check(r3[0] === h0 - 16, `Apostador: Ana deveria ter ${h0 - 16} PV, tem ${r3[0]}`);
    // Fantasma: Ana vê a primeira carta de Beto antes de fechar
    for (let k = 0; k < 60; k++) {
      const ok = await Promise.all([A, B].map(p => p.evaluate(() => window.__c21.S.phase === 'play' && window.__c21.S.round === 4 && !window.__c21.S.busy)));
      if (ok.every(Boolean)) break;
      for (const p of [A, B]) { const ph = await p.evaluate(() => window.__c21.S.phase); if (ph === 'cash') await p.click('[data-act=collect]', { timeout: 1500 }).catch(() => {}); else if (ph === 'shop') await p.click('[data-act=leave]', { timeout: 1500 }).catch(() => {}); }
      await A.waitForTimeout(500);
    }
    await deck('fantasma');
    const viu = await A.waitForFunction(() => { window.__c21.render(); return !!document.querySelector('.rvl .tg.ghost'); }, null, { timeout: 8000 }).then(() => true, () => false);
    check(viu, 'Fantasma: Ana deveria ver a primeira carta de Beto');
    // Cinco Cartas: 5 cartas somando 15 ganham de 18 (pontos (35+15)×4 = 200 → 50 de dano)
    await deck('padrao');
    const antes = (await hp())[1];
    const r4 = await round([['2', '♠'], ['2', '♥'], ['3', '♣'], ['4', '♦'], ['4', '♠']], [['10', '♣'], ['8', '♦']]);
    check(r4[1] === antes - 50 && r4[0] === h0 - 16, `Cinco Cartas: Beto deveria perder 50 PV e Ana nada, veio ${r4} (Beto tinha ${antes})`);
    // a tela de jogadas do PvP explica as jogadas certas
    await A.evaluate(() => { const b = document.createElement('button'); b.dataset.act = 'hands'; document.body.appendChild(b); b.click(); });
    check(await A.isVisible('text=Jogadas do PvP') && await A.isVisible('text=ganha de qualquer mão até 20'), 'a tela de jogadas do PvP não apareceu');
    check(t.errors.length === 0, 'erros na página: ' + t.errors.join(' | '));
    return 'baralhos no jogo ok (Vidro, Miúdo, Apostador, Fantasma) e Cinco Cartas no PvP';
  } finally { await t.close(); }
}
