// Simulador de balanceamento das cartas do PvP (sem navegador).
// Reproduz as regras de pvpStartRound / pvpShowdown / pvpCheckDamage do index.html.
// Uso: node balanceamento.mjs [partidas]   (os números das cartas ficam em P)
export const P = {
  alvoCost: {mira:4,maldicao:4,gelo:5,roubo:3,troca:5,espiao:2}, roubo: 3, maldicao: 0.5, trocaMax: 15, miraAll: true, miraK: 0, geloMax: 2,
  escudo: 4, espelho: 0.20, espelhoMin1: true, esquiva: 17, critico: 1.5, sangria: 2, sangriaR: 3,
  vampiro: 0.25, lamina: 3, duplo: 1.5, duploN: 3, precisao: 4, furia: 1.4, furiaHp: 30, cinco: 2,
  armadura: 0.85, bandagem: 3, muralha: 10, muralhaFrac: 0, critico21: false, duploAll: false, cincoN: 5, esquivaX: false, cincoFlat: 0, furiaFlat: 0, criticoFlat: 0, duploAllK: 0, bandagemHalf: false, multOnPer: false, botGrowth: true, botSmart: false, cincoExtra: 0,
};
export const COST = { escudo:5, espelho:5, esquiva:4, critico:5, sangria:5, vampiro:6, lamina:4, duplo:5, precisao:4, furia:5, cinco:5, armadura:5, bandagem:4, ultima:5, muralha:5, colete:3 };
export const CARDS = Object.keys(COST);
const HANDS = { win:{c:10,m:2}, t21:{c:25,m:3}, bj:{c:40,m:4}, five:{c:35,m:4} };
const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const val = r => r==='A'?11:(r==='J'||r==='Q'||r==='K')?10:+r;
export const RC = {cap:21, iron:false, maxC:5};
const tot = cs => { let t=0,a=0; for(const r of cs){ if(r==='A'&&RC.iron){t+=1;continue} t+=val(r); if(r==='A')a++} while(t>21&&a){t-=10;a--} return t };
const cval = r => r==='A'&&RC.iron?1:val(r);
const minHit = r => Math.round(1+0.4*Math.max(0,r-1));
const hpFor = n => n>=6?120:120+12*(6-Math.max(2,n));
export const DECKS={padrao:1,vermelho:1,azul:1,reis:1,miudo:1,ases:1,guerreiro:1,guardiao:1,vidro:1,apostador:1,fantasma:1};
export const DK={vermelhoSw:1,azulMo:4,vidroHp:40,vidroDmg:3,apostK:3,apostBust:5,asesExtra:4,reisMin:6,miudoMax:7,fantasmaSw:0,guerMo:0,miudoCard:0,miudoHp:0,reisHp:0,asesHp:0,azulShop:0};
const ATK=['critico','sangria','vampiro','lamina','duplo','precisao','furia','cinco'],DEF=['escudo','espelho','esquiva','armadura','bandagem','ultima','muralha','colete'];
function deck(rng,kind){const d=[];
  const ranks=kind==='reis'?RANKS.filter(r=>r==='A'||val(r)>=DK.reisMin):kind==='miudo'?RANKS.filter(r=>r==='A'||val(r)<=DK.miudoMax):RANKS;
  for(let s=0;s<4;s++)for(const r of ranks)d.push(r);
  if(kind==='ases')for(let i=0;i<DK.asesExtra;i++)d.push('A');
  if(kind==='miudo'||kind==='reis'){const base=d.slice();while(d.length<40)d.push(...base)}for(let i=d.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[d[i],d[j]]=[d[j],d[i]]}return d}
export function mkRng(seed){let s=seed>>>0||1;return()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296}}

