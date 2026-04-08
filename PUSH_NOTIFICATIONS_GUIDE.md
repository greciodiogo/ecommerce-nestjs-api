# Guia de Implementação de Push Notifications

## Visão Geral
Este guia explica como implementar notificações push usando Firebase Cloud Messaging (FCM) ou OneSignal.

## Opção 1: Firebase Cloud Messaging (FCM) - Recomendado

### Vantagens
- Gratuito
- Integração nativa com Angular
- Suporte para Web, Android e iOS
- Controle total sobre os dados

### Passos de Implementação

#### 1. Configurar Firebase Project
```bash
# 1. Acesse https://console.firebase.google.com/
# 2. Crie um novo projeto ou use existente
# 3. Vá em Project Settings > Cloud Messaging
# 4. Copie o Server Key e Sender ID
```

#### 2. Backend (NestJS) - Instalar Dependências
```bash
cd ecommerce-api
npm install firebase-admin
```

#### 3. Backend - Criar Serviço FCM
Criar arquivo: `src/notifications/fcm.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FcmService {
  constructor() {
    // Inicializar Firebase Admin
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }

  async sendToDevice(token: string, notification: any) {
    const message = {
      notification: {
        title: notification.title,
        body: notification.message,
      },
      data: {
        type: notification.type,
        relatedEntityId: notification.relatedEntityId?.toString() || '',
        actionUrl: notification.actionUrl || '',
      },
      token,
    };

    try {
      const response = await admin.messaging().send(message);
      console.log('Successfully sent message:', response);
      return response;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async sendToMultipleDevices(tokens: string[], notification: any) {
    const message = {
      notification: {
        title: notification.title,
        body: notification.message,
      },
      data: {
        type: notification.type,
        relatedEntityId: notification.relatedEntityId?.toString() || '',
        actionUrl: notification.actionUrl || '',
      },
      tokens,
    };

    try {
      const response = await admin.messaging().sendMulticast(message);
      console.log(`Successfully sent ${response.successCount} messages`);
      return response;
    } catch (error) {
      console.error('Error sending messages:', error);
      throw error;
    }
  }
}
```

#### 4. Backend - Criar Tabela de Device Tokens
```sql
CREATE TABLE device_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL UNIQUE,
  device_type VARCHAR(50), -- 'web', 'android', 'ios'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_device_tokens_user ON device_tokens(user_id);
```

#### 5. Backend - Adicionar ao .env
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

#### 6. Frontend (Angular) - Instalar Dependências
```bash
cd ecommerce-platform-angular-admin-panel-master
npm install firebase @angular/fire
```

#### 7. Frontend - Configurar Firebase
Criar arquivo: `src/firebase-messaging-sw.js` (na pasta public/src)

```javascript
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/assets/logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
```

#### 8. Frontend - Criar Serviço FCM
Criar arquivo: `src/app/services/fcm.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { initializeApp } from 'firebase/app';

@Injectable({ providedIn: 'root' })
export class FcmService {
  private messaging: any;

  constructor() {
    const app = initializeApp({
      apiKey: "YOUR_API_KEY",
      authDomain: "YOUR_AUTH_DOMAIN",
      projectId: "YOUR_PROJECT_ID",
      storageBucket: "YOUR_STORAGE_BUCKET",
      messagingSenderId: "YOUR_SENDER_ID",
      appId: "YOUR_APP_ID"
    });

    this.messaging = getMessaging(app);
  }

  async requestPermission(): Promise<string | null> {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(this.messaging, {
          vapidKey: 'YOUR_VAPID_KEY'
        });
        console.log('FCM Token:', token);
        return token;
      }
      return null;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  listenToMessages(callback: (payload: any) => void) {
    onMessage(this.messaging, (payload) => {
      console.log('Message received:', payload);
      callback(payload);
    });
  }
}
```

## Opção 2: OneSignal - Mais Simples

### Vantagens
- Setup mais rápido
- Dashboard visual
- Segmentação de usuários
- Analytics integrado

### Passos de Implementação

#### 1. Criar Conta OneSignal
```bash
# 1. Acesse https://onesignal.com/
# 2. Crie uma conta gratuita
# 3. Crie um novo app
# 4. Configure para Web Push
```

#### 2. Frontend - Instalar SDK
```bash
npm install react-onesignal
```

#### 3. Frontend - Inicializar OneSignal
```typescript
import OneSignal from 'react-onesignal';

// No app.component.ts ou main.ts
OneSignal.init({
  appId: "YOUR_ONESIGNAL_APP_ID",
  allowLocalhostAsSecureOrigin: true,
}).then(() => {
  OneSignal.showSlidedownPrompt();
});
```

#### 4. Backend - Enviar Notificação
```typescript
import axios from 'axios';

async sendPushNotification(userIds: string[], notification: any) {
  const response = await axios.post(
    'https://onesignal.com/api/v1/notifications',
    {
      app_id: process.env.ONESIGNAL_APP_ID,
      include_external_user_ids: userIds,
      headings: { en: notification.title },
      contents: { en: notification.message },
      data: {
        type: notification.type,
        relatedEntityId: notification.relatedEntityId,
        actionUrl: notification.actionUrl,
      },
    },
    {
      headers: {
        'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
}
```

## Comparação

| Recurso | FCM | OneSignal |
|---------|-----|-----------|
| Custo | Gratuito | Gratuito até 10k usuários |
| Setup | Médio | Fácil |
| Controle | Total | Limitado |
| Analytics | Básico | Avançado |
| Segmentação | Manual | Automática |
| Dashboard | Firebase Console | OneSignal Dashboard |

## Recomendação

Para este projeto, recomendo **Firebase Cloud Messaging (FCM)** porque:
1. Você já tem controle total do backend
2. É completamente gratuito
3. Integração nativa com Angular
4. Mais flexibilidade para customização

## Próximos Passos

1. Escolher entre FCM ou OneSignal
2. Configurar o projeto no serviço escolhido
3. Implementar o backend service
4. Implementar o frontend service
5. Testar notificações
6. Adicionar ao fluxo de criação de notificações existente
