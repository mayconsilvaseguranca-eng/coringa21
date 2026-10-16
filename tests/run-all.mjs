// Agente de testes do Coringa 21: roda cada teste várias vezes e falha se qualquer rodada quebrar.
// Uso: node tests/run-all.mjs [vezes]   (padrão: 3)
const TESTS = ['solo', 'pvp-bots', 'pvp-cartas', 'sobrevivencia'];
const RUNS = +process.argv[2] || +process.env.RUNS || 3;

let fails = 0;
const report = [];
for (const name of TESTS) {
  const mod = await import(`./${name}.test.mjs`);
  for (let i = 1; i <= RUNS; i++) {
    const t0 = Date.now();
    try {
      const msg = await mod.default();
      report.push(`✔ ${name} #${i} (${Math.round((Date.now() - t0) / 1000)}s) ${msg || ''}`);
    } catch (e) {
      fails++;
      report.push(`✘ ${name} #${i}: ${e.message}`);
    }
    console.log(report[report.length - 1]);
  }
}
console.log(`\n${report.length - fails}/${report.length} execuções passaram.`);
process.exit(fails ? 1 : 0);
