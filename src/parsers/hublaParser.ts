import { StandardizedSale, normalizePaymentMethod } from '../types/sale';
import { WebhookParser } from './baseParser';

export class HublaParser implements WebhookParser {
  readonly platformName = 'hubla';

  canHandle(platform: string): boolean {
    const normalized = platform.toLowerCase().trim();
    return normalized === 'hubla';
  }

  parse(payload: any): StandardizedSale {
    if (!payload || typeof payload !== 'object') {
      throw new Error('[HublaParser] Payload inválido ou vazio recebido.');
    }

    const eventData = payload.event || payload;
    const invoice = eventData.invoice || {};
    const payer = invoice.payer || eventData.user || {};
    const product =
      eventData.product ||
      (Array.isArray(eventData.products) && eventData.products[0]) ||
      {};

    // 1. Nome do Cliente
    const customerName =
      [payer.firstName, payer.lastName].filter(Boolean).join(' ') ||
      payer.name ||
      'Cliente Desconhecido';

    // 2. E-mail
    const email = payer.email || '';

    // 3. Telefone
    const phone = payer.phone || '';

    // 4. Nome do Produto
    const productName = product.name || 'Produto Hubla';

    // 5. Valor (Hubla envia amount.total em reais ou amount.totalCents em centavos)
    let value = 0;
    if (invoice.amount?.total !== undefined) {
      value = Number(invoice.amount.total);
    } else if (invoice.amount?.totalCents !== undefined) {
      value = Number(invoice.amount.totalCents) / 100;
    } else if (invoice.amount?.subtotal !== undefined) {
      value = Number(invoice.amount.subtotal);
    } else if (invoice.amount?.subtotalCents !== undefined) {
      value = Number(invoice.amount.subtotalCents) / 100;
    } else if (payload.amount !== undefined) {
      value = Number(payload.amount);
    }

    // 6. Status da Compra
    const rawStatus = (invoice.status || payload.type || '').toString().toLowerCase();
    const rawPaymentMethod = (
      invoice.paymentMethod ||
      invoice.payment_method ||
      eventData.paymentMethod ||
      payload.paymentMethod ||
      ''
    ).toString();
    const paymentMethod = normalizePaymentMethod(rawPaymentMethod);
    const status = this.mapStatus(rawStatus, rawPaymentMethod.toLowerCase());

    // 7. Data da Transação
    let transactionDate = new Date().toISOString();
    const rawDate =
      invoice.saleDate ||
      invoice.createdAt ||
      invoice.dueDate ||
      payload.createdAt;

    if (rawDate) {
      const parsed = new Date(rawDate);
      if (!isNaN(parsed.getTime())) {
        transactionDate = parsed.toISOString();
      }
    }

    const transactionId = invoice.id || invoice.orderId || payload.id;

    // 8. ID ou Código da Oferta
    const offerId = (
      eventData.offer?.id ||
      eventData.offer?.code ||
      invoice.offerId ||
      invoice.offer_id ||
      product.offerId ||
      product.offer_id ||
      product.offer?.id ||
      product.offer?.code ||
      payload.offerId ||
      payload.offer_id ||
      ''
    ).toString().trim();

    // 9. UTM Source
    const metadata = eventData.metadata || invoice.metadata || payload.metadata || {};
    const tracking = eventData.tracking || invoice.tracking || payload.tracking || {};
    const utmSource = (
      metadata.utm_source ||
      tracking.utm_source ||
      payload.utm_source ||
      eventData.utm_source ||
      metadata.src ||
      tracking.src ||
      payload.src ||
      eventData.src ||
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

  private mapStatus(rawStatus: string, paymentMethod: string): string {
    if (rawStatus === 'paid' || rawStatus.includes('paid')) {
      return 'Aprovado';
    }
    if (rawStatus === 'unpaid') {
      if (paymentMethod === 'bank_slip') {
        return 'Boleto Impresso';
      }
      return 'Aguardando Pagamento';
    }
    if (rawStatus === 'failed' || rawStatus.includes('failed') || rawStatus === 'declined') {
      return 'Recusado';
    }
    if (rawStatus === 'refunded' || rawStatus.includes('refund')) {
      return 'Reembolsado';
    }
    if (rawStatus === 'expired') {
      return 'Expirado';
    }
    return rawStatus ? rawStatus.toUpperCase() : 'Processando';
  }
}
