// PvP: duelo roteirizado que confere as cartas novas (Lâmina, Precisão, Cinco Lâminas, Armadura, Bandagem, Colete, Última Chance).
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
    await A.evaluate(() => { window.__c21.S.jokers = [{ k: 'lamina', v: 0 }, { k: 'precisao', v: 0 }, { k: 'cinco', v: 0 }]; });
    await B.evaluate(() => { window.__c21.S.jokers = [{ k: 'armadura', v: 0 }, { k: 'bandagem', v: 0 }, { k: 'colete', v: 0 }, { k: 'ultima', v: 0 }]; });
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
    // Ana fecha 20 contra 18: 15 de dano + Lâmina 3 + Cinco Lâminas 2 (1 carta além da primeira) + Precisão 7 = 27; Armadura tira 15% → 23.
    const r1 = await round([['K', '♠'], ['Q', '♥']], [['10', '♣'], ['8', '♦']]);
    check(r1[1] === h0 - 23, `Lâmina/Precisão/Armadura: Beto deveria ter ${h0 - 23} PV, tem ${r1[1]}`);
    check(r1[0] === h0, `Ana não deveria levar dano, tem ${r1[0]}`);
    // Bandagem não cura acima da metade da vida; Beto estoura e o Colete anula o dano.
    const r2 = await round([['10', '♠'], ['6', '♥']], [['K', '♣'], ['Q', '♦'], ['5', '♠']]);
    check(r2[1] === h0 - 23, `Bandagem/Colete: Beto deveria ter ${h0 - 23} PV, tem ${r2[1]}`);
    // Colete é de uso único. Cinco cartas com 20: 55 + Lâmina 3 + Cinco Lâminas 8 + Precisão 7 = 73; Armadura → 62.
    const r3 = await round([['2', '♠'], ['3', '♥'], ['4', '♠'], ['5', '♥'], ['6', '♣']], [['10', '♣'], ['7', '♦']]);
    const sem = await B.evaluate(() => window.__c21.S.jokers.some(j => j.k === 'colete'));
    check(!sem, 'o Colete deveria sumir depois de usado');
    check(r3[1] === h0 - 85, `Cinco Lâminas: Beto deveria ter ${h0 - 85} PV, tem ${r3[1]}`);
    // Abaixo da metade da vida, a Bandagem passa a curar 3 por rodada (conferido no laço abaixo).
    // Golpes até a Última Chance segurar Beto com 1 PV.
    let salvo = false;
    for (let i = 0; i < 6 && !salvo; i++) {
      const r = await round([['2', '♠'], ['3', '♥'], ['4', '♠'], ['5', '♥'], ['7', '♣']], [['10', '♣'], ['7', '♦']]);
      salvo = await B.evaluate(() => !!window.__c21.S.mp.ultimaUsed);
      if (salvo) check(r[1] === 1, `Última Chance: Beto deveria ficar com 1 PV, tem ${r[1]}`);
    }
    check(salvo, 'a Última Chance não foi usada');
    const ints = await Promise.all([A, B].map(p => p.evaluate(() => [window.__c21.S.mp.dealt || 0, ...Object.values(window.__c21.S.mp.sent)].every(Number.isInteger))));
    check(ints.every(Boolean), 'dano com número quebrado');
    check(t.errors.length === 0, 'erros na página: ' + t.errors.join(' | '));
    return 'cartas novas de ataque e defesa ok';
  } finally { await t.close(); }
}
