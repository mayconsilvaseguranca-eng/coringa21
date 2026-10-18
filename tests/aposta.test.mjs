// PvP: aposta da rodada e modo assistir para quem foi eliminado.
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
    // Ana aposta $2 em fechar com 20 ou mais; Beto aposta $1 na maior mão da mesa
    async function apostar(p, k, a) {
      await p.waitForFunction(() => window.__c21.S.phase === 'play' && !window.__c21.S.busy, null, { timeout: 15000 });
      await p.evaluate(() => window.__c21.render());
      await p.click('[data-act=bet]');
      await p.click(`[data-act=betgo][data-k="${k}"][data-a="${a}"]`);
      check(await p.evaluate(a => window.__c21.S.mp.bet && window.__c21.S.mp.bet.a === a, a), 'a aposta não foi feita');
    }
    await apostar(A, '20', 2);
    await apostar(B, 'top', 1);
    check((await A.textContent('.betbtn')).includes('Aposta $2'), 'o botão deveria mostrar a aposta');
    await round([['K', '♠'], ['Q', '♥']], [['10', '♣'], ['8', '♦']]);
    const mo = await Promise.all([A, B].map(p => p.evaluate(() => window.__c21.S.money)));
    // Ana: 4 − 2 + 4 (aposta) + 2 (maior mão) = 8 · Beto: 4 − 1 = 3
    check(mo[0] === 8 && mo[1] === 3, `Aposta: esperado Ana $8 e Beto $3, veio ${mo}`);
    // Ana é eliminada e assiste o Beto jogar
    await A.evaluate(() => { const c = window.__c21; c.S.mp.alive = false; c.S.phase = 'out'; c.render(); c.showBoard(); });
    await A.click('#panel [data-act=watch]');
    check(await A.isVisible('text=Assistindo'), 'o modo assistir não abriu');
    await B.waitForFunction(() => window.__c21.S.phase === 'play' && !window.__c21.S.busy, null, { timeout: 15000 });
    await B.evaluate(() => { const S = window.__c21.S; S.player = [{ r: '9', s: '♣', id: 9921 }, { r: '7', s: '♦', id: 9922 }]; window.__c21.render(); });
    const viu = await A.waitForFunction(() => document.querySelectorAll('.wcards .card').length === 2 && document.querySelector('.wname').textContent.includes('Beto'), null, { timeout: 8000 }).then(() => true, () => false);
    check(viu, 'Ana deveria ver as 2 cartas do Beto ao vivo');
    check(t.errors.length === 0, 'erros na página: ' + t.errors.join(' | '));
    return 'aposta e modo assistir ok';
  } finally { await t.close(); }
}
