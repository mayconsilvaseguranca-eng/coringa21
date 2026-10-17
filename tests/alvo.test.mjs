// PvP: as 6 cartas com alvo (Mira, Maldição, Gelo, Roubo, Troca de Mão, Espião), usadas pelos botões, e a opção de desligar.
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
    await A.evaluate(() => { window.__c21.S.alvoInv = ['mira', 'roubo']; });
    await B.evaluate(() => { window.__c21.S.alvoInv = ['gelo', 'maldicao']; });
    // baralho só com 2 para nenhuma mão inicial virar blackjack sozinha antes do roteiro
    for (const p of [A, B]) await p.evaluate(() => { window.__c21.S.deck = Array.from({ length: 80 }, (_, i) => ({ r: '2', s: '♣', id: 5000 + i })); });
    // sem carta de mesa: este teste confere contas exatas de dano
    for (const p of [A, B]) await p.evaluate(() => { window.__c21.S.mp.mesa = false; });
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
    async function usar(p, k, alvo) {
      await p.waitForFunction(() => window.__c21.S.phase === 'play' && !window.__c21.S.busy, null, { timeout: 15000 });
      await p.evaluate(() => window.__c21.render());
      const i = await p.evaluate(k => window.__c21.S.alvoInv.indexOf(k), k);
      await p.click(`#rack .alvoslot[data-i="${i}"]`);
      await p.click(`[data-act=usealvo] >> text=${alvo}`);
      check(await p.evaluate(k => !window.__c21.S.alvoInv.includes(k), k), `${k} não foi usada`);
    }
    // Rodada 1: Ana usa Mira e Roubo em Beto; Beto usa Gelo e Maldição em Ana (valem na rodada 2).
    await usar(A, 'mira', 'Beto');
    await usar(A, 'roubo', 'Beto');
    await usar(B, 'gelo', 'Ana');
    await usar(B, 'maldicao', 'Ana');
    // a carta fica marcada no jogador: Beto vê ❄ no quadrinho da Ana; Ana vê a etiqueta Gelo (próxima rodada) embaixo das cartas
    const marcaB = await B.waitForFunction(() => { window.__c21.render(); return [...document.querySelectorAll('.rvl .fxb.next')].some(e => e.textContent.includes('❄')); }, null, { timeout: 8000 }).then(() => true, () => false);
    check(marcaB, 'Beto deveria ver o Gelo marcado no quadrinho da Ana');
    const marcaA = await A.waitForFunction(() => { window.__c21.render(); const m = document.querySelector('#mefx'); return m && m.textContent.includes('Gelo') && m.textContent.includes('próx'); }, null, { timeout: 8000 }).then(() => true, () => false);
    check(marcaA, 'Ana deveria ver a etiqueta do Gelo (próxima rodada) embaixo das cartas');
    // tocar na etiqueta explica o que a carta faz em você
    await A.click('#mefx .mfx');
    check(await A.isVisible('text=só pode pedir 1 carta'), 'tocar na etiqueta do Gelo deveria explicar o efeito');
    await A.click('[data-act=close]');
    const viu = await B.waitForFunction(() => [...document.querySelectorAll('#fx .alvo-toast')].some(e => e.textContent.includes('Ana') && e.textContent.includes('Mira')), null, { timeout: 8000 }).then(() => true, () => false);
    check(viu, 'Beto não viu o aviso da Mira da Ana');
    // Ana 20 contra 18: 15 de dano com Mira (+50%) = 23.
    const r1 = await round([['K', '♠'], ['Q', '♥']], [['10', '♣'], ['8', '♦']]);
    check(r1[1] === h0 - 23, `Mira: Beto deveria ter ${h0 - 23} PV, tem ${r1[1]}`);
    const mo = await Promise.all([A, B].map(p => p.evaluate(() => window.__c21.S.money)));
    check(mo[0] === 4 + 2 + 2 && mo[1] === 2, `Roubo: esperado Ana $8 e Beto $2, veio ${mo}`);
    // Rodada 2 com Gelo: Ana pede carta e a mão fecha com 3 cartas. Beto estoura; a Maldição corta o dano de Ana pela metade.
    await A.waitForFunction(() => { const S = window.__c21.S; return S.round === 2 && S.phase === 'play' && !S.busy; }, null, { timeout: 15000 });
    await A.evaluate(() => window.__c21.render());
    check(await A.evaluate(() => !!document.querySelector('#mefx .mfx.now')), 'na rodada 2 o Gelo deveria aparecer como ativo na Ana');
    await A.click('[data-act=hit]');
    await A.waitForFunction(() => window.__c21.S.mp.sub && window.__c21.S.mp.sub.r === 2, null, { timeout: 10000 });
    check(await A.evaluate(() => window.__c21.S.mp.sub.c.length) === 3, 'Gelo: a mão deveria fechar com 3 cartas');
    await B.waitForFunction(() => window.__c21.S.phase === 'play' && !window.__c21.S.busy, null, { timeout: 15000 });
    await B.evaluate(() => { const S = window.__c21.S; S.player = [{ r: 'K', s: '♣', id: 9901 }, { r: 'Q', s: '♦', id: 9902 }, { r: '5', s: '♥', id: 9903 }]; window.__c21.pvpSubmit(); });
    for (const p of [A, B]) await p.waitForFunction(() => window.__c21.S.phase === 'pshow' && !window.__c21.S.busy, null, { timeout: 15000 });
    await A.waitForTimeout(2500);
    const r2 = await hp();
    check(r2[1] === h0 - 27, `Maldição: Beto deveria ter ${h0 - 27} PV (8 de dano vira 4), tem ${r2[1]}`);
    for (const p of [A, B]) { await p.waitForFunction(() => window.__c21.pvpReadyNext(), null, { timeout: 15000 }); await p.evaluate(() => window.__c21.pvpNext()); }
    // Rodada 3: Ana usa Troca de Mão em Beto. Ana fecha 15, Beto 20: trocam, Ana vence com 20 (15 de dano).
    await A.evaluate(() => { window.__c21.S.alvoInv = ['troca', 'espiao']; window.__c21.render(); });
    check(await A.evaluate(() => document.querySelectorAll('#rack .alvoslot').length) === 2, 'o estoque de cartas com alvo deveria mostrar 2 cartas');
    await usar(A, 'troca', 'Beto');
    const r3 = await round([['10', '♠'], ['5', '♥']], [['K', '♣'], ['Q', '♦']]);
    check(r3[0] === h0 && r3[1] === h0 - 42, `Troca de Mão: esperado Ana ${h0} e Beto ${h0 - 42}, veio ${r3}`);
    // Rodada 4: Ana usa Espião em Beto e vê o 17 dele antes de fechar.
    for (let k = 0; k < 60; k++) {
      const ok = await Promise.all([A, B].map(p => p.evaluate(() => window.__c21.S.phase === 'play' && window.__c21.S.round === 4 && !window.__c21.S.busy)));
      if (ok.every(Boolean)) break;
      for (const p of [A, B]) { const ph = await p.evaluate(() => window.__c21.S.phase); if (ph === 'cash') await p.click('[data-act=collect]', { timeout: 1500 }).catch(() => {}); else if (ph === 'shop') await p.click('[data-act=leave]', { timeout: 1500 }).catch(() => {}); }
      await A.waitForTimeout(500);
    }
    await usar(A, 'espiao', 'Beto');
    await B.evaluate(() => { const S = window.__c21.S; S.player = [{ r: '10', s: '♣', id: 9911 }, { r: '7', s: '♦', id: 9912 }]; window.__c21.pvpSubmit(); });
    const espiou = await A.waitForFunction(() => { window.__c21.render(); return [...document.querySelectorAll('.rvl .tg.spy')].some(e => e.textContent.includes('17')); }, null, { timeout: 8000 }).then(() => true, () => false);
    check(espiou, 'Espião: Ana deveria ver o 17 de Beto antes de fechar');
    check(t.errors.length === 0, 'erros na página: ' + t.errors.join(' | '));
    await t.close();

    // Sala com as cartas com alvo desligadas
    const t2 = await setup();
    try {
      const C = await t2.page('Caio');
      await createRoom(C, 'Caio', 'pvp');
      await C.click('[data-act=alvotoggle]');
      check(await C.isVisible('[data-act=alvotoggle] >> text=Desligado'), 'o botão das cartas com alvo não mudou');
      await C.click('[data-act=addbot]');
      await C.waitForTimeout(500);
      await C.click('[data-act=startgame]');
      await C.waitForFunction(() => window.__c21.S && window.__c21.S.mp);
      check(await C.evaluate(() => window.__c21.S.mp.alvo === false), 'a partida deveria começar sem cartas com alvo');
      check(t2.errors.length === 0, 'erros na página: ' + t2.errors.join(' | '));
    } finally { await t2.close(); }
    return 'cartas com alvo ok (Mira, Roubo, Gelo, Maldição, Troca de Mão, Espião e opção desligar)';
  } finally { await t.close().catch(() => {}); }
}
