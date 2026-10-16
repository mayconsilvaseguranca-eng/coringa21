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
    await B.fill('#nick', 'Beto'); await B.click('[data-act=join]'); await B.waitForSelector('.code');
    await A.waitForFunction(() => document.querySelectorAll('#panel .li').length >= 6, null, { timeout: 8000 });
    const lobby = await B.$$eval('#panel .li', els => els.map(e => e.textContent));
    check(lobby.filter(x => x.includes('bot')).length === 4, 'Beto não vê os 4 bots na sala');
    await A.click('[data-act=startgame]');
    for (const p of [A, B]) await p.waitForFunction(() => window.__c21.S && window.__c21.S.mp, null, { timeout: 10000 });
    check((await A.evaluate(() => window.__c21.S.mp.players.length)) === 6, 'a partida não começou com 6 jogadores');
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
    check(rounds <= 25, `partida longa demais: ${rounds} rodadas`);
    await A.waitForTimeout(2000);
    const final = await A.evaluate(() => window.__c21.gamePlayers().map(p => ({ n: p.name, ph: p.st && p.st.ph, hp: p.st && p.st.hp })));
    check(final.filter(x => x.ph === 'won').length === 1, 'não houve exatamente um vencedor: ' + JSON.stringify(final));
    check(t.errors.length === 0, 'erros na página: ' + t.errors.join(' | '));
    return `pvp com bots ok: ${rounds} rodadas, vencedor ${final.find(x => x.ph === 'won').n}`;
  } finally { await t.close(); }
}
