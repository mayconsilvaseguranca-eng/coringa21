// Temas: escolher no menu, salvar no aparelho e caber na tela do iPhone SE em todos.
import { setup, check } from './lib.mjs';

export default async function () {
  const t = await setup();
  try {
    const p = await t.page('Ana', 'iPhone SE');
    check(await p.evaluate(() => document.documentElement.dataset.tema === 'feltro'), 'o tema padrão não é o Feltro Verde');
    await p.click('[data-act=temas]');
    const ks = await p.$$eval('[data-act=temapick]', b => b.map(x => x.dataset.k));
    check(ks.length === 5 && !ks.includes('oceano'), 'deveria haver 5 temas: ' + ks);
    for (const k of ks) {
      await p.click(`[data-act=temapick][data-k=${k}]`);
      check(await p.getAttribute(`[data-act=temapick][data-k=${k}]`, 'aria-pressed') === 'true', 'o tema não ficou marcado: ' + k);
      await p.click('[data-act=home]');
      const ok = await p.evaluate(() => { const e = document.querySelector('#panel'); return e.scrollHeight <= e.clientHeight + 2; });
      check(ok, 'o menu precisa rolar no tema ' + k);
      await p.click('[data-act=temas]');
    }
    await p.click('[data-act=temapick][data-k=papel]');
    await p.reload();
    check(await p.evaluate(() => document.documentElement.dataset.tema === 'papel' && document.documentElement.classList.contains('claro')), 'o tema não ficou salvo depois de recarregar');
    check(t.errors.length === 0, 'erros na página: ' + t.errors.join(' | '));
    return '5 temas';
  } finally { await t.close(); }
}
