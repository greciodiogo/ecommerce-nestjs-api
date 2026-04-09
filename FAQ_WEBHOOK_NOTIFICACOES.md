# FAQ - Sistema de Webhook de Notificações

## Perguntas Gerais

### 1. O que é um webhook?

Um webhook é uma forma de comunicação entre sistemas onde uma aplicação envia uma requisição HTTP para outra quando um evento específico ocorre. No nosso caso, a API AdonisJS envia uma requisição HTTP para a API NestJS quando um novo pedido é criado.

### 2. Por que usar webhook em vez de outras soluções?

**Vantagens:**
- ✅ Simples de implementar
- ✅ Não requer infraestrutura adicional
- ✅ Baixa latência
- ✅ Fácil de debugar
- ✅ Custo zero

**Alternativas consideradas:**
- **Polling**: Dashboard consultaria API periodicamente (ineficiente)
- **Database compartilhado**: Acoplamento alto entre sistemas
- **Message Queue**: Complexidade adicional desnecessária neste momento

### 3. O webhook é seguro?

Sim, com as seguintes medidas:
- ✅ HTTPS obrigatório em produção
- ✅ Validação de payload (DTO)
- ✅ Timeout configurável
- ✅ Logs de auditoria

**Recomendações futuras:**
- Adicionar autenticação (Bearer token)
- Implementar rate limiting
- Validar IP de origem

## Perguntas Técnicas

### 4. O que acontece se o webhook falhar?

O webhook é executado de forma assíncrona e não bloqueia a criação do pedido. Se falhar:
- ✅ Pedido é criado normalmente
- ✅ Erro é logado para análise
- ✅ Notificação Firebase ainda é enviada (mobile)
- ❌ Dashboard não recebe notificação em tempo real

**Solução:** Administrador pode atualizar a página ou verificar lista de pedidos.

### 5. Qual é o tempo de resposta esperado?

**Meta:** < 1 segundo

**Componentes:**
- Envio do webhook: ~100-300ms
- Processamento na API NestJS: ~50-100ms
- Emissão via Socket.io: ~10-50ms
- **Total:** ~200-500ms

### 6. O webhook pode causar duplicação de notificações?

Não. Cada pedido gera apenas um webhook. O sistema não implementa retry automático, então não há risco de duplicação.

### 7. Como funciona o timeout?

O timeout está configurado para 5 segundos (padrão). Se a API NestJS não responder em 5 segundos:
- Requisição é cancelada
- Erro é logado
- Pedido continua criado normalmente

**Configuração:**
```env
WEBHOOK_TIMEOUT=5000  # 5 segundos
```

### 8. O webhook suporta retry automático?

Não, por design. Retry automático pode causar:
- Duplicação de notificações
- Sobrecarga da API
- Complexidade adicional

**Se necessário no futuro:** Implementar com queue system (Redis/Bull).

## Perguntas de Deploy

### 9. Preciso reiniciar as aplicações após o deploy?

**encontrarCore:** Sim, o deploy reinicia automaticamente.

**API NestJS:** Sim, o deploy reinicia automaticamente.

**Dashboard Angular:** Não, apenas refresh da página.

### 10. Posso fazer rollback se algo der errado?

Sim, facilmente:

**Opção 1 - Git revert:**
```bash
git revert HEAD
git push
```

**Opção 2 - Desabilitar webhook:**
```env
WEBHOOK_NOTIFICATIONS_ENABLED=false
```

### 11. Como testar antes de fazer deploy em produção?

**Teste local:**
```bash
# 1. Configurar .env local
NESTJS_API_URL=http://localhost:3000

# 2. Rodar ambas as APIs localmente

# 3. Testar webhook
node test-webhook-notification.js

# 4. Criar pedido de teste
```

**Teste em staging:**
- Deploy em ambiente de staging primeiro
- Testar com pedidos reais
- Verificar logs
- Só então fazer deploy em produção

### 12. Quanto tempo leva o deploy?

**Tempo estimado:**
- encontrarCore: ~5 minutos
- API NestJS: ~5 minutos
- Testes: ~5 minutos
- **Total: ~15 minutos**

