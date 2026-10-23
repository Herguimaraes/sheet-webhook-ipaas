import { Router, Request, Response } from 'express';
import { webhookController } from '../controllers/webhookController';
import { getSupportedPlatforms } from '../parsers';

const router = Router();

/**
 * Health check e informações do serviço
 * GET /api/health
 */
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'iPaaS Webhook to Google Sheets',
    supportedPlatforms: getSupportedPlatforms(),
    endpointPattern: 'POST /api/webhook/:plataforma/:sheetId/:tabName',
  });
});

/**
 * Retorna as instruções e e-mail da Conta de Serviço para o cliente compartilhar a planilha
 * GET /api/service-account
 */
router.get('/service-account', (req: Request, res: Response) => {
  webhookController.getServiceAccountInfo(req, res);
});

/**
 * Validação prévia de permissão de acesso à planilha do Google
 * POST /api/validate-sheet
 */
router.post('/validate-sheet', (req: Request, res: Response) => {
  webhookController.validateSheet(req, res);
});

/**
 * Endpoint de entrada dinâmico para webhooks:
 * POST /api/webhook/:plataforma/:sheetId/:tabName
 *
 * Exemplos:
 * POST /api/webhook/hotmart/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/Vendas
 * POST /api/webhook/hubla/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/Vendas
 * POST /api/webhook/zouti/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/Vendas
 * POST /api/webhook/tmb/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/Vendas
 */
router.post(
  '/webhook/:plataforma/:sheetId/:tabName',
  (req: Request, res: Response) => {
    webhookController.handleWebhook(req, res);
  }
);

/**
 * Suporte a rota com tabName default ou passado por query param
 * POST /api/webhook/:plataforma/:sheetId
 */
router.post(
  '/webhook/:plataforma/:sheetId',
  (req: Request, res: Response) => {
    webhookController.handleWebhook(req, res);
  }
);

export default router;
