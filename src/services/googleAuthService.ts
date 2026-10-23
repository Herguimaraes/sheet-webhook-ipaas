import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config();

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

let cachedJwtClient: JWT | null = null;

/**
 * Obtém ou inicializa o cliente de autenticação JWT da Conta de Serviço do Google.
 * As credenciais são lidas das variáveis de ambiente:
 * - GOOGLE_CLIENT_EMAIL: E-mail da Conta de Serviço (ex: xxxx@project-id.iam.gserviceaccount.com)
 * - GOOGLE_PRIVATE_KEY: Chave privada RSA (contendo -----BEGIN PRIVATE KEY-----)
 */
export function getGoogleAuthClient(): JWT {
  if (cachedJwtClient) {
    return cachedJwtClient;
  }

  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    throw new Error(
      '[GoogleAuth] Variáveis de ambiente GOOGLE_CLIENT_EMAIL e GOOGLE_PRIVATE_KEY são obrigatórias para autenticação com o Google Sheets.'
    );
  }

  // Tratamento essencial para quebras de linha em chaves RSA armazenadas em variáveis de ambiente
  privateKey = privateKey.replace(/\\n/g, '\n');

  cachedJwtClient = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: SCOPES,
  });

  return cachedJwtClient;
}

/**
 * Retorna uma instância autenticada da API Google Sheets v4.
 */
export function getSheetsClient() {
  const auth = getGoogleAuthClient();
  return google.sheets({ version: 'v4', auth });
}

/**
 * Retorna o e-mail da Conta de Serviço para exibição ao usuário final.
 */
export function getServiceAccountEmail(): string {
  return process.env.GOOGLE_CLIENT_EMAIL || '';
}