## Perguntas de Monitoramento

### 13. Como verificar se o webhook está funcionando?

**Método 1 - Logs:**
```bash
# encontrarCore
grep "webhook" logs/adonis.log

# API NestJS
# Verificar Railway/Heroku logs
```

**Método 2 - Teste manual:**
```bash
node test-webhook-notification.js
```

**Método 3 - Criar pedido real:**
- Criar pedido via app
- Verificar se notificação aparece no dashboard

### 14. Quais métricas devo monitorar?

**Essenciais:**
1. Taxa de sucesso do webhook (meta: >99%)
2. Tempo de resposta (meta: <1s)
3. Número de erros por dia

**Opcionais:**
1. Número de webhooks enviados por hora
2. Distribuição de tempo de resposta
3. Taxa de timeout

### 15. Como sei se há um problema?

**Sinais de alerta:**
- ❌ Logs mostram muitos erros de webhook
- ❌ Tempo de resposta > 3 segundos
- ❌ Dashboard não recebe notificações
- ❌ Taxa de sucesso < 95%

**Ação:**
1. Verificar logs de ambas as APIs
2. Testar webhook manualmente
3. Verificar conectividade de rede
4. Verificar se APIs estão rodando

## Perguntas de Troubleshooting

### 16. Webhook retorna erro 404

**Causa:** Endpoint não encontrado

**Soluções:**
1. Verificar se API NestJS foi deployada
2. Verificar se `WebhooksModule` está registrado
3. Verificar URL no .env: `NESTJS_API_URL`
4. Testar endpoint manualmente com curl

### 17. Webhook retorna timeout

**Causa:** API NestJS não responde a tempo

**Soluções:**
1. Aumentar timeout: `WEBHOOK_TIMEOUT=10000`
2. Verificar se API NestJS está sobrecarregada
3. Verificar latência de rede
4. Verificar logs da API NestJS

### 18. Notificações não aparecem no dashboard

**Possíveis causas:**
1. Webhook não está sendo enviado
2. API NestJS não está processando
3. Socket.io não está conectado
4. Usuário não tem permissão (não é admin/manager)

**Diagnóstico:**
```bash
# 1. Verificar logs do encontrarCore
grep "webhook" logs/adonis.log

# 2. Verificar logs da API NestJS
# Procurar por "Webhook received"

# 3. Verificar console do navegador (F12)
# Procurar por "Socket.IO connected"

# 4. Verificar role do usuário
# Deve ser admin ou manager
```

### 19. Como debugar problemas de webhook?

**Passo a passo:**

1. **Verificar se webhook está habilitado:**
```env
WEBHOOK_NOTIFICATIONS_ENABLED=true
```

2. **Testar webhook manualmente:**
```bash
node test-webhook-notification.js
```

3. **Verificar logs do encontrarCore:**
```bash
# Procurar por:
✅ Webhook sent successfully
# ou
❌ Error sending webhook notification
```

4. **Verificar logs da API NestJS:**
```bash
# Procurar por:
📥 Webhook received from: encontrarCore
```

5. **Verificar Socket.io no dashboard:**
```javascript
// Console do navegador (F12)
// Deve mostrar:
✅ Socket.IO connected successfully!
```

### 20. Webhook funciona localmente mas não em produção

**Possíveis causas:**
1. URL incorreta no .env de produção
2. Firewall bloqueando requisições
3. HTTPS não configurado
4. Variáveis de ambiente não configuradas

**Soluções:**
1. Verificar `NESTJS_API_URL` em produção
2. Testar conectividade: `curl https://api.encontrarshopping.com/api/webhooks/order-notification`
3. Verificar logs de ambas as APIs
4. Verificar configurações de rede/firewall

## Perguntas de Performance

### 21. O webhook afeta a performance da criação de pedidos?

Não. O webhook é executado de forma assíncrona (não bloqueia). A criação do pedido retorna imediatamente, e o webhook é enviado em background.

**Tempo adicional:** 0ms (não bloqueia)

### 22. Quantos webhooks o sistema suporta por segundo?

