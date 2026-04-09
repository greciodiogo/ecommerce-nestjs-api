# Solução: Notificações do Dashboard via Webhook

## Problema

O dashboard Angular não recebia notificações em tempo real quando pedidos eram criados nos apps mobile/web, pois:
- Dashboard conecta à API NestJS (`api.encontrarshopping.com`)
- Apps mobile/web fazem pedidos na API AdonisJS (`encontrarCore`)
- As duas APIs não se comunicavam

## Solução Implementada

Sistema de webhook HTTP onde a API AdonisJS notifica a API NestJS quando um pedido é criado.

### Fluxo

```
App Mobile/Web → API AdonisJS → Webhook HTTP → API NestJS → Socket.io → Dashboard Angular
```

## Arquivos Criados

### encontrarCore (AdonisJS)
- ✅ `app/Services/WebhookNotificationService.js` - Envia webhooks
- ✅ `app/Modules/Sales/Services/OrderService.js` - Modificado para enviar webhook
- ✅ `test-webhook-notification.js` - Script de teste
- ✅ `WEBHOOK_NOTIFICATIONS_SETUP.md` - Documentação completa

### ecommerce-platform-nestjs-api-master (NestJS)
- ✅ `src/webhooks/webhooks.module.ts`
- ✅ `src/webhooks/webhooks.controller.ts`
- ✅ `src/webhooks/webhooks.service.ts`
- ✅ `src/webhooks/dto/order-notification.dto.ts`
- ✅ `src/app.module.ts` - Registrado WebhooksModule
- ✅ `src/notifications/notification.module.ts` - Exportado NotificationsGateway

## Configuração Necessária

### 1. Adicionar ao `.env` do encontrarCore:

```env
NESTJS_API_URL=https://api.encontrarshopping.com
WEBHOOK_NOTIFICATIONS_ENABLED=true
WEBHOOK_TIMEOUT=5000
```

### 2. Deploy das Alterações

#### encontrarCore:
```bash
cd encontrarCore
git add .
git commit -m "feat: add webhook notifications to NestJS API"
git push
```

#### API NestJS:
```bash
cd ecommerce-platform-nestjs-api-master
git add .
git commit -m "feat: add webhook endpoint for order notifications"
git push
```

## Testar

### 1. Testar Webhook Manualmente

```bash
cd encontrarCore
node test-webhook-notification.js
```

### 2. Testar com Pedido Real

1. Abra o dashboard Angular
2. Faça login como admin/manager
3. Crie um pedido via app mobile ou web
4. Verifique se a notificação aparece no dashboard

## Verificar Logs

### encontrarCore
```
✅ Webhook sent successfully for order #12345
```

### API NestJS
```
📥 Webhook received from: encontrarCore
✅ Notification broadcasted to admins/managers for order #12345
```

### Dashboard Angular (Console F12)
```
🔔 New notification received: { type: 'new_order', ... }
```

## Endpoint do Webhook

**URL:** `POST https://api.encontrarshopping.com/api/webhooks/order-notification`

**Público:** Sem autenticação necessária

**Payload:**
```json
{
  "type": "new_order",
  "title": "Novo Pedido Recebido",
  "message": "Novo pedido #12345 recebido",
  "orderId": 12345,
  "orderNumber": "ORD-2024-001",
  "orderStatus": "PENDING",
  "totalAmount": 1500.00,
  "source": "encontrarCore"
}
```

## Troubleshooting

### Notificações não aparecem no dashboard

1. ✅ Verificar `WEBHOOK_NOTIFICATIONS_ENABLED=true`
2. ✅ Verificar `NESTJS_API_URL` correto
3. ✅ API NestJS está rodando
4. ✅ Dashboard conectado ao Socket.io
5. ✅ Usuário é admin ou manager

### Webhook timeout

1. Aumentar `WEBHOOK_TIMEOUT`
2. Verificar latência de rede
3. Verificar logs da API NestJS

## Próximos Passos (Opcional)

- [ ] Adicionar autenticação ao webhook (Bearer token)
- [ ] Implementar retry automático
- [ ] Usar fila (Redis/Bull) para processar webhooks
- [ ] Adicionar logs de webhook no banco de dados
- [ ] Criar dashboard de monitoramento

## Documentação Completa

Ver `encontrarCore/WEBHOOK_NOTIFICATIONS_SETUP.md` para documentação detalhada.
