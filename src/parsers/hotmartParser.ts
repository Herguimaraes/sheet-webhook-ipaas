import { StandardizedSale } from '../types/sale';
import { WebhookParser } from './baseParser';

export class HotmartParser implements WebhookParser {
  readonly platformName = 'hotmart';

  canHandle(platform: string): boolean {
    const normalized = platform.toLowerCase().trim();
    return normalized === 'hotmart' || normalized === 'hotmart2';
  }

  parse(payload: any): StandardizedSale {
    if (!payload || typeof payload !== 'object') {
      throw new Error('[HotmartParser] Payload inválido ou vazio recebido.');
    }

    // Suporte tanto para Hotmart Webhook 2.0 (bloco "data") quanto para versões legadas/planas
    const data = payload.data || payload;
    const buyer = data.buyer || payload.buyer || {};
    const product = data.product || payload.product || {};
    const purchase = data.purchase || payload.purchase || {};

    // 1. Nome do Cliente
    const customerName =
      buyer.name ||
      [buyer.first_name, buyer.last_name].filter(Boolean).join(' ') ||
      payload.name ||
      data.name ||
      'Cliente Desconhecido';

    // 2. E-mail
    const email = buyer.email || payload.email || data.email || '';

    // 3. Telefone
    const phone =
      buyer.checkout_phone ||
      buyer.phone ||
      buyer.cellphone ||
      payload.phone ||
      data.phone ||
      '';

    // 4. Nome do Produto
    const productName =
      product.name ||
      payload.prod_name ||
      data.prod_name ||
      'Produto Hotmart';

    // 5. Valor
    let value = 0;
    if (purchase.full_price?.value !== undefined) {
      value = Number(purchase.full_price.value);
    } else if (purchase.price?.value !== undefined) {
      value = Number(purchase.price.value);
    } else if (purchase.original_offer_price?.value !== undefined) {
      value = Number(purchase.original_offer_price.value);
    } else if (payload.price !== undefined) {
      value = Number(payload.price);
    } else if (data.price !== undefined) {
      value = Number(data.price);
    }

    // 6. Status da Compra
    const rawStatus = (
      purchase.status ||
      payload.event ||
      payload.status ||
      ''
    ).toString().toUpperCase();

    const status = this.mapStatus(rawStatus);

    // 7. Data da Transação
    let transactionDate = new Date().toISOString();
    const rawDate =
      purchase.approved_date ||
      purchase.order_date ||
      payload.creation_date ||
      data.creation_date;

    if (rawDate) {
      if (typeof rawDate === 'number') {
        transactionDate = new Date(rawDate).toISOString();
      } else if (!isNaN(Number(rawDate)) && String(rawDate).length >= 10) {
        transactionDate = new Date(Number(rawDate)).toISOString();
      } else {
        const parsed = new Date(rawDate);
        if (!isNaN(parsed.getTime())) {
          transactionDate = parsed.toISOString();
        }
      }
    }

    const transactionId = purchase.transaction || payload.id || data.transaction;

    return {
      customerName,
      email,
      phone,
      productName,
      value: isNaN(value) ? 0 : value,
      status,
      transactionDate,
      platform: this.platformName,
      transactionId,
    };
  }

  private mapStatus(rawStatus: string): string {
    if (rawStatus.includes('APPROVED') || rawStatus === 'COMPLETE') {
      return 'Aprovado';
    }
    if (
      rawStatus.includes('BILLET_PRINTED') ||
      rawStatus.includes('PRINTED_BILLET') ||
      rawStatus.includes('WAITING_PAYMENT') ||
      rawStatus.includes('PROTESTED')
    ) {
      return 'Boleto Impresso';
    }
    if (rawStatus.includes('REFUNDED')) {
      return 'Reembolsado';
    }
    if (rawStatus.includes('CANCELED') || rawStatus.includes('CANCELLED')) {
      return 'Cancelado';
    }
    if (rawStatus.includes('CHARGEBACK')) {
      return 'Chargeback';
    }
    if (
      rawStatus.includes('BLOCKED') ||
      rawStatus.includes('EXPIRED') ||
      rawStatus.includes('DECLINED')
    ) {
      return 'Recusado';
    }
    return rawStatus || 'Processando';
  }
}
