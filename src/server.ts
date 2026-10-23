import app from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Micro-iPaaS Backend iniciado com sucesso!`);
  console.log(`📡 Servidor escutando na porta: ${PORT}`);
  console.log(`🔗 Endpoint Base: http://localhost:${PORT}/api`);
  console.log(`🩺 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📥 Rota de Webhook:`);
  console.log(`   POST http://localhost:${PORT}/api/webhook/:plataforma/:sheetId/:tabName`);
  console.log(`=======================================================`);
});
