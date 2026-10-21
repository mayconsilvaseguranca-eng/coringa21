// Tutorial do multiplayer: segue os passos tocando só no que é liberado, confere que o resto fica bloqueado e que tudo cabe no iPhone SE.
import { setup, check } from './lib.mjs';

export default async function () {
  const t = await setup();
  try {
    const p = await t.page('Ana', 'iPhone SE');
    await p.click('[data-act=mphome]');
    await p.click('[data-act=tutorial]');
    await p.waitForSelector('#tut:not([hidden]) .tut-coach');
    const st = () => p.evaluate(() => { const T = window.__c21.T; return T ? { i: T.i, allow: T.allow, busy: T.busy, hp: T.riv.map(r => r.hp), hand: T.hand.length } : null; });
    const fits = () => p.evaluate(() => { const e = document.querySelector('#tut'); return e.scrollHeight <= e.clientHeight + 2 && [...e.querySelectorAll('.tut-coach,.actions,.tut-pane')].every(x => x.getBoundingClientRect().bottom <= innerHeight + 1); });
    // bloqueio: com o passo 0 aberto, tocar em Pedir não faz nada
    await p.$eval('#tut [data-tut=hit]', b => b.click());
    check((await st()).i === 0, 'tocar fora do destaque deveria ser ignorado');
    const path = ['next', 'next', 'next', 'hit', 'stand', 'next', 'double', 'next', 'buy', 'leave', 'next', 'deck', 'next', 'next'];
    for (const k of path) {
      await p.waitForFunction(() => { const T = window.__c21.T; return T && !T.busy && (T.allow || document.querySelector('#tut [data-tut=next]')); }, null, { timeout: 15000 });
      check(await fits(), 'o tutorial não cabe no iPhone SE no passo ' + (await st()).i);
      // tentar um botão errado primeiro: precisa ser ignorado
      const before = (await st()).i;
      if (k !== 'hit') { await p.$eval('#tut [data-tut=hit]', b => b.click()).catch(() => {}); await p.waitForTimeout(100); check((await st()).i === before, 'botão bloqueado respondeu no passo ' + before); }
      await p.click(`#tut [data-tut=${k}]`, { timeout: 4000 });
      await p.waitForTimeout(250);
    }
    const s1 = await st();
    check(s1 && s1.i === 14, 'o tutorial deveria chegar ao fim: ' + JSON.stringify(s1));
    check(s1.hp.every(h => h === 116), 'os rivais deveriam ter levado 24 + 60 de dano: ' + s1.hp);
    await p.click('#tut [data-tut=next]');
    await p.waitForSelector('#tut[hidden]', { state: 'attached' });
    check(await p.isVisible('[data-act=create]'), 'no fim, deveria voltar ao Multiplayer com Criar sala');
    check(t.errors.length === 0, 'erros na página: ' + t.errors.join(' | '));
    return 'tutorial ok (15 passos, bloqueio de toques, cabe no iPhone SE)';
  } finally { await t.close(); }
}
