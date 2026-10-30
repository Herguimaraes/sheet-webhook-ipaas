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
        payment: {
          type: 'CREDIT_CARD',
        },
        offer: {
          code: 'OFFER_HOTMART_01',
        },
        tracking: {
          utm_source: 'instagram_ads',
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
  assert(hotmartSale.paymentMethod === 'Cartão de Crédito', 'Método de pagamento deve ser Cartão de Crédito');
  assert(hotmartSale.offerId === 'OFFER_HOTMART_01', 'Código da oferta deve ser OFFER_HOTMART_01');
  assert(hotmartSale.utmSource === 'instagram_ads', 'UTM Source deve ser instagram_ads');
  const hotmartRow = saleToSheetRow(hotmartSale);
  assert(hotmartRow.length === 10, 'Linha do Sheets deve ter 10 colunas');
  console.log('Linha Google Sheets:', hotmartRow);
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
      offer: {
        id: 'offer_hubla_99',
      },
      metadata: {
        utm_source: 'youtube_live',
      },
      invoice: {
        id: '7614b1bb-1d1a-43ba-890c-50d74216eb56',
        status: 'paid',
        paymentMethod: 'pix',
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
  assert(hublaSale.paymentMethod === 'Pix', 'Método de pagamento deve ser Pix');
  assert(hublaSale.offerId === 'offer_hubla_99', 'Código da oferta deve ser offer_hubla_99');
  assert(hublaSale.utmSource === 'youtube_live', 'UTM Source deve ser youtube_live');
  const hublaRow = saleToSheetRow(hublaSale);
  assert(hublaRow.length === 10, 'Linha do Sheets deve ter 10 colunas');
  console.log('Linha Google Sheets:', hublaRow);
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
    payment: {
      method: 'BOLETO',
    },
    offer_id: 'zouti_offer_123',
    metadata: {
      utm_source: 'facebook_feed',
    },
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
  assert(zoutiSale.paymentMethod === 'Boleto', 'Método de pagamento deve ser Boleto');
  assert(zoutiSale.offerId === 'zouti_offer_123', 'Código da oferta deve ser zouti_offer_123');
  assert(zoutiSale.utmSource === 'facebook_feed', 'UTM Source deve ser facebook_feed');
  const zoutiRow = saleToSheetRow(zoutiSale);
  assert(zoutiRow.length === 10, 'Linha do Sheets deve ter 10 colunas');
  console.log('Linha Google Sheets:', zoutiRow);
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
    forma_pagamento: 'cartao_credito',
    codigo_oferta: 'TMB_TURMA_2026',
    utm_source: 'google_search',
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
  assert(tmbSale.paymentMethod === 'Cartão de Crédito', 'Método de pagamento deve ser Cartão de Crédito');
  assert(tmbSale.offerId === 'TMB_TURMA_2026', 'Código da oferta deve ser TMB_TURMA_2026');
  assert(tmbSale.utmSource === 'google_search', 'UTM Source deve ser google_search');
  const tmbRow = saleToSheetRow(tmbSale);
  assert(tmbRow.length === 10, 'Linha do Sheets deve ter 10 colunas');
  console.log('Linha Google Sheets:', tmbRow);
  console.log('✅ TmbParser validado com sucesso!\n');

  // ==========================================
  // 5. TESTE KIWIFY
  // ==========================================
  console.log('--- Testando KiwifyParser ---');
  const kiwifyParser = getParser('kiwify');
  assert(!!kiwifyParser, 'Parser para kiwify deve ser encontrado');

  const kiwifyPayload = {
    order_id: '7f7e2b76-6339-49af-8788-e753e76b61c1',
    order_ref: 'UOcHGBY',
    order_status: 'paid',
    payment_method: 'credit_card',
    created_at: '2026-10-23 12:30:00',
    approved_date: '2026-10-23 12:30:15',
    webhook_event_type: 'order_approved',
    Product: {
      product_id: '2a14ad80-7edc-4f06-a237-aa4ae3d0f2c8',
      product_name: 'Método Vendas Automáticas',
    },
    Customer: {
      full_name: 'Camila Fernandes',
      email: 'camila.fernandes@example.com',
      mobile: '+5511988889999',
    },
    Commissions: {
      charge_amount: 19700,
      product_base_price: 19700,
    },
    TrackingParameters: {
      offer: 'kiwi_offer_xyz',
      utm_source: 'whatsapp_group',
    },
  };

  const kiwifySale = kiwifyParser!.parse(kiwifyPayload);
  console.log('Venda Kiwify normalizada:', kiwifySale);
  assert(kiwifySale.customerName === 'Camila Fernandes', 'Nome deve ser Camila Fernandes');
  assert(kiwifySale.email === 'camila.fernandes@example.com', 'E-mail deve bater');
  assert(kiwifySale.phone === '+5511988889999', 'Telefone deve bater');
  assert(kiwifySale.productName === 'Método Vendas Automáticas', 'Produto deve ser Método Vendas Automáticas');
  assert(kiwifySale.value === 197.0, 'Valor deve ser 197.00 (convertido de centavos 19700)');
  assert(kiwifySale.status === 'Aprovado', 'Status deve ser Aprovado');
  assert(kiwifySale.paymentMethod === 'Cartão de Crédito', 'Método de pagamento deve ser Cartão de Crédito');
  assert(kiwifySale.offerId === 'kiwi_offer_xyz', 'Código da oferta deve ser kiwi_offer_xyz');
  assert(kiwifySale.utmSource === 'whatsapp_group', 'UTM Source deve ser whatsapp_group');
  const kiwifyRow = saleToSheetRow(kiwifySale);
  assert(kiwifyRow.length === 10, 'Linha do Sheets deve ter 10 colunas');
  console.log('Linha Google Sheets:', kiwifyRow);
  console.log('✅ KiwifyParser validado com sucesso!\n');
  console.log('✅ KiwifyParser validado com sucesso!\n');

  console.log('🎉 TODOS OS PARSERS FORAM TESTADOS E VALIDADOS COM SUCESSO!');
}

runAllTests().catch((err) => {
  console.error('❌ Falha nos testes:', err);
  process.exit(1);
});
