# Exemplos de Uso - Sistema de Webhook de Notificações

## 1. Enviar Notificação de Novo Pedido

### Código (encontrarCore)

```javascript
const WebhookNotificationService = use('App/Services/WebhookNotificationService')

// Após criar o pedido
const order = await Order.create(orderData)

// Enviar notificação via webhook
const webhookService = new WebhookNotificationService()
await webhookService.notifyNewOrder(order, orderItems)
```

### Payload Enviado

```json
{
  "type": "new_order",
  "title": "Novo Pedido Recebido",
  "message": "Novo pedido #12345 recebido via Encontrar Core",
  "orderId": 12345,
  "orderNumber": "ORD-2024-001",
  "orderStatus": "PENDING",
  "totalAmount": 1500.00,
  "userId": 123,
  "createdAt": "2024-01-15T10:30:00Z",
  "source": "encontrarCore",
  "metadata": {
    "itemsCount": 3,
    "customerName": "João Silva",
    "contactEmail": "joao@example.com",
    "contactPhone": "+258 84 123 4567"
  }
}
```

## 2. Enviar Notificação de Atualização de Status

### Código (encontrarCore)

```javascript
const WebhookNotificationService = use('App/Services/WebhookNotificationService')

// Após atualizar status do pedido
const order = await Order.find(orderId)
const oldStatus = order.status
order.status = 'CONFIRMED'
await order.save()

// Enviar notificação via webhook
const webhookService = new WebhookNotificationService()
await webhookService.notifyOrderStatusUpdate(order, oldStatus, 'CONFIRMED')
```

### Payload Enviado

```json
{
  "type": "order_status_update",
  "title": "Status do Pedido Atualizado",
  "message": "Pedido #12345 mudou de PENDING para CONFIRMED",
  "orderId": 12345,
  "orderNumber": "ORD-2024-001",
  "oldStatus": "PENDING",
  "newStatus": "CONFIRMED",
  "source": "encontrarCore"
}
```

## 3. Testar Webhook Manualmente

### Usando cURL

```bash
curl -X POST https://api.encontrarshopping.com/api/webhooks/order-notification \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Source: encontrarCore" \
  -d '{
    "type": "new_order",
    "title": "Teste de Webhook",
    "message": "Pedido de teste #999",
    "orderId": 999,
    "orderNumber": "TEST-001",
    "orderStatus": "PENDING",
    "totalAmount": 100.00,
    "source": "encontrarCore"
  }'
```

### Usando Node.js Script

```bash
cd encontrarCore
node test-webhook-notification.js
```

### Usando Postman

1. Criar nova requisição POST
2. URL: `https://api.encontrarshopping.com/api/webhooks/order-notification`
3. Headers:
   - `Content-Type: application/json`
   - `X-Webhook-Source: postman`
4. Body (raw JSON):
```json
{
  "type": "new_order",
  "title": "Teste via Postman",
  "message": "Pedido de teste",
  "orderId": 999,
  "orderNumber": "TEST-POSTMAN",
  "orderStatus": "PENDING",
  "source": "postman"
}
```

## 4. Integrar em Outros Serviços

### Exemplo: Notificar quando pedido é pago

```javascript
// app/Modules/Payment/Services/PaymentService.js

const WebhookNotificationService = use('App/Services/WebhookNotificationService')

class PaymentService {
  async processPayment(orderId, paymentData) {
    // Processar pagamento
    const payment = await Payment.create(paymentData)
    
    // Atualizar status do pedido
    const order = await Order.find(orderId)
    order.status = 'PAID'
    await order.save()
    
    // Notificar via webhook
    const webhookService = new WebhookNotificationService()
    await webhookService.notifyOrderStatusUpdate(order, 'PENDING', 'PAID')
    
    return payment
  }
}
```

### Exemplo: Notificar quando pedido é entregue

```javascript
// app/Modules/Delivery/Services/DeliveryService.js

const WebhookNotificationService = use('App/Services/WebhookNotificationService')

class DeliveryService {
  async markAsDelivered(orderId) {
    const order = await Order.find(orderId)
    const oldStatus = order.status
    
    order.status = 'DELIVERED'
    order.deliveredAt = new Date()
    await order.save()
    
    // Notificar via webhook
    const webhookService = new WebhookNotificationService()
    await webhookService.notifyOrderStatusUpdate(order, oldStatus, 'DELIVERED')
    
    return order
  }
}
```

## 5. Configurações Avançadas

### Desabilitar Webhook Temporariamente

```env
# .env
WEBHOOK_NOTIFICATIONS_ENABLED=false
```

### Aumentar Timeout

```env
# .env
WEBHOOK_TIMEOUT=10000  # 10 segundos
```

### Usar URL de Desenvolvimento

```env
# .env
NESTJS_API_URL=http://localhost:3000
```

## 6. Tratamento de Erros

### Exemplo: Retry Manual

```javascript
const WebhookNotificationService = use('App/Services/WebhookNotificationService')

async function sendNotificationWithRetry(order, orderItems, maxRetries = 3) {
  const webhookService = new WebhookNotificationService()
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await webhookService.notifyNewOrder(order, orderItems)
      
      if (result.success) {
        console.log(`✅ Webhook sent successfully on attempt ${attempt}`)
        return result
      }
      
      console.warn(`⚠️ Webhook failed on attempt ${attempt}, retrying...`)
      
      // Aguardar antes de tentar novamente (backoff exponencial)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
      
    } catch (error) {
      console.error(`❌ Webhook error on attempt ${attempt}:`, error.message)
      
      if (attempt === maxRetries) {
        console.error('❌ Max retries reached, giving up')
        return { success: false, error: error.message }
      }
    }
  }
}

// Uso
await sendNotificationWithRetry(order, orderItems)
```

