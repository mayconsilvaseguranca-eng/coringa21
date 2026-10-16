// PvP: 2 pessoas e 4 bots jogam até sobrar um. Confere cartas diferentes, fim da partida e contas de PV.
import { setup, check, createRoom, joinRoom, pvpStep } from './lib.mjs';

export default async function () {
  const t = await setup();
  try {
    const A = await t.page('Ana');
    const code = await createRoom(A, 'Ana', 'pvp');
    // Beto entra pelo link de convite
    const link = await A.textContent('#share');
    check(link.includes('?sala=' + code), 'o link de convite não tem o código da sala: ' + link);
    const B = await t.page('Beto', 'iPhone 13', '&sala=' + code);
    check((await B.inputValue('#codein')) === code, 'o link de convite não preencheu o código');
    for (let i = 0; i < 4; i++) await A.click('[data-act=addbot]');
    await B.fill('#nick', 'Beto'); await B.click('[data-act=join]'); await B.waitForSelector('.lb-code');
    await A.waitForFunction(() => document.querySelectorAll('#panel .lb-p').length >= 6, null, { timeout: 8000 });
    const seesBots = await B.waitForFunction(() => document.querySelectorAll('#panel .lb-p.isbot').length === 4, null, { timeout: 10000 }).then(() => true, () => false);
    check(seesBots, 'Beto não vê os 4 bots na sala');
    check(await A.evaluate(() => { const p = document.querySelector('#panel'); return p.scrollHeight <= p.clientHeight + 2; }), 'a tela da sala precisa rolar com 6 jogadores');
    // vida inicial ajustada pelo anfitrião: 120 automático + 2 × 20
    await A.click('[data-act=hpup]'); await A.click('[data-act=hpup]');
    await A.click('[data-act=startgame]');
    for (const p of [A, B]) await p.waitForFunction(() => window.__c21.S && window.__c21.S.mp, null, { timeout: 10000 });
    check((await A.evaluate(() => window.__c21.S.mp.players.length)) === 6, 'a partida não começou com 6 jogadores');
    check((await B.evaluate(() => window.__c21.pvpHP())) === 160, 'a vida inicial escolhida na sala não chegou ao Beto');
    for (const p of [A, B]) await p.click('[data-act=pvpgo]');
    await A.waitForTimeout(1200);
    const hands = await Promise.all([A, B].map(p => p.evaluate(() => window.__c21.S.player.map(c => c.r + c.s).join(' '))));
    check(hands[0] !== hands[1], 'Ana e Beto receberam as mesmas cartas');

    let alive = 6, rounds = 0;
    for (let i = 0; i < 900 && alive > 1; i++) {
      for (const p of [A, B]) await pvpStep(p);
      await A.waitForTimeout(250);
      alive = await A.evaluate(() => window.__c21.gamePlayers().filter(p => p.st && p.st.al).length);
      rounds = await A.evaluate(() => Math.max(...window.__c21.gamePlayers().map(p => +(p.st && p.st.r) || 0)));
    }
    check(alive <= 1, `a partida não terminou (ainda ${alive} vivos na rodada ${rounds})`);
    check(rounds <= 30, `partida longa demais: ${rounds} rodadas`);
    const botCards = await A.evaluate(() => window.__c21.gamePlayers().filter(p => p.bot || String(p.pid).startsWith('b')).map(p => +(p.st && p.st.n) || 0));
    check(botCards.some(n => n > 0), `nenhum bot comprou carta: ${botCards}`);
    await A.waitForFunction(() => window.__c21.gamePlayers().some(p => p.st && p.st.ph === 'won'), null, { timeout: 10000 }).catch(() => {});
    const final = await A.evaluate(() => window.__c21.gamePlayers().map(p => ({ n: p.name, ph: p.st && p.st.ph, hp: p.st && p.st.hp })));
    check(final.filter(x => x.ph === 'won').length === 1, 'não houve exatamente um vencedor: ' + JSON.stringify(final));
    // fim de partida: voltar para a mesma sala (com os bots) ou para o menu
    await A.evaluate(() => window.__c21.showBoard());
    const btns = await A.$$eval('#panel .btn', els => els.map(e => e.textContent.trim()));
    check(btns.some(x => x.includes('Voltar para a sala')) && btns.some(x => x.includes('Voltar ao menu')), 'botões do fim de partida errados: ' + btns.join(', '));
    await A.click('#panel [data-act=lobby]');
    await A.waitForSelector('.lb-code', { timeout: 5000 });
    check((await A.textContent('.lb-code')).trim() === code, 'voltou para outra sala');
    await A.waitForFunction(() => document.querySelectorAll('#panel .lb-p.isbot').length === 4, null, { timeout: 8000 }).catch(() => {});
    const back = await A.$$eval('#panel .lb-p.isbot', els => els.length);
    check(back === 4, `os bots não voltaram para a sala (${back})`);
    await B.evaluate(() => window.__c21.showBoard()); await B.click('#panel [data-act=lobby]');
    await A.waitForFunction(() => document.querySelectorAll('#panel .lb-p').length >= 6, null, { timeout: 8000 });
    await A.click('[data-act=startgame]');
    for (const p of [A, B]) await p.waitForFunction(() => window.__c21.S && window.__c21.S.mp && !window.__c21.S.round, null, { timeout: 10000 });
    check((await A.evaluate(() => window.__c21.S.mp.players.length)) === 6, 'a segunda partida não começou com os 6 jogadores');
    check(t.errors.length === 0, 'erros na página: ' + t.errors.join(' | '));
    return `pvp com bots ok: ${rounds} rodadas, vencedor ${final.find(x => x.ph === 'won').n}`;
  } finally { await t.close(); }
}
