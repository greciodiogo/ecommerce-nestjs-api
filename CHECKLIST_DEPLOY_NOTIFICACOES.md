# Checklist de Deploy - Sistema de Notificações via Webhook

## ✅ Pré-Deploy

### Verificações Locais

- [ ] Todos os arquivos criados estão commitados
- [ ] Não há erros de sintaxe (verificado com getDiagnostics)
- [ ] Variáveis de ambiente documentadas no .env.example
- [ ] Documentação criada e revisada

### Testes Locais (Opcional)

- [ ] Testar webhook localmente com `node test-webhook-notification.js`
- [ ] Verificar logs no console
- [ ] Confirmar que não há erros de conexão

## 📦 Deploy - encontrarCore (API AdonisJS)

### 1. Preparar Código

```bash
cd encontrarCore
git status
git add .
git commit -m "feat: add webhook notifications to NestJS API for real-time dashboard updates"
```

### 2. Configurar Variáveis de Ambiente

**Produção (Railway/Heroku/etc):**

Adicionar as seguintes variáveis no painel de controle:

```env
NESTJS_API_URL=https://api.encontrarshopping.com
WEBHOOK_NOTIFICATIONS_ENABLED=true
WEBHOOK_TIMEOUT=5000
```

**Como adicionar:**
- Railway: Settings → Variables → Add Variable
- Heroku: Settings → Config Vars → Reveal Config Vars
- Vercel: Settings → Environment Variables

### 3. Deploy

```bash
git push origin main
# ou
git push heroku main
# ou conforme seu processo de deploy
```

### 4. Verificar Deploy

- [ ] Build concluído com sucesso
- [ ] Aplicação iniciou sem erros
- [ ] Logs não mostram erros de importação
- [ ] Endpoint `/api/orders` ainda funciona

### 5. Verificar Logs

```bash
# Railway
railway logs

# Heroku
heroku logs --tail

# Ou acessar o painel de logs da sua plataforma
```

**Procurar por:**
- ✅ Sem erros de módulo não encontrado
- ✅ Sem erros de sintaxe
- ✅ Aplicação rodando normalmente

## 📦 Deploy - API NestJS

### 1. Preparar Código

```bash
cd ecommerce-platform-nestjs-api-master
git status
git add .
git commit -m "feat: add webhook endpoint to receive order notifications from encontrarCore"
```

### 2. Deploy

```bash
git push origin main
# ou conforme seu processo de deploy
```

### 3. Verificar Deploy

- [ ] Build concluído com sucesso
- [ ] Aplicação iniciou sem erros
- [ ] Endpoint `/api/webhooks/order-notification` está acessível
- [ ] Socket.io ainda funciona

### 4. Testar Endpoint Webhook

```bash
curl -X POST https://api.encontrarshopping.com/api/webhooks/order-notification \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Source: test" \
  -d '{
    "type": "new_order",
    "title": "Teste",
    "message": "Teste de webhook",
    "orderId": 999,
    "orderNumber": "TEST-001",
    "orderStatus": "PENDING",
    "source": "test"
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Notification received and broadcasted successfully"
}
```

### 5. Verificar Logs

```bash
# Railway
railway logs

# Procurar por:
# 📥 Webhook received from: test
# ✅ Notification broadcasted to admins/managers
```

## 🧪 Testes Pós-Deploy

### Teste 1: Webhook Manual

```bash
cd encontrarCore
NESTJS_API_URL=https://api.encontrarshopping.com node test-webhook-notification.js
```

**Resultado esperado:**
```
✅ Webhook enviado com sucesso!
⏱️  Tempo de resposta: XXXms
📊 Status: 200
```

### Teste 2: Pedido Real

1. **Abrir Dashboard Angular**
   - URL: https://admin.encontrarshopping.com
   - Login como admin ou manager

2. **Verificar Conexão Socket.io**
   - Abrir DevTools (F12)
   - Console deve mostrar: `✅ Socket.IO connected successfully!`

3. **Criar Pedido via App**
   - Usar app mobile ou web
   - Criar um pedido de teste

4. **Verificar Notificação no Dashboard**
   - [ ] Notificação aparece em tempo real
   - [ ] Som de alerta toca
   - [ ] Badge de contador atualiza
   - [ ] Detalhes do pedido estão corretos

### Teste 3: Verificar Logs

**encontrarCore:**
```bash
# Procurar por:
✅ Webhook sent successfully for order #XXXXX
```

