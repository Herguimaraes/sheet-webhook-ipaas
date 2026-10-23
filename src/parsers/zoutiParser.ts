import { StandardizedSale } from '../types/sale';
import { WebhookParser } from './baseParser';

export class ZoutiParser implements WebhookParser {
  readonly platformName = 'zouti';

  canHandle(platform: string): boolean {
    const normalized = platform.toLowerCase().trim();
    return normalized === 'zouti';
  }

  parse(payload: any, headers?: Record<string, any>): StandardizedSale {
    if (!payload || typeof payload !== 'object') {
      throw new Error('[ZoutiParser] Payload inválido ou vazio recebido.');
    }

    const customer = payload.customer || {};

    // 1. Nome do Cliente
    const customerName = customer.name || 'Cliente Desconhecido';

    // 2. E-mail
    const email = customer.email || '';

    // 3. Telefone
    const phone = customer.phone || '';

    // 4. Nome do Produto (pode estar em items, products, line_items ou plan)
    let productName = 'Produto Zouti';
    if (Array.isArray(payload.items) && payload.items.length > 0) {
      productName = payload.items[0].name || productName;
    } else if (Array.isArray(payload.products) && payload.products.length > 0) {
      productName = payload.products[0].name || productName;
    } else if (Array.isArray(payload.line_items) && payload.line_items.length > 0) {
      productName = payload.line_items[0].name || productName;
    } else if (payload.plan?.name) {
      productName = payload.plan.name;
    }

    // 5. Valor em reais
    let value = 0;
    if (payload.amount_total_in_brl !== undefined) {
      value = Number(payload.amount_total_in_brl);
    } else if (payload.amount_in_brl !== undefined) {
      value = Number(payload.amount_in_brl);
    } else if (payload.total_amount_in_brl !== undefined) {
      value = Number(payload.total_amount_in_brl);
    } else if (payload.payment?.amount_in_brl !== undefined) {
      value = Number(payload.payment.amount_in_brl);
    } else if (payload.amount_total !== undefined) {
      value = Number(payload.amount_total) / 100;
    } else if (payload.amount !== undefined) {
      value = Number(payload.amount) / 100;
    } else if (payload.total_amount !== undefined) {
      value = Number(payload.total_amount) / 100;
    }

    // 6. Status da Compra (checa x-zouti-event-type do header se fornecido, ou payload.status)
    const headerEventType = (headers?.['x-zouti-event-type'] || '').toString().toUpperCase();
    const rawStatus = (payload.status || headerEventType || '').toString().toUpperCase();
    const paymentMethod = (
      payload.payment?.method ||
      payload.payment_method ||
      payload.metadata?.payment_method ||
      ''
    ).toString().toUpperCase();

    const status = this.mapStatus(rawStatus, headerEventType, paymentMethod);

    // 7. Data da Transação
    let transactionDate = new Date().toISOString();
    const rawDate =
      payload.paid_at ||
      payload.created_at ||
      payload.updated_at ||
      payload.current_period_start;

    if (rawDate) {
      const parsed = new Date(rawDate);
      if (!isNaN(parsed.getTime())) {
        transactionDate = parsed.toISOString();
      }
    }

    const transactionId = payload.id || payload.order_id || payload.order_session_id;

    return {
      customerName,
      email,
      phone,
      productName,
      value: isNaN(value) ? 0 : Number(value.toFixed(2)),
      status,
      transactionDate,
      platform: this.platformName,
      transactionId,
    };
  }

  private mapStatus(rawStatus: string, headerEvent: string, paymentMethod: string): string {
    const combined = `${rawStatus} ${headerEvent}`;

    if (
      combined.includes('PAID') ||
      combined.includes('ACTIVE') ||
      combined.includes('APPROVED')
    ) {
      return 'Aprovado';
    }
    if (combined.includes('BOLETO_CREATED')) {
      return 'Boleto Impresso';
    }
    if (combined.includes('PIX_CREATED') || combined.includes('AWAITING_PAYMENT') || combined.includes('PENDING')) {
      if (paymentMethod === 'BOLETO') {
        return 'Boleto Impresso';
      }
      return 'Aguardando Pagamento';
    }
    if (
      combined.includes('DECLINED') ||
      combined.includes('UNPAID') ||
      combined.includes('REFUSED')
    ) {
      return 'Recusado';
    }
    if (combined.includes('REFUND')) {
      return 'Reembolsado';
    }
    if (combined.includes('CANCEL')) {
      return 'Cancelado';
    }
    if (combined.includes('DISPUT')) {
      return 'Chargeback';
    }
    return rawStatus || 'Processando';
  }
}
