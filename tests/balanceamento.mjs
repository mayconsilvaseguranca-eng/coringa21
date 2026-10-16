// Simulador de balanceamento das cartas do PvP (sem navegador).
// Reproduz as regras de pvpStartRound / pvpShowdown / pvpCheckDamage do index.html.
// Uso: node balanceamento.mjs [partidas]   (os números das cartas ficam em P)
export const P = {
  escudo: 4, espelho: 0.20, espelhoMin1: true, esquiva: 17, critico: 1.5, sangria: 2, sangriaR: 3,
  vampiro: 0.25, lamina: 3, duplo: 1.5, duploN: 3, precisao: 4, furia: 1.4, furiaHp: 30, cinco: 2,
  armadura: 0.85, bandagem: 3, muralha: 10, muralhaFrac: 0, critico21: false, duploAll: false, cincoN: 5, esquivaX: false, cincoFlat: 0, furiaFlat: 0, criticoFlat: 0, duploAllK: 0, bandagemHalf: false, multOnPer: false, botGrowth: true, botSmart: false, cincoExtra: 0,
};
export const COST = { escudo:5, espelho:5, esquiva:4, critico:5, sangria:5, vampiro:6, lamina:4, duplo:5, precisao:4, furia:5, cinco:5, armadura:5, bandagem:4, ultima:5, muralha:5, colete:3 };
export const CARDS = Object.keys(COST);
const HANDS = { win:{c:10,m:2}, t21:{c:25,m:3}, bj:{c:40,m:4}, five:{c:35,m:4} };
const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const val = r => r==='A'?11:(r==='J'||r==='Q'||r==='K')?10:+r;
const tot = cs => { let t=0,a=0; for(const r of cs){t+=val(r); if(r==='A')a++} while(t>21&&a){t-=10;a--} return t };
const minHit = r => Math.round(1+0.4*Math.max(0,r-1));
const hpFor = n => n>=6?120:120+12*(6-Math.max(2,n));
function deck(rng){const d=[];for(let s=0;s<4;s++)for(const r of RANKS)d.push(r);for(let i=d.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[d[i],d[j]]=[d[j],d[i]]}return d}
export function mkRng(seed){let s=seed>>>0||1;return()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296}}

function playHand(p, rng){
  if(!p.deck||p.deck.length<15)p.deck=deck(rng);
  const draw=()=>p.deck.pop();
  const c=[draw(),draw()];let doubled=false;
  if(tot(c)===21) return {c,doubled};
  // troca: mão dura de 12 a 16 com 2 cartas troca a menor
  if(!p.bot&&p.swaps>0&&c.length===2&&tot(c)>=12&&tot(c)<=16&&!c.includes('A')){const i=val(c[0])<=val(c[1])?0:1;c[i]=draw();p.swaps--;if(tot(c)===21)return{c,doubled}}
  const t2=tot(c);
  if(p.dbl&&(t2===10||t2===11)){doubled=true;c.push(draw());return{c,doubled}}
  const stop=p.bot?(P.botSmart?17:16+(rng()<.5?1:0)):(p.stop||17);
  while(c.length<5){const t=tot(c);
    if(t>=21)break;
    if(p.has.cinco&&c.length===P.cincoN-1&&t<=15){c.push(draw());continue}
    if(t>=stop)break;
    c.push(draw())}
  return {c,doubled};
}
const handVal = h => h.x?-1:h.t+(h.bj?.5:0)+(h.f?.25:0);

