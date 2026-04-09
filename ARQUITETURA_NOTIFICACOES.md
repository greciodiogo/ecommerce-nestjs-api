# Arquitetura de Notificações - Sistema Encontrar

## Visão Geral

O sistema possui duas APIs principais que agora se comunicam via webhook para garantir que o dashboard receba notificações em tempo real de todos os pedidos.

## Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLIENTES / USUÁRIOS                              │
└─────────────────────────────────────────────────────────────────────────┘
         │                    │                    │
         │                    │                    │
    ┌────▼────┐         ┌─────▼─────┐      ┌─────▼──────┐
    │ App iOS │         │  App Web  │      │  Dashboard │
    │ Flutter │         │  Next.js  │      │  Angular   │
    └────┬────┘         └─────┬─────┘      └─────┬──────┘
         │                    │                    │
         │                    │                    │ Socket.io
         │ HTTP               │ HTTP               │ (tempo real)
         │                    │                    │
         └────────┬───────────┘                    │
                  │                                │
                  │                                │
┌─────────────────▼────────────────┐      ┌───────▼──────────────────────┐
│                                  │      │                              │
│   API ADONISJS (encontrarCore)   │      │   API NESTJS                 │
│   Port: 3381                     │      │   api.encontrarshopping.com  │
│                                  │      │                              │
│  ┌────────────────────────────┐  │      │  ┌────────────────────────┐  │
│  │  OrderService              │  │      │  │  WebhooksController    │  │
│  │  - Cria pedido             │  │      │  │  - Recebe webhook      │  │
│  │  - Valida dados            │  │      │  │  - Valida payload      │  │
│  │  - Salva no BD             │  │      │  └───────────┬────────────┘  │
│  └──────────┬─────────────────┘  │      │              │               │
│             │                     │      │  ┌───────────▼────────────┐  │
│             │ Após criar pedido   │      │  │  WebhooksService       │  │
│             │                     │      │  │  - Processa notif.     │  │
│  ┌──────────▼─────────────────┐  │      │  │  - Salva no BD         │  │
│  │  FirebaseService           │  │      │  └───────────┬────────────┘  │
│  │  - Push notification       │  │      │              │               │
│  │  - Notifica cliente        │  │      │  ┌───────────▼────────────┐  │
│  │  - Notifica lojistas       │  │      │  │  NotificationsGateway  │  │
│  └────────────────────────────┘  │      │  │  - Socket.io server    │  │
│             │                     │      │  │  - Emite para admins   │  │
│  ┌──────────▼─────────────────┐  │      │  │  - Emite para managers │  │
│  │  WebhookNotificationService│  │      │  └────────────────────────┘  │
│  │  - Envia webhook HTTP      │──┼──────┤                              │
│  │  - Timeout: 5s             │  │      │  ┌────────────────────────┐  │
│  │  - Não bloqueia resposta   │  │      │  │  NotificationsService  │  │
│  └────────────────────────────┘  │      │  │  - Salva notificações  │  │
│                                  │      │  │  - Envia FCM push      │  │
└──────────────────────────────────┘      │  └────────────────────────┘  │
                                          │                              │
                                          └──────────────────────────────┘
```

## Fluxo de Notificações Detalhado

### 1. Criação de Pedido via Apps Mobile/Web

```
1. Cliente faz pedido no App
   ↓
2. POST /api/orders → API AdonisJS (encontrarCore)
   ↓
3. OrderService.createdOrders()
   ├─→ CreateOrderUseCase.execute()
   │   └─→ Salva pedido no banco de dados
   │
   ├─→ FirebaseService.notifyNewOrder() [Assíncrono]
   │   ├─→ Notifica cliente via Firebase Push
   │   └─→ Notifica lojistas via Firebase Push
   │
   └─→ WebhookNotificationService.notifyNewOrder() [Assíncrono]
       └─→ POST /api/webhooks/order-notification → API NestJS
           ↓
4. API NestJS recebe webhook
   ↓
5. WebhooksController.receiveOrderNotification()
   ↓
6. WebhooksService.processOrderNotification()
   ├─→ NotificationsGateway.sendNotificationToRole('admin')
   │   └─→ Socket.io emit → Dashboard Angular
   │
   ├─→ NotificationsGateway.sendNotificationToRole('manager')
   │   └─→ Socket.io emit → Dashboard Angular
   │
   └─→ NotificationsService.notifyUsersByRole()
       └─→ Salva notificações no banco de dados
```

### 2. Dashboard Angular Recebe Notificação

```
1. Dashboard conectado via Socket.io
   ↓
2. NotificationsService.connect(userId)
   ├─→ Estabelece conexão Socket.io
   └─→ Escuta evento 'notification'
   ↓
3. Recebe notificação em tempo real
   ↓
4. NotificationsService atualiza BehaviorSubject
   ├─→ notifications$ (lista de notificações)
   └─→ unreadCount$ (contador de não lidas)
   ↓
