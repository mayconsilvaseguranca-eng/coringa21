// Solo: as cartas novas (v23) pontuam como descrito. Mãos montadas, conferindo os pontos de cada uma.
import { setup, check } from './lib.mjs';

export default async function () {
  const t = await setup();
  try {
    const p = await t.page('solo');
    await p.click('[data-act=new]'); await p.click('[data-act=play]');
    await p.waitForFunction(() => window.__c21.S && window.__c21.S.phase === 'play' && !window.__c21.S.busy, null, { timeout: 10000 });
    const hand = (jokers, pl, dl, extra = {}) => p.evaluate(async ({ jokers, pl, dl, extra }) => {
      const c = window.__c21, S = c.S;
      S.ante = 8; S.bi = 0; S.handsLeft = 9; S.roundScore = 0; S.busy = false; S.awaitNext = false;
      S.jokers = jokers.map(k => typeof k === 'string' ? { k, v: 0 } : k);
      const card = (x, i) => ({ r: x.slice(0, -1), s: x.slice(-1), id: 8000 + i + Math.random() });
      S.player = pl.map(card); S.dealer = dl.map(card); S.hidden = false; S.doubled = !!extra.doubled;
      const h0 = S.handsLeft;
      await c.resolve();
      return { score: S.roundScore, hands: S.handsLeft, used: h0 - S.handsLeft, jv: S.jokers.map(j => j.v || 0) };
    }, { jokers, pl, dl, extra });
    const W = ['10♠', '9♣'], D18 = ['10♦', '8♣'], D17 = ['10♦', '7♣'];
    // sem cartas: vitória 19 contra 17 = (10 + 19) × 2 = 58
    let r = await hand([], W, D17);
    check(r.score === 58, 'vitória sem cartas deveria valer 58: ' + r.score);
    // Rei do 21: 21 com 3 cartas contra 18 = (25 + 21) × 3 × 4 = 552
    r = await hand(['rei21'], ['10♠', '5♣', '6♦'], D18);
    check(r.score === 552, 'Rei do 21 deveria dar 552: ' + r.score);
    // Mão Cheia: vitória 19 com 3 cartas contra 17 = (10 + 19) × 2 × 3 = 174
    r = await hand(['maocheia'], ['10♠', '4♣', '5♦'], D17);
    check(r.score === 174, 'Mão Cheia deveria dar 174: ' + r.score);
    // Dealer Azarado: dealer estoura = (10 + 19) × 2 × 2 = 116
    r = await hand(['azarado'], W, ['10♦', '6♣', '9♠']);
    check(r.score === 116, 'Dealer Azarado deveria dar 116: ' + r.score);
    // Rede de Segurança: estouro com 10, 9, 5 marca 24 Fichas
    r = await hand(['rede'], ['10♠', '9♣', '5♦'], D17);
    check(r.score === 24, 'Rede de Segurança deveria marcar 24: ' + r.score);
    // Sequência: 1ª vitória normal (58), 2ª vitória ×2 (116), derrota zera
    r = await hand([{ k: 'sequencia', v: 0 }], W, D17);
    check(r.score === 58 && r.jv[0] === 1, 'Sequência 1ª vitória: ' + JSON.stringify(r));
    r = await hand([{ k: 'sequencia', v: 1 }], W, D17);
    check(r.score === 116 && r.jv[0] === 2, 'Sequência 2ª vitória deveria dar ×2: ' + JSON.stringify(r));
    r = await hand([{ k: 'sequencia', v: 2 }], ['10♠', '6♣'], D18);
    check(r.jv[0] === 0, 'Sequência deveria zerar ao perder: ' + JSON.stringify(r));
    // Dobradinha: mão dobrada vencida = ×3 e não gasta a mão
    r = await hand(['dobradinha'], ['5♠', '6♣', '9♦'], D18, { doubled: true });
    check(r.score === (10 + 20) * 2 * 3 && r.used === 0, 'Dobradinha: ' + JSON.stringify(r));
    // Escalada: +1 Mult a cada 4 vitórias (com 7 vitórias vira 8 nesta mão → +2)
    r = await hand([{ k: 'escalada', v: 7 }], W, D17);
    check(r.score === 29 * 4, 'Escalada com 8 vitórias deveria dar +2 Mult: ' + r.score);
    // Juros Altos, Cofrinho e Baralho Alto
    const misc = await p.evaluate(() => {
      const c = window.__c21, S = c.S;
      S.jokers = [{ k: 'juros', v: 0 }, { k: 'cofrinho', v: 0 }, { k: 'baralhoalto', v: 0 }]; S.money = 10;
      S.roundScore = 99999; S.ante = 1; S.bi = 0;
      c.startBlind();
      const low = S.deck.concat(S.player, S.dealer).filter(x => ['2', '3', '4'].includes(x.r)).length;
      return { low, deck: S.deck.length + S.player.length + S.dealer.length, hands: S.handsLeft };
    });
    check(misc.low === 0 && misc.deck === 40, 'Baralho Alto deveria tirar 2, 3 e 4: ' + JSON.stringify(misc));
    check(misc.hands === 6, 'o solo deveria ter 6 mãos por blind: ' + misc.hands);
    await p.waitForFunction(() => !window.__c21.S.busy, null, { timeout: 10000 });
    const cash = await p.evaluate(async () => { const S = window.__c21.S; S.money = 10; S.roundScore = 99999; S.handsLeft = 1; S.player = [{ r: '10', s: '♠', id: 1 }, { r: '9', s: '♣', id: 2 }]; S.dealer = [{ r: '10', s: '♦', id: 3 }, { r: '7', s: '♣', id: 4 }]; S.hidden = false; await window.__c21.resolve(); return S.cash; });
    check(cash && cash.interest === 5 && cash.pig === 4, 'Juros Altos ($10 → $5) e Cofrinho (+$4): ' + JSON.stringify(cash));
    check(t.errors.length === 0, 'erros na página: ' + t.errors.join(' | '));
    return 'cartas novas do solo ok (Rei do 21, Mão Cheia, Dealer Azarado, Rede, Sequência, Dobradinha, Escalada, Juros, Cofrinho, Baralho Alto)';
  } finally { await t.close(); }
}
