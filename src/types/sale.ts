/**
 * Interface padronizada para todas as vendas recebidas via Webhook.
 * Qualquer plataforma integrada (Hotmart, Hubla, Zouti, TMB Educação)
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

  /** Identificador da plataforma de origem (ex: hotmart, hubla, zouti, tmb) */
  platform?: string;

  /** Identificador ou código da transação/pedido original (opcional) */
  transactionId?: string;
}

/**
 * Converte um objeto StandardizedSale em um array de colunas ordenadas para o Google Sheets.
 * Ordem padrão das colunas:
 * [Nome do Cliente, E-mail, Telefone, Nome do Produto, Valor, Status, Data da Transação]
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
];
