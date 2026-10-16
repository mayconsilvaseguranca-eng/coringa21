// Tela "Cartas": lista todas as cartas do PvP e do solo, e volta para o menu.
import { setup, check } from './lib.mjs';

export default async function () {
  const t = await setup();
  try {
    const p = await t.page('cartas', 'iPhone SE');
    await p.click('[data-act=cardsh]');
    const pvp = await p.$$eval('#panel .cc', els => els.length);
    const total = await p.evaluate(() => Object.values(window.__c21.JK).filter(j => j.pvp).length);
    check(pvp === total && pvp >= 16, `aba PvP deveria mostrar ${total} cartas, mostra ${pvp}`);
    check(await p.isVisible('text=Golpe Duplo'), 'Golpe Duplo não aparece na aba PvP');
    await p.click('[data-act=cards][data-t=solo]');
    const solo = await p.$$eval('#panel .cc', els => els.length);
    const js = await p.evaluate(() => Object.values(window.__c21.JK).filter(j => !j.pvp).length);
    check(solo === js + 5, `aba Solo deveria mostrar ${js + 5} cartas, mostra ${solo}`);
    const wide = await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
    check(wide, 'a tela de cartas passou da largura do celular');
    await p.click('[data-act=home]');
    await p.waitForSelector('[data-act=cardsh]');
    check(t.errors.length === 0, 'erros na página: ' + t.errors.join(' | '));
    return `tela de cartas ok (${pvp} PvP, ${solo} solo)`;
  } finally { await t.close(); }
}
