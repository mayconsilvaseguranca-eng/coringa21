// PvP: as 7 cartas de mesa novas (Céu Aberto, Mão Curta, Ás de Ferro, Empate Sangrento, Febre do Ouro, Silêncio, Hospital).
import { setup, check, createRoom, joinRoom } from './lib.mjs';


// Segundo duelo: as 7 cartas de mesa novas, uma por rodada (só no teste a carta troca toda rodada).
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
    await A.evaluate(() => { window.__c21.S.jokers = [{ k: 'lamina', v: 0 }]; });
    for (const p of [A, B]) await p.evaluate(() => { window.__c21.S.mp.mesaSeq = ['ceu', 'curta', 'asferro', 'empate', 'ouro', 'silencio', 'hospital']; window.__c21.S.mp.mesaEvery = 1; });
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
    const fx = () => A.evaluate(() => (window.__c21.S.mp.fx || []).map(e => e.k).join(','));
    // R1 Céu Aberto: Ana fecha 23 com 3 cartas e não estoura; vence o 20 de Beto. (10+23)×2 = 66 → 17 de dano + Lâmina 3.
    const r1 = await round([['10', '♠'], ['K', '♥'], ['3', '♣']], [['K', '♣'], ['Q', '♦']]);
    check(r1[0] === h0 && r1[1] === h0 - 20, `Céu Aberto: esperado Ana ${h0} e Beto ${h0 - 20}, veio ${r1}`);
    // R2 Mão Curta: Ana pede carta pelo botão e a mão fecha sozinha com 3 cartas.
    await A.waitForFunction(() => { const S = window.__c21.S; return S.round === 2 && S.phase === 'play' && !S.busy; }, null, { timeout: 15000 });
    check(await fx() === 'curta', 'rodada 2 deveria ter Mão Curta');
    await A.evaluate(() => window.__c21.render());
    await A.click('[data-act=hit]');
    await A.waitForFunction(() => window.__c21.S.mp.sub && window.__c21.S.mp.sub.r === 2, null, { timeout: 10000 });
    check(await A.evaluate(() => window.__c21.S.mp.sub.c.length) === 3, 'Mão Curta: a mão deveria fechar com 3 cartas');
    await B.waitForFunction(() => window.__c21.S.phase === 'play' && !window.__c21.S.busy, null, { timeout: 15000 });
    await B.evaluate(() => { const S = window.__c21.S; S.player = [{ r: '2', s: '♣', id: 9901 }, { r: '2', s: '♦', id: 9902 }, { r: '2', s: '♥', id: 9903 }]; window.__c21.pvpSubmit(); });
    for (const p of [A, B]) await p.waitForFunction(() => window.__c21.S.phase === 'pshow' && !window.__c21.S.busy, null, { timeout: 15000 });
    for (const p of [A, B]) { await p.waitForFunction(() => window.__c21.pvpReadyNext(), null, { timeout: 15000 }); await p.evaluate(() => window.__c21.pvpNext()); }
    // R3 Ás de Ferro: o Ás de Ana vale 1 (A+K = 11, sem blackjack) e Beto 19 vence: 58 → 15 de dano.
    const r3 = await round([['A', '♠'], ['K', '♥']], [['10', '♣'], ['9', '♦']]);
    check(r3[0] === h0 - 15, `Ás de Ferro: Ana deveria ter ${h0 - 15} PV, tem ${r3[0]}`);
    // R4 Empate Sangrento: os dois fecham 18 e cada um leva 5.
    const r4 = await round([['10', '♠'], ['8', '♥']], [['10', '♣'], ['8', '♦']]);
    check(r4[0] === h0 - 20 && r4[1] === h0 - 25, `Empate Sangrento: esperado Ana ${h0 - 20} e Beto ${h0 - 25}, veio ${r4}`);
    // R5 Febre do Ouro: Ana tem a maior mão e ganha $4 em vez de $2 (depois da loja).
    let m0 = 0;
    for (let k = 0; k < 60; k++) {
      const ok = await Promise.all([A, B].map(p => p.evaluate(() => window.__c21.S.phase === 'play' && window.__c21.S.round === 5 && !window.__c21.S.busy)));
      if (ok.every(Boolean)) break;
      for (const p of [A, B]) { const ph = await p.evaluate(() => window.__c21.S.phase); if (ph === 'cash') await p.click('[data-act=collect]', { timeout: 1500 }).catch(() => {}); else if (ph === 'shop') await p.click('[data-act=leave]', { timeout: 1500 }).catch(() => {}); }
      await A.waitForTimeout(500);
    }
    m0 = await A.evaluate(() => window.__c21.S.money);
    const r5 = await round([['K', '♠'], ['Q', '♥']], [['10', '♣'], ['8', '♦']]);
    const m1 = await A.evaluate(() => window.__c21.S.money);
    check(m1 - m0 === 4, `Febre do Ouro: Ana deveria ganhar $4, ganhou $${m1 - m0}`);
    check(r5[1] === h0 - 43, `rodada 5: Beto deveria ter ${h0 - 43} PV (15 + Lâmina 3), tem ${r5[1]}`);
    // R6 Silêncio: a Lâmina de Ana não funciona, só 15 de dano.
    const r6 = await round([['K', '♠'], ['Q', '♥']], [['10', '♣'], ['8', '♦']]);
    check(r6[1] === h0 - 58, `Silêncio: Beto deveria ter ${h0 - 58} PV, tem ${r6[1]}`);
    // R7 Hospital: os dois recuperam 4 no começo; empate sem dano.
    const r7 = await round([['10', '♠'], ['8', '♥']], [['10', '♣'], ['8', '♦']]);
    check(r7[0] === h0 - 16 && r7[1] === h0 - 54, `Hospital: esperado Ana ${h0 - 16} e Beto ${h0 - 54}, veio ${r7}`);
    check(t.errors.length === 0, 'erros na página: ' + t.errors.join(' | '));
    return 'cartas de mesa novas ok (Céu Aberto, Mão Curta, Ás de Ferro, Empate Sangrento, Febre do Ouro, Silêncio, Hospital)';
  } finally { await t.close().catch(() => {}); }
}
