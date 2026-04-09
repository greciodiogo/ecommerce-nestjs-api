# 🔔 Sistema de Webhook de Notificações - Encontrar

> Solução para notificações em tempo real no dashboard Angular quando pedidos são criados via apps mobile/web

---

## 🎯 Problema Resolvido

O dashboard Angular não recebia notificações em tempo real quando pedidos eram criados nos apps mobile/web, pois:
- Dashboard conecta à API NestJS
- Apps fazem pedidos na API AdonisJS
- As APIs não se comunicavam

## ✅ Solução

Sistema de webhook HTTP que conecta as duas APIs, garantindo notificações em tempo real para todos os pedidos.

```
App Mobile/Web → API AdonisJS → Webhook → API NestJS → Socket.io → Dashboard
```

---

## 🚀 Quick Start

### 1. Deploy (15 minutos)

#### encontrarCore
```bash
cd encontrarCore
git add .
git commit -m "feat: add webhook notifications"
git push
```

Adicionar variáveis de ambiente:
```env
NESTJS_API_URL=https://api.encontrarshopping.com
WEBHOOK_NOTIFICATIONS_ENABLED=true
WEBHOOK_TIMEOUT=5000
```

#### API NestJS
```bash
cd ecommerce-platform-nestjs-api-master
git add .
git commit -m "feat: add webhook endpoint"
git push
```

### 2. Testar

```bash
cd encontrarCore
node test-webhook-notification.js
```

---

## 📚 Documentação

### 🌟 Comece Aqui

| Documento | Para Quem | Tempo |
|-----------|-----------|-------|
| [SOLUCAO_NOTIFICACOES_WEBHOOK.md](SOLUCAO_NOTIFICACOES_WEBHOOK.md) | Desenvolvedores | 5 min |
| [RESUMO_EXECUTIVO.md](RESUMO_EXECUTIVO.md) | Gestores/POs | 10 min |
| [INDEX_DOCUMENTACAO_WEBHOOK.md](INDEX_DOCUMENTACAO_WEBHOOK.md) | Todos | 2 min |

### 📖 Documentação Completa

| Documento | Descrição |
|-----------|-----------|
| [ARQUITETURA_NOTIFICACOES.md](ARQUITETURA_NOTIFICACOES.md) | Arquitetura e diagramas |
| [CHECKLIST_DEPLOY_NOTIFICACOES.md](CHECKLIST_DEPLOY_NOTIFICACOES.md) | Guia de deploy |
| [EXEMPLOS_USO_WEBHOOK.md](EXEMPLOS_USO_WEBHOOK.md) | Exemplos de código |
| [FAQ_WEBHOOK_NOTIFICACOES.md](FAQ_WEBHOOK_NOTIFICACOES.md) | Perguntas frequentes |
| [encontrarCore/WEBHOOK_NOTIFICATIONS_SETUP.md](encontrarCore/WEBHOOK_NOTIFICATIONS_SETUP.md) | Setup detalhado |

---

## 🛠️ Arquivos Criados

### encontrarCore (API AdonisJS)
- ✅ `app/Services/WebhookNotificationService.js`
- ✅ `app/Modules/Sales/Services/OrderService.js` (modificado)
- ✅ `test-webhook-notification.js`
- ✅ `.env` (modificado)

### API NestJS
- ✅ `src/webhooks/webhooks.module.ts`
- ✅ `src/webhooks/webhooks.controller.ts`
- ✅ `src/webhooks/webhooks.service.ts`
- ✅ `src/webhooks/dto/order-notification.dto.ts`
- ✅ `src/app.module.ts` (modificado)

---

## 🧪 Como Testar

### Teste Manual
```bash
cd encontrarCore
node test-webhook-notification.js
```

### Teste com Pedido Real
1. Abrir dashboard Angular
2. Fazer login como admin/manager
3. Criar pedido via app mobile/web
4. Verificar notificação no dashboard

---

## 📊 Benefícios

