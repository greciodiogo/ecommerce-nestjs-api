# 🚀 Executar Migration do Chat

## Status Atual
✅ Chat funciona em modo fallback (sem salvar histórico)
⚠️ Tabelas `chat_sessions`, `chat_messages` e `chat_config` não existem no banco

## Tabelas do Chat

### 1. `chat_sessions` - Sessões de conversação
Armazena sessões de chat dos usuários.

### 2. `chat_messages` - Mensagens trocadas
Armazena todas as mensagens (usuário e assistente) com histórico completo.

### 3. `chat_config` - Configurações do Assistente ⭐ NOVO
Armazena configurações personalizáveis do chat:
- **assistantName**: Nome do assistente (ex: "Sino")
- **welcomeMessage**: Mensagem de boas-vindas principal
- **avatarUrl**: URL da imagem do avatar (upload via dashboard)
- **greetingMessage**: Saudação para usuários não autenticados
- **greetingMessageWithName**: Saudação para usuários autenticados (suporta `{name}`)
- **quickReplies**: Lista de sugestões rápidas (JSON) com ícone, label e mensagem

## Para Habilitar Histórico + Configurações

Execute no banco de produção:

```sql
-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    active BOOLEAN DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    source VARCHAR(20) CHECK (source IN ('quick', 'database', 'ai')),
    response_time_ms INTEGER,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create chat_config table (NOVO)
CREATE TABLE IF NOT EXISTS chat_config (
    id SERIAL PRIMARY KEY,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assistantName VARCHAR(255) DEFAULT 'Sino',
    welcomeMessage TEXT DEFAULT 'Como posso ajudar você hoje?',
    avatarUrl TEXT NULL,
    greetingMessage TEXT DEFAULT 'Olá, amigo! 👋🏾',
    greetingMessageWithName TEXT DEFAULT 'Olá, {name}! 👋🏾',
    quickReplies JSONB NULL,
    isActive BOOLEAN DEFAULT true
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_active ON chat_sessions(active);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_source ON chat_messages(source);

-- Create updated_at trigger for chat_sessions
CREATE OR REPLACE FUNCTION update_chat_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chat_sessions_updated_at
    BEFORE UPDATE ON chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_sessions_updated_at();

-- Insert default chat config
INSERT INTO chat_config (
    assistantName,
    welcomeMessage,
    avatarUrl,
    greetingMessage,
    greetingMessageWithName,
    quickReplies,
    isActive
) VALUES (
    'Sino',
    'Como posso ajudar você hoje?',
    NULL,
    'Olá, amigo! 👋🏾',
    'Olá, {name}! 👋🏾',
    '[
        {"icon": "attach_money", "label": "Qual é o mais caro?", "message": "Qual é o mais caro? 💎"},
        {"icon": "wine_bar", "label": "Tem vinho?", "message": "Tem vinho? 🍷"},
        {"icon": "sports_bar", "label": "Mostrar cervejas", "message": "Mostrar cervejas 🍺"},
        {"icon": "local_offer", "label": "Promoções", "message": "Quais são as promoções? 🏷️"},
        {"icon": "access_time", "label": "Horários", "message": "Horários do shopping ⏰"},
        {"icon": "location_on", "label": "Localização", "message": "Onde fica? 📍"}
    ]'::jsonb,
    true
);
```

## Comando Rápido (Railway/Postgres)

```bash
# Via Railway CLI
railway run psql -U postgres -d encontrar -f migrations-sql/03-create-chat-tables.sql

# OU conectar e colar o SQL acima
```

## API Endpoints para Configuração

### GET /chat/config
Retorna a configuração atual do chat.

**Resposta:**
```json
{
  "id": 1,
  "assistantName": "Sino",
  "welcomeMessage": "Como posso ajudar você hoje?",
  "avatarUrl": "https://api.encontrarshopping.com/uploads/avatar.jpeg",
  "greetingMessage": "Olá, amigo! 👋🏾",
  "greetingMessageWithName": "Olá, {name}! 👋🏾",
  "quickReplies": [
    {
      "icon": "attach_money",
      "label": "Qual é o mais caro?",
      "message": "Qual é o mais caro? 💎"
    }
  ],
  "isActive": true
}
```

### PUT /chat/config
Atualiza a configuração do chat (via dashboard admin).

**Body:**
```json
{
  "assistantName": "Meu Assistente",
  "welcomeMessage": "Como posso te ajudar?",
  "avatarUrl": "https://...",
  "greetingMessage": "Olá! 👋",
  "greetingMessageWithName": "Olá, {name}! 👋",
  "quickReplies": [...]
}
```

## Ícones Suportados (Flutter)

- `attach_money` - 💰
- `wine_bar` - 🍷
- `sports_bar` - 🍺
- `local_offer` - 🏷️
- `access_time` - ⏰
- `location_on` - 📍

Depois de executar, o chat vai:
- ✅ Salvar histórico automaticamente
- ✅ Carregar configurações do banco
- ✅ Permitir personalização via dashboard