function playHand(p, rng, know){
  if(!p.deck||p.deck.length<15)p.deck=deck(rng,p.deckK);
  const draw=()=>p.deck.pop();
  const c=[draw(),draw()];let doubled=false;
  for(let g=0;g<20&&tot(c)>RC.cap;g++)c[1]=draw(); // mão inicial nunca estoura
  const maxC=Math.min(RC.maxC,p.frozenNow?3:5);
  if(p.frozenNow){while(c.length<Math.min(P.geloMax,maxC)&&tot(c)<17)c.push(draw());return {c,doubled}}
  if(know){ // Espião: joga sabendo a mão do rival
    if(know.x)return {c,doubled};
    while(c.length<maxC&&tot(c)<RC.cap&&tot(c)<=know.t)c.push(draw());
    return {c,doubled};
  }
  if(tot(c)===21&&RC.cap>=21) return {c,doubled};
  // troca: mão dura de 12 a 16 com 2 cartas troca a menor
  if(!p.bot&&p.swaps>0&&c.length===2&&tot(c)>=12&&tot(c)<=16&&!c.includes('A')){const i=val(c[0])<=val(c[1])?0:1;c[i]=draw();p.swaps--;if(tot(c)===21)return{c,doubled}}
  const t2=tot(c);
  if(p.dbl&&RC.cap===21&&maxC>=3&&(t2===10||t2===11)){doubled=true;c.push(draw());return{c,doubled}}
  let stop=(p.bot?(P.botSmart?17:16+(rng()<.5?1:0)):(p.stop||17))+(RC.cap-21);
  if(p.fantasmaT)stop=Math.max(stop-2,Math.min(stop+1,p.fantasmaT)); // vê a 1ª carta dos rivais
  while(c.length<maxC){const t=tot(c);
    if(t>=RC.cap)break;
    if(p.has.cinco&&c.length===P.cincoN-1&&t<=15){c.push(draw());continue}
    if(t>=stop)break;
    c.push(draw())}
  return {c,doubled};
}
const handVal = h => h.x?-1:h.f?Math.max(h.t,20.5)+.25:h.t+(h.bj?.5:0); // igual ao jogo: Cinco Cartas ganha de qualquer mão até 20
const MESA=['tempestade','teto','ceu','empate','curta','asferro','ouro','silencio','hospital'];