**API NestJS:**
```bash
# Procurar por:
📥 Webhook received from: encontrarCore
📦 Order notification: { type: 'new_order', orderId: XXXXX, ... }
✅ Notification broadcasted to admins/managers for order #XXXXX
✅ Notifications saved to database for admins/managers
```

**Dashboard Angular (Console F12):**
```bash
# Procurar por:
🔔 New notification received: { ... }
```

## 🔍 Monitoramento Pós-Deploy

### Primeiras 24 Horas

- [ ] Verificar logs a cada 2 horas
- [ ] Monitorar taxa de erro do webhook
- [ ] Verificar tempo de resposta do webhook
- [ ] Confirmar que notificações chegam ao dashboard

### Métricas a Monitorar

1. **Taxa de Sucesso do Webhook**
   - Meta: > 99%
   - Como verificar: Contar logs de sucesso vs erro

2. **Tempo de Resposta**
   - Meta: < 1 segundo
   - Como verificar: Logs mostram tempo de resposta

3. **Notificações Entregues**
   - Meta: 100% dos pedidos geram notificação
   - Como verificar: Comparar número de pedidos vs notificações

## ⚠️ Rollback (Se Necessário)

### Se encontrarCore apresentar problemas:

```bash
cd encontrarCore
git revert HEAD
git push origin main
```

**Ou desabilitar webhook:**
```env
WEBHOOK_NOTIFICATIONS_ENABLED=false
```

### Se API NestJS apresentar problemas:

```bash
cd ecommerce-platform-nestjs-api-master
git revert HEAD
git push origin main
```

## 🐛 Troubleshooting Comum

### Problema: "Module not found: WebhookNotificationService"

**Causa:** Arquivo não foi commitado ou deploy não incluiu o arquivo

**Solução:**
```bash
cd encontrarCore
git add app/Services/WebhookNotificationService.js
git commit -m "fix: add missing WebhookNotificationService"
git push
```

### Problema: "Cannot POST /api/webhooks/order-notification"

**Causa:** Endpoint não está registrado ou módulo não foi importado

**Solução:**
1. Verificar se `WebhooksModule` está em `app.module.ts`
2. Verificar se o build foi concluído
3. Reiniciar a aplicação

### Problema: Webhook timeout

**Causa:** API NestJS lenta ou não acessível

**Solução:**
1. Verificar se API NestJS está rodando
2. Aumentar `WEBHOOK_TIMEOUT` para 10000 (10s)
3. Verificar latência de rede

### Problema: Notificações não aparecem no dashboard

**Causa:** Socket.io não conectado ou usuário sem permissão

**Solução:**
1. Verificar console do navegador (F12)
2. Confirmar que usuário é admin/manager
3. Verificar se Socket.io está conectado
4. Tentar reconectar (refresh da página)

## ✅ Checklist Final

### encontrarCore
- [ ] Deploy concluído
- [ ] Variáveis de ambiente configuradas
- [ ] Logs sem erros
- [ ] Webhook enviando com sucesso

### API NestJS
- [ ] Deploy concluído
- [ ] Endpoint webhook acessível
- [ ] Logs mostrando recebimento de webhooks
- [ ] Socket.io funcionando

### Dashboard Angular
- [ ] Conectado ao Socket.io
- [ ] Recebendo notificações em tempo real
- [ ] Som de alerta funcionando
- [ ] Badge de contador atualizando

### Testes
- [ ] Webhook manual testado
- [ ] Pedido real testado
- [ ] Notificação apareceu no dashboard
- [ ] Logs verificados em todas as aplicações

## 📞 Suporte

Se encontrar problemas:

1. **Verificar Logs:**
   - encontrarCore: Logs da plataforma de deploy
   - API NestJS: Logs da plataforma de deploy
   - Dashboard: Console do navegador (F12)

2. **Documentação:**
   - `WEBHOOK_NOTIFICATIONS_SETUP.md` - Documentação completa
   - `ARQUITETURA_NOTIFICACOES.md` - Arquitetura do sistema
   - `SOLUCAO_NOTIFICACOES_WEBHOOK.md` - Resumo da solução

3. **Teste Manual:**
   ```bash
   node test-webhook-notification.js
   ```

## 🎉 Deploy Concluído!

Parabéns! O sistema de notificações via webhook está funcionando.

Agora o dashboard Angular receberá notificações em tempo real de todos os pedidos, independentemente de virem da API NestJS ou da API AdonisJS (encontrarCore).
