# 🚀 Micro-iPaaS de Webhooks para Google Sheets

Backend de alta performance e resiliência em **Node.js + TypeScript** que recebe webhooks de plataformas digitais de pagamento (**Hotmart**, **Hubla**, **Zouti** e **TMB Educação**) e insere as vendas de forma padronizada e estruturada em abas específicas do **Google Sheets**.

---

## ✨ Experiência Zero-Config para o Cliente Final

O cliente final **não precisa criar conta no Google Cloud, nem gerar credenciais ou API Keys**!
O fluxo para o usuário é 100% simplificado:

1. **Compartilhar:** O cliente abre a sua planilha do Google e compartilha com o e-mail do bot (exibido na tela) dando permissão de **Editor**.
2. **Colar o Link:** O cliente apenas cola o link completo da sua planilha (ex: `https://docs.google.com/spreadsheets/d/.../edit`). O sistema extrai o ID automaticamente!
3. **Criação Automática:** A aba e as colunas de cabeçalho (`Nome do Cliente`, `E-mail`, `Telefone`, etc.) são criadas **automaticamente** na primeira venda se não existirem!

---

## 🖥️ Interface Web Integrada

O sistema conta com uma interface gráfica acessível diretamente na raiz do servidor (`http://localhost:3000/`):
* **Cópia em 1 Clique:** Copie o e-mail do bot para compartilhar a planilha.
* **Validação em Tempo Real:** Botão para testar se a planilha foi compartilhada corretamente antes de ativar os webhooks.
* **Gerador de Webhooks:** Gera a URL pronta para colar na Hotmart, Hubla, Zouti ou TMB Educação.

---

## 🎯 Plataformas Suportadas

| Plataforma | Identificador na URL | Versão Suportada | Principais Eventos Mapeados |
| :--- | :--- | :--- | :--- |
| **Hotmart** | `hotmart` | Webhook 2.0 / 1.0 | `PURCHASE_APPROVED`, `PURCHASE_BILLET_PRINTED`, `PURCHASE_REFUNDED`, `PURCHASE_CANCELED` |
| **Hubla** | `hubla` | Webhook 2.0 | `invoice.paid`, `invoice.created`, `invoice.refunded`, `invoice.failed` |
| **Zouti** | `zouti` | Vendas / Pagamentos | `ORDER_PAID`, `BOLETO_CREATED`, `PIX_CREATED`, `SUBSCRIPTION_ACTIVATED` |
| **TMB Educação** | `tmb` | Vendas / Parcelamento | `Efetivado`, `Cancelado`, `Pendente` |
| **Kiwify** | `kiwify` | Webhook Oficial | `paid`, `waiting_payment`, `refunded`, `refused` |

---

## 📊 Estrutura Normalizada (`StandardizedSale`)

Todas as vendas são normalizadas para o seguinte contrato TypeScript:

```typescript
export interface StandardizedSale {
  customerName: string;    // Nome completo do cliente
  email: string;           // E-mail do cliente
  phone: string;           // Telefone com DDD
  productName: string;     // Nome do Produto ou Oferta
  value: number;           // Valor em reais (R$ float, ex: 197.00)
  status: string;          // Status (ex: 'Aprovado', 'Boleto Impresso', 'Recusado')
  transactionDate: string; // Data da transação em formato ISO
  platform?: string;       // Identificador da plataforma
  transactionId?: string;  // ID da transação na plataforma de origem
}
```

Linha correspondente inserida no Google Sheets (Colunas **A:G**):
```
[ Nome do Cliente | E-mail | Telefone | Nome do Produto | Valor (R$) | Status | Data da Transação ]
```

---

## 🛠️ Instalação e Configuração

### 1. Instalar Dependências
```bash
cd iPAAS
npm install
```

### 2. Configurar Variáveis de Ambiente no Servidor
Crie o arquivo `.env` na raiz do projeto copiando o exemplo:
```bash
cp .env.example .env
```

Preencha com a **Conta de Serviço Mestre** da sua aplicação:
```ini
PORT=3000
GOOGLE_CLIENT_EMAIL="seu-service-account@seu-projeto-gcp.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

---

## 🚦 Execução

### Modo Desenvolvimento
```bash
npm run dev
```

### Executar Testes Automatizados
```bash
npm test
```

### Build e Produção
```bash
npm run build
npm start
```

---

## 📡 Endpoints da API

### 1. Interface Web do Usuário
```http
GET /
```

### 2. Obter E-mail do Bot para Compartilhamento
```http
GET /api/service-account
```

### 3. Validar Acesso à Planilha
```http
POST /api/validate-sheet
Content-Type: application/json

{
  "sheetUrl": "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
}
```

### 4. Rota Principal de Webhook
```http
POST /api/webhook/:plataforma/:sheetId/:tabName
```
*(Nota: `:sheetId` aceita tanto o ID bruto quanto o Link completo da planilha codificado na URL)*

#### Parâmetros de Consulta Opcionais:
* `?sync=true`: Processa a escrita no Google Sheets de forma síncrona. Por padrão, a API opera de forma assíncrona para responder `200 OK` imediatamente.
