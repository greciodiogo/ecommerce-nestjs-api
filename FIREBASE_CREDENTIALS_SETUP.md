# 🔐 Configuração de Credenciais do Firebase

## ⚠️ IMPORTANTE: Segurança

As credenciais do Firebase **NÃO** devem ser commitadas no repositório Git por questões de segurança.

## 📋 Como Configurar

### Opção 1: Usar Variável de Ambiente (Recomendado)

As credenciais já estão configuradas no arquivo `.env`:

```env
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"encontrar-nestjs",...}
```

✅ Esta é a forma mais segura e já está funcionando!

### Opção 2: Usar Arquivo JSON (Desenvolvimento Local)

Se preferir usar um arquivo JSON:

1. **Baixe as credenciais do Firebase Console:**
   - Acesse: https://console.firebase.google.com/project/encontrar-nestjs/settings/serviceaccounts/adminsdk
   - Clique em "Generate new private key"
   - Salve o arquivo como `firebase-credentials.json` na pasta `ecommerce-api/`

2. **O arquivo será ignorado pelo Git** (já está no .gitignore)

3. **Atualize o código** para usar o arquivo:

```typescript
// src/notifications/fcm.service.ts
import * as serviceAccount from '../firebase-credentials.json';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});
```

## 🚀 Deploy em Produção

### Railway / Vercel / Heroku

Configure a variável de ambiente:

```bash
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"encontrar-nestjs",...}
```

### Docker

Adicione ao `docker-compose.yml`:

```yaml
environment:
  - FIREBASE_SERVICE_ACCOUNT=${FIREBASE_SERVICE_ACCOUNT}
```

### Kubernetes

Crie um Secret:

```bash
kubectl create secret generic firebase-credentials \
  --from-literal=service-account='{"type":"service_account",...}'
```

## 🔍 Verificar Configuração

Execute no terminal:

```bash
npm run start:dev
```

Deve aparecer no log:
```
[FCM] Firebase Admin initialized successfully
```

## ❌ O que NÃO fazer

- ❌ Não commite arquivos `*-firebase-adminsdk-*.json`
- ❌ Não compartilhe credenciais em chat/email
- ❌ Não exponha credenciais em logs públicos
- ❌ Não use credenciais de produção em desenvolvimento

## ✅ Boas Práticas

- ✅ Use variáveis de ambiente
- ✅ Mantenha credenciais no `.env` (já no .gitignore)
- ✅ Use diferentes projetos Firebase para dev/prod
- ✅ Rotacione credenciais periodicamente
- ✅ Use IAM roles com permissões mínimas

## 🆘 Credenciais Vazadas?

Se você acidentalmente commitou credenciais:

1. **Revogue imediatamente** no Firebase Console
2. **Gere novas credenciais**
3. **Remova do histórico do Git:**

```bash
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch path/to/credentials.json" \
  --prune-empty --tag-name-filter cat -- --all

git push origin --force --all
```

4. **Notifique a equipe**

## 📞 Suporte

Para mais informações sobre segurança do Firebase:
https://firebase.google.com/docs/admin/setup#initialize-sdk
