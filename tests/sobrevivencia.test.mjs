// Sobrevivência: lista de salas, código errado, duelo com perda de vida, reconexão e vitória do último.
import { setup, check, createRoom } from './lib.mjs';

export default async function () {
  const t = await setup();
  try {
    const A = await t.page('Ana'), B = await t.page('Beto'), C = await t.page('Caio');
    const code = await createRoom(A, 'Ana', 'surv');
    await B.click('[data-act=mphome]'); await B.fill('#nick', 'Beto');
    await B.waitForSelector('.roombtn', { timeout: 8000 });
    await B.click('.roombtn'); await B.fill('#codein', 'ZZZZ'); await B.click('[data-act=joinpick]');
    check((await B.textContent('#panel .note')).includes('Código errado'), 'código errado não foi recusado');
    await B.fill('#codein', code.toLowerCase()); await B.click('[data-act=joinpick]'); await B.waitForSelector('.lb-code');
    await C.click('[data-act=mphome]'); await C.fill('#nick', 'Caio'); await C.fill('#codein', code); await C.click('[data-act=join]'); await C.waitForSelector('.lb-code');
    await A.waitForFunction(() => document.querySelectorAll('#panel .lb-p').length >= 3, null, { timeout: 8000 });
    await A.click('[data-act=startgame]');
    for (const p of [A, B, C]) await p.waitForFunction(() => window.__c21.S && window.__c21.S.mp, null, { timeout: 8000 });
    const duel = (p, sc) => p.evaluate(sc => { const t = window.__c21, S = t.S; S.busy = false; S.bi = 2; S.phase = 'play'; S.roundScore = sc; t.duelFinished(); }, sc);
    await duel(B, 200); await duel(A, 500);
    await A.waitForTimeout(800);
    check((await A.evaluate(() => window.__c21.S.phase)) === 'duelwait', 'o duelo terminou antes de todos jogarem');
    await duel(C, 300);
    for (const p of [A, B, C]) await p.waitForFunction(() => window.__c21.S.phase === 'duelres', null, { timeout: 8000 });
    const lives = await Promise.all([A, B, C].map(p => p.evaluate(() => window.__c21.S.mp.lives)));
    check(JSON.stringify(lives) === '[3,2,3]', 'vidas erradas após o duelo: ' + lives);
    for (const p of [A, B, C]) await p.click('[data-act=duelnext]');
    await B.reload(); await B.click('[data-act=mphome]'); await B.fill('#codein', code); await B.click('[data-act=join]');
    await B.waitForFunction(() => window.__c21.S && window.__c21.S.mp, null, { timeout: 8000 });
    check((await B.evaluate(() => window.__c21.S.mp.lives)) === 2, 'Beto não voltou para a partida com 2 vidas');
    await A.waitForTimeout(1500);
    for (const p of [B, C]) await p.evaluate(() => { const t = window.__c21; t.S.busy = false; t.S.mp.alive = false; t.S.phase = 'out'; t.render(); });
    await A.evaluate(() => { window.__c21.S.phase = 'shop'; window.__c21.render(); });
    await A.waitForFunction(() => window.__c21.S.phase === 'won', null, { timeout: 8000 });
    check(t.errors.length === 0, 'erros na página: ' + t.errors.join(' | '));
    return 'sobrevivência ok';
  } finally { await t.close(); }
}
