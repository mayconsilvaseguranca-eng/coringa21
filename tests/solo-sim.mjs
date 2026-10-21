// Simulador do modo solo: joga milhares de partidas com as regras de index.html (blinds, chefes, coringas, planetas, loja, juros).
// Uso: node tests/solo-sim.mjs [partidas]
// Os números (HANDS, BLINDS, ANTE_BASE, coringas) precisam bater com index.html.
import { mkRng } from './balanceamento.mjs';

export const HANDS = { win:{c:10,m:2,lc:10,lm:1}, t21:{c:25,m:3,lc:15,lm:1}, bj:{c:40,m:4,lc:20,lm:2}, five:{c:35,m:4,lc:20,lm:2}, push:{c:5,m:1,lc:10,lm:1} };
const WIN_TYPES = ['win','t21','bj','five'];
const BLINDS = [{r:3,k:1},{r:4,k:1.5},{r:5,k:2}];
export const ANTE_BASE = [80,220,600,1500,3800,8500,18000,38000];
export let ENDLESS_K = 2.2;
const BOSSES = ['muro','espelho','agulha','corrente','peso','chama'];
export const COST = { coringa:2, as:4, corte:5, beirada:6, pefrio:4, bolso:5, sete:6, cautela:6, seguro:5, vidente:4, agiota:5, par:4, dobradinha:6, reserva:6, trocador:4, sangue:4, escalada:7, ganancia:5 };
export const JOKERS = Object.keys(COST);
const SUITS = ['♠','♥','♦','♣'], RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

export function target(a, i) { const base = a <= 8 ? ANTE_BASE[a-1] : ANTE_BASE[7]*Math.pow(ENDLESS_K, a-8); return Math.round(base*BLINDS[i].k/10)*10; }

// Ordem de preferência do "jogador esperto" (ajustada pelo próprio simulador: os mais fortes primeiro)
export let TIER = ['escalada','dobradinha','reserva','beirada','corte','bolso','sete','coringa','ganancia','sangue','as','cautela','par','agiota','pefrio','trocador','seguro','vidente'];

export function run(cfg = {}, rng) {
  const pick = a => a[Math.floor(rng()*a.length)];
  const shuffle = a => { a = a.slice(); for (let i = a.length-1; i > 0; i--) { const j = Math.floor(rng()*(i+1)); [a[i],a[j]] = [a[j],a[i]]; } return a; };
  const S = { ante:1, bi:0, money:4, jokers:(cfg.start||[]).map(k=>({k,v:0})), levels:{win:1,t21:1,bj:1,five:1,push:1}, boss:null, best:0, bought:{} };
  const has = k => S.jokers.some(j => j.k === k);
  let deck = [];
  const newDeck = () => { const d = []; for (const s of SUITS) for (const r of RANKS) d.push({r,s}); return shuffle(d); };
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
          const dbl = has('dobradinha') ? (p >= 9 && p <= 11) : ((p === 10 || p === 11) && up < 10);
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
    if (isWin) for (const j of S.jokers) if (j.k === 'escalada') j.v = (j.v||0) + 1;
    if (type === 'bust' || type === 'lose') return 0;
    const b = hv(type); let c = b.c, m = b.m;
    if (bossOn('chama')) m = Math.max(1, Math.floor(m/2));
    for (const card of P) c += chips(card);
    const x = { cards:P, total:p, dBust:d > 21, isWin };
    for (const j of S.jokers) {
      switch (j.k) {
        case 'coringa': m += 4; break;
        case 'as': c += 25*P.filter(q => q.r === 'A').length; break;
        case 'corte': m += 3*P.filter(q => 'JQK'.includes(q.r)).length; break;
        case 'beirada': if (x.total >= 20) m *= 2; break;
        case 'pefrio': if (x.dBust) c += 60; break;
        case 'bolso': m += 2*P.length; break;
        case 'sete': for (const q of P) if (q.r === '7') m *= 1.5; break;
        case 'cautela': if (isWin && p <= 16) m *= 3; break;
        case 'par': if (P[0].r === P[1].r) m += 10; break;
        case 'sangue': c += 15*P.filter(q => q.s === '♥' || q.s === '♦').length; break;
        case 'escalada': if (j.v) m += j.v; break;
        case 'ganancia': m += Math.floor(S.money/5); break;
      }
    }
    if (doubled) m *= has('dobradinha') ? 3 : 2;
    if (isWin && has('agiota')) S.money++;
    return Math.floor(c*m);
  }

  function shop() {
    const smart = cfg.ai !== 'guloso';
    let items = [], reroll = 3;
    const gen = () => { const pool = shuffle(JOKERS.filter(k => !has(k))); const hs = shuffle(Object.keys(HANDS)); return [...pool.slice(0,2).map(k => ({t:'j',k})), ...hs.slice(0,2).map(k => ({t:'p',k}))]; };
    items = gen();
    const rank = k => { const i = TIER.indexOf(k); return i < 0 ? 99 : i; };
    for (let guard = 0; guard < 6; guard++) {
      let did = false;
      const js = items.filter(it => it.t === 'j' && !it.sold).sort((a,b) => rank(a.k) - rank(b.k));
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

  let prevBoss = null;
  for (S.ante = 1; S.ante <= maxAnte; S.ante++) {
    boss = pick(BOSSES.filter(k => k !== prevBoss)); prevBoss = boss;
    for (S.bi = 0; S.bi < 3; S.bi++) {
      deck = newDeck();
      let score = 0;
      let hands = 5 - (S.bi === 2 && boss === 'agulha' ? 2 : 0) + (has('reserva') ? 1 : 0);
      const st = { swaps: (S.bi === 2 && boss === 'corrente') ? 0 : 3 + (has('trocador') ? 2 : 0), seguro:false };
      const tgt = target(S.ante, S.bi);
      while (hands > 0 && score < tgt) { const pts = playHand(st); S.best = Math.max(S.best, pts); score += pts; hands--; }
      if (score < tgt) return { ante:S.ante, bi:S.bi, won:S.ante > 8 || false, boss:S.bi === 2 ? boss : null, jokers:S.jokers.map(j=>j.k), best:S.best, bought:S.bought };
      S.money += BLINDS[S.bi].r + hands + Math.min(5, Math.floor(S.money/5));
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
