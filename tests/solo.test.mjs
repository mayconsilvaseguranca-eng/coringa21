// Solo: joga uma partida inteira com estratégia simples e confere a música e o volume.
import { setup, check, handState, buyFirst } from './lib.mjs';

export default async function () {
  const t = await setup();
  try {
    const p = await t.page('solo', 'iPhone SE');
    // música: o controle de volume existe e muda o volume salvo
    await p.click('.logo');
    await p.$eval('#musvol', el => { el.value = '40'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    check((await p.textContent('#musvolv')).includes('40'), 'controle de volume da música não atualizou');

    await p.click('[data-act=new]'); await p.click('[data-act=play]');
    const seen = new Set();
    let shopSeen = false, confirmSeen = false;
    for (let i = 0; i < 260; i++) {
      await p.waitForTimeout(120);
      const st = await handState(p);
      seen.add(st.ph);
      try {
        if (st.ph === 'play' && !st.busy) {
          if (st.next) await p.click('[data-act=next]', { timeout: 1500 });
          else await p.click(st.t < 17 ? '[data-act=hit]' : '[data-act=stand]', { timeout: 1500 });
        } else if (st.ph === 'cash') await p.click('[data-act=collect]', { timeout: 1500 });
        else if (st.ph === 'shop') { shopSeen = true; if (await buyFirst(p)) confirmSeen = true; await p.click('[data-act=leave]', { timeout: 1500 }); }
        else if (st.ph === 'select') await p.click('[data-act=play]', { timeout: 1500 });
        else if (st.ph === 'over' || st.ph === 'won') break;
      } catch (e) {}
    }
    check(seen.has('play'), 'a partida solo não começou');
    check(!shopSeen || confirmSeen, 'a loja não mostrou a tela de confirmar compra');
    const end = await p.evaluate(() => ({ ph: window.__c21.S.phase, hands: window.__c21.S.stats.hands }));
    check(end.hands >= 3, `poucas mãos jogadas no solo (${end.hands})`);
    check(t.errors.length === 0, 'erros na página: ' + t.errors.join(' | '));
    return `solo ok: ${end.hands} mãos, fim em "${end.ph}"`;
  } finally { await t.close(); }
}
