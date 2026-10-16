# Família 21 — guia para continuar o projeto

Blackjack roguelike (estilo Balatro) para celular, para o Maycon e a família. Tudo em português.

## Onde está cada coisa
- **Jogo:** `index.html` (arquivo único, JS puro). Site: https://mayconsilvaseguranca-eng.github.io/coringa21/ (GitHub Pages, publica sozinho a cada push na `main`).
- **Testes:** `tests/` (Playwright + broker MQTT local). `cd tests && npm install && node run-all.mjs 2`. Rodam também no GitHub Actions a cada push (`.github/workflows/testes.yml`).
- **Diário:** `diario/diario.py` gera `diario/diario.html`. Para cada mudança: inserir uma tupla nova no início da lista `V=[` (versão, "dd/mm · hh:mm", título, pedido do usuário, [(Novo|Mudou|Corrigido, texto)]), atualizar o "atualizado em", rodar o script e republicar o artifact do diário.
- **Artifacts no claude.ai:** Diário https://claude.ai/artifact/TSseWZp3NGpDos8mQB4XTh · Prévia do jogo https://claude.ai/artifact/PrEx9BMW4hoLBVFtz1tzn9 (gerada de `index.html`: tirar doctype/html/head/body, meta charset/viewport, `ROOM=typeof WebSocket!=='undefined';` → `ROOM=false;`, e trocar o aviso "Este navegador não consegue abrir salas online…" pelo aviso de prévia apontando para o site).

## Como trabalhar (preferências do Maycon)
- Toda mudança: editar `index.html`, rodar os testes, commit + push, atualizar o diário e a prévia.
- Tudo cabe numa tela de celular sem rolar (testar no iPhone SE). Números legíveis: fonte Rubik; fonte pixel só na palavra FAMÍLIA do logo.
- PvP é o modo principal. Dano e vida sempre inteiros. Ritmo mais lento (`PACE=1.6`).
- Fim de partida: "Voltar para a sala" e "Voltar ao menu" (sem "Jogar de novo").
- Quando ele pede explicação ("não acrescentem isso ao jogo"), só explicar.
- Ideias de PvP Avançado (Mira, Maldição, Gelo etc.) estão só no diário, não no jogo.

## Técnico em resumo
- Multiplayer sem conta: cliente MQTT próprio sobre WebSocket (brokers públicos EMQX/HiveMQ). `?broker=` troca o broker e `?test=1` expõe `window.__c21` para os testes.
- PvP sem dealer: todos enviam a mão; na revelação, cada um causa dano em quem ficou abaixo. Constantes em `index.html`: `PVP_HP=120`, `DMG_K=20`, loja a cada 3 rodadas (120 s), 45 s por jogada. A vida inicial é ajustável na sala.
- Cartas de PvP: 16 em `JK` com `pvp:'atk'|'def'`. Ataque em `pvpShowdown`, defesa em `pvpCheckDamage`, efeitos de início de rodada em `pvpStartRound`.
- Tela "Cartas" (`showCards`) lista as cartas de PvP e as do solo.
- Bots rodam no aparelho de quem criou a sala.
