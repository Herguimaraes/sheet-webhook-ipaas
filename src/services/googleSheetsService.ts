import { getSheetsClient } from './googleAuthService';
import { StandardizedSale, saleToSheetRow, DEFAULT_SHEET_HEADERS } from '../types/sale';
import { extractSpreadsheetId } from '../utils/sheetUtils';

export interface AppendResult {
  success: boolean;
  spreadsheetId: string;
  tabName: string;
  updatedRange?: string | null;
  updatedRows?: number | null;
  tabCreated?: boolean;
  headersAdded?: boolean;
}

export interface SheetValidationResult {
  valid: boolean;
  spreadsheetId: string;
  title?: string;
  sheets?: string[];
  error?: string;
  instructions?: string;
  tabCreated?: boolean;
  headersAdded?: boolean;
}

export class GoogleSheetsService {
  /**
   * Valida se a Conta de Serviço possui permissão de leitura/edição na planilha especificada.
   * Opcionalmente pré-inicializa a aba e as 10 colunas de cabeçalho (A:J).
   *
   * @param sheetIdOrUrl ID da Planilha ou URL completa do Google Sheets
   * @param tabNameToInit Nome opcional da aba para criar/atualizar colunas de cabeçalho
   */
  async validateAccess(sheetIdOrUrl: string, tabNameToInit?: string): Promise<SheetValidationResult> {
    const spreadsheetId = extractSpreadsheetId(sheetIdOrUrl);
    if (!spreadsheetId) {
      return {
        valid: false,
        spreadsheetId: '',
        error: 'O ID ou Link da planilha não é válido.',
      };
    }

    try {
      const sheets = getSheetsClient();
      const metadata = await sheets.spreadsheets.get({
        spreadsheetId,
        fields: 'properties.title,sheets.properties.title',
      });

      const title = metadata.data.properties?.title || 'Planilha sem título';
      const sheetNames = (metadata.data.sheets || [])
        .map((s) => s.properties?.title || '')
        .filter(Boolean);

      let headersAdded = false;
      let tabCreated = false;
      if (tabNameToInit && typeof tabNameToInit === 'string') {
        const cleanTabName = tabNameToInit.trim();
        if (cleanTabName) {
          try {
            const initRes = await this.ensureTabAndHeaders(sheets, spreadsheetId, cleanTabName);
            headersAdded = initRes.headersAdded;
            tabCreated = initRes.tabCreated;
            if (tabCreated && !sheetNames.includes(cleanTabName)) {
              sheetNames.push(cleanTabName);
            }
          } catch (initErr) {
            console.warn('[GoogleSheetsService] Não foi possível pré-configurar aba na validação:', initErr);
          }
        }
      }

      return {
        valid: true,
        spreadsheetId,
        title,
        sheets: sheetNames,
        tabCreated,
        headersAdded,
      };
    } catch (error: any) {
      const status = error?.code || error?.status;
      if (status === 403 || status === 401) {
        return {
          valid: false,
          spreadsheetId,
          error: 'Permissão negada (403): O bot não tem acesso de Editor a esta planilha.',
          instructions:
            'Abra a planilha no Google Sheets, clique em "Compartilhar", cole o e-mail da Conta de Serviço e defina a permissão como "Editor".',
        };
      }
      if (status === 404) {
        return {
          valid: false,
          spreadsheetId,
          error: 'Planilha não encontrada (404). Verifique se o link ou ID está correto.',
        };
      }
      return {
        valid: false,
        spreadsheetId,
        error: error?.message || 'Falha ao conectar com o Google Sheets.',
      };
    }
  }

