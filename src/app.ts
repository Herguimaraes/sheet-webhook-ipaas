import express, { Express, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import webhookRoutes from './routes/webhookRoutes';

dotenv.config();

export function createApp(): Express {
  const app = express();

  // Middleware para parser de JSON e URL-encoded (suporta payloads maiores se necessário)
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Middleware de Log Simples de Requisições
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`[HTTP] ${req.method} ${req.url} - ${new Date().toISOString()}`);
    next();
  });

  // Arquivos estáticos da interface web
  const publicPath = path.join(__dirname, 'public');
  app.use(express.static(publicPath));

  // Rota raiz: serve a interface interativa ou JSON
  app.get('/', (req: Request, res: Response) => {
    if (req.accepts('html')) {
      res.sendFile(path.join(publicPath, 'index.html'));
    } else {
      res.status(200).json({
        message: 'Micro-iPaaS Webhook to Google Sheets API está online.',
        docs: '/api/health',
        serviceAccount: '/api/service-account',
        instructions:
          'Envie webhooks via POST /api/webhook/:plataforma/:sheetId/:tabName',
      });
    }
  });

  // Rotas da API
  app.use('/api', webhookRoutes);

  // Tratamento de rota não encontrada (404)
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: 'Not Found',
      message: `A rota ${req.method} ${req.originalUrl} não foi encontrada.`,
    });
  });

  // Tratamento global de erros
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[App Global Error]:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: err?.message || 'Ocorreu um erro interno no servidor.',
    });
  });

  return app;
}

export const app = createApp();
export default app;
