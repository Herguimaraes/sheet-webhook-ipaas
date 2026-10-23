/**
 * Utilitários para manipulação de URLs e IDs do Google Sheets.
 */

/**
 * Extrai o ID da planilha do Google a partir de uma URL completa ou retorna o próprio ID limpo.
 *
 * Exemplos aceitos:
 * - https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0
 * - https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing
 * - 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
 */
export function extractSpreadsheetId(input: string): string {
  if (!input) return '';

  const trimmed = decodeURIComponent(input.trim());

  // Regex para capturar o ID entre /spreadsheets/d/ e a próxima barra
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }

  // Se não for URL completa, remove eventuais parâmetros de query/hash que tenham vindo no ID
  return trimmed.split(/[/?#]/)[0].trim();
}
