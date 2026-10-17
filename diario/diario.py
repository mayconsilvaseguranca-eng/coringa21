import html
V=[
 ("v17","17/10 · 05:50","Cartas com alvo, troca da loja a $1",
  "Adicionar as cartas com alvo com opção de tirar da partida, trocar as cartas da loja por $1, testar no 1 contra 1 e com mais gente e balancear as fortes.",
  [("Novo","6 cartas com alvo na loja do PvP, de uso único: toque nela na sua vez e escolha o rival. Mira ($2): o rival leva 50% a mais do seu dano nesta rodada. Maldição ($2): na próxima rodada, o rival causa metade do dano. Gelo ($3): na próxima rodada, o rival só pode pedir 1 carta. Roubo ($2): tira $2 do rival para você. Troca de Mão ($3): sua mão e a do rival trocam de dono na revelação. Espião ($1): você vê a mão do rival assim que ele fechar."),
   ("Novo","Quando alguém usa uma carta com alvo, todos veem um aviso (quem usou, qual carta, em quem). Se for em você, o aviso fica vermelho. Só o Espião é segredo."),
   ("Novo","Na sala, quem cria a partida liga ou desliga as cartas com alvo, na mesma linha das cartas de mesa."),
   ("Novo","Os bots compram e usam as cartas com alvo (menos o Espião), sempre no rival com mais vida. A Troca de Mão eles só usam com mão fraca."),
   ("Mudou","Balanceamento no simulador, em 1 contra 1, mesa de 4 e mesa de 6: a Mira dobrava o dano (+26% de vitórias), virou +50%; o Gelo deixava o rival sem pedir carta (a mais forte, até +57%), virou só 1 carta; o Roubo tirava $3 (+40% na mesa de 4), virou $2. Como são de uso único, ficaram baratas ($1 a $3)."),
   ("Mudou","No PvP, trocar as cartas da loja custa $1 (era $3), subindo $1 a cada troca na mesma loja."),
   ("Novo","Teste novo no agente: um duelo usando as 6 cartas com alvo pelos botões, mais a opção de desligar.")]),
 ("v16.2","16/10 · 20:45","Teto 19 sem estouro na mão inicial e 2 trocas por loja",
  "No Teto 19 ninguém pode estourar logo no início, e o Trocar fica só 2 vezes a cada loja.",
  [("Corrigido","Com Teto 19, quem recebia 20 ou 21 nas duas primeiras cartas estourava sem jogar. Agora a mão inicial nunca estoura: a segunda carta é trocada até caber. Vale para pessoas e bots."),
   ("Mudou","No PvP, o Trocar vale 2 vezes a cada loja (eram 3).")]),
 ("v16.1","16/10 · 20:20","Trégua saiu",
  "Tirar a carta de mesa Trégua.",
  [("Mudou","A carta de mesa Trégua saiu do jogo. A mesa agora sorteia entre 9 cartas de mesa, uma a cada 3 rodadas, sem repetir a anterior.")]),
 ("v16","16/10 · 17:05","Partidas mais longas e reações",
  "Partidas um pouco mais longas, até cada um ter umas 4 cartas compradas, e um botão de reações durante a partida.",
  [("Mudou","Vida inicial do PvP: 200 PV com 6 ou mais jogadores (era 120), até 232 com 2. Na simulação, uma partida de 6 dura umas 16 rodadas (eram 11) e quem chega ao fim tem umas 4 cartas compradas."),
   ("Novo","Botão Reagir no topo do PvP (no lugar do Ante): 8 reações (😂 😡 😱 👏 🔥 😎 🤡 💀). A reação sobe como um balão com o seu nome na tela de todos."),
   ("Novo","Os bots também reagem às vezes na revelação: comemoram quando passam todo mundo e se assustam quando estouram."),
   ("Novo","Teste novo no agente: uma pessoa manda reação e a outra vê.")]),
 ("v15.1","16/10 · 15:40","Versão na tela inicial",
  "Mostrar na tela inicial qual versão o jogo está.",
  [("Novo","A tela inicial mostra a versão embaixo do logo (blackjack roguelike · v15.1), com o mesmo número deste diário. Assim dá para conferir se o celular já pegou a atualização."),
   ("Mudou","O agente de testes confere que a versão aparece na tela inicial.")]),
 ("v15","16/10 · 15:30","7 cartas de mesa novas",
  "Adicionar as cartas de mesa sugeridas, menos Maré Alta, Azarão e Coroa Pesada.",
  [("Novo","Céu Aberto: só estoura acima de 23 (22 e 23 vencem 21). Mão Curta: no máximo 3 cartas, a mão fecha sozinha na terceira. Ás de Ferro: Ases valem só 1, então não tem blackjack."),
   ("Novo","Empate Sangrento: quem empatar com alguém leva 5 de dano. Febre do Ouro: o dinheiro das rodadas vem em dobro. Silêncio: as cartas de ataque e defesa não funcionam. Hospital: todos recuperam 4 PV no começo de cada rodada."),
   ("Mudou","A mesa agora sorteia entre 10 cartas de mesa, uma a cada 3 rodadas, sem repetir a anterior. Os bots seguem as mesmas regras."),
   ("Novo","Teste novo no agente: um duelo roteirizado com as 7 cartas novas.")]),
 ("v14.1","16/10 · 15:20","Embaralhar saiu",
  "Tirar a carta de mesa Embaralhar e dar outras ideias de carta de mesa.",
  [("Mudou","A carta de mesa Embaralhar saiu do jogo. A mesa agora sorteia entre Tempestade, Trégua e Teto 19, sem repetir a anterior."),
   ("Novo","10 ideias novas de cartas de mesa na seção Possíveis ideias deste diário. Ainda não estão no jogo.")]),
 ("v14","16/10 · 15:10","Carta de mesa sorteada a cada 3 rodadas",
  "A carta de mesa vale durante as rodadas: sempre uma ativa, sorteada, por 3 rodadas (até a próxima loja), e a animação fica 5 segundos.",
  [("Mudou","As cartas de mesa não se compram mais. A mesa sempre tem uma valendo para todos: sorteada no começo da partida e trocada por outra a cada loja (a cada 3 rodadas), sem repetir a anterior."),
   ("Mudou","Para durar 3 rodadas: Tempestade tira 5 PV de todos no começo de cada rodada, e Trégua corta todo dano pela metade (3 rodadas sem dano travariam a partida). Teto 19 e Embaralhar continuam iguais."),
   ("Mudou","A animação aparece quando a carta de mesa entra, mostra em que rodadas ela vale e fica 5 segundos na tela."),
   ("Novo","A carta de mesa que está valendo aparece no topo da mesa, e o que ela faz aparece no meio da mesa entre as jogadas."),
   ("Mudou","A loja do PvP voltou a ter 3 cartas (ataque e defesa). Quem cria a sala ainda pode desligar as cartas de mesa."),
   ("Mudou","Teste das cartas de mesa refeito para a regra nova; os testes de contas exatas de dano jogam sem carta de mesa.")]),
 ("v13.2","16/10 · 08:00","Animação quando alguém usa uma carta de mesa",
  "Mostrar com uma animação qual carta de mesa foi usada, para todos se prepararem para a próxima rodada.",
  [("Novo","Quando alguém (pessoa ou bot) usa uma carta de mesa, aparece para todos: a carta entra girando no meio da tela, com o nome de quem usou, o que ela faz e em que rodada vale. Dura uns 3 segundos e não trava a tela."),
   ("Novo","Se duas cartas forem usadas juntas, elas aparecem uma depois da outra."),
   ("Mudou","O teste das cartas de mesa agora confere que o outro jogador vê a animação.")]),
 ("v13.1","16/10 · 07:40","Loja com 4 opções: sempre uma carta de mesa",
  "A carta de mesa ganha uma vaga própria na loja: 4 opções, uma sempre de mesa.",
  [("Mudou","Loja do PvP com 4 cartas: 3 de ataque ou defesa e 1 de mesa, sempre. Com as cartas de mesa desligadas na sala, volta a ter 3. Os bots compram com a mesma regra."),
   ("Mudou","Na loja, a etiqueta (Ataque, Defesa, Mesa) fica embaixo do preço, e algumas descrições ficaram mais curtas, sem mudar as regras. As 4 cartas cabem no iPhone SE sem rolar.")]),
 ("v13","16/10 · 07:20","Cartas de mesa no PvP, com opção de desligar",
  "Colocar no jogo as cartas que mudam a partida para todo mundo e deixar uma opção para desativar.",
  [("Novo","4 cartas de mesa na loja do PvP, de uso único: você toca na carta e ela vale na próxima rodada, para todo mundo. Todos veem quem usou."),
   ("Novo","Tempestade ($4): todos os rivais levam 5 de dano. Trégua ($3): ninguém causa dano. Teto 19 ($3): passar de 19 estoura. Embaralhar ($3): ninguém decide, a mesa dá cartas a cada um até 17 ou mais."),
   ("Novo","Na sala, quem cria a partida liga ou desliga as cartas de mesa. Desligadas, elas não aparecem na loja de ninguém, nem dos bots."),
   ("Novo","Os bots também compram e usam cartas de mesa: Tempestade e Teto 19 logo, Trégua quando estão com pouca vida, Embaralhar quando estão em último."),
   ("Mudou","Tela Cartas: nova seção Mesa na aba PvP."),
   ("Mudou","Sala mais compacta: com 5 ou mais jogadores, os nomes ficam em 3 colunas (bots em itálico, anfitrião com ★). Cabe inteira no iPhone SE até com 10, o que antes não acontecia."),
   ("Novo","Testes novos: um duelo roteirizado com as 4 cartas de mesa e a opção de desligar, e a sala com 10 jogadores no iPhone SE.")]),
 ("v12.2","16/10 · 06:10","Bots com cartas, loja sem rolar e sua posição no PvP",
  "Deixar os bots menos fáceis, fazer a loja caber no iPhone SE e mostrar se estou em primeiro ou em último pela vida.",
  [("Novo","Bots compram cartas de ataque e defesa na loja, com o mesmo dinheiro das pessoas, e usam todas elas. Também jogam melhor: param no 17 e dobram com 10 ou 11."),
   ("Mudou","Na simulação, 2 pessoas contra 4 bots venciam 73% a 76% das partidas. Agora vencem 38% a 43% (o empate justo seria 33%)."),
   ("Novo","Sua posição no PvP pela vida, no quadro de cima: dourada em 1º, vermelha em último. Aparece também no resultado de cada rodada."),
   ("Mudou","A faixa de jogadores no topo rola sozinha até você."),
   ("Mudou","Loja em linhas compactas, com o preço em cada carta. Cabe inteira no iPhone SE, no PvP e no solo."),
   ("Corrigido","Um Espelho podia devolver dano depois do desempate e eliminar até o último jogador vivo, deixando a partida sem vencedor. Agora quem sobra vence."),
   ("Novo","Dois testes novos no agente: a loja precisa caber no iPhone SE, e os bots precisam comprar cartas.")]),
 ("v12.1","16/10 · 05:40","Cartas do PvP rebalanceadas e Espelho corrigido",
  "Testar as cartas do PvP várias vezes e ver se precisam de rebalanceamento.",
  [("Mudou","Muralha: em último na rodada, leva 20% a menos de dano (antes: no máximo 10). Era a carta mais forte do jogo: vencia 52% das partidas de 6 e 98% dos duelos 1 contra 1."),
   ("Mudou","Escudo absorve 2 por rodada (era 4). Vampiro cura 15% (era 25%). Bandagem cura 3 só quando você está abaixo da metade da vida."),
   ("Mudou","Golpe Crítico vale para qualquer 21, não só blackjack, e custa $4. Fúria: abaixo de 40 PV, dano em dobro. Precisão: +7 fechando com 20. Golpe Duplo: a partir de 2 rivais passados."),
   ("Mudou","Cinco Lâminas: +2 de dano por carta na mão, sem contar a primeira. Antes só valia com 5 cartas e quase nunca acontecia. Espelho custa $4."),
   ("Corrigido","Os bônus que multiplicam o dano agora valem sobre o dano final. Antes eram aplicados antes do dano mínimo da rodada, e numa mesa grande sumiam."),
   ("Corrigido","Dois jogadores com Espelho ficavam devolvendo 1 de dano um ao outro sem parar, até alguém morrer."),
   ("Novo","Simulador de balanceamento (tests/balanceamento.mjs): joga milhares de partidas com as regras do jogo. Numa mesa de 6, cada carta agora dá entre 22% e 29% de chance de vitória, contra 17% sem carta. Antes ia de 18% a 52%."),
   ("Novo","Teste novo no agente: Espelho contra Espelho, para o bug não voltar."),
   ("Novo","Seção Agora mesmo neste diário: mostra o que está sendo feito enquanto o trabalho acontece.")]),
 ("v12","16/10 · 05:10","10 cartas novas no PvP e a tela Cartas",
  "Adicionar todas as cartas simples de PvP, guardar as ideias avançadas no diário e criar uma aba com todas as cartas do jogo.",
  [("Novo","5 cartas de ataque: Lâmina (+3 de dano em cada rival que você passar), Golpe Duplo (+50% se passar 3 ou mais), Precisão (+4 fechando com 20), Fúria (+40% com menos de 30 PV) e Cinco Lâminas (dobro de dano vencendo com 5 cartas)."),
   ("Novo","5 cartas de defesa: Armadura (−15% de dano), Bandagem (+3 PV por rodada), Última Chance (fica com 1 PV uma vez), Muralha (no máximo 10 de dano se ficar em último) e Colete (uso único: estourou, não leva dano)."),
   ("Novo","Tela Cartas, no menu inicial e no menu de pausa: abas PvP e Solo com todas as cartas, o que fazem e quanto custam."),
   ("Novo","Seção Possíveis ideias neste diário, com as cartas do futuro modo PvP Avançado. Elas não estão no jogo."),
   ("Mudou","O agente de testes ganhou dois testes: um duelo roteirizado com as cartas novas e a tela Cartas.")]),
 ("v11.1","16/10 · 04:30","Vida dos jogadores maior no PvP",
  "Aumentar a informação de vida dos jogadores no PvP.",
  [("Mudou","Cada rival na mesa agora tem duas linhas: nome e situação em cima, vida grande embaixo e uma barra de vida no rodapé."),
   ("Mudou","A faixa de jogadores no topo mostra a vida maior e em negrito."),
   ("Mudou","No PvP, o quadro de Fichas × Mult só aparece na revelação da rodada, para sobrar espaço na mesa.")]),
 ("v11","16/10 · 04:15","PvP mais organizado e revanche na mesma sala",
  "Vida no lugar dos pontos no PvP, dano sem vírgula, voltar todo mundo para a mesma sala no fim e o tempo da jogada mais visível.",
  [("Mudou","No PvP, o quadro de cima mostra sua vida no lugar dos pontos da rodada, e o outro quadro mostra o dano total que você causou."),
   ("Mudou","Todo dano, cura e vida do PvP agora são números inteiros."),
   ("Novo","No fim de uma partida multiplayer: Voltar para a sala (mesma sala, com os bots, para começar outra) ou Voltar ao menu."),
   ("Mudou","O tempo da jogada virou uma pílula dourada no meio da mesa, com barra que esvazia. Fica vermelho e pulsando nos últimos 10 segundos.")]),
 ("v10.1","16/10 · 04:00","Fim de partida mais claro",
  "Quando a partida termina, mostrar só a opção de voltar ao menu.",
  [("Mudou","No fim de qualquer partida (solo, PvP ou Sobrevivência) o botão principal agora é Voltar ao menu. Saíram Jogar de novo, Nova partida e Voltar ao lobby.")]),
 ("v10","16/10 · 03:50","PvP mais longo, menos dinheiro e cartas rebalanceadas",
  "Menos dinheiro no PvP, partidas mais longas, um controle para aumentar a vida de todos, cartas balanceadas e um ritmo mais calmo.",
  [("Novo","Vida inicial na sala: quem cria ajusta com − e +, de 20 em 20 PV. O padrão continua automático pelo tamanho da mesa."),
   ("Mudou","Vida padrão: 120 PV com 6 ou mais jogadores, até 168 com 2. Nos testes, partidas de 6 jogadores duraram 14 a 17 rodadas."),
   ("Mudou","Dinheiro do PvP: $1 por rodada só se você passar alguém, $2 com a maior mão da mesa. Juros de $1 a cada $10, no máximo $2."),
   ("Mudou","Cartas: Escudo absorve 4 por rodada (era 8), Espelho devolve 20% (era 30%), Golpe Crítico ×1,5 (era ×2). Preços entre $4 e $6."),
   ("Mudou","Ritmo mais calmo: cartas, contagem de pontos e avisos ficaram 60% mais lentos. O resultado da rodada fica 20 segundos na tela."),
   ("Corrigido","O dano do PvP encolhia depois da rodada 6, e uma partida de teste chegou a 56 rodadas. A base do dano agora é fixa.")]),
 ("v9.1","16/10 · 03:25","Toda partida PvP chega ao fim",
  "Correção encontrada pelo agente de testes.",
  [("Corrigido","Os dois últimos jogadores podiam ficar dezenas de rodadas sem se eliminar, porque o dano encolhia nas rodadas longas. Agora existe um dano mínimo que cresce a cada rodada."),
   ("Corrigido","A vitória do último de pé passa a ser conferida a cada segundo.")]),
 ("v9","16/10 · 03:10","Animações de 21, telas sem rolagem e convite para o jogo",
  "Animações de 21, sala sem rolar com muitos bots, contagem da loja, link de convite para o jogo, menus sem a partida ao fundo e pausa mais visível.",
  [("Novo","Blackjack natural: explosão dourada com “BLACKJACK!” e naipes caindo."),
   ("Novo","Chegar a 21 comprando: ondas verdes saindo das cartas e um “21!” subindo."),
   ("Novo","Botão Convidar para o jogo na tela inicial: gera um link novo, e quem abre vê “Fulano te convidou”."),
   ("Mudou","Sala compacta: cabe inteira com 10 jogadores, até no iPhone SE."),
   ("Mudou","Mesa do PvP: rivais em linhas curtas, 3 por linha. Suas cartas não somem mais com 9 rivais."),
   ("Mudou","Menus sem a partida anterior ao fundo."),
   ("Mudou","Botão de pausa dourado, com o símbolo e a palavra “Pausa”."),
   ("Corrigido","A contagem da loja aparece no topo e diminui ao vivo.")]),
 ("v8","16/10 · 02:35","Logo legível e convite direto para a sala",
  "Fonte melhor no 21 do logo e um link que leva direto para a sala.",
  [("Mudou","O 21 do logo usa a fonte limpa dos números."),
   ("Novo","Convidar amigos, na sala, manda um link que entra direto nela."),
   ("Corrigido","Se os últimos jogadores zeravam juntos, a partida ficava sem vencedor. Agora sobrevive quem ficou menos negativo."),
   ("Corrigido","A mesa podia travar esperando alguém que já tinha passado de rodada.")]),
 ("v7","16/10 · 02:25","Bots, música, agente de testes e nome novo",
  "Bots no PvP, testes automáticos, música com volume, loja só com as 6 cartas, confirmação de compra e o nome Família 21.",
  [("Novo","Bots no PvP: quem cria a sala adiciona ou remove bots, que jogam sozinhos."),
   ("Novo","Agente de testes: a cada atualização, o GitHub joga solo, PvP com bots, as cartas especiais e a Sobrevivência, 3 vezes cada."),
   ("Novo","Música de fundo com controle de volume (começa em 25%)."),
   ("Novo","Tocar numa carta da loja mostra a descrição e o botão Confirmar compra."),
   ("Mudou","A loja do PvP oferece só as 6 cartas de ataque e defesa e fica aberta por 2 minutos."),
   ("Mudou","O jogo se chama Família 21. O endereço do site continua o mesmo.")]),
 ("v6","16/10 · 01:56","Cartas de ataque e defesa no PvP",
  "Adicionar as cartas de ataque e defesa.",
  [("Novo","Defesa: Escudo (absorve 8 de dano por rodada), Espelho (devolve 30%), Esquiva (ignora quem fechou com 17 ou menos)."),
   ("Novo","Ataque: Golpe Crítico (blackjack causa dano dobrado), Sangria (+2 de dano por 3 rodadas), Vampiro (cura 25% do dano causado).")]),
 ("v5.1","16/10 · 01:44","Partida PvP mais curta",
  "Uma partida de 6 jogadores deve durar umas 10 rodadas.",
  [("Mudou","PV conforme a mesa: 90 com 6 ou mais jogadores, até 130 com 2. Na simulação, 6 jogadores terminam em 9 a 11 rodadas.")]),
 ("v5","16/10 · 01:19","PvP por rodadas, sem dealer",
  "Tirar o dealer do PvP, jogar por rodadas e não repetir cartas entre jogadores.",
  [("Mudou","Todos jogam a mesma rodada, e a mesa só revela as mãos quando todos fecham."),
   ("Novo","45 segundos por jogada. Se acabar, a mão fecha sozinha."),
   ("Mudou","Cada jogador tem o próprio baralho embaralhado de verdade."),
   ("Mudou","Números com fonte limpa, mais fáceis de ler.")]),
 ("v4","16/10 · 01:06","Modo PvP com pontos de vida",
  "Um modo em que todos jogam contra todos com pontos de vida.",
  [("Novo","Na sala, quem cria escolhe PvP ou Sobrevivência."),
   ("Novo","Pontos de vida, dano nos rivais e eliminação de quem zera.")]),
 ("—","16/10 · 00:35 a 01:00","Site no GitHub e envio automático",
  "Ajuda para subir no GitHub e eu atualizar o site sozinho.",
  [("Novo","Jogo publicado em mayconsilvaseguranca-eng.github.io/coringa21."),
   ("Novo","O Claude envia cada versão nova direto para o site.")]),
 ("v3","16/10 · 00:06 a 00:19","Multiplayer sem conta e lista de salas",
  "Jogar sem conta no Claude, lista de salas e esta página de acompanhamento.",
  [("Novo","Versão em um arquivo só, com salas por um servidor público de mensagens."),
   ("Novo","Lista de salas abertas: toca na sala e digita o código."),
   ("Novo","Este diário do projeto."),
   ("Corrigido","Toques bloqueados depois de fechar menus e botões cobertos em telas baixas.")]),
 ("v2","15/10 · 23:50","Letras legíveis e multiplayer",
  "Letras mais fáceis de ler e multiplayer para até 10 pessoas.",
  [("Mudou","Fonte limpa e maior nos textos."),
   ("Novo","Salas com código, 3 vidas, Duelo e placar ao vivo.")]),
 ("v1","15/10 · 23:35","Primeira versão",
  "Um jogo de 21 no estilo Balatro para o celular.",
  [("Novo","8 antes, blinds e chefes, Fichas × Mult, 18 coringas, planetas, loja e Desafio do dia.")]),
]
TAGC={"Novo":"t-new","Mudou":"t-chg","Corrigido":"t-fix"}
def card(v,open_):
  ver,when,title,ask,items=v
  groups=""
  for k in ["Novo","Mudou","Corrigido"]:
    its=[t for (c,t) in items if c==k]
    if not its: continue
    groups+=f'<div class="grp"><span class="tag {TAGC[k]}">{ {"Novo":"Novidades","Mudou":"Mudanças","Corrigido":"Correções"}[k] }</span><ul>'+"".join(f"<li>{html.escape(t)}</li>" for t in its)+"</ul></div>"
  return f'''<details class="ver" {"open" if open_ else ""}>
  <summary><span class="vtag">{ver}</span><span class="vt"><b>{html.escape(title)}</b><small>{when}</small></span><span class="chev">›</span></summary>
  <div class="vbody"><p class="ask"><b>Seu pedido</b>{html.escape(ask)}</p>{groups}</div>
</details>'''
cards="\n".join(card(v,i==0) for i,v in enumerate(V))
# Trabalho em andamento: diario/agora.json (apague o arquivo quando terminar)
import json,os
_ag=os.path.join(os.path.dirname(os.path.abspath(__file__)),'agora.json')
AG=json.load(open(_ag)) if os.path.exists(_ag) else None
UPD=AG['atualizado'] if AG else '17/10/2026, 05:50'
def live():
  if not AG: return ''
  ic={'feito':('✓','st-ok'),'agora':('●','st-now'),'falta':('○','st-todo')}
  steps=''.join(f'<li class="{ic[x["s"]][1]}"><span class="ic">{ic[x["s"]][0]}</span><span>{html.escape(x["t"])}</span></li>' for x in AG['passos'])
  fx=''.join(f'<li>{html.escape(t)}</li>' for t in AG.get('achados',[]))
  tb=''
  if AG.get('tabela'):
    T=AG['tabela'];tb=f'<div class="tblw"><p class="tcap">{html.escape(T["titulo"])}</p><table><thead><tr>'+''.join(f'<th>{html.escape(h)}</th>' for h in T['cab'])+'</tr></thead><tbody>'+''.join('<tr>'+''.join(f'<td>{html.escape(str(c))}</td>' for c in r)+'</tr>' for r in T['linhas'])+'</tbody></table>'+(f'<p class="tnote">{html.escape(T["nota"])}</p>' if T.get('nota') else '')+'</div>'
  return f'''<section>
    <h2><span class="pulse"></span>Agora mesmo</h2>
    <div class="live">
      <div class="top"><div><b>{html.escape(AG['titulo'])}</b><small>Atualizado às {html.escape(AG['hora'])} · recarregue a página para ver o mais novo</small></div></div>
      <p class="ask"><b>Seu pedido</b>{html.escape(AG['pedido'])}</p>
      <ul class="steps">{steps}</ul>
      {f'<div class="grp"><span class="tag t-chg">O que já descobri</span><ul>{fx}</ul></div>' if fx else ''}
      {tb}
    </div>
  </section>'''
