import { StandardizedSale, normalizePaymentMethod } from '../types/sale';
import { WebhookParser } from './baseParser';

export class TmbParser implements WebhookParser {
  readonly platformName = 'tmb';

  canHandle(platform: string): boolean {
    const normalized = platform.toLowerCase().trim();
    return (
      normalized === 'tmb' ||
      normalized === 'tmbeducacao' ||
      normalized === 'tmb-educacao'
    );
  }

  parse(payload: any): StandardizedSale {
    if (!payload || typeof payload !== 'object') {
      throw new Error('[TmbParser] Payload inválido ou vazio recebido.');
    }

    // 1. Nome do Cliente
    const customerName =
      payload.cliente ||
      payload.nome ||
      payload.name ||
      payload.aluno ||
      'Cliente Desconhecido';

    // 2. E-mail
    const email = payload.email || '';

    // 3. Telefone
    const phone =
      payload.telefone_ativo ||
      payload.telefones ||
      payload.telefone ||
      payload.celular ||
      '';

    // 4. Nome do Produto (titulo ou lancamento no webhook da TMB)
    const productName =
      payload.titulo ||
      payload.lancamento ||
      payload.produto ||
      'Produto TMB Educação';

    // 5. Valor (em reais)
    let value = 0;
    if (payload.valor_total !== undefined) {
      value = Number(payload.valor_total);
    } else if (payload.valor_principal !== undefined) {
      value = Number(payload.valor_principal);
    } else if (payload.valor !== undefined) {
      value = Number(payload.valor);
    }

    // 6. Status da Compra (status_pedido)
    const rawStatus = (payload.status_pedido || payload.status || '').toString().trim();
    const status = this.mapStatus(rawStatus);

    // 7. Data da Transação
    let transactionDate = new Date().toISOString();
    const rawDate = payload.data_efetivado || payload.criado_em || payload.data;

    if (rawDate) {
      const parsed = new Date(rawDate);
      if (!isNaN(parsed.getTime())) {
        transactionDate = parsed.toISOString();
      }
    }

    const transactionId = payload.code || (payload.pedido ? String(payload.pedido) : undefined);

    // 8. Método ou Tipo de Pagamento
    const rawPaymentMethod = (
      payload.forma_pagamento ||
      payload.metodo_pagamento ||
      payload.tipo_pagamento ||
      payload.payment_method ||
      payload.pagamento?.forma ||
      payload.forma_de_pagamento ||
      ''
    ).toString();
    const paymentMethod = normalizePaymentMethod(rawPaymentMethod);

    // 9. ID ou Código da Oferta
    const offerId = (
      payload.codigo_oferta ||
      payload.id_oferta ||
      payload.oferta ||
      payload.offer_id ||
      payload.offer_code ||
      payload.cod_oferta ||
      payload.turma ||
      payload.codigo_turma ||
      ''
    ).toString().trim();

    // 10. UTM Source
    const tracking = payload.tracking || payload.tracking_parameters || payload.utm || {};
    const metadata = payload.metadata || {};
    const utmSource = (
      payload.utm_source ||
      tracking.utm_source ||
      tracking.source ||
      metadata.utm_source ||
      payload.src ||
      payload.origem ||
      tracking.src ||
      ''
    ).toString().trim();

    return {
      customerName,
      email,
      phone,
      productName,
      value: isNaN(value) ? 0 : Number(value.toFixed(2)),
      status,
      transactionDate,
      paymentMethod,
      offerId,
      utmSource,
      platform: this.platformName,
      transactionId,
    };
  }

  private mapStatus(rawStatus: string): string {
    const lower = rawStatus.toLowerCase();
    if (lower === 'efetivado' || lower.includes('aprovad')) {
      return 'Aprovado';
    }
    if (lower === 'cancelado' || lower.includes('cancel')) {
      return 'Cancelado';
    }
    if (lower === 'recusado' || lower.includes('reprovad')) {
      return 'Recusado';
    }
    if (lower.includes('pendente') || lower.includes('aguardando')) {
      return 'Aguardando Pagamento';
    }
    return rawStatus || 'Processando';
  }
}
