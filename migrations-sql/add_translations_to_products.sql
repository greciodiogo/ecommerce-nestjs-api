-- Migration: Adicionar traduções em inglês para produtos
-- Data: 2026-05-01
-- Descrição: Adiciona colunas name_en e description_en para suportar multi-idioma

-- Adicionar colunas de tradução
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS name_en VARCHAR(255) NULL AFTER name,
ADD COLUMN IF NOT EXISTS description_en TEXT NULL AFTER description;

-- Criar índice para melhor performance em buscas
CREATE INDEX IF NOT EXISTS idx_products_name_en ON products(name_en);

-- Comentários nas colunas
COMMENT ON COLUMN products.name_en IS 'Nome do produto em inglês';
COMMENT ON COLUMN products.description_en IS 'Descrição do produto em inglês';

-- Nota: As traduções dos produtos devem ser preenchidas manualmente
-- ou através de um script de tradução automática, pois são muitos produtos.

-- Exemplo de como preencher manualmente:
-- UPDATE products SET 
--   name_en = 'Product Name in English',
--   description_en = 'Product description in English'
-- WHERE id = 1;

-- Verificar estrutura
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('name', 'name_en', 'description', 'description_en');