5. UI atualiza automaticamente
   ├─→ Exibe badge com contador
   ├─→ Mostra popup de notificação
   └─→ Toca som de alerta
```

## Componentes do Sistema

### API AdonisJS (encontrarCore)

| Componente | Responsabilidade |
|------------|------------------|
| `OrderService` | Gerencia criação e atualização de pedidos |
| `FirebaseService` | Envia push notifications para mobile |
| `WebhookNotificationService` | Envia webhooks HTTP para API NestJS |

### API NestJS

| Componente | Responsabilidade |
|------------|------------------|
| `WebhooksController` | Recebe webhooks externos |
| `WebhooksService` | Processa e distribui notificações |
| `NotificationsGateway` | Gerencia conexões Socket.io |
| `NotificationsService` | Salva notificações no banco |

### Dashboard Angular

| Componente | Responsabilidade |
|------------|------------------|
| `NotificationsService` | Gerencia conexão Socket.io |
| `NotificationComponent` | Exibe notificações na UI |

## Tecnologias Utilizadas

### Comunicação em Tempo Real
- **Socket.io**: WebSocket para comunicação bidirecional
- **Polling**: Fallback para ambientes sem WebSocket

### Notificações Push
- **Firebase Cloud Messaging (FCM)**: Push para apps mobile
- **Firebase Admin SDK**: Gerenciamento de tokens e envio

### Comunicação entre APIs
- **HTTP Webhook**: POST request assíncrono
- **Axios**: Cliente HTTP para Node.js

## Configurações Importantes

### Socket.io (API NestJS)

```typescript
@WebSocketGateway({
  cors: {
    origin: ['https://admin.encontrarshopping.com', ...],
    credentials: true,
  },
  path: '/socket.io/',
  transports: ['polling'], // Apenas polling para Railway
  pingTimeout: 60000,
  pingInterval: 25000,
})
```

### Webhook (encontrarCore)

```javascript
// .env
NESTJS_API_URL=https://api.encontrarshopping.com
WEBHOOK_NOTIFICATIONS_ENABLED=true
WEBHOOK_TIMEOUT=5000
```

## Vantagens da Arquitetura

### ✅ Desacoplamento
- APIs independentes
- Falha no webhook não afeta criação do pedido
- Fácil manutenção

### ✅ Escalabilidade
- Webhooks assíncronos
- Não bloqueia resposta ao cliente
- Pode adicionar mais consumidores

### ✅ Confiabilidade
- Timeout configurável
- Logs detalhados
- Tratamento de erros

### ✅ Tempo Real
- Socket.io para dashboard
- Firebase Push para mobile
- Notificações instantâneas

## Monitoramento

### Métricas Importantes

1. **Taxa de Sucesso do Webhook**
   - Meta: > 99%
   - Alerta se < 95%

2. **Tempo de Resposta do Webhook**
   - Meta: < 1s
   - Alerta se > 3s

3. **Conexões Socket.io Ativas**
   - Monitorar número de admins conectados
   - Verificar reconexões frequentes

4. **Notificações Entregues**
   - Push mobile entregues
   - Notificações Socket.io recebidas

## Segurança

### Implementado
- ✅ HTTPS obrigatório em produção
- ✅ CORS configurado
- ✅ Validação de payload (DTO)
- ✅ Timeout para prevenir DoS

### Recomendado para Produção
- [ ] Autenticação do webhook (Bearer token)
- [ ] Validação de IP de origem
- [ ] Rate limiting no endpoint
- [ ] Assinatura HMAC do payload
- [ ] Logs de auditoria

## Troubleshooting

### Problema: Notificações não chegam

**Verificar:**
1. Webhook habilitado: `WEBHOOK_NOTIFICATIONS_ENABLED=true`
2. URL correta: `NESTJS_API_URL`
3. API NestJS rodando
4. Dashboard conectado ao Socket.io
5. Usuário tem role admin/manager

**Logs:**
```bash
# encontrarCore
grep "webhook" logs/adonis.log

# NestJS
# Verificar Railway logs ou console
```

### Problema: Webhook timeout

**Causas:**
- API NestJS lenta ou sobrecarregada
- Latência de rede alta
- Timeout muito baixo

**Soluções:**
- Aumentar `WEBHOOK_TIMEOUT`
- Otimizar API NestJS
- Verificar infraestrutura

## Evolução Futura

### Fase 2: Queue System
```
encontrarCore → Redis Queue → Worker → API NestJS
```
- Retry automático
- Processamento em lote
- Melhor controle de falhas

### Fase 3: Event Bus
```
encontrarCore → RabbitMQ/Kafka → Múltiplos Consumidores
```
- Múltiplos sistemas podem consumir eventos
- Histórico de eventos
- Event sourcing

### Fase 4: Microservices
```
Notification Service (dedicado)
├─→ Push Notifications
├─→ Email Notifications
├─→ SMS Notifications
└─→ WebSocket Notifications
```
