// PvP: botão de reações. Ana manda uma reação e Beto vê o balão com o nome dela.
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
    await A.evaluate(() => { window.__c21.S.jokers = [{ k: 'espelho', v: 0 }]; });
    await B.evaluate(() => { window.__c21.S.jokers = [{ k: 'espelho', v: 0 }]; });
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
    await A.waitForFunction(() => window.__c21.S.phase === 'play', null, { timeout: 15000 });
    await A.evaluate(() => window.__c21.render());
    await A.click('[data-act=rxopen]');
    check(await A.isVisible('#rxpick'), 'o seletor de reações não abriu');
    await A.click('#rxpick [data-i="0"]');
    check(!(await A.$('#rxpick')), 'o seletor deveria fechar depois de mandar');
    const viu = await B.waitForFunction(() => [...document.querySelectorAll('#fx .rxb')].some(e => e.textContent.includes('Ana') && e.textContent.includes('😂')), null, { timeout: 8000 }).then(() => true, () => false);
    check(viu, 'Beto não viu a reação da Ana');
    check(t.errors.length === 0, 'erros na página: ' + t.errors.join(' | '));
    return 'reações ok';
  } finally { await t.close(); }
}
