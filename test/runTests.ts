import { getParser } from '../src/parsers';
import { saleToSheetRow } from '../src/types/sale';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ Assertion Failed: ${message}`);
  }
}

async function runAllTests() {
  console.log('🧪 Iniciando testes de validação dos Parsers...\n');

  // ==========================================
  // 1. TESTE HOTMART (Webhook 2.0)
  // ==========================================
  console.log('--- Testando HotmartParser ---');
  const hotmartParser = getParser('hotmart');
  assert(!!hotmartParser, 'Parser para hotmart deve ser encontrado');

  const hotmartPayload = {
    id: 'e8f9a0b1-2c3d-4e5f-6789-0abcdef12345',
    creation_date: 1737120000000,
    event: 'PURCHASE_APPROVED',
    version: '2.0.0',
    data: {
      product: {
        id: 123456,
        name: 'Curso de Next.js Pro',
      },
      buyer: {
        email: 'carlos.almeida@example.com',
        name: 'Carlos Almeida',
        first_name: 'Carlos',
        last_name: 'Almeida',
        checkout_phone: '+5511987654321',
      },
      purchase: {
        transaction: 'HP98765432101234',
        status: 'APPROVED',
        approved_date: 1737120000000,
        full_price: {
          value: 497.0,
          currency_value: 'BRL',
        },
      },
    },
  };

  const hotmartSale = hotmartParser!.parse(hotmartPayload);
  console.log('Venda Hotmart normalizada:', hotmartSale);
  assert(hotmartSale.customerName === 'Carlos Almeida', 'Nome deve ser Carlos Almeida');
  assert(hotmartSale.email === 'carlos.almeida@example.com', 'E-mail deve bater');
  assert(hotmartSale.phone === '+5511987654321', 'Telefone deve bater');
  assert(hotmartSale.productName === 'Curso de Next.js Pro', 'Produto deve ser Curso de Next.js Pro');
  assert(hotmartSale.value === 497.0, 'Valor deve ser 497.00');
  assert(hotmartSale.status === 'Aprovado', 'Status deve ser Aprovado');
  console.log('Linha Google Sheets:', saleToSheetRow(hotmartSale));
  console.log('✅ HotmartParser validado com sucesso!\n');

  // ==========================================
  // 2. TESTE HUBLA
  // ==========================================
  console.log('--- Testando HublaParser ---');
  const hublaParser = getParser('hubla');
  assert(!!hublaParser, 'Parser para hubla deve ser encontrado');

  const hublaPayload = {
    type: 'invoice.paid',
    event: {
      product: {
        id: 'inAVzweR0QYw5y03K5mq',
        name: 'Comunidade VIP Dev',
      },
      invoice: {
        id: '7614b1bb-1d1a-43ba-890c-50d74216eb56',
        status: 'paid',
        paymentMethod: 'credit_card',
        amount: {
          totalCents: 112320,
          total: 1123.2,
        },
        payer: {
          firstName: 'Renata',
          lastName: 'Menezes',
          email: 'renata.menezes@example.com',
          phone: '+5521988887777',
        },
        saleDate: '2024-03-28T20:35:22.671Z',
      },
    },
  };

  const hublaSale = hublaParser!.parse(hublaPayload);
  console.log('Venda Hubla normalizada:', hublaSale);
  assert(hublaSale.customerName === 'Renata Menezes', 'Nome deve ser Renata Menezes');
  assert(hublaSale.email === 'renata.menezes@example.com', 'E-mail deve bater');
  assert(hublaSale.phone === '+5521988887777', 'Telefone deve bater');
  assert(hublaSale.productName === 'Comunidade VIP Dev', 'Produto deve ser Comunidade VIP Dev');
  assert(hublaSale.value === 1123.2, 'Valor deve ser 1123.20');
  assert(hublaSale.status === 'Aprovado', 'Status deve ser Aprovado');
  console.log('Linha Google Sheets:', saleToSheetRow(hublaSale));
  console.log('✅ HublaParser validado com sucesso!\n');

  // ==========================================
  // 3. TESTE ZOUTI
  // ==========================================
  console.log('--- Testando ZoutiParser ---');
  const zoutiParser = getParser('zouti');
  assert(!!zoutiParser, 'Parser para zouti deve ser encontrado');

  const zoutiPayload = {
    id: 'ord_eloz1kotrd7jtghi5oa3vl',
    status: 'PAID',
    amount_total_in_brl: 197.9,
    paid_at: '2024-12-16T19:50:17.044Z',
    items: [
      {
        name: 'Mentoria Exclusiva de Vendas',
        amount_in_brl: 197.9,
      },
    ],
    customer: {
      name: 'Juliana Costa',
      email: 'juliana.costa@example.com',
      phone: '5531998765432',
    },
  };

  const zoutiSale = zoutiParser!.parse(zoutiPayload, {
    'x-zouti-event-type': 'ORDER_PAID',
  });
  console.log('Venda Zouti normalizada:', zoutiSale);
  assert(zoutiSale.customerName === 'Juliana Costa', 'Nome deve ser Juliana Costa');
  assert(zoutiSale.email === 'juliana.costa@example.com', 'E-mail deve bater');
  assert(zoutiSale.phone === '5531998765432', 'Telefone deve bater');
  assert(zoutiSale.productName === 'Mentoria Exclusiva de Vendas', 'Produto deve ser Mentoria Exclusiva de Vendas');
  assert(zoutiSale.value === 197.9, 'Valor deve ser 197.90');
  assert(zoutiSale.status === 'Aprovado', 'Status deve ser Aprovado');
  console.log('Linha Google Sheets:', saleToSheetRow(zoutiSale));
  console.log('✅ ZoutiParser validado com sucesso!\n');

  // ==========================================
  // 4. TESTE TMB EDUCAÇÃO
  // ==========================================
  console.log('--- Testando TmbParser ---');
  const tmbParser = getParser('tmb');
  assert(!!tmbParser, 'Parser para tmb deve ser encontrado');

  const tmbPayload = {
    produtor: 'Produtora Exemplo',
    lancamento: 'Curso de Pós-Graduação Executiva',
    pedido: 166051,
    status_pedido: 'Efetivado',
    cliente: 'Marcos Vinicius Ribeiro',
    email: 'marcos.vinicius@example.com',
    telefone_ativo: '(11) 97777-6666',
    valor_total: 2500.0,
    criado_em: '2026-06-01T10:30:00',
    data_efetivado: '2026-06-01T14:15:00',
    titulo: 'Curso de Pós-Graduação Executiva',
    code: 'TMB-166051',
  };

  const tmbSale = tmbParser!.parse(tmbPayload);
  console.log('Venda TMB normalizada:', tmbSale);
  assert(tmbSale.customerName === 'Marcos Vinicius Ribeiro', 'Nome deve ser Marcos Vinicius Ribeiro');
  assert(tmbSale.email === 'marcos.vinicius@example.com', 'E-mail deve bater');
  assert(tmbSale.phone === '(11) 97777-6666', 'Telefone deve bater');
  assert(tmbSale.productName === 'Curso de Pós-Graduação Executiva', 'Produto deve ser Curso de Pós-Graduação Executiva');
  assert(tmbSale.value === 2500.0, 'Valor deve ser 2500.00');
  assert(tmbSale.status === 'Aprovado', 'Status deve ser Aprovado');
  console.log('Linha Google Sheets:', saleToSheetRow(tmbSale));
  console.log('✅ TmbParser validado com sucesso!\n');

  console.log('🎉 TODOS OS PARSERS FORAM TESTADOS E VALIDADOS COM SUCESSO!');
}

runAllTests().catch((err) => {
  console.error('❌ Falha nos testes:', err);
  process.exit(1);
});
