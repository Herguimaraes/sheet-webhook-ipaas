import { WebhookParser } from './baseParser';
import { HotmartParser } from './hotmartParser';
import { HublaParser } from './hublaParser';
import { ZoutiParser } from './zoutiParser';
import { TmbParser } from './tmbParser';
import { KiwifyParser } from './kiwifyParser';

export * from './baseParser';
export * from './hotmartParser';
export * from './hublaParser';
export * from './zoutiParser';
export * from './tmbParser';
export * from './kiwifyParser';

/** Lista de todos os parsers instanciados no sistema */
const parsers: WebhookParser[] = [
  new HotmartParser(),
  new HublaParser(),
  new ZoutiParser(),
  new TmbParser(),
  new KiwifyParser(),
];

/**
 * Localiza o parser adequado com base no identificador da plataforma informado na rota.
 * @param platform Nome da plataforma (ex: 'hotmart', 'hubla', 'zouti', 'tmb', 'kiwify')
 */
export function getParser(platform: string): WebhookParser | null {
  if (!platform) return null;
  const match = parsers.find((p) => p.canHandle(platform));
  return match || null;
}

/**
 * Retorna os nomes das plataformas suportadas atualmente.
 */
export function getSupportedPlatforms(): string[] {
  return parsers.map((p) => p.platformName);
}