### Exemplo: Fallback para Queue

```javascript
const WebhookNotificationService = use('App/Services/WebhookNotificationService')
const Queue = use('Queue')

async function sendNotificationWithFallback(order, orderItems) {
  const webhookService = new WebhookNotificationService()
  
  try {
    const result = await webhookService.notifyNewOrder(order, orderItems)
    
    if (!result.success) {
      // Se falhar, adicionar à fila para tentar depois
      await Queue.add('webhook-notification', {
        order,
        orderItems,
        attempt: 1
      })
      console.log('⚠️ Webhook failed, added to queue for retry')
    }
    
  } catch (error) {
    // Em caso de erro, adicionar à fila
    await Queue.add('webhook-notification', {
      order,
      orderItems,
      attempt: 1
    })
    console.error('❌ Webhook error, added to queue:', error.message)
  }
}
```

## 7. Logs e Debugging

### Habilitar Logs Detalhados

```javascript
// app/Services/WebhookNotificationService.js

// Adicionar logs detalhados
console.log('📤 Sending webhook:', {
  url: webhookUrl,
  payload: notificationPayload,
  headers: headers
})

// Log de resposta
console.log('📥 Webhook response:', {
  status: response.status,
  data: response.data,
  duration: Date.now() - startTime
})
```

### Verificar Logs em Produção

```bash
# Railway
railway logs --tail

# Heroku
heroku logs --tail --app encontrar-core

# Filtrar apenas webhooks
railway logs | grep webhook
```

## 8. Monitoramento

### Exemplo: Salvar Histórico de Webhooks

```javascript
// app/Models/WebhookLog.js

class WebhookLog extends Model {
  static get table() {
    return 'webhook_logs'
  }
}

// app/Services/WebhookNotificationService.js

async notifyNewOrder(order, orderItems = []) {
  const startTime = Date.now()
  
  try {
    const response = await axios.post(webhookUrl, notificationPayload, config)
    
    // Salvar log de sucesso
    await WebhookLog.create({
      type: 'new_order',
      order_id: order.id,
      status: 'success',
      response_status: response.status,
      duration_ms: Date.now() - startTime,
      payload: JSON.stringify(notificationPayload),
      response: JSON.stringify(response.data)
    })
    
    return { success: true, response: response.data }
    
  } catch (error) {
    // Salvar log de erro
    await WebhookLog.create({
      type: 'new_order',
      order_id: order.id,
      status: 'error',
      error_message: error.message,
      duration_ms: Date.now() - startTime,
      payload: JSON.stringify(notificationPayload)
    })
    
    return { success: false, error: error.message }
  }
}
```

### Exemplo: Dashboard de Monitoramento

```javascript
// app/Controllers/Http/WebhookLogController.js

class WebhookLogController {
  async index({ request }) {
    const page = request.input('page', 1)
    const perPage = request.input('perPage', 20)
    
    const logs = await WebhookLog
      .query()
      .orderBy('created_at', 'desc')
      .paginate(page, perPage)
    
    return logs
  }
  
  async stats() {
    const total = await WebhookLog.getCount()
    const success = await WebhookLog.query().where('status', 'success').getCount()
    const errors = await WebhookLog.query().where('status', 'error').getCount()
    
    const avgDuration = await WebhookLog
      .query()
      .where('status', 'success')
      .avg('duration_ms as avg')
    
    return {
      total,
      success,
      errors,
      successRate: (success / total * 100).toFixed(2) + '%',
      avgDuration: Math.round(avgDuration[0].avg) + 'ms'
    }
  }
}
```

## 9. Testes Automatizados

### Exemplo: Teste Unitário

```javascript
// test/unit/webhook-notification-service.spec.js

const { test } = use('Test/Suite')('WebhookNotificationService')
const WebhookNotificationService = use('App/Services/WebhookNotificationService')

test('should send webhook notification successfully', async ({ assert }) => {
  const service = new WebhookNotificationService()
  
  const order = {
    id: 123,
    order_number: 'TEST-001',
    status: 'PENDING',
    total_amount: 1500
  }
  
  const result = await service.notifyNewOrder(order, [])
  
  assert.isTrue(result.success)
})

test('should handle webhook timeout', async ({ assert }) => {
  const service = new WebhookNotificationService()
  service.webhookTimeout = 1 // 1ms para forçar timeout
  
  const order = {
    id: 123,
    order_number: 'TEST-001',
    status: 'PENDING'
  }
  
  const result = await service.notifyNewOrder(order, [])
  
  assert.isFalse(result.success)
  assert.exists(result.error)
})
```

## 10. Documentação da API

### Swagger/OpenAPI

```yaml
# swagger.yml

/api/webhooks/order-notification:
  post:
    summary: Receive order notification webhook
    tags:
      - Webhooks
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required:
              - type
              - title
              - message
              - orderId
            properties:
              type:
                type: string
                enum: [new_order, order_status_update]
              title:
                type: string
              message:
                type: string
              orderId:
                type: number
              orderNumber:
                type: string
              orderStatus:
                type: string
              totalAmount:
                type: number
              source:
                type: string
    responses:
      200:
        description: Notification received successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                message:
                  type: string
```

## Conclusão

Estes exemplos cobrem os casos de uso mais comuns do sistema de webhook de notificações. Para mais informações, consulte:

- `WEBHOOK_NOTIFICATIONS_SETUP.md` - Documentação completa
- `ARQUITETURA_NOTIFICACOES.md` - Arquitetura do sistema
- `CHECKLIST_DEPLOY_NOTIFICACOES.md` - Guia de deploy