**Limitações:**
- encontrarCore: Limitado pela capacidade da API
- API NestJS: Limitado pela capacidade da API
- Rede: Limitado pela latência

**Estimativa conservadora:** 100-500 webhooks/segundo

**Nota:** Para volumes maiores, considerar queue system.

### 23. O webhook pode causar sobrecarga na API NestJS?

Não, se configurado corretamente. O endpoint de webhook é leve e processa rapidamente.

**Proteções:**
- Timeout configurável
- Processamento assíncrono
- Validação rápida de payload

**Se necessário:** Implementar rate limiting.

## Perguntas de Evolução

### 24. Como adicionar autenticação ao webhook?

**Implementação:**

1. **encontrarCore:**
```javascript
// .env
WEBHOOK_API_KEY=seu-token-secreto

// WebhookNotificationService.js
headers: {
  'Authorization': `Bearer ${Env.get('WEBHOOK_API_KEY')}`
}
```

2. **API NestJS:**
```typescript
// webhooks.controller.ts
@Post('order-notification')
async receiveOrderNotification(
  @Headers('authorization') auth: string,
  @Body() data: OrderNotificationDto,
) {
  const token = auth?.replace('Bearer ', '')
  
  if (token !== process.env.WEBHOOK_API_KEY) {
    throw new UnauthorizedException('Invalid webhook token')
  }
  
  // Processar webhook...
}
```

### 25. Como implementar retry automático?

**Opção 1 - Retry simples:**
```javascript
// Ver EXEMPLOS_USO_WEBHOOK.md
// Seção: "Exemplo: Retry Manual"
```

**Opção 2 - Queue system:**
```javascript
// Usar Redis + Bull
// Ver EXEMPLOS_USO_WEBHOOK.md
// Seção: "Exemplo: Fallback para Queue"
```

### 26. Como adicionar mais tipos de notificações?

**Passo a passo:**

1. **Adicionar método no WebhookNotificationService:**
```javascript
async notifyOrderCancelled(order) {
  const payload = {
    type: 'order_cancelled',
    title: 'Pedido Cancelado',
    message: `Pedido #${order.id} foi cancelado`,
    orderId: order.id,
    // ...
  }
  
  await this.sendWebhook(payload)
}
```

2. **Usar no código:**
```javascript
const webhookService = new WebhookNotificationService()
await webhookService.notifyOrderCancelled(order)
```

3. **API NestJS já suporta** (processa qualquer tipo)

### 27. Como migrar para um sistema de mensageria (RabbitMQ/Kafka)?

**Quando considerar:**
- Volume > 1000 pedidos/hora
- Necessidade de retry automático
- Múltiplos consumidores
- Histórico de eventos

**Migração:**
1. Manter webhook funcionando
2. Adicionar publicação em queue
3. Criar consumer na API NestJS
4. Testar em paralelo
5. Desabilitar webhook quando estável

## Perguntas de Custo

### 28. Qual o custo adicional desta solução?

**Infraestrutura:** R$ 0,00
- Usa infraestrutura existente
- Apenas requisições HTTP adicionais (mínimas)

**Desenvolvimento:** ~4 horas
- Análise e implementação
- Documentação
- Testes

### 29. O webhook aumenta o uso de recursos?

**Impacto mínimo:**
- CPU: +0.1% (requisições HTTP leves)
- Memória: +0 MB (sem cache adicional)
- Rede: +1-2 KB por pedido
- Banco de dados: +0 queries (webhook não acessa BD)

## Suporte

### 30. Onde encontro mais informações?

**Documentação:**
- `WEBHOOK_NOTIFICATIONS_SETUP.md` - Guia completo
- `ARQUITETURA_NOTIFICACOES.md` - Arquitetura
- `CHECKLIST_DEPLOY_NOTIFICACOES.md` - Deploy
- `EXEMPLOS_USO_WEBHOOK.md` - Exemplos
- `RESUMO_EXECUTIVO.md` - Visão geral

**Testes:**
- `test-webhook-notification.js` - Script de teste

**Logs:**
- encontrarCore: Logs da plataforma de deploy
- API NestJS: Logs da plataforma de deploy
- Dashboard: Console do navegador (F12)
