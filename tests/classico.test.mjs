// PvP 21 Clássico: sem loja, sem cartas, sem trocas e sem apostas, com a vida do modo.
import { setup, check, createRoom, joinRoom } from './lib.mjs';

export default async function () {
  const t = await setup();
  try {
    const A = await t.page('Ana', 'iPhone SE'), B = await t.page('Beto');
    const code = await createRoom(A, 'Ana', 'pvp');
    await A.click('[data-act=mode][data-m=cl]');
    check(await A.$('[data-act=mesatoggle]') === null && await A.$('[data-act=decks]') === null, 'no 21 Clássico as opções de mesa, alvo e baralho deveriam sumir');
    await joinRoom(B, 'Beto', code);
    await A.waitForFunction(() => document.querySelectorAll('#panel .lb-p').length >= 2);
    check(await A.evaluate(() => { const e = document.querySelector('#panel'); return e.scrollHeight <= e.clientHeight + 2; }), 'a sala do 21 Clássico precisa caber no iPhone SE');
    await B.waitForFunction(() => document.querySelector('#panel').textContent.includes('21 Clássico'), null, { timeout: 8000 });
    await A.click('[data-act=startgame]');
    for (const p of [A, B]) await p.waitForFunction(() => window.__c21.S && window.__c21.S.mp);
    for (const p of [A, B]) {
      const mp = await p.evaluate(() => { const m = window.__c21.S.mp; return { cl: m.cl, hp: m.maxHp, mesa: m.mesa, alvo: m.alvo }; });
      check(mp.cl && !mp.mesa && !mp.alvo, 'o modo clássico não desligou mesa e alvo: ' + JSON.stringify(mp));
      check(mp.hp === 256, 'vida do 21 Clássico com 2 jogadores deveria ser 256: ' + mp.hp);
    }
    for (const p of [A, B]) await p.evaluate(() => { window.__c21.S.deck = Array.from({ length: 80 }, (_, i) => ({ r: '2', s: '♣', id: 5000 + i })); });
    for (const p of [A, B]) await p.click('[data-act=pvpgo]');
    async function round(ha, hb) {
      for (const [p, h] of [[A, ha], [B, hb]]) {
        await p.waitForFunction(() => window.__c21.S.phase === 'play' && !window.__c21.S.busy, null, { timeout: 15000 });
        await p.evaluate(h => { const S = window.__c21.S; S.player = h.map((x, i) => ({ r: x[0], s: x[1], id: 9000 + i + Math.random() })); window.__c21.pvpSubmit(); }, h);
      }
      for (const p of [A, B]) await p.waitForFunction(() => window.__c21.S.phase === 'pshow' && !window.__c21.S.busy, null, { timeout: 15000 });
      await A.waitForTimeout(2000);
      for (const p of [A, B]) { await p.waitForFunction(() => window.__c21.pvpReadyNext(), null, { timeout: 15000 }); await p.evaluate(() => window.__c21.pvpNext()); }
    }
    await A.waitForFunction(() => window.__c21.S.phase === 'play' && !window.__c21.S.busy, null, { timeout: 15000 });
    await A.evaluate(() => window.__c21.render());
    check(await A.$('[data-act=swap]') === null, 'no 21 Clássico não tem botão Trocar');
    check(await A.$('[data-act=bet]') === null, 'no 21 Clássico não tem aposta');
    check(await A.evaluate(() => window.__c21.S.swapsLeft) === 0, 'no 21 Clássico não tem trocas');
    for (let i = 0; i < 3; i++) await round([['10', '♠'], ['9', '♥']], [['10', '♦'], ['7', '♣']]);
    for (const p of [A, B]) {
      await p.waitForFunction(() => window.__c21.S.round === 4 || window.__c21.S.phase === 'cash', null, { timeout: 15000 });
      check(await p.evaluate(() => window.__c21.S.phase !== 'cash' && window.__c21.S.round === 4), 'depois da 3ª rodada a loja não pode abrir no 21 Clássico');
    }
    const hb = await B.evaluate(() => window.__c21.pvpHP());
    check(hb < 256, 'Beto deveria ter levado dano: ' + hb);
    check(t.errors.length === 0, 'erros na página: ' + t.errors.join(' | '));
    return `21 Clássico ok (256 PV no 1 contra 1, sem loja; Beto ficou com ${hb})`;
  } finally { await t.close(); }
}
