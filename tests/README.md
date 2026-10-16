# Testes do Família 21

O agente de testes roda sozinho no GitHub a cada atualização do jogo (aba **Actions**, rotina "Testes do jogo").
Ele abre o jogo em navegadores simulados de celular e roda cada teste 3 vezes:

- **solo**: partida inteira, loja com confirmação de compra e controle de volume da música.
- **pvp-bots**: 2 pessoas e 4 bots jogam até sobrar um; confere cartas diferentes e um único vencedor.
- **pvp-cartas**: duelo roteirizado conferindo Escudo, Espelho, Esquiva, Golpe Crítico, Sangria e Vampiro.
- **sobrevivencia**: lista de salas, código errado, duelo com perda de vida, reconexão e vitória.

As salas usam um servidor de mensagens local (`broker.mjs`), então os testes não dependem dos servidores públicos.

Para rodar no computador: `cd tests && npm install && npx playwright install chromium && node run-all.mjs 3`