last=V[0]
page=f'''<title>Diário do Família 21</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@700&family=Rubik:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
/* Layout: uma coluna de leitura — status no topo, última atualização em destaque, histórico em cartões que abrem e fecham, depois regras e limites. Mundo único de feltro escuro, igual ao jogo. */
:root{{
  --bg:#081d19; --panel:#10261f; --panel-2:#183630; --edge:#040d0b; --line:#24453d;
  --ink:#f8f1df; --dim:#b3cdc3; --gold:#f5bd3a; --chips:#4d9bff; --mult:#ff6b61; --ok:#5fd38a;
  --font:"Rubik", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --px:"Pixelify Sans", "Rubik", system-ui, sans-serif;
  color-scheme:dark;
}}
body{{background:var(--bg);color:var(--ink);font-family:var(--font);font-size:16px;line-height:1.55;-webkit-font-smoothing:antialiased;margin:0}}
.wrap{{max-width:680px;margin:0 auto;padding-block:28px 64px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));display:flex;flex-direction:column;gap:36px}}
header{{display:flex;flex-direction:column;gap:10px}}
.eyebrow{{font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--dim)}}
h1{{font-family:var(--px);font-size:clamp(34px,9vw,48px);line-height:1;margin:0;text-shadow:3px 3px 0 var(--edge)}}
h1 span{{font-family:var(--font);font-weight:800;color:var(--gold)}}
h2{{font-size:21px;font-weight:800;margin:0 0 4px;text-wrap:balance}}
h3{{font-size:16px;font-weight:800;margin:0}}
p{{margin:0}}
.lead{{color:var(--dim);max-width:60ch}}
.links{{display:grid;grid-template-columns:1fr 1fr;gap:10px}}
.lnk{{background:var(--panel);border:2px solid var(--edge);border-radius:12px;padding:12px 14px;display:flex;flex-direction:column;gap:2px;min-width:0}}
.lnk small{{font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--dim)}}
.lnk a{{color:var(--gold);font-weight:700;word-break:break-all;font-size:14.5px}}
.lnk b{{font-size:15px}}
.now{{background:linear-gradient(160deg,color-mix(in srgb,var(--gold) 16%,var(--panel)),var(--panel));border:2px solid color-mix(in srgb,var(--gold) 55%,var(--edge));border-radius:16px;padding:18px;display:flex;flex-direction:column;gap:14px;box-shadow:0 4px 0 var(--edge)}}
.now .top{{display:flex;align-items:center;gap:12px}}
.badge{{font-family:var(--font);font-weight:800;background:var(--gold);color:#2a1b00;border-radius:10px;padding:6px 10px;font-size:18px;flex:0 0 auto}}
.now .top b{{display:block;font-size:18px;line-height:1.25}}
.now .top small{{color:var(--dim);font-size:13.5px}}
section{{display:flex;flex-direction:column;gap:12px}}
.sec-note{{color:var(--dim);font-size:14.5px}}
.ver{{background:var(--panel);border:2px solid var(--edge);border-radius:14px;box-shadow:0 3px 0 var(--edge);overflow:hidden}}
.ver summary{{list-style:none;cursor:pointer;display:flex;align-items:center;gap:12px;padding:14px 16px}}
.ver summary::-webkit-details-marker{{display:none}}
.vtag{{font-weight:800;font-size:14px;color:var(--gold);background:var(--panel-2);border-radius:8px;padding:4px 8px;min-width:44px;text-align:center;flex:0 0 auto}}
.vt{{flex:1;min-width:0;display:flex;flex-direction:column}}
.vt b{{font-size:16px;line-height:1.3}}
.vt small{{color:var(--dim);font-size:13px;font-variant-numeric:tabular-nums}}
.chev{{color:var(--dim);font-size:22px;transition:transform .2s;flex:0 0 auto}}
.ver[open] .chev{{transform:rotate(90deg)}}
.vbody,.now .vbody{{padding:0 16px 18px;display:flex;flex-direction:column;gap:16px}}
.now .vbody{{padding:0}}
.ask{{background:var(--panel-2);border-left:3px solid var(--chips);border-radius:0 10px 10px 0;padding:10px 12px;font-size:15px;color:var(--ink)}}
.ask b{{display:block;color:var(--chips);font-size:12px;letter-spacing:.08em;text-transform:uppercase;margin-bottom:2px}}
.grp{{display:flex;flex-direction:column;gap:8px}}
.grp ul{{margin:0;padding-left:20px;display:flex;flex-direction:column;gap:8px}}
.grp li{{font-size:15px;line-height:1.5}}
.grp li::marker{{color:var(--dim)}}
.tag{{align-self:flex-start;font-size:11.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;border-radius:6px;padding:3px 8px}}
.t-new{{background:color-mix(in srgb,var(--ok) 22%,transparent);color:var(--ok)}}
.t-chg{{background:color-mix(in srgb,var(--chips) 22%,transparent);color:var(--chips)}}
.t-fix{{background:color-mix(in srgb,var(--mult) 22%,transparent);color:var(--mult)}}
.grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px}}
.box{{background:var(--panel);border:2px solid var(--edge);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:6px;min-width:0}}
.box p,.box li{{font-size:14.5px;color:var(--dim)}}
.box ul{{margin:0;padding-left:18px}}
.limits{{margin:0;padding-left:20px;display:flex;flex-direction:column;gap:8px}}
.limits li{{color:var(--dim);font-size:15px}}
footer{{font-size:13px;color:var(--dim);border-top:1px solid var(--line);padding-top:14px}}
.live{{background:var(--panel);border:2px solid color-mix(in srgb,var(--ok) 55%,var(--edge));border-radius:16px;padding:18px;display:flex;flex-direction:column;gap:14px;box-shadow:0 4px 0 var(--edge)}}
.live .top b{{display:block;font-size:18px;line-height:1.25}}
.live .top small{{color:var(--dim);font-size:13.5px}}
.pulse{{display:inline-block;width:10px;height:10px;border-radius:50%;background:var(--ok);margin-right:8px;vertical-align:middle;animation:pl 1.4s ease-in-out infinite}}
@keyframes pl{{50%{{opacity:.25}}}}
.steps{{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}}
.steps li{{display:flex;gap:10px;font-size:15px;line-height:1.45}}
.steps .ic{{flex:0 0 18px;font-weight:800;text-align:center}}
.st-ok{{color:var(--dim)}}.st-ok .ic{{color:var(--ok)}}
.st-now{{color:var(--ink);font-weight:600}}.st-now .ic{{color:var(--gold)}}
.st-todo{{color:var(--dim);opacity:.7}}
.tblw{{display:flex;flex-direction:column;gap:6px;overflow-x:auto}}
.tcap{{font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--dim)}}
.tnote{{font-size:13px;color:var(--dim)}}
table{{border-collapse:collapse;width:100%;font-size:14px;font-variant-numeric:tabular-nums}}
th{{text-align:left;font-size:12px;color:var(--dim);font-weight:700;padding:4px 6px;border-bottom:1px solid var(--line)}}
td{{padding:5px 6px;border-bottom:1px solid var(--line)}}
@media (max-width:420px){{.links{{grid-template-columns:1fr}}}}
@media (prefers-reduced-motion:reduce){{*{{transition:none!important}}}}
</style>

<div class="wrap">
  <header>
    <span class="eyebrow">Diário do projeto · atualizado em {UPD}</span>
    <h1>Família <span>21</span></h1>
    <p class="lead">Cada vez que o jogo muda, aparece aqui. A última atualização fica em destaque; as anteriores ficam fechadas logo abaixo, é só tocar para abrir.</p>
  </header>

  <div class="links">
    <div class="lnk"><small>Site do jogo</small><a href="https://mayconsilvaseguranca-eng.github.io/coringa21/" target="_blank" rel="noopener">mayconsilvaseguranca-eng.github.io/coringa21</a></div>
    <div class="lnk"><small>Como atualiza</small><b>Sozinho, 1 ou 2 minutos depois de cada mudança. Os testes rodam a cada envio.</b></div>
  </div>

  {live()}

  <section>
    <h2>Última atualização</h2>
    <div class="now">
      <div class="top"><span class="badge">{last[0]}</span><div><b>{html.escape(last[2])}</b><small>{last[1]}</small></div></div>
      <div class="vbody">{card(last,True).split('<div class="vbody">',1)[1].rsplit('</div>',1)[0]}</div>
    </div>
  </section>

  <section>
    <h2>Histórico</h2>
    <p class="sec-note">Da mais nova para a mais antiga. Toque numa versão para ver os detalhes.</p>
    {"".join(card(v,False) for v in V[1:])}
  </section>

  <section>
    <h2>Como o jogo está agora</h2>
    <div class="grid">
      <div class="box"><h3>PvP</h3><p>Até 10 pessoas ou bots, sem dealer. Todos jogam a mesma rodada; na revelação, cada um causa dano em quem ficou abaixo. 120 a 168 PV conforme a mesa (ajustável na sala). Loja a cada 3 rodadas, com 16 cartas de ataque e defesa (veja todas na tela Cartas do jogo).</p></div>
      <div class="box"><h3>Sobrevivência</h3><p>Até 10 pessoas, 3 vidas cada. Falhar uma blind custa 1 vida. No Duelo de cada ante, o menor placar perde 1 vida.</p></div>
      <div class="box"><h3>Solo</h3><p>8 antes com blinds e chefes, 18 coringas, planetas e o Desafio do dia, com o mesmo baralho para todos.</p></div>
    </div>
  </section>

  <section>
    <h2>Possíveis ideias</h2>
    <p class="sec-note">Ainda não estão no jogo. Ficam guardadas para um futuro modo PvP Avançado, com cartas que escolhem um alvo ou mexem na mesa.</p>
    <div class="grid">
      <div class="box"><h3>Baralho especial</h3><ul><li><b>Carta Bomba:</b> quem tirar leva 10 de dano</li><li><b>Curinga Vermelho:</b> vale o que você quiser de 1 a 11</li><li><b>Carta Ouro:</b> dá $2 a quem tirar</li></ul></div>
    </div>
  </section>

  <section>
    <h2>Testes automáticos</h2>
    <div class="grid">
      <div class="box"><h3>O que o agente testa</h3><ul><li>Partida solo inteira e loja com confirmação</li><li>PvP com 2 pessoas e 4 bots até sobrar um</li><li>As 16 cartas de ataque e defesa, em dois duelos roteirizados</li><li>A tela Cartas</li><li>Sobrevivência, lista de salas e reconexão</li></ul></div>
      <div class="box"><h3>Quando</h3><p>A cada atualização enviada ao GitHub, 3 vezes cada teste. Se algo quebrar, o GitHub avisa na aba Actions.</p></div>
    </div>
  </section>

  <section>
    <h2>Limitações conhecidas</h2>
    <ul class="limits">
      <li>As salas usam um servidor público e gratuito, sem garantia de ficar sempre no ar.</li>
      <li>Os bots rodam no aparelho de quem criou a sala. Se essa pessoa sair, os bots param.</li>
      <li>A duração do PvP (~15 rodadas com 6 jogadores) vem de testes e simulação e pode variar com as cartas compradas.</li>
      <li>Se alguém ficar mais de 3 minutos sem internet, a mesa segue sem essa pessoa.</li>
    </ul>
  </section>

  <footer>Feito com o Claude para o Maycon e a família. Peça mudanças na conversa que esta página é atualizada.</footer>
</div>
'''
import os,sys; open(sys.argv[1] if len(sys.argv)>1 else os.path.join(os.path.dirname(os.path.abspath(__file__)),'diario.html'),'w').write(page)
