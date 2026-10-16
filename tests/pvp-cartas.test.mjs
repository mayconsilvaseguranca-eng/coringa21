// PvP: duelo roteirizado que confere as cartas de ataque e defesa.
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
    await A.evaluate(() => { window.__c21.S.jokers = [{ k: 'critico', v: 0 }, { k: 'sangria', v: 0 }, { k: 'vampiro', v: 0 }]; });
    await B.evaluate(() => { window.__c21.S.jokers = [{ k: 'escudo', v: 0 }, { k: 'espelho', v: 0 }, { k: 'esquiva', v: 0 }]; });
    // baralho só com 2 para nenhuma mão inicial virar blackjack sozinha antes do roteiro
    for (const p of [A, B]) await p.evaluate(() => { window.__c21.S.deck = Array.from({ length: 80 }, (_, i) => ({ r: '2', s: '♣', id: 5000 + i })); });
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
    check(h0 === 168, `PV iniciais de 2 jogadores deveriam ser 168, são ${h0}`);
    const up = x => Math.ceil(Math.round(x * 10) / 10);
    // Blackjack de Ana com Golpe Crítico: 61 × 1,5 = 92 de dano; Escudo absorve 2 (90); Espelho devolve 20% de 90 = 18.
    const r1 = await round([['A', '♠'], ['K', '♥']], [['10', '♣'], ['7', '♦']]);
    check(r1[1] === h0 - 90, `Escudo/Crítico: Beto deveria ter ${h0 - 90} PV, tem ${r1[1]}`);
    check(r1[0] === h0 - 18, `Espelho: Ana deveria ter ${h0 - 18} PV, tem ${r1[0]}`);
    // Beto vence com 20 (15 de dano); a Sangria de Ana (2) é absorvida pelo Escudo.
    const r2 = await round([['9', '♠'], ['6', '♥']], [['K', '♣'], ['Q', '♦']]);
    check(r2[0] === h0 - 33 && r2[1] === h0 - 90, `rodada 2 errada: ${r2}`);
    // Ana fecha com 16 e Beto estoura: Esquiva anula o dano; Vampiro cura Ana em 2 (15% de 13).
    const r3 = await round([['10', '♠'], ['6', '♥']], [['K', '♣'], ['Q', '♦'], ['5', '♠']]);
    check(r3[1] === h0 - 90, `Esquiva: Beto deveria continuar com ${h0 - 90} PV, tem ${r3[1]}`);
    check(r3[0] === h0 - 31, `Vampiro: Ana deveria ter ${h0 - 31} PV, tem ${r3[0]}`);
    const ints = await Promise.all([A, B].map(p => p.evaluate(() => [window.__c21.S.mp.dealt || 0, ...Object.values(window.__c21.S.mp.sent)].every(Number.isInteger))));
    check(ints.every(Boolean), 'dano com número quebrado');
    check(t.errors.length === 0, 'erros na página: ' + t.errors.join(' | '));
    return 'cartas de ataque e defesa ok';
  } finally { await t.close(); }
}
