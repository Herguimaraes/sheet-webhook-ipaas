import { StandardizedSale } from '../types/sale';

/**
 * Contrato base para todos os parsers de plataformas de pagamento.
 */
export interface WebhookParser {
  /** Nome identificador da plataforma */
  readonly platformName: string;

  /**
   * Verifica se o identificador recebido na URL corresponde a este parser.
   * @param platform Nome da plataforma em caixa baixa (ex: "hotmart", "hubla", "zouti", "tmb")
   */
  canHandle(platform: string): boolean;

  /**
   * Traduz e normaliza o payload bruto do webhook para o formato StandardizedSale.
   * @param payload Objeto JSON enviado no corpo da requisição POST
   * @param headers Cabeçalhos HTTP da requisição (opcional, para validação ou leitura de metadados)
   */
  parse(payload: any, headers?: Record<string, any>): StandardizedSale;
}
