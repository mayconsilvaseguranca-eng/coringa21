// PvP: duelo roteirizado com as cartas de mesa (Teto 19, Trégua, Tempestade, Embaralhar) e a opção de desligá-las na sala.
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
    await A.evaluate(() => { window.__c21.S.jokers = [{ k: 'teto', v: 0 }, { k: 'tregua', v: 0 }, { k: 'embaralhar', v: 0 }]; });
    await B.evaluate(() => { window.__c21.S.jokers = [{ k: 'tempestade', v: 0 }]; });
    // baralho só com 2 para nenhuma mão inicial virar blackjack sozinha antes do roteiro
    for (const p of [A, B]) await p.evaluate(() => { window.__c21.S.deck = Array.from({ length: 80 }, (_, i) => ({ r: '2', s: '♣', id: 5000 + i })); });
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
    check(await A.evaluate(() => window.__c21.S.mp.mesa === true), 'as cartas de mesa deveriam vir ligadas');
    // usa uma carta de mesa pelo botão (toca na carta e em Usar)
    async function usar(p, k) {
      await p.waitForFunction(() => window.__c21.S.phase === 'play' && !window.__c21.S.busy, null, { timeout: 15000 });
      const i = await p.evaluate(k => window.__c21.S.jokers.findIndex(j => j.k === k), k);
      await p.evaluate(() => window.__c21.render());
      await p.click(`#rack .joker[data-i="${i}"]`);
      await p.click('[data-act=usemesa]');
      const ok = await p.evaluate(k => !window.__c21.S.jokers.some(j => j.k === k) && window.__c21.S.mp.ev.some(e => e.k === k), k);
      check(ok, `a carta ${k} não foi usada`);
      await p.evaluate(() => window.__c21.render());
    }
    // Rodada 1: Ana usa Teto 19 (vale na 2). Ana 20 contra 18: Beto leva 15.
    await usar(A, 'teto');
    // Beto vê a animação da carta usada pela Ana
    const viu = await B.waitForFunction(() => { const f = document.querySelector('#fx .mesa-fx'); return f && f.textContent.includes('Teto 19') && f.textContent.includes('Ana') && f.textContent.includes('rodada 2'); }, null, { timeout: 8000 }).then(() => true, () => false);
    check(viu, 'Beto não viu a animação do Teto 19 usado pela Ana');
    const r1 = await round([['K', '♠'], ['Q', '♥']], [['10', '♣'], ['8', '♦']]);
    check(r1[1] === h0 - 15, `rodada 1: Beto deveria ter ${h0 - 15} PV, tem ${r1[1]}`);
    // Rodada 2 com Teto 19: Beto fecha 20 e estoura; Ana 18 vence (14 de dano). Ana usa Trégua (vale na 3).
    await usar(A, 'tregua');
    const r2 = await round([['10', '♠'], ['8', '♥']], [['K', '♣'], ['Q', '♦']]);
    check(r2[0] === h0, `Teto 19: o 20 de Beto deveria estourar e Ana não levar dano, Ana tem ${r2[0]}`);
    check(r2[1] === h0 - 29, `rodada 2: Beto deveria ter ${h0 - 29} PV, tem ${r2[1]}`);
    // Rodada 3 com Trégua: ninguém causa dano. Beto usa Tempestade (vale na 4).
    await usar(B, 'tempestade');
    const r3 = await round([['K', '♠'], ['Q', '♥']], [['10', '♣'], ['8', '♦']]);
    check(r3[0] === h0 && r3[1] === h0 - 29, `Trégua: ninguém deveria levar dano, veio ${r3}`);
    // Rodada 4: a Tempestade de Beto tira 5 de Ana no começo. Ana usa Embaralhar (vale na 5).
    for (let k = 0; k < 60; k++) {
      const ok = await Promise.all([A, B].map(p => p.evaluate(() => window.__c21.S.phase === 'play' && window.__c21.S.round === 4 && !window.__c21.S.busy)));
      if (ok.every(Boolean)) break;
      for (const p of [A, B]) {
        const ph = await p.evaluate(() => window.__c21.S.phase);
        if (ph === 'cash') await p.click('[data-act=collect]', { timeout: 1500 }).catch(() => {});
        else if (ph === 'shop') await p.click('[data-act=leave]', { timeout: 1500 }).catch(() => {});
      }
      await A.waitForTimeout(500);
    }
    const a4 = (await hp())[0];
    check(a4 === h0 - 5, `Tempestade: Ana deveria ter ${h0 - 5} PV, tem ${a4}`);
    check((await hp())[1] === h0 - 29, 'a Tempestade não pode machucar quem usou');
    await usar(A, 'embaralhar');
    await round([['10', '♠'], ['9', '♥']], [['10', '♣'], ['7', '♦']]);
    // Rodada 5 com Embaralhar: a mesa dá cartas e fecha a mão de todos sozinha.
    for (let k = 0; k < 60; k++) {
      const done = await Promise.all([A, B].map(p => p.evaluate(() => { const S = window.__c21.S; return S.round === 5 && S.mp.sub && S.mp.sub.r === 5; })));
      if (done.every(Boolean)) break;
      for (const p of [A, B]) {
        const ph = await p.evaluate(() => window.__c21.S.phase);
        if (ph === 'cash') await p.click('[data-act=collect]', { timeout: 1500 }).catch(() => {});
        else if (ph === 'shop') await p.click('[data-act=leave]', { timeout: 1500 }).catch(() => {});
      }
      await A.waitForTimeout(500);
    }
    const subs = await Promise.all([A, B].map(p => p.evaluate(() => window.__c21.S.mp.sub)));
    check(subs.every(x => x && x.r === 5 && (x.x || x.t >= 17 || x.c.length === 5)), `Embaralhar: a mesa deveria fechar as mãos sozinha: ${JSON.stringify(subs)}`);
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
      check(await C.evaluate(() => window.__c21.S.mp.mesa === false), 'a partida deveria começar sem cartas de mesa');
      check(t2.errors.length === 0, 'erros na página: ' + t2.errors.join(' | '));
    } finally { await t2.close(); }
    return 'cartas de mesa ok (Teto 19, Trégua, Tempestade, Embaralhar e opção desligar)';
  } finally { await t.close().catch(() => {}); }
}
