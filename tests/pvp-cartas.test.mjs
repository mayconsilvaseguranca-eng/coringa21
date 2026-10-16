// PvP: duelo roteirizado que confere as cartas de ataque e defesa.
import { setup, check, createRoom, joinRoom } from './lib.mjs';

export default async function () {
  const t = await setup();
  try {
    const A = await t.page('Ana'), B = await t.page('Beto');
    const code = await createRoom(A, 'Ana', 'pvp');
    await joinRoom(B, 'Beto', code);
    await A.waitForFunction(() => document.querySelectorAll('#panel .li').length >= 2);
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
    check(JSON.stringify(await hp()) === '[130,130]', 'PV iniciais de 2 jogadores deveriam ser 130');
    // Blackjack de Ana com Golpe Crítico: 122 de dano; Escudo absorve 8; Espelho devolve 30% de 114.
    const r1 = await round([['A', '♠'], ['K', '♥']], [['10', '♣'], ['7', '♦']]);
    check(r1[1] === 16, `Escudo/Crítico: Beto deveria ter 16 PV, tem ${r1[1]}`);
    check(r1[0] === 96, `Espelho: Ana deveria ter 96 PV, tem ${r1[0]}`);
    // Beto vence com 20; a Sangria de Ana (2) é absorvida pelo Escudo.
    const r2 = await round([['9', '♠'], ['6', '♥']], [['K', '♣'], ['Q', '♦']]);
    check(r2[0] === 81 && r2[1] === 16, `rodada 2 errada: ${r2}`);
    // Ana fecha com 16 e Beto estoura: Esquiva anula o dano; Vampiro cura Ana.
    const r3 = await round([['10', '♠'], ['6', '♥']], [['K', '♣'], ['Q', '♦'], ['5', '♠']]);
    check(r3[1] === 16, `Esquiva: Beto deveria continuar com 16 PV, tem ${r3[1]}`);
    check(r3[0] === 85, `Vampiro: Ana deveria ter 85 PV, tem ${r3[0]}`);
    check(t.errors.length === 0, 'erros na página: ' + t.errors.join(' | '));
    return 'cartas de ataque e defesa ok';
  } finally { await t.close(); }
}