// sim de uma partida. players: [{cards:[], buy:'random'|'none'|fn, ...}]
export function game(cfg, rng){
  const n=cfg.n, maxHp=cfg.hp||hpFor(n);
  const ps=[];
  for(let i=0;i<n;i++){const s=cfg.players[i]||{};
    ps.push({i,hp:maxHp,al:true,has:{},cards:[],money:4,swaps:0,ult:false,colete:0,bleed:{},sent:0,dealt:0,dbl:s.bot?P.botSmart:(s.dbl??true),gift:s.gift||null,alvo:[],deckK:s.deck||'padrao',stop:s.stop,bot:!!s.bot,buy:s.buy||'none',want:s.want||null,fixed:s.cards||[],t:0,acq:{}});
    for(const k of ps[i].fixed){ps[i].has[k]=true;ps[i].cards.push(k);ps[i].acq[k]=0}
    const q=ps[i];q.maxHp=maxHp-(q.deckK==='vidro'?DK.vidroHp:0);q.hp=q.maxHp;
    if(q.deckK==='azul')q.money+=DK.azulMo;
    if(q.deckK==='guerreiro'||q.deckK==='guardiao')q.money=Math.max(0,q.money+DK.guerMo);
    const dh={miudo:DK.miudoHp,reis:DK.reisHp,ases:DK.asesHp,azul:DK.azulHp||0}[q.deckK]||0;q.maxHp+=dh;q.hp=q.maxHp;
    if(q.deckK==='guerreiro'||q.deckK==='guardiao'){const L=q.deckK==='guerreiro'?ATK:DEF;const k=L[Math.floor(rng()*L.length)];q.has[k]=true;q.cards.push(k);q.acq[k]=0}
  }
  let mesaK=null,mesaPrev=null;
  let r=0, pingpong=0;
  while(ps.filter(p=>p.al).length>1 && r<200){
    // início de rodada
    for(const p of ps){if(!p.al)continue;
      if(p.colete&&p.colete<=r){p.has.colete=false;p.cards=p.cards.filter(k=>k!=='colete');p.colete=0}
      if(p.has.bandagem&&r>0&&p.hp<p.maxHp&&(!P.bandagemHalf||p.hp<p.maxHp/2))p.hp=Math.min(p.maxHp,p.hp+P.bandagem)}
    r++;
    if(cfg.mesa&&(r-1)%3===0){const pool=MESA.filter(k=>k!==mesaPrev);mesaK=pool[Math.floor(rng()*pool.length)];mesaPrev=mesaK}
    const M=cfg.mesa?mesaK:null;
    RC.cap=M==='teto'?19:M==='ceu'?23:21;RC.iron=M==='asferro';RC.maxC=M==='curta'?3:5;
    for(const p of ps){if(!p.al)continue;
      if(M==='tempestade')p.hp-=5;
      if(M==='hospital')p.hp=Math.min(p.maxHp,p.hp+4);
      if(M==='silencio'){p.hasReal=p.has;p.has={}}}
    if((r-1)%3===0)for(const p of ps){p.swaps=2+(p.deckK==='vermelho'?DK.vermelhoSw:0)+(p.deckK==='fantasma'?DK.fantasmaSw:0);}
    const alive=ps.filter(p=>p.al);
    // cartas com alvo: usa uma por rodada, no rival com mais vida
    for(const p of alive){p.mira=null;p.spy=null;p.trocaReady=false;p.frozenNow=p.frozen===r;
      if(!p.alvo.length)continue;
      const rv=alive.filter(q=>q!==p);if(!rv.length)continue;
      const T=rv.reduce((a,b)=>b.hp>a.hp?b:a);const k=p.alvo.shift();p.used=(p.used||0)+1;
      if(k==='mira')p.mira=T;else if(k==='maldicao')T.curse=r+1;else if(k==='gelo')T.frozen=r+1;
      else if(k==='roubo'){const a=Math.min(P.roubo,T.money);T.money-=a;p.money+=a}
      else if(k==='espiao')p.spy=T;else if(k==='troca')p.trocaReady=true}
    const mk=(p,h)=>{const t=tot(h.c);p.sub={t:Math.min(t,99),bj:h.c.length===2&&t===21&&RC.cap>=21,f:h.c.length>=5&&t<=RC.cap,x:t>RC.cap,c:h.c,d:h.doubled};p.v=handVal(p.sub);if(p.sub.x&&p.deckK==='apostador')p.hp-=DK.apostBust};
    for(const p of alive)p.fantasmaT=0;
    for(const p of alive)if(!p.spy&&p.deckK!=='fantasma')mk(p,playHand(p,rng));
    for(const p of alive)if(!p.spy&&p.deckK==='fantasma'){const f=alive.filter(q=>q!==p&&q.sub&&q.sub.c).map(q=>Math.min(RC.cap,cval(q.sub.c[0])+10));p.fantasmaT=f.length?Math.max(...f):0;mk(p,playHand(p,rng))}
    for(const p of alive)if(p.spy)mk(p,playHand(p,rng,P.spyOff?null:p.spy.sub));
    for(const p of alive)if(p.trocaReady&&!p.sub.x&&p.sub.t<=P.trocaMax){
      const rv=alive.filter(q=>q!==p);const T=rv.reduce((a,b)=>b.hp>a.hp?b:a);
      [p.sub,T.sub]=[T.sub,p.sub];[p.v,T.v]=[T.v,p.v]}
    for(const p of alive)if(p.trocaReady&&!(!p.sub.x&&p.sub.t<=P.trocaMax))p.alvo.unshift('troca');
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
      const type2=s.t===21&&RC.cap>=21?type:(type==='t21'?'win':type);
      let pts=(HANDS[type2].c+s.c.reduce((a,x)=>a+cval(x),0))*HANDS[type2].m*(s.d?(p.deckK==='apostador'?DK.apostK:2):1);
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
      if(p.deckK==='vidro')per+=DK.vidroDmg;
      if(p.deckK==='miudo'&&DK.miudoCard)per+=DK.miudoCard*Math.max(0,s.c.length-2);
      if(p.curse===r)per=Math.max(1,Math.round(per*P.maldicao));
      if(p.mira&&P.miraK&&beaten.includes(p.mira)){for(const b of beaten)add(b,p,b===p.mira?Math.round(per*P.miraK):per)}
      else if(p.mira&&beaten.includes(p.mira))add(p.mira,p,per*beaten.length);
      else for(const b of beaten)add(b,p,per);
      p.dealt+=per*beaten.length;
      if(p.has.sangria)for(const b of beaten)p.bleed[b.i]={from:r,to:r+P.sangriaR};
      if(p.has.vampiro)p.hp=Math.min(p.maxHp,p.hp+Math.max(1,Math.round(per*beaten.length*P.vampiro)));
    }
    // dinheiro
    for(const p of alive){const parts=alive.length-1;const b=p.v<0?0:alive.filter(q=>q!==p&&q.v<p.v).length;p.money+=(b?(b===parts?2:1):0)*(M==='ouro'?2:1);
      if(M==='empate'&&p.v>=0&&alive.some(q=>q!==p&&q.v===p.v))p.hp-=5}
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
    for(const p of ps)if(p.hasReal){p.has=p.hasReal;p.hasReal=null}
    // eliminação (desempate: sobrevive a vida menos negativa)
    const dead=alive.filter(p=>p.hp<=0);
    if(dead.length===alive.length){const best=dead.reduce((a,b)=>b.hp>a.hp||(b.hp===a.hp&&b.t>a.t)?b:a);best.hp=1}
    for(const p of alive)if(p.hp<=0){p.al=false;p.out=r}
    // loja a cada 3 rodadas
    if(r%3===0)for(const p of ps){if(!p.al)continue;
      p.money+=Math.min(2,Math.floor(p.money/10));
      if(p.deckK==='azul')p.money+=DK.azulShop;
      if(p.gift&&p.money>=(P.alvoCost[p.gift]||0)){p.money-=(P.alvoCost[p.gift]||0);p.alvo.push(p.gift)}
      if(p.buy==='none')continue;
      if(cfg.alvo&&p.alvo.length<2&&p.money>=1){const L=['mira','maldicao','gelo','roubo','troca'];p.alvo.push(L[Math.floor(rng()*L.length)]);p.money-=1}
      let offer=shuffle(CARDS.filter(k=>!p.has[k]),rng).slice(0,3);let rr=1;
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