### Operacionais
- ✅ Notificações em tempo real (< 1s)
- ✅ Melhor experiência do administrador
- ✅ Resposta mais rápida aos clientes
- ✅ Visibilidade completa de pedidos

### Técnicos
- ✅ Desacoplamento entre APIs
- ✅ Não bloqueia criação de pedidos
- ✅ Fácil manutenção
- ✅ Custo zero de infraestrutura

---

## 🔍 Troubleshooting

### Notificações não aparecem?

1. **Verificar webhook habilitado:**
```env
WEBHOOK_NOTIFICATIONS_ENABLED=true
```

2. **Testar manualmente:**
```bash
node test-webhook-notification.js
```

3. **Verificar logs:**
```bash
# encontrarCore
grep "webhook" logs/adonis.log

# API NestJS
# Verificar Railway/Heroku logs
```

4. **Consultar FAQ:**
Ver [FAQ_WEBHOOK_NOTIFICACOES.md](FAQ_WEBHOOK_NOTIFICACOES.md)

---

## 📈 Métricas

### Metas
- Taxa de sucesso: > 99%
- Tempo de resposta: < 1s
- Disponibilidade: 99.9%

### Monitorar
- Logs de webhook
- Tempo de resposta
- Taxa de erro
- Notificações entregues

---

## 🔒 Segurança

### Implementado
- ✅ HTTPS obrigatório
- ✅ CORS configurado
- ✅ Validação de payload
- ✅ Timeout configurável

### Recomendado
- [ ] Autenticação (Bearer token)
- [ ] Rate limiting
- [ ] Validação de IP
- [ ] Assinatura HMAC

---

## 🎓 Recursos

### Documentação
- [Socket.io](https://socket.io/docs/)
- [NestJS](https://docs.nestjs.com/)
- [AdonisJS](https://docs.adonisjs.com/)
- [Axios](https://axios-http.com/)

### Conceitos
- [Webhooks](https://en.wikipedia.org/wiki/Webhook)
- [Event-Driven Architecture](https://en.wikipedia.org/wiki/Event-driven_architecture)
- [WebSocket](https://en.wikipedia.org/wiki/WebSocket)

---

## 📞 Suporte

### Documentação
- Ver arquivos `.md` neste workspace
- Comentários no código fonte

### Logs
- encontrarCore: Logs da plataforma
- API NestJS: Logs da plataforma
- Dashboard: Console do navegador (F12)

### Testes
```bash
node test-webhook-notification.js
```

---

## 🎉 Status

**✅ Pronto para Deploy**

- Código implementado e testado
- Documentação completa
- Scripts de teste incluídos
- Zero custo adicional
- Deploy em 15 minutos

---

## 📝 Changelog

### v1.0.0 (2024-01-15)
- ✅ Implementação inicial do webhook
- ✅ Integração com API NestJS
- ✅ Documentação completa
- ✅ Scripts de teste
- ✅ Guias de deploy

---

## 🤝 Contribuindo

Para adicionar novas funcionalidades:

1. Consultar [EXEMPLOS_USO_WEBHOOK.md](EXEMPLOS_USO_WEBHOOK.md)
2. Seguir padrões existentes
3. Atualizar documentação
4. Adicionar testes

---

## 📄 Licença

Este projeto faz parte do sistema Encontrar.

---

## 🔗 Links Rápidos

- [📖 Índice Completo](INDEX_DOCUMENTACAO_WEBHOOK.md)
- [🚀 Solução Rápida](SOLUCAO_NOTIFICACOES_WEBHOOK.md)
- [📊 Resumo Executivo](RESUMO_EXECUTIVO.md)
- [🏗️ Arquitetura](ARQUITETURA_NOTIFICACOES.md)
- [✅ Checklist de Deploy](CHECKLIST_DEPLOY_NOTIFICACOES.md)
- [💡 Exemplos](EXEMPLOS_USO_WEBHOOK.md)
- [❓ FAQ](FAQ_WEBHOOK_NOTIFICACOES.md)

---

**Desenvolvido com ❤️ para o sistema Encontrar**
