// Loja: cabe inteira no iPhone SE sem rolar, no PvP (com as descrições mais longas) e no solo.
import { setup, check } from './lib.mjs';
import { createRoom } from './lib.mjs';

export default async function () {
  const t = await setup();
  try {
    const out = {};

    
    const A = await t.page('Ana','iPhone SE');
    await createRoom(A, 'Ana', 'pvp');
    await A.click('[data-act=addbot]'); await A.waitForTimeout(600);
    await A.click('[data-act=startgame]');
    await A.waitForFunction(() => window.__c21.S && window.__c21.S.mp);
    await A.waitForTimeout(1200);
    await A.evaluate(() => { const c=window.__c21,S=c.S; const keep=['colete','ultima','esquiva'];S.jokers=Object.keys(c.JK).filter(k=>c.JK[k].pvp&&!keep.includes(k)).slice(0,4).map(k=>({k,v:0}));S.money=12;S.phase='cash';S.cash={reward:0,hands:0,interest:0,bonus:0,total:0};
      const b=document.createElement('button');b.dataset.act='collect';document.body.appendChild(b);b.click(); });
    await A.evaluate(()=>{const S=window.__c21.S;S.shop.items=['colete','ultima','esquiva'].map(k=>({t:'j',k,sold:false}));const b=document.createElement('button');b.dataset.act='toshop';document.body.appendChild(b);b.click();});
    await A.waitForTimeout(700);
    
    out.pvp=await A.evaluate(()=>{const p=document.querySelector('#panel');return {sh:p.scrollHeight,ch:p.clientHeight}});
    
    const B = await t.page('Bia','iPhone SE');
    await B.click('.logo').catch(()=>{});
    await B.click('[data-act=new]'); await B.click('[data-act=play]');
    await B.waitForTimeout(1500);
    await B.evaluate(() => { const c=window.__c21; c.S.money=20; c.S.jokers=[{k:'coringa',v:0}]; c.openShop(); });
    await B.waitForTimeout(700);
    
    out.solo=await B.evaluate(()=>{const p=document.querySelector('#panel');return {sh:p.scrollHeight,ch:p.clientHeight}});
    
    check(out.pvp.sh <= out.pvp.ch + 2, `a loja do PvP rola no iPhone SE (${out.pvp.sh} > ${out.pvp.ch})`);
    check(out.solo.sh <= out.solo.ch + 2, `a loja do solo rola no iPhone SE (${out.solo.sh} > ${out.solo.ch})`);
    check(t.errors.length === 0, 'erros na página: ' + t.errors.join(' | '));
    return `loja cabe no iPhone SE (PvP ${out.pvp.sh}px, solo ${out.solo.sh}px)`;
  } finally { await t.close(); }
}
