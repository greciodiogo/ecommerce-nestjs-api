-- Criar tabela chat_config para configurações do assistente de chat
CREATE TABLE IF NOT EXISTS chat_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  assistantName VARCHAR(255) DEFAULT 'Sino',
  welcomeMessage TEXT DEFAULT 'Como posso ajudar você hoje?',
  avatarUrl TEXT NULL,
  greetingMessage TEXT DEFAULT 'Olá, amigo! 👋🏾',
  greetingMessageWithName TEXT DEFAULT 'Olá, {name}! 👋🏾',
  quickReplies JSON NULL,
  isActive TINYINT(1) DEFAULT 1
);

-- Inserir configuração padrão
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
  JSON_ARRAY(
    JSON_OBJECT('icon', 'attach_money', 'label', 'Qual é o mais caro?', 'message', 'Qual é o mais caro? 💎'),
    JSON_OBJECT('icon', 'wine_bar', 'label', 'Tem vinho?', 'message', 'Tem vinho? 🍷'),
    JSON_OBJECT('icon', 'sports_bar', 'label', 'Mostrar cervejas', 'message', 'Mostrar cervejas 🍺'),
    JSON_OBJECT('icon', 'local_offer', 'label', 'Promoções', 'message', 'Quais são as promoções? 🏷️'),
    JSON_OBJECT('icon', 'access_time', 'label', 'Horários', 'message', 'Horários do shopping ⏰'),
    JSON_OBJECT('icon', 'location_on', 'label', 'Localização', 'message', 'Onde fica? 📍')
  ),
  1
);
