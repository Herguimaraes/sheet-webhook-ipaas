import { Request, Response } from 'express';
import { getParser, getSupportedPlatforms } from '../parsers';
import { googleSheetsService } from '../services/googleSheetsService';
import { extractSpreadsheetId } from '../utils/sheetUtils';
import { getServiceAccountEmail } from '../services/googleAuthService';

export class WebhookController {
  /**
   * Retorna as informações da Conta de Serviço do sistema para o cliente compartilhar a planilha.
   * GET /api/service-account
   */
  async getServiceAccountInfo(_req: Request, res: Response): Promise<void> {
    const email = getServiceAccountEmail();
    res.status(200).json({
      serviceAccountEmail: email || 'Não configurado no .env',
      instructions: [
        '1. Abra a sua Planilha no Google Planilhas (Google Sheets).',
        '2. Clique no botão "Compartilhar" (no canto superior direito).',
        `3. Adicione o e-mail: ${email || 'SEU_BOT@PROJETO.iam.gserviceaccount.com'}`,
        '4. Conceda a permissão de "Editor" para que o sistema possa inserir as vendas.',
        '5. Desmarque "Notificar pessoas" e clique em "Salvar" ou "Compartilhar".',
        '6. Copie o Link da sua planilha e cole no nosso gerador de Webhooks.',
      ],
    });
  }

  /**
   * Valida se a planilha informada pelo cliente está compartilhada com permissão de Editor.
   * POST /api/validate-sheet
   * Body: { sheetUrl: "https://docs.google.com/spreadsheets/d/.../edit" }
   */
  async validateSheet(req: Request, res: Response): Promise<void> {
    const sheetInput = req.body?.sheetUrl || req.body?.sheetId || req.query?.sheetUrl || req.query?.sheetId;

    if (!sheetInput || typeof sheetInput !== 'string') {
      res.status(400).json({
        valid: false,
        error: 'Informe o campo "sheetUrl" ou "sheetId" no corpo da requisição.',
      });
      return;
    }

    const result = await googleSheetsService.validateAccess(sheetInput);
    if (!result.valid) {
      res.status(400).json(result);
      return;
    }

    res.status(200).json(result);
  }

  /**
   * Manipulador para a rota dinâmica:
   * POST /api/webhook/:plataforma/:sheetId/:tabName
   */
  async handleWebhook(req: Request, res: Response): Promise<void> {
    const plataformaParam = Array.isArray(req.params.plataforma)
      ? req.params.plataforma[0]
      : req.params.plataforma;
    const sheetIdParam = Array.isArray(req.params.sheetId)
      ? req.params.sheetId[0]
      : req.params.sheetId;
    const tabNameParam = Array.isArray(req.params.tabName)
      ? req.params.tabName[0]
      : req.params.tabName;

    // Permite que o sheetId venha também como query param ?sheetUrl=... ou default tabName
    const rawSheet = (req.query.sheetUrl as string) || sheetIdParam;
    const sheetId = extractSpreadsheetId(rawSheet);
    const tabName = tabNameParam || (req.query.tabName as string) || 'Vendas';
    const plataforma = plataformaParam;

    const isSync = req.query.sync === 'true';

    // 1. Validação de parâmetros da rota
    if (!plataforma || !sheetId || !tabName) {
      res.status(400).json({
        error: 'Bad Request',
        message:
          'Os parâmetros :plataforma, :sheetId (ou Link da Planilha) e :tabName são obrigatórios.',
        routeExample: '/api/webhook/hotmart/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/Vendas',
      });
      return;
    }

    // 2. Localização do Parser para a plataforma especificada
    const parser = getParser(plataforma);
    if (!parser) {
      res.status(400).json({
        error: 'Unsupported Platform',
        message: `A plataforma '${plataforma}' não é suportada.`,
        supportedPlatforms: getSupportedPlatforms(),
      });
      return;
    }

    // 3. Validação do corpo da requisição
    const payload = req.body;
    if (!payload || (typeof payload === 'object' && Object.keys(payload).length === 0)) {
      res.status(400).json({
        error: 'Empty Payload',
        message: 'O corpo (body) da requisição JSON não pode estar vazio.',
      });
      return;
    }

    // 4. Execução do Parser e Normalização para StandardizedSale
    let standardizedSale;
    try {
      standardizedSale = parser.parse(payload, req.headers as Record<string, any>);
    } catch (parseError: any) {
      console.error(
        `[WebhookController] Erro ao fazer parsing do webhook [${plataforma}]:`,
        {
          error: parseError.message,
          payloadSample: JSON.stringify(payload).slice(0, 300),
        }
      );

      res.status(422).json({
        error: 'Unprocessable Entity',
        message: `Falha ao interpretar o payload da plataforma '${plataforma}'.`,
        details: parseError.message,
      });
      return;
    }

    console.log(
      `[WebhookController] Webhook recebido com sucesso da plataforma [${parser.platformName}]:`,
      {
        cliente: standardizedSale.customerName,
        produto: standardizedSale.productName,
        valor: standardizedSale.value,
        status: standardizedSale.status,
        data: standardizedSale.transactionDate,
        destino: `Sheet: ${sheetId} | Aba: ${tabName}`,
      }
    );

    // 5. Modo Síncrono (útil para testes manuais e validações imediatas)
    if (isSync) {
      try {
        const result = await googleSheetsService.appendSale(
          sheetId,
          tabName,
          standardizedSale
        );
        res.status(200).json({
          status: 'success',
          mode: 'synchronous',
          message: 'Linha inserida no Google Sheets com sucesso.',
          data: standardizedSale,
          sheetsResult: result,
        });
      } catch (sheetsError: any) {
        res.status(502).json({
          error: 'Google Sheets Integration Error',
          message:
            'A venda foi parseada, mas a gravação no Google Sheets falhou.',
          details: sheetsError?.message || sheetsError,
          parsedSale: standardizedSale,
        });
      }
      return;
    }

    // 6. Modo Padrão / Assíncrono (Resiliência para Webhooks em Produção)
    // Retorna 200 OK imediatamente para a plataforma de pagamento evitar timeouts
    res.status(200).json({
      status: 'acknowledged',
      message: 'Webhook recebido com sucesso e processamento iniciado.',
      platform: parser.platformName,
      sale: {
        customerName: standardizedSale.customerName,
        productName: standardizedSale.productName,
        value: standardizedSale.value,
        status: standardizedSale.status,
        transactionDate: standardizedSale.transactionDate,
      },
    });

    // Processamento da gravação em segundo plano (não bloqueia a resposta HTTP)
    setImmediate(async () => {
      try {
        await googleSheetsService.appendSale(sheetId, tabName, standardizedSale);
        console.log(
          `[Background Worker] Inserção concluída no Google Sheets para ${standardizedSale.customerName} (${sheetId}/${tabName})`
        );
      } catch (err: any) {
        console.error(
          `[Background Worker ERROR] Falha ao gravar no Google Sheets em segundo plano:`,
          {
            platform: parser.platformName,
            sheetId,
            tabName,
            customer: standardizedSale.customerName,
            error: err.message,
            stack: err.stack,
          }
        );
      }
    });
  }
}

export const webhookController = new WebhookController();
