// Simulador do modo solo: joga milhares de partidas com as regras de index.html (blinds, chefes, coringas, planetas, loja, juros).
// Uso: node tests/solo-sim.mjs [partidas]   (v23: 6 mãos por blind, metas novas e 26 coringas balanceados)
// Os números (HANDS, BLINDS, ANTE_BASE, coringas) precisam bater com index.html.
import { mkRng } from './balanceamento.mjs';

export const HANDS = { win:{c:10,m:2,lc:10,lm:1}, t21:{c:25,m:3,lc:15,lm:1}, bj:{c:40,m:4,lc:20,lm:2}, five:{c:35,m:4,lc:20,lm:2}, push:{c:5,m:1,lc:10,lm:1} };
const WIN_TYPES = ['win','t21','bj','five'];
const BLINDS = [{r:3,k:1},{r:4,k:1.5},{r:5,k:2}];
export const ANTE_BASE = [35,90,180,350,620,1000,1550,2300];
const BOSSES = ['muro','espelho','agulha','corrente','peso','chama'];
export const COST = { coringa:4, as:4, corte:5, beirada:5, pefrio:4, bolso:6, sete:4, cautela:4, seguro:4, vidente:4, agiota:5, par:4, dobradinha:4, reserva:6, trocador:3, sangue:4, escalada:10, ganancia:4, rei21:4, azarado:5, sequencia:6, maocheia:4, rede:4, cofrinho:3, juros:2, baralhoalto:4 };
export const JOKERS = Object.keys(COST);
const SUITS = ['♠','♥','♦','♣'], RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

// números das cartas novas (ajustados no simulador)
export const P_ = { endK:1.6, jurosCap:8, escCap:999, altoM:1, hands:6, rei21:4, azarado:2, seq:1, maocheia:3, rede:1, cofrinho:4, jurosDiv:2, coringa:4, as:40, corte:3, beirada:2, pefrio:60, bolso:2, sete:2, cautela:3, par:3, sangue:15, escalada:0.25, ganancia:3, vidente:3, dobradinha:3, trocador:3, alto:['2', '3', '4'] };
export function target(a, i) { const base = a <= 8 ? ANTE_BASE[a-1] : ANTE_BASE[7]*Math.pow(P_.endK, a-8); return Math.round(base*BLINDS[i].k/10)*10; }

// Ordem de preferência do "jogador esperto" (ajustada pelo próprio simulador: os mais fortes primeiro)
export let TIER = ['sequencia','rei21','maocheia','azarado','cofrinho','juros','baralhoalto','rede','escalada','dobradinha','reserva','beirada','corte','bolso','sete','coringa','ganancia','sangue','as','cautela','par','agiota','pefrio','trocador','seguro','vidente'];

