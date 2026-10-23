import { StandardizedSale } from '../types/sale';
import { WebhookParser } from './baseParser';

export class KiwifyParser implements WebhookParser {
  readonly platformName = 'kiwify';

  canHandle(platform: string): boolean {
    const normalized = platform.toLowerCase().trim();
    return normalized === 'kiwify';
  }

  parse(payload: any): StandardizedSale {
    if (!payload || typeof payload !== 'object') {
      throw new Error('[KiwifyParser] Payload inválido ou vazio recebido.');
    }

    const customer = payload.Customer || payload.customer || {};
    const product = payload.Product || payload.product || {};
    const commissions = payload.Commissions || payload.commissions || {};

    // 1. Nome do Cliente
    const customerName =
      customer.full_name ||
      customer.name ||
      [customer.first_name, customer.last_name].filter(Boolean).join(' ') ||
      'Cliente Desconhecido';

    // 2. E-mail
    const email = customer.email || '';

    // 3. Telefone
    const phone = customer.mobile || customer.phone || customer.cellphone || '';

    // 4. Nome do Produto
    const productName =
      product.product_name ||
      product.name ||
      payload.product_name ||
      'Produto Kiwify';

    // 5. Valor (Kiwify envia em centavos no bloco Commissions.charge_amount)
    let value = 0;
    if (commissions.charge_amount !== undefined) {
      value = Number(commissions.charge_amount) / 100;
    } else if (commissions.product_base_price !== undefined) {
      value = Number(commissions.product_base_price) / 100;
    } else if (payload.order_amount !== undefined) {
      value = Number(payload.order_amount) > 1000 && !String(payload.order_amount).includes('.')
        ? Number(payload.order_amount) / 100
        : Number(payload.order_amount);
    } else if (payload.order_value !== undefined) {
      value = Number(payload.order_value);
    }

    // 6. Status da Compra
    const rawStatus = (
      payload.order_status ||
      payload.webhook_event_type ||
      payload.status ||
      ''
    ).toString().toLowerCase();

    const paymentMethod = (payload.payment_method || '').toString().toLowerCase();
    const status = this.mapStatus(rawStatus, paymentMethod);

    // 7. Data da Transação
    let transactionDate = new Date().toISOString();
    const rawDate =
      payload.approved_date ||
      payload.created_at ||
      payload.updated_at;

    if (rawDate) {
      const parsed = new Date(rawDate);
      if (!isNaN(parsed.getTime())) {
        transactionDate = parsed.toISOString();
      }
    }

    const transactionId = payload.order_id || payload.order_ref;

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

  private mapStatus(rawStatus: string, paymentMethod: string): string {
    if (
      rawStatus === 'paid' ||
      rawStatus.includes('approved') ||
      rawStatus === 'compra_aprovada'
    ) {
      return 'Aprovado';
    }
    if (
      rawStatus === 'waiting_payment' ||
      rawStatus.includes('billet_created') ||
      rawStatus.includes('pix_created') ||
      rawStatus.includes('boleto')
    ) {
      if (paymentMethod === 'boleto') {
        return 'Boleto Impresso';
      }
      return 'Aguardando Pagamento';
    }
    if (
      rawStatus === 'refused' ||
      rawStatus.includes('declined') ||
      rawStatus.includes('recusad')
    ) {
      return 'Recusado';
    }
    if (
      rawStatus === 'refunded' ||
      rawStatus.includes('refund') ||
      rawStatus === 'reembolsado'
    ) {
      return 'Reembolsado';
    }
    if (
      rawStatus === 'chargedback' ||
      rawStatus.includes('disputed') ||
      rawStatus.includes('chargeback')
    ) {
      return 'Chargeback';
    }
    if (rawStatus.includes('canceled') || rawStatus.includes('cancelado')) {
      return 'Cancelado';
    }

    return rawStatus ? rawStatus.toUpperCase() : 'Processando';
  }
}