// sim de uma partida. players: [{cards:[], buy:'random'|'none'|fn, ...}]
export function game(cfg, rng){
  const n=cfg.n, maxHp=cfg.hp||hpFor(n);
  const ps=[];
  for(let i=0;i<n;i++){const s=cfg.players[i]||{};
    ps.push({i,hp:maxHp,al:true,has:{},cards:[],money:4,swaps:0,ult:false,colete:0,bleed:{},sent:0,dealt:0,dbl:s.bot?P.botSmart:(s.dbl??true),stop:s.stop,bot:!!s.bot,buy:s.buy||'none',want:s.want||null,fixed:s.cards||[],t:0,acq:{}});
    for(const k of ps[i].fixed){ps[i].has[k]=true;ps[i].cards.push(k);ps[i].acq[k]=0}
  }
  let r=0, pingpong=0;
  while(ps.filter(p=>p.al).length>1 && r<200){
    // início de rodada
    for(const p of ps){if(!p.al)continue;
      if(p.colete&&p.colete<=r){p.has.colete=false;p.cards=p.cards.filter(k=>k!=='colete');p.colete=0}
      if(p.has.bandagem&&r>0&&p.hp<maxHp&&(!P.bandagemHalf||p.hp<maxHp/2))p.hp=Math.min(maxHp,p.hp+P.bandagem)}
    r++;
    if((r-1)%3===0)for(const p of ps)p.swaps=3;
    const alive=ps.filter(p=>p.al);
    for(const p of alive){const h=playHand(p,rng);const t=tot(h.c);p.sub={t:Math.min(t,99),bj:h.c.length===2&&t===21,f:h.c.length>=5&&t<=21,x:t>21,c:h.c,d:h.doubled};p.v=handVal(p.sub)}
    // ataques
    const inc=new Map(); // alvo -> Map(atacante -> dano bruto)
    const add=(to,from,d)=>{if(!inc.has(to))inc.set(to,new Map());const m=inc.get(to);m.set(from,(m.get(from)||0)+d)};
    const hp0=new Map(alive.map(p=>[p,p.hp]));
    for(const p of alive){
      const parts=alive.filter(q=>q!==p);
      // sangria de rodadas anteriores
      for(const [q,b] of Object.entries(p.bleed)){const tg=ps[q];if(r>b.from&&r<=b.to&&tg.al){add(tg,p,P.sangria);p.dealt+=P.sangria}if(r>=b.to)delete p.bleed[q]}
      const myV=p.v;const beaten=myV<0?[]:parts.filter(q=>q.v<myV);
      if(!beaten.length)continue;
      const s=p.sub;const type=s.bj?'bj':s.f?'five':s.t===21?'t21':'win';
      let pts=(HANDS[type].c+s.c.reduce((a,x)=>a+val(x),0))*HANDS[type].m*(s.d?2:1);
      p.t+=pts;
      let dmg=Math.round(pts/80*20*(p.bot&&P.botGrowth?(1+0.05*Math.min(10,r-1)):1));
      if(!P.multOnPer&&!P.criticoFlat&&(type==='bj'||(P.critico21&&s.t===21))&&p.has.critico)dmg=Math.round(dmg*P.critico);
      if(!P.multOnPer&&p.has.cinco&&!P.cincoFlat&&!P.cincoExtra&&s.c.length>=P.cincoN&&s.t<=21)dmg=Math.round(dmg*P.cinco);
      if(!P.multOnPer&&p.has.furia&&!P.furiaFlat&&hp0.get(p)<P.furiaHp)dmg=Math.round(dmg*P.furia);
      let per=Math.max(1,Math.round(dmg/Math.max(1,parts.length)),minHit(r));
      if(P.multOnPer){
        if((type==='bj'||(P.critico21&&s.t===21))&&p.has.critico)per=Math.round(per*P.critico);
        if(p.has.cinco&&!P.cincoExtra&&s.c.length>=P.cincoN&&s.t<=21)per=Math.round(per*P.cinco);
        if(p.has.furia&&hp0.get(p)<P.furiaHp)per=Math.round(per*P.furia);
      }
      if(p.has.duplo&&!P.duploAllK&&(P.duploAll?beaten.length===parts.length:beaten.length>=P.duploN))per=Math.round(per*P.duplo);
      if(p.has.lamina)per+=P.lamina;
      if(p.has.cinco&&P.cincoExtra)per+=P.cincoExtra*(s.c.length-2);
      if(p.has.cinco&&P.cincoFlat&&s.c.length>=P.cincoN)per+=P.cincoFlat;
      if(p.has.furia&&P.furiaFlat&&hp0.get(p)<P.furiaHp)per+=P.furiaFlat;
      if(p.has.critico&&P.criticoFlat&&s.t===21)per+=P.criticoFlat;
      if(p.has.duplo&&P.duploAllK&&beaten.length===parts.length)per=Math.round(per*P.duploAllK);
      if(p.has.precisao&&s.t===20)per+=P.precisao;
      for(const b of beaten)add(b,p,per);
      p.dealt+=per*beaten.length;
      if(p.has.sangria)for(const b of beaten)p.bleed[b.i]={from:r,to:r+P.sangriaR};
      if(p.has.vampiro)p.hp=Math.min(maxHp,p.hp+Math.max(1,Math.round(per*beaten.length*P.vampiro)));
    }
    // dinheiro
    for(const p of alive){const parts=alive.length-1;const b=p.v<0?0:alive.filter(q=>q!==p&&q.v<p.v).length;p.money+=b?(b===parts?2:1):0}
    // defesa (pvpCheckDamage), com reflexos do Espelho em ondas
    const sh=new Map(),mw=new Map();
    let wave=inc, guard=0;
    while(wave.size&&guard<60){guard++;const next=new Map();
      for(const [p,m] of wave){ if(!p.al)continue;
        for(const [from,raw] of m){let d=Math.round(raw);
          if(p.has.esquiva&&!from.sub.x&&from.sub.t<=P.esquiva)d=0;
          if(p.has.colete&&p.sub.x&&d>0){d=0;p.colete=r}
          if(p.has.armadura&&d>0)d=Math.max(0,Math.round(d*P.armadura));
          if(p.has.muralha&&d>0){const last=alive.filter(q=>q!==p).every(q=>q.v>=p.v);if(last){if(P.muralhaFrac)d=Math.round(d*(1-P.muralhaFrac));else{if(!mw.has(p))mw.set(p,P.muralha);const left=mw.get(p);d=Math.min(d,left);mw.set(p,left-d)}}}
          if(p.has.escudo&&d>0){if(!sh.has(p))sh.set(p,P.escudo);const a=Math.min(sh.get(p),d);d-=a;sh.set(p,sh.get(p)-a)}
          if(p.has.espelho&&d>0){let back=Math.round(d*P.espelho);if(P.espelhoMin1)back=Math.max(1,back);if(back>0&&from.al){if(!next.has(from))next.set(from,new Map());next.get(from).set(p,(next.get(from).get(p)||0)+back);if(guard>1)pingpong+=back}}
          if(d>0)p.hp-=d;
          if(p.hp<=0&&p.has.ultima&&!p.ult){p.ult=true;p.hp=1}
        }}
      wave=next}
    // eliminação (desempate: sobrevive a vida menos negativa)
    const dead=alive.filter(p=>p.hp<=0);
    if(dead.length===alive.length){const best=dead.reduce((a,b)=>b.hp>a.hp||(b.hp===a.hp&&b.t>a.t)?b:a);best.hp=1}
    for(const p of alive)if(p.hp<=0){p.al=false;p.out=r}
    // loja a cada 3 rodadas
    if(r%3===0)for(const p of ps){if(!p.al)continue;
      p.money+=Math.min(2,Math.floor(p.money/10));
      if(p.buy==='none')continue;
      let offer=shuffle(CARDS.filter(k=>!p.has[k]),rng).slice(0,3);let rr=3;
      for(let tries=0;tries<4;tries++){
        let pick=null;
        if(p.want){pick=offer.find(k=>p.want.includes(k)&&COST[k]<=p.money)}
        else pick=offer.find(k=>COST[k]<=p.money);
        if(pick&&p.cards.length<5){p.money-=COST[pick];p.has[pick]=true;p.cards.push(pick);p.acq[pick]=r;offer=offer.filter(k=>k!==pick);continue}
        if(p.want&&p.money>=rr+3&&p.cards.length<5){p.money-=rr;rr++;offer=shuffle(CARDS.filter(k=>!p.has[k]),rng).slice(0,3);continue}
        break}
    }
  }
  const win=ps.find(p=>p.al)||ps[0];
  return {rounds:r,winner:win.i,ps,pingpong};
}
function shuffle(a,rng){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}