  /**
   * Garante que a aba (tabName) exista na planilha e que o cabeçalho padrão esteja preenchido.
   * Se a aba não existir, ela é criada automaticamente.
   * Se a primeira linha estiver vazia, o cabeçalho padrão é inserido automaticamente.
   */
  private async ensureTabAndHeaders(
    sheets: ReturnType<typeof getSheetsClient>,
    spreadsheetId: string,
    tabName: string
  ): Promise<{ tabCreated: boolean; headersAdded: boolean }> {
    let tabCreated = false;
    let headersAdded = false;

    // 1. Obter abas existentes
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets.properties.title',
    });

    const existingTabs = (metadata.data.sheets || []).map(
      (s) => s.properties?.title || ''
    );

    // 2. Se a aba não existir, cria a aba automaticamente
    if (!existingTabs.includes(tabName)) {
      console.log(
        `[GoogleSheetsService] Aba '${tabName}' não encontrada. Criando automaticamente na planilha ${spreadsheetId}...`
      );
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: tabName,
                },
              },
            },
          ],
        },
      });
      tabCreated = true;
    }

    // 3. Verifica se a linha 1 da aba já possui cabeçalhos
    const formattedTabName = this.formatTabRange(tabName);
    const headerRange = `${formattedTabName}!A1:Z1`;

    const headerCheck = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: headerRange,
    });

    if (!headerCheck.data.values || headerCheck.data.values.length === 0) {
      console.log(
        `[GoogleSheetsService] Aba '${tabName}' está sem cabeçalho. Inserindo colunas padrão automaticamente...`
      );
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${formattedTabName}!A1:J1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [DEFAULT_SHEET_HEADERS],
        },
      });
      headersAdded = true;
    } else {
      // Se a aba já possuía cabeçalhos, verifica se alguma das 10 colunas está ausente ou vazia
      const existingHeaders = headerCheck.data.values[0] || [];
      const missingUpdates: { colIndex: number; title: string }[] = [];

      for (let i = 0; i < DEFAULT_SHEET_HEADERS.length; i++) {
        const val = existingHeaders[i];
        if (val === undefined || val === null || String(val).trim() === '') {
          missingUpdates.push({ colIndex: i + 1, title: DEFAULT_SHEET_HEADERS[i] });
        }
      }

      if (missingUpdates.length > 0) {
        const firstMissing = missingUpdates[0].colIndex;
        const lastMissing = missingUpdates[missingUpdates.length - 1].colIndex;

        // Se as colunas faltantes forem contíguas (caso padrão: colunas 8 a 10 / H1:J1)
        if (lastMissing - firstMissing + 1 === missingUpdates.length) {
          const startColLetter = this.getColumnLetter(firstMissing);
          const endColLetter = this.getColumnLetter(lastMissing);
          const titles = missingUpdates.map((u) => u.title);
          console.log(
            `[GoogleSheetsService] Atualizando cabeçalho da aba '${tabName}' com novas colunas (${startColLetter}1:${endColLetter}1)...`
          );
          await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${formattedTabName}!${startColLetter}1:${endColLetter}1`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
              values: [titles],
            },
          });
        } else {
          // Atualiza individualmente as células vazias
          for (const item of missingUpdates) {
            const letter = this.getColumnLetter(item.colIndex);
            console.log(
              `[GoogleSheetsService] Preenchendo coluna de cabeçalho ${letter}1 na aba '${tabName}'...`
            );
            await sheets.spreadsheets.values.update({
              spreadsheetId,
              range: `${formattedTabName}!${letter}1`,
              valueInputOption: 'USER_ENTERED',
              requestBody: {
                values: [[item.title]],
              },
            });
          }
        }
        headersAdded = true;
      }
    }

    return { tabCreated, headersAdded };
  }

  /**
   * Adiciona uma nova linha com os dados da venda na planilha e aba especificadas.
   * Aceita tanto o sheetId bruto quanto o link completo do Google Sheets.
   *
   * @param sheetIdOrUrl ID da Planilha do Google ou Link completo da planilha
   * @param tabName Nome da Aba / Página da Planilha (ex: "Vendas", "Página1")
   * @param sale Objeto da venda normalizada
   */
  async appendSale(
    sheetIdOrUrl: string,
    tabName: string,
    sale: StandardizedSale
  ): Promise<AppendResult> {
    const spreadsheetId = extractSpreadsheetId(sheetIdOrUrl);

    if (!spreadsheetId || !tabName) {
      throw new Error(
        '[GoogleSheetsService] sheetId e tabName são parâmetros obrigatórios.'
      );
    }

    const sheets = getSheetsClient();

    // Garante que a aba e o cabeçalho existam automaticamente
    const { tabCreated, headersAdded } = await this.ensureTabAndHeaders(
      sheets,
      spreadsheetId,
      tabName
    );

    const rowValues = saleToSheetRow(sale);
    const formattedTabName = this.formatTabRange(tabName);
    const range = `${formattedTabName}!A:J`;

    try {
      const response = await sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [rowValues],
        },
      });

      return {
        success: true,
        spreadsheetId,
        tabName,
        updatedRange: response.data.updates?.updatedRange,
        updatedRows: response.data.updates?.updatedRows,
        tabCreated,
        headersAdded,
      };
    } catch (error: any) {
      console.error(
        `[GoogleSheetsService ERROR] Falha ao inserir linha na planilha ${spreadsheetId} (Aba: ${tabName}):`,
        {
          message: error?.message,
          code: error?.code,
          errors: error?.errors,
          saleCustomer: sale.customerName,
          saleProduct: sale.productName,
        }
      );
      throw error;
    }
  }

  private formatTabRange(tabName: string): string {
    return tabName.includes(' ') || tabName.includes('-')
      ? `'${tabName.replace(/'/g, "\\'")}'`
      : tabName;
  }

  private getColumnLetter(colIndex: number): string {
    let temp = colIndex;
    let letter = '';
    while (temp > 0) {
      const rem = (temp - 1) % 26;
      letter = String.fromCharCode(65 + rem) + letter;
      temp = Math.floor((temp - 1) / 26);
    }
    return letter;
  }
}

export const googleSheetsService = new GoogleSheetsService();
