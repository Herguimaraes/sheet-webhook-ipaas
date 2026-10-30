/**
 * Interface padronizada para todas as vendas recebidas via Webhook.
 * Qualquer plataforma integrada (Hotmart, Hubla, Zouti, TMB Educação, Kiwify)
 * deve normalizar seu payload para este formato.
 */
export interface StandardizedSale {
  /** Nome completo do comprador/cliente */
  customerName: string;

  /** E-mail do cliente */
  email: string;

  /** Telefone com DDD do cliente */
  phone: string;

  /** Nome do produto ou oferta adquirida */
  productName: string;

  /** Valor da transação em reais (número decimal, ex: 197.00) */
  value: number;

  /**
   * Status da compra normalizado em português:
   * 'Aprovado' | 'Boleto Impresso' | 'Aguardando Pagamento' | 'Recusado' | 'Cancelado' | 'Reembolsado' | 'Chargeback' | etc.
   */
  status: string;

  /** Data e hora da transação no formato ISO ou Legível */
  transactionDate: string;

  /** Método ou tipo de pagamento (ex: 'Cartão de Crédito', 'Pix', 'Boleto') */
  paymentMethod?: string;

  /** ID ou código da oferta */
  offerId?: string;

  /** UTM Source da campanha de origem */
  utmSource?: string;

  /** Identificador da plataforma de origem (ex: hotmart, hubla, zouti, tmb, kiwify) */
  platform?: string;

  /** Identificador ou código da transação/pedido original (opcional) */
  transactionId?: string;
}

/**
 * Normaliza o método ou tipo de pagamento para exibição limpa e padronizada.
 */
export function normalizePaymentMethod(rawMethod?: any): string {
  if (!rawMethod || typeof rawMethod !== 'string') return '';
  const trimmed = rawMethod.trim();
  const lower = trimmed.toLowerCase();

  if (
    lower.includes('credit_card') ||
    lower.includes('creditcard') ||
    lower.includes('cartao_credito') ||
    lower.includes('cartão de crédito') ||
    lower.includes('cartao de credito') ||
    lower === 'credit'
  ) {
    return 'Cartão de Crédito';
  }

  if (
    lower.includes('debit_card') ||
    lower.includes('debitcard') ||
    lower.includes('cartao_debito') ||
    lower.includes('cartão de débito') ||
    lower.includes('cartao de debito') ||
    lower === 'debit'
  ) {
    return 'Cartão de Débito';
  }

  if (lower.includes('pix')) {
    if (lower.includes('parcelado')) {
      return 'Pix Parcelado';
    }
    return 'Pix';
  }

  if (
    lower.includes('boleto') ||
    lower.includes('bank_slip') ||
    lower.includes('billet')
  ) {
    if (lower.includes('parcelado')) {
      return 'Boleto Parcelado';
    }
    return 'Boleto';
  }

  if (lower.includes('paypal')) {
    return 'PayPal';
  }

  if (lower.includes('wallet') || lower.includes('carteira')) {
    return 'Carteira Virtual';
  }

  if (lower.includes('free') || lower.includes('gratis') || lower.includes('gratuito')) {
    return 'Gratuito';
  }

  if (lower.includes('financing') || lower.includes('financiamento')) {
    return 'Financiamento';
  }

  if (lower.includes('two_credit_cards') || lower.includes('dois_cartoes')) {
    return '2 Cartões de Crédito';
  }

  return trimmed;
}

/**
 * Converte um objeto StandardizedSale em um array de colunas ordenadas para o Google Sheets.
 * Ordem padrão das colunas:
 * [Nome do Cliente, E-mail, Telefone, Nome do Produto, Valor, Status, Data da Transação, Método de Pagamento, ID da Oferta, UTM Source]
 */
export function saleToSheetRow(sale: StandardizedSale): (string | number)[] {
  return [
    sale.customerName || 'N/A',
    sale.email || 'N/A',
    sale.phone || 'N/A',
    sale.productName || 'N/A',
    Number(sale.value.toFixed(2)),
    sale.status || 'N/A',
    sale.transactionDate || new Date().toISOString(),
    sale.paymentMethod || 'N/A',
    sale.offerId || 'N/A',
    sale.utmSource || 'N/A',
  ];
}

/**
 * Cabeçalho padrão caso a planilha/aba esteja vazia.
 */
export const DEFAULT_SHEET_HEADERS = [
  'Nome do Cliente',
  'E-mail',
  'Telefone',
  'Nome do Produto',
  'Valor (R$)',
  'Status da Compra',
  'Data da Transação',
  'Método de Pagamento',
  'Código da Oferta',
  'UTM Source',
];