// ---------- experimentos ----------
export function solo(card,{n=6,G=20000,seed=1}={}){ // jogador 0 com a carta desde a 1ª rodada, rivais sem carta
  const rng=mkRng(seed);let w=0,rs=0;
  for(let g=0;g<G;g++){const res=game({n,players:[{cards:card?[card]:[]}]},rng);if(res.winner===0)w++;rs+=res.rounds}
  return {win:w/G,rounds:rs/G};
}
export function economy({n=6,G=20000,seed=7}={}){ // todos compram aleatoriamente na loja
  const rng=mkRng(seed);const hold={},holdW={};let rs=0;
  for(const k of CARDS){hold[k]=0;holdW[k]=0}
  for(let g=0;g<G;g++){const res=game({n,players:Array.from({length:n},()=>({buy:'random'}))},rng);rs+=res.rounds;
    for(const p of res.ps)for(const k of Object.keys(p.acq)){hold[k]++;if(res.winner===p.i)holdW[k]++}}
  const out={};for(const k of CARDS)out[k]=hold[k]?holdW[k]/hold[k]:0;
  return {out,rounds:rs/G,base:1/n};
}

if(import.meta.url===`file://${process.argv[1]}`){
  const G=+process.argv[2]||20000;
  for(const n of [6,4,2]){
    const b=solo(null,{n,G});
    console.log(`\n== Mesa de ${n} · sem carta: vitória ${(b.win*100).toFixed(1)}% · ${b.rounds.toFixed(1)} rodadas`);
    const rows=CARDS.map(k=>[k,solo(k,{n,G})]).sort((a,b)=>b[1].win-a[1].win);
    for(const [k,x] of rows)console.log(`${k.padEnd(9)} ${(x.win*100).toFixed(1).padStart(5)}%  (${x.win/b.win>=1?'+':''}${((x.win/b.win-1)*100).toFixed(0)}%)  $${COST[k]}`);
  }
}
