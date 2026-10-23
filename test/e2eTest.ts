import app from '../src/app';
import { Server } from 'http';

async function testHttpEndpoint() {
  console.log('🧪 Iniciando teste HTTP da API Express...');

  const server: Server = await new Promise((resolve) => {
    const s = app.listen(3333, () => resolve(s));
  });

  try {
    // 1. Testar Health Check
    console.log('1. Testando GET /api/health ...');
    const healthRes = await fetch('http://localhost:3333/api/health');
    const healthJson = await healthRes.json();
    console.log('Health check response:', healthJson);
    if (healthRes.status !== 200 || healthJson.status !== 'healthy') {
      throw new Error('Health check falhou!');
    }

    // 2. Testar Service Account Info
    console.log('\n2. Testando GET /api/service-account ...');
    const saRes = await fetch('http://localhost:3333/api/service-account');
    const saJson = await saRes.json();
    console.log('Service account response:', saJson);
    if (saRes.status !== 200 || !saJson.instructions) {
      throw new Error('Endpoint /api/service-account falhou!');
    }

    // 3. Testar Webhook Hotmart via POST usando Link completo do Google Sheets como parâmetro
    console.log('\n3. Testando POST com Link Completo do Sheets na URL ...');
    const fullSheetUrlEncoded = encodeURIComponent(
      'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0'
    );
    const webhookRes = await fetch(
      `http://localhost:3333/api/webhook/hotmart/${fullSheetUrlEncoded}/AbaVendas`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'PURCHASE_APPROVED',
          data: {
            product: { name: 'Treinamento FullStack' },
            buyer: {
              name: 'Guilherme Silva',
              email: 'guilherme@test.com',
              checkout_phone: '+5511999990000',
            },
            purchase: {
              transaction: 'HP11223344',
              status: 'APPROVED',
              full_price: { value: 297.0 },
            },
          },
        }),
      }
    );

    const webhookJson = await webhookRes.json();
    console.log('Webhook Hotmart response:', webhookJson);
    if (webhookRes.status !== 200 || webhookJson.status !== 'acknowledged') {
      throw new Error('Endpoint webhook falhou!');
    }

    // 4. Testar Validação de Planilha com corpo vazio (esperado 400)
    console.log('\n4. Testando POST /api/validate-sheet com corpo vazio ...');
    const validateEmptyRes = await fetch('http://localhost:3333/api/validate-sheet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const validateEmptyJson = await validateEmptyRes.json();
    console.log('Validação vazia response (esperado 400):', validateEmptyJson);
    if (validateEmptyRes.status !== 400) {
      throw new Error('Deveria ter retornado 400 para validação com corpo vazio!');
    }

    // 5. Testar Plataforma Não Suportada
    console.log('\n5. Testando plataforma inválida ...');
    const invalidRes = await fetch(
      'http://localhost:3333/api/webhook/plataformaInvalida/testSheetId/AbaVendas',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ any: 'payload' }),
      }
    );
    const invalidJson = await invalidRes.json();
    console.log('Plataforma inválida response (esperado 400):', invalidJson);
    if (invalidRes.status !== 400) {
      throw new Error('Deveria ter retornado 400 para plataforma desconhecida!');
    }

    // 6. Testar Interface Web GET /
    console.log('\n6. Testando GET / (Interface Web HTML) ...');
    const webRes = await fetch('http://localhost:3333/', {
      headers: { 'Accept': 'text/html' }
    });
    const webHtml = await webRes.text();
    if (webRes.status !== 200 || !webHtml.includes('Webhook para Google Sheets')) {
      throw new Error('Falha ao servir a interface web!');
    }
    console.log('Interface Web HTML servida com sucesso (tamanho: ' + webHtml.length + ' bytes)');

    console.log('\n🎉 TODOS OS TESTES HTTP PASSARAM COM SUCESSO!');
  } finally {
    server.close();
  }
}

testHttpEndpoint().catch((err) => {
  console.error('❌ Erro no teste HTTP:', err);
  process.exit(1);
});
