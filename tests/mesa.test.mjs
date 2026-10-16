// PvP: a mesa sempre tem uma carta de mesa, sorteada a cada 3 rodadas (troca na loja). Confere Teto 19, a troca de carta e a Tempestade, a animação e a opção de desligar.
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
    // baralho só com 2 para nenhuma mão inicial virar blackjack sozinha antes do roteiro
    for (const p of [A, B]) await p.evaluate(() => { window.__c21.S.deck = Array.from({ length: 80 }, (_, i) => ({ r: '2', s: '♣', id: 5000 + i })); });
    // sequência fixa só no teste (no jogo é sorteada pela partida)
    for (const p of [A, B]) await p.evaluate(() => { window.__c21.S.mp.mesaSeq = ['teto', 'ceu', 'tempestade']; });
    for (const p of [A, B]) await p.click('[data-act=pvpgo]');
    const hp = () => Promise.all([A, B].map(p => p.evaluate(() => window.__c21.pvpHP())));
    async function round(ha, hb) {
      for (const [p, h] of [[A, ha], [B, hb]]) {
        for (let k = 0; k < 40; k++) {
          const ph = await p.evaluate(() => window.__c21.S.phase);
          if (ph === 'play') break;
          if (ph === 'cash') await p.click('[data-act=collect]', { timeout: 1500 }).catch(() => {});
          else if (ph === 'shop') await p.click('[data-act=leave]', { timeout: 1500 }).catch(() => {});
          else if (ph === 'select') await p.click('[data-act=pvpgo]', { timeout: 1500 }).catch(() => {});
          await p.waitForTimeout(400);
        }
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
    const fx = () => Promise.all([A, B].map(p => p.evaluate(() => (window.__c21.S.mp.fx || []).map(e => e.k).join(','))));
    check((await fx()).every(x => x === 'teto'), `rodada 1 deveria ter Teto 19 para os dois: ${await fx()}`);
    const viu = await B.waitForFunction(() => { const f = document.querySelector('#fx .mesa-fx'); return f && f.textContent.includes('Teto 19') && f.textContent.includes('rodadas 1 a 3'); }, null, { timeout: 8000 }).then(() => true, () => false);
    check(viu, 'Beto não viu a animação da carta de mesa');
    // Rodada 1 com Teto 19: Beto fecha 20 e estoura; Ana 18 vence (14 de dano).
    const r1 = await round([['10', '♠'], ['8', '♥']], [['K', '♣'], ['Q', '♦']]);
    check(r1[0] === h0 && r1[1] === h0 - 14, `Teto 19: esperado Ana ${h0} e Beto ${h0 - 14}, veio ${r1}`);
    // Rodadas 2 e 3 empatadas (sem dano); o Teto 19 continua valendo.
    await round([['10', '♠'], ['8', '♥']], [['10', '♣'], ['8', '♦']]);
    check((await fx()).every(x => x === 'teto'), 'o Teto 19 deveria valer nas 3 rodadas');
    await round([['10', '♠'], ['8', '♥']], [['10', '♣'], ['8', '♦']]);
    // Rodada 4 (depois da loja): troca para Céu Aberto. Ana 20 contra 18: 15 de dano.
    const r4 = await round([['K', '♠'], ['Q', '♥']], [['10', '♣'], ['8', '♦']]);
    check((await fx()).every(x => x === 'ceu'), `rodada 4 deveria ter Céu Aberto: ${await fx()}`);
    check(r4[1] === h0 - 29, `rodada 4: Beto deveria ter ${h0 - 29} PV, tem ${r4[1]}`);
    await round([['10', '♠'], ['8', '♥']], [['10', '♣'], ['8', '♦']]);
    await round([['10', '♠'], ['8', '♥']], [['10', '♣'], ['8', '♦']]);
    // Rodada 7: Tempestade tira 5 de todos no começo.
    const r7 = await round([['10', '♠'], ['8', '♥']], [['10', '♣'], ['8', '♦']]);
    check(r7[0] === h0 - 5 && r7[1] === h0 - 34, `Tempestade: esperado Ana ${h0 - 5} e Beto ${h0 - 34}, veio ${r7}`);
    check(t.errors.length === 0, 'erros na página: ' + t.errors.join(' | '));
    await t.close();

    // Sala com as cartas de mesa desligadas
    const t2 = await setup();
    try {
      const C = await t2.page('Caio');
      await createRoom(C, 'Caio', 'pvp');
      await C.click('[data-act=mesatoggle]');
      check(await C.isVisible('text=Desligadas'), 'o botão das cartas de mesa não mudou para Desligadas');
      await C.click('[data-act=addbot]');
      await C.waitForTimeout(500);
      await C.click('[data-act=startgame]');
      await C.waitForFunction(() => window.__c21.S && window.__c21.S.mp);
      await C.click('[data-act=pvpgo]');
      await C.waitForTimeout(800);
      check(await C.evaluate(() => window.__c21.S.mp.mesa === false && !(window.__c21.S.mp.fx || []).length), 'a partida deveria começar sem carta de mesa');
      check(t2.errors.length === 0, 'erros na página: ' + t2.errors.join(' | '));
    } finally { await t2.close(); }
    return 'cartas de mesa ok (troca a cada loja, Teto 19, Tempestade, animação e opção desligar)';
  } finally { await t.close().catch(() => {}); }
}
