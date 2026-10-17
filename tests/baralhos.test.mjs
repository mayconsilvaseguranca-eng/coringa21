// Baralhos: cada um escolhe o seu na sala (com explicação e cartas), e quem cria pode desligar.
import { setup, check, createRoom, joinRoom } from './lib.mjs';

async function escolher(p, k) {
  await p.click('[data-act=decks]');
  await p.click(`[data-act=deckinfo][data-k=${k}]`);
  await p.waitForSelector('.dkcards');
  const n = await p.$$eval('.dkcards .dkc', els => els.length);
  await p.click('[data-act=deckpick]');
  return n;
}

export default async function () {
  const t = await setup();
  try {
    const A = await t.page('Ana', 'iPhone SE'), B = await t.page('Beto');
    const code = await createRoom(A, 'Ana', 'pvp');
    await joinRoom(B, 'Beto', code);
    await A.waitForFunction(() => document.querySelectorAll('#panel .lb-p').length >= 2);
    const nA = await escolher(A, 'azul');
    const nB = await escolher(B, 'reis');
    check(nA === 13 && nB === 11, `a tela do baralho deveria mostrar 13 valores no Azul e 11 no Reis, mostrou ${nA} e ${nB}`);
    check((await A.textContent('.deckrow')).includes('Azul'), 'a sala deveria mostrar o baralho escolhido');
    await B.waitForTimeout(800);
    await A.click('[data-act=startgame]');
    for (const p of [A, B]) await p.waitForFunction(() => window.__c21.S && window.__c21.S.mp);
    for (const p of [A, B]) await p.evaluate(() => { window.__c21.S.mp.mesa = false; });
    for (const p of [A, B]) await p.click('[data-act=pvpgo]');
    for (const p of [A, B]) await p.waitForFunction(() => window.__c21.S.phase === 'play' && !window.__c21.S.busy, null, { timeout: 15000 });
    const a = await A.evaluate(() => ({ dk: window.__c21.S.mp.deck, mo: window.__c21.S.money, mx: window.__c21.S.mp.maxHp, sw: window.__c21.S.swapsLeft }));
    const b = await B.evaluate(() => ({ dk: window.__c21.S.mp.deck, mx: window.__c21.S.mp.maxHp, low: [...window.__c21.S.deck, ...window.__c21.S.player].filter(c => c.r === '2' || c.r === '3').length, n: window.__c21.S.deck.length + window.__c21.S.player.length }));
    check(a.dk === 'azul' && a.mo === 6 && a.mx === 217 && a.sw === 2, `Azul: esperado $6 e 217 PV, veio ${JSON.stringify(a)}`);
    check(b.dk === 'reis' && b.mx === 217 && b.low === 0 && b.n === 44, `Reis: esperado sem 2 e 3 (44 cartas) e 217 PV, veio ${JSON.stringify(b)}`);
    check(t.errors.length === 0, 'erros na página: ' + t.errors.join(' | '));
    await t.close();

    // Baralhos desligados: todos jogam com o Padrão
    const t2 = await setup();
    try {
      const C = await t2.page('Caio');
      await createRoom(C, 'Caio', 'pvp');
      await escolher(C, 'vermelho');
      await C.click('[data-act=decktoggle]');
      check(await C.isVisible('text=Baralhos desligados'), 'a sala deveria avisar que os baralhos estão desligados');
      await C.click('[data-act=addbot]'); await C.waitForTimeout(500);
      await C.click('[data-act=startgame]');
      await C.waitForFunction(() => window.__c21.S && window.__c21.S.mp);
      await C.click('[data-act=pvpgo]');
      await C.waitForFunction(() => window.__c21.S.phase === 'play', null, { timeout: 15000 });
      const c = await C.evaluate(() => ({ dk: window.__c21.S.mp.deck, sw: window.__c21.S.swapsLeft }));
      check(c.dk === 'padrao' && c.sw === 2, `com baralhos desligados deveria ser o Padrão: ${JSON.stringify(c)}`);
      check(t2.errors.length === 0, 'erros na página: ' + t2.errors.join(' | '));
    } finally { await t2.close(); }
    return 'baralhos ok (escolha na sala, cartas, Azul, Reis e opção desligar)';
  } finally { await t.close().catch(() => {}); }
}