export function run(cfg = {}, rng) {
  const pick = a => a[Math.floor(rng()*a.length)];
  const shuffle = a => { a = a.slice(); for (let i = a.length-1; i > 0; i--) { const j = Math.floor(rng()*(i+1)); [a[i],a[j]] = [a[j],a[i]]; } return a; };
  const S = { ante:1, bi:0, money:4, jokers:(cfg.start||[]).map(k=>({k,v:0})), levels:{win:1,t21:1,bj:1,five:1,push:1}, boss:null, best:0, bought:{} };
  const has = k => S.jokers.some(j => j.k === k);
  let deck = [];
  const newDeck = () => { const d = []; for (const s of SUITS) for (const r of RANKS) { if (has('baralhoalto') && P_.alto.includes(r)) continue; d.push({r,s}); } return shuffle(d); };
  const draw = () => { if (!deck.length) deck = newDeck(); return deck.pop(); };
  let boss = null;
  const bossOn = k => S.bi === 2 && boss === k;
  const val = c => c.r === 'A' ? 11 : 'JQK'.includes(c.r) ? 10 : +c.r;
  const total = cards => { let t = 0, a = 0; const peso = bossOn('peso'); for (const c of cards) { if (c.r === 'A') { if (peso) t += 1; else { t += 11; a++; } } else t += val(c); } while (t > 21 && a) { t -= 10; a--; } return t; };
  const chips = c => c.r === 'A' ? (bossOn('peso') ? 1 : 11) : val(c);
  const hv = k => { const h = HANDS[k], l = S.levels[k]; return { c: h.c + h.lc*(l-1), m: h.m + h.lm*(l-1) }; };
  const maxAnte = cfg.endless ? (cfg.maxAnte || 30) : 8;

  function playHand(st) {
    const P = [draw()], D = [draw()]; P.push(draw()); D.push(draw());
    let doubled = false;
    const up = val(D[0]) === 11 ? 11 : Math.min(10, val(D[0]));
    const pBJ0 = total(P) === 21, dBJ0 = total(D) === 21;
    if (!pBJ0 && !dBJ0) {
      for (;;) {
        const p = total(P);
        if (p >= 21 || P.length >= 5) break;
        if (P.length === 2 && !doubled) {
          const dbl = has('dobradinha') ? (p >= 8 && p <= 11) : ((p === 10 || p === 11) && up < 10);
          if (dbl) { doubled = true; P.push(draw()); break; }
          if (st.swaps > 0 && !bossOn('corrente') && p >= 12 && p <= 16 && up >= 7) {
            const i = val(P[0]) <= val(P[1]) ? 0 : 1; if (P[i].r !== 'A') { P[i] = draw(); st.swaps--; continue; }
          }
        }
        let hit;
        if (P.length === 4 && p <= 13) hit = true;            // perto de Cinco Cartas
        else if (p <= 11) hit = true;
        else if (p === 12) hit = !(up >= 4 && up <= 6);
        else if (p <= 16) hit = up >= 7;
        else hit = false;
        if (has('cautela') && p >= 13 && p <= 16) hit = false;
        if (!hit) break;
        P.push(draw());
      }
    }
    const p = total(P);
    if (p <= 21 && P.length < 5 && !pBJ0) { const stop = bossOn('muro') ? 18 : 17; while (total(D) < stop) D.push(draw()); }
    const d = total(D);
    const pBJ = P.length === 2 && p === 21, dBJ = D.length === 2 && d === 21;
    let type;
    if (p > 21) { type = 'bust'; if (has('seguro') && !st.seguro) { st.seguro = true; type = 'push'; } }
    else if (pBJ && !dBJ) type = 'bj';
    else if (dBJ && !pBJ) type = 'lose';
    else if (P.length >= 5) type = 'five';
    else if (d > 21 || p > d) type = p === 21 ? 't21' : 'win';
    else if (p === d) type = 'push';
    else type = 'lose';
    if (type === 'push' && bossOn('espelho')) type = 'lose';
    const isWin = WIN_TYPES.includes(type);
    const seqJ = S.jokers.find(j => j.k === 'sequencia'); const streak = seqJ ? (seqJ.v||0) : 0;
    if (isWin) for (const j of S.jokers) if (j.k === 'escalada') j.v = (j.v||0) + 1;
    if (seqJ) { if (isWin) seqJ.v = (seqJ.v||0) + 1; else if (type === 'bust' || type === 'lose') seqJ.v = 0; }
    if (type === 'bust' || type === 'lose') { if (has('rede')) { let c0 = 0; for (const card of P) c0 += chips(card); return Math.floor(c0 * P_.rede); } return 0; }
    const b = hv(type); let c = b.c, m = b.m;
    if (bossOn('chama')) m = Math.max(1, Math.floor(m/2));
    for (const card of P) c += chips(card);
    const x = { cards:P, total:p, dBust:d > 21, isWin };
    for (const j of S.jokers) {
      switch (j.k) {
        case 'coringa': m += P_.coringa; break;
        case 'as': c += P_.as*P.filter(q => q.r === 'A').length; break;
        case 'corte': m += P_.corte*P.filter(q => 'JQK'.includes(q.r)).length; break;
        case 'beirada': if (x.total >= 20) m *= P_.beirada; break;
        case 'pefrio': if (x.dBust) c += P_.pefrio; break;
        case 'bolso': m += P_.bolso*P.length; break;
        case 'sete': for (const q of P) if (q.r === '7') m *= P_.sete; break;
        case 'cautela': if (isWin && p <= 16) m *= P_.cautela; break;
        case 'par': if (P[0].r === P[1].r) m *= P_.par; break;
        case 'sangue': c += P_.sangue*P.filter(q => q.s === '♥' || q.s === '♦').length; break;
        case 'escalada': if (j.v) m += Math.min(P_.escCap, Math.floor(P_.escalada*j.v)); break;
        case 'ganancia': m += Math.floor(S.money/P_.ganancia); break;
        case 'rei21': if (p === 21) m *= P_.rei21; break;
        case 'azarado': if (x.dBust) m *= P_.azarado; break;
        case 'sequencia': if (streak) m *= 1 + P_.seq*streak; break;
        case 'maocheia': if (isWin && P.length >= 3) m *= P_.maocheia; break;
      }
    }
    if (has('vidente')) m += P_.vidente;
    if (has('baralhoalto')) m += P_.altoM;
    if (doubled) m *= has('dobradinha') ? P_.dobradinha : 2;
    if (isWin && has('agiota')) S.money++;
    if (doubled && isWin && has('dobradinha')) st.refund = (st.refund||0) + 1;
    return Math.floor(c*m);
  }

  function shop() {
    if (cfg.noShop) return;
    const smart = cfg.ai !== 'guloso';
    let items = [], reroll = 3;
    const gen = () => { const pool = shuffle(JOKERS.filter(k => !has(k))); const hs = shuffle(Object.keys(HANDS)); return [...pool.slice(0,2).map(k => ({t:'j',k})), ...hs.slice(0,2).map(k => ({t:'p',k}))]; };
    items = gen();
    if (cfg.force && !has(cfg.force) && S.money >= COST[cfg.force] && S.jokers.length < 5) { S.money -= COST[cfg.force]; S.jokers.push({k:cfg.force, v:0}); items = items.filter(it => it.k !== cfg.force); }
    const rank = k => { const i = TIER.indexOf(k); return i < 0 ? 99 : i; };
    for (let guard = 0; guard < 6; guard++) {
      let did = false;
      const js = cfg.ai === 'aleatorio' ? shuffle(items.filter(it => it.t === 'j' && !it.sold)) : items.filter(it => it.t === 'j' && !it.sold).sort((a,b) => rank(a.k) - rank(b.k));
      for (const it of js) {
        const c = COST[it.k];
        if (S.money < c) continue;
        if (S.jokers.length >= 5) {
          if (!smart) continue;
          const worst = S.jokers.reduce((w,j) => rank(j.k) > rank(w.k) ? j : w, S.jokers[0]);
          if (rank(worst.k) - rank(it.k) < 4 || worst.k === 'escalada') continue;
          S.money += Math.max(1, Math.floor(COST[worst.k]/2)); S.jokers = S.jokers.filter(j => j !== worst);
        }
        S.money -= c; S.jokers.push({k:it.k,v:0}); it.sold = true; S.bought[it.k] = 1; did = true;
      }
      const want = smart ? ['win','t21'] : ['win','t21','bj','five','push'];
      for (const it of items.filter(it => it.t === 'p' && !it.sold && want.includes(it.k))) {
        const reserve = smart && S.jokers.length >= 3 ? Math.min(25, 5*Math.floor(S.money/5)) : 0;
        if (S.money - 3 >= (smart ? Math.min(reserve, S.money-3) : 0) && S.money >= 3) { S.money -= 3; S.levels[it.k]++; it.sold = true; did = true; }
      }
      if (smart && S.jokers.length < 5 && S.money >= reroll + 6) { S.money -= reroll; reroll++; const ps = items.filter(x => x.t === 'p'); items = gen().filter(x => x.t === 'j').concat(ps); did = true; continue; }
      if (!did) break;
    }
  }

  if (cfg.handsOnly) { // mede pontos por mão com um deck fixo (sem loja, sem meta)
    S.ante = 5; S.bi = 0; S.money = cfg.money ?? 15; Object.assign(S.levels, cfg.levels || {});
    let tot = 0; const st = { swaps: 3 + (has('trocador') ? P_.trocador : 0), seguro:false };
    for (let h = 0; h < cfg.handsOnly; h++) { if (h % 5 === 0) { deck = newDeck(); st.swaps = 3 + (has('trocador') ? P_.trocador : 0); st.seguro = false; } tot += playHand(st); }
    return tot / cfg.handsOnly;
  }
  let prevBoss = null;
  for (S.ante = 1; S.ante <= maxAnte; S.ante++) {
    if (cfg.giveAt && cfg.giveAt.ante === S.ante && !has(cfg.giveAt.k)) { if (S.jokers.length >= 5) S.jokers.splice(Math.floor(rng()*5), 1); S.jokers.push({k:cfg.giveAt.k, v:0}); }
    boss = pick(BOSSES.filter(k => k !== prevBoss)); prevBoss = boss;
    for (S.bi = 0; S.bi < 3; S.bi++) {
      deck = newDeck();
      let score = 0;
      let hands = P_.hands - (S.bi === 2 && boss === 'agulha' ? 2 : 0) + (has('reserva') ? 1 : 0);
      const st = { swaps: (S.bi === 2 && boss === 'corrente') ? 0 : 3 + (has('trocador') ? P_.trocador : 0), seguro:false };
      const tgt = target(S.ante, S.bi);
      while (hands > 0 && score < tgt) { const pts = playHand(st); S.best = Math.max(S.best, pts); score += pts; hands--; if (st.refund) { hands += st.refund; st.refund = 0; } if (cfg.log) cfg.log.push([S.ante, pts]); }
      if (score < tgt) return { ante:S.ante, bi:S.bi, won:S.ante > 8 || false, boss:S.bi === 2 ? boss : null, jokers:S.jokers.map(j=>j.k), best:S.best, bought:S.bought };
      S.money += BLINDS[S.bi].r + hands + (has('juros') ? Math.min(P_.jurosCap, Math.floor(S.money/P_.jurosDiv)) : Math.min(5, Math.floor(S.money/5))) + (has('cofrinho') ? P_.cofrinho : 0);
      if (!(S.ante === maxAnte && S.bi === 2)) shop();
    }
  }
  return { ante:maxAnte+1, bi:0, won:true, jokers:S.jokers.map(j=>j.k), best:S.best, bought:S.bought };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const G = +process.argv[2] || 5000;
  const pct = x => (x*100).toFixed(1).padStart(5) + '%';
  for (const ai of ['esperto','guloso']) {
    const rng = mkRng(5); const reach = Array(40).fill(0); let win8 = 0; const fails = {}; const dies = {};
    for (let g = 0; g < G; g++) { const r = run({ai}, rng); if (r.won) win8++; else { reach[r.ante]++; dies[r.ante+'.'+r.bi] = (dies[r.ante+'.'+r.bi]||0)+1; if (r.boss) fails[r.boss] = (fails[r.boss]||0)+1; } }
    console.log(`\n== Jogador ${ai}: vence o ante 8 em ${pct(win8/G)}`);
    console.log('perde no ante:', reach.map((n,a) => n ? `${a}:${pct(n/G).trim()}` : '').filter(Boolean).join('  '));
    console.log('perde em qual blind:', Object.entries(dies).sort().map(([k,n]) => `${k.replace('.0',' P').replace('.1',' G').replace('.2',' C')}:${(n/G*100).toFixed(1)}%`).join('  '));
    console.log('chefe que eliminou:', Object.entries(fails).map(([k,n]) => `${k} ${n}`).join(' · '));
  }
}
