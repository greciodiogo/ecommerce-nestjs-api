-- Migration for banners table
-- NOTA: Esta tabela já existe no encontrarCore
-- Execute apenas se estiver criando do zero

CREATE TABLE IF NOT EXISTS banners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url_pt VARCHAR(500) COMMENT 'Caminho da imagem em Português',
  image_url_en VARCHAR(500) COMMENT 'Caminho da imagem em Inglês',
  link_url VARCHAR(500) COMMENT 'URL de destino ao clicar no banner',
  `order` INT DEFAULT 0 COMMENT 'Ordem de exibição',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX idx_banners_is_active_order ON banners(is_active, `order`);
