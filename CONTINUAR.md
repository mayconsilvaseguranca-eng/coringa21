# Família 21 — guia para continuar o projeto

Blackjack roguelike (estilo Balatro) para celular, para o Maycon e a família. Tudo em português.

## Onde está cada coisa
- **Jogo:** `index.html` (arquivo único, JS puro). Site: https://mayconsilvaseguranca-eng.github.io/coringa21/ (GitHub Pages, publica sozinho a cada push na `main`).
- **Testes:** `tests/` (Playwright + broker MQTT local). `cd tests && npm install && node run-all.mjs 2`. Rodam também no GitHub Actions a cada push (`.github/workflows/testes.yml`). Se o npm não alcançar o registro, use a cópia local: `mkdir -p tests/node_modules && ln -sfn /opt/node-tools/node_modules/playwright-core tests/node_modules/playwright`.
- **Balanceamento:** `node tests/balanceamento.mjs 10000` simula milhares de partidas PvP com as regras do jogo (sem navegador) e mostra a chance de vitória de cada carta em mesas de 6, 4 e 2. Os números das cartas ficam em `P` e precisam bater com `index.html`. Meta na mesa de 6: cada carta entre ~22% e 30% (sem carta: 17%).
- **Diário:** `diario/diario.py` gera `diario/diario.html`. Atualizar e republicar o diário só uma vez, no fim do trabalho (o Maycon pediu para não atualizar ao vivo, gasta muitos tokens). O gerador ainda aceita `diario/agora.json` para a seção Agora mesmo, mas só use se ele pedir. Para cada mudança: inserir uma tupla nova no início da lista `V=[` (versão, "dd/mm · hh:mm", título, pedido do usuário, [(Novo|Mudou|Corrigido, texto)]), atualizar o "atualizado em", rodar o script e republicar o artifact do diário.
- **Artifacts no claude.ai:** Diário https://claude.ai/artifact/TSseWZp3NGpDos8mQB4XTh · Prévia do jogo https://claude.ai/artifact/PrEx9BMW4hoLBVFtz1tzn9 (gerada de `index.html` com `python3 tests/previa.py index.html previa.html`: tira doctype/html/head/body, meta charset/viewport, `ROOM=typeof WebSocket!=='undefined';` → `ROOM=false;`, e trocar o aviso "Este navegador não consegue abrir salas online…" pelo aviso de prévia apontando para o site).

## Como trabalhar (preferências do Maycon)
- Toda mudança: editar `index.html`, rodar os testes, commit + push, atualizar o diário (uma vez, no fim).
- Não atualizar a prévia do claude.ai: o Maycon testa o PvP pelo site, e na prévia o multiplayer não funciona. Só se ele pedir.
- Tudo cabe numa tela de celular sem rolar (testar no iPhone SE). Números legíveis: fonte Rubik; fonte pixel só na palavra FAMÍLIA do logo.
- PvP é o modo principal. Dano e vida sempre inteiros. Ritmo mais lento (`PACE=1.6`).
- Fim de partida: "Voltar para a sala" e "Voltar ao menu" (sem "Jogar de novo").
- Quando ele pede explicação ("não acrescentem isso ao jogo"), só explicar.
- Ideias de PvP Avançado (Mira, Maldição, Gelo etc.) estão só no diário, não no jogo.

## Técnico em resumo
- Multiplayer sem conta: cliente MQTT próprio sobre WebSocket (brokers públicos EMQX/HiveMQ). `?broker=` troca o broker e `?test=1` expõe `window.__c21` para os testes.
- PvP sem dealer: todos enviam a mão; na revelação, cada um causa dano em quem ficou abaixo. Constantes em `index.html`: `PVP_HP=120`, `DMG_K=20`, loja a cada 3 rodadas (120 s), 45 s por jogada. A vida inicial é ajustável na sala.
- Cartas de PvP: 16 em `JK` com `pvp:'atk'|'def'`. Ataque em `pvpShowdown`, defesa em `pvpCheckDamage`, efeitos de início de rodada em `pvpStartRound`. Bônus de ataque valem sobre o dano final (depois de `pvpMinHit`). Rebalanceadas na v12.1 com o simulador.
- Bots (`botTick`, `botDefend`, `botShop`): compram cartas na loja e usam as mesmas regras das pessoas, param no 17, dobram com 10/11 e ganham +5% de dano por rodada (até +50%). Simulação: 2 pessoas contra 4 bots vencem ~40%.
- Posição no PvP: `pvpRank()` (pela vida), mostrada no quadro de cima e no resultado da rodada.
- Tela "Cartas" (`showCards`) lista as cartas de PvP e as do solo.
- Cartas de mesa (`pvp:'mesa'`): uso único. `useMesa` publica um evento `{k,r}` em `st.ev`; `mesaFx(R)` junta os eventos da rodada de todos os jogadores (bots: `botFx`). Efeitos: Tempestade no início da rodada, Trégua no ataque, Teto 19 via `capNow()`, Embaralhar em `pvpDeal`. Ligadas ou desligadas na sala (`MP.mesaOff`, vai em `st.mesa` no início da partida).
- Bots rodam no aparelho de quem criou a sala.
