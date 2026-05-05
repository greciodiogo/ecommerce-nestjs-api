-- Migration: Adicionar traduções em inglês para categorias
-- Data: 2026-05-01
-- Descrição: Adiciona colunas name_en e description_en para suportar multi-idioma

-- Adicionar colunas de tradução
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS name_en VARCHAR(255) NULL AFTER name,
ADD COLUMN IF NOT EXISTS description_en TEXT NULL AFTER description;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_categories_name_en ON categories(name_en);

-- Comentários nas colunas
COMMENT ON COLUMN categories.name_en IS 'Nome da categoria em inglês';
COMMENT ON COLUMN categories.description_en IS 'Descrição da categoria em inglês';

-- Popular traduções iniciais (exemplos)
UPDATE categories SET name_en = 'Drinks', description_en = 'Beverages and drinks' WHERE name = 'Bebidas';
UPDATE categories SET name_en = 'Wines', description_en = 'Wine selection' WHERE name = 'Vinhos';
UPDATE categories SET name_en = 'Beers', description_en = 'Beer selection' WHERE name = 'Cervejas';
UPDATE categories SET name_en = 'Whiskey', description_en = 'Whiskey collection' WHERE name = 'Whiskey';
UPDATE categories SET name_en = 'Water', description_en = 'Bottled water' WHERE name = 'Água';
UPDATE categories SET name_en = 'Milk', description_en = 'Dairy milk products' WHERE name = 'Leite';
UPDATE categories SET name_en = 'Rice', description_en = 'Rice products' WHERE name = 'Arroz';
UPDATE categories SET name_en = 'Oil', description_en = 'Cooking oils' WHERE name = 'Óleo';
UPDATE categories SET name_en = 'Creams', description_en = 'Cream products' WHERE name = 'Cremes';
UPDATE categories SET name_en = 'Pasta', description_en = 'Pasta products' WHERE name = 'Massa';
UPDATE categories SET name_en = 'Beans', description_en = 'Bean products' WHERE name = 'Feijoão';
UPDATE categories SET name_en = 'Cereals', description_en = 'Breakfast cereals' WHERE name = 'Cereais';
UPDATE categories SET name_en = 'Sugar', description_en = 'Sugar products' WHERE name = 'Açúcar';
UPDATE categories SET name_en = 'Food', description_en = 'Food products' WHERE name = 'Alimentação';
UPDATE categories SET name_en = 'Home Appliances', description_en = 'Electronic home appliances' WHERE name = 'Eletrodomésticos';
UPDATE categories SET name_en = 'Bedroom', description_en = 'Bedroom furniture and accessories' WHERE name = 'Quarto';
UPDATE categories SET name_en = 'Air Conditioning', description_en = 'Air conditioning units' WHERE name = 'AC';
UPDATE categories SET name_en = 'TV', description_en = 'Television sets' WHERE name = 'TV';
UPDATE categories SET name_en = 'Kitchen', description_en = 'Kitchen appliances and utensils' WHERE name = 'Cozinha';
UPDATE categories SET name_en = 'Car & Accessories', description_en = 'Car accessories and parts' WHERE name = 'Car & stuffs';
UPDATE categories SET name_en = 'Office', description_en = 'Office supplies and equipment' WHERE name = 'Escritório';
UPDATE categories SET name_en = 'Juice', description_en = 'Fruit juices' WHERE name = 'Sumo';
UPDATE categories SET name_en = 'Nutrition', description_en = 'Nutritional products' WHERE name = 'nutri';
UPDATE categories SET name_en = 'Alcoholic Beverages', description_en = 'Alcoholic drinks' WHERE name = 'Bebidas Alcoólicas';
UPDATE categories SET name_en = 'Personal Care', description_en = 'Personal care products' WHERE name = 'Cuidados Pessoais';
UPDATE categories SET name_en = 'Trending', description_en = 'Trending products' WHERE name = 'Trending';
UPDATE categories SET name_en = 'Promotions', description_en = 'Special promotions' WHERE name = 'Promotions';
UPDATE categories SET name_en = 'Unclassified', description_en = 'Unclassified items' WHERE name = 'Unclassificadores';
UPDATE categories SET name_en = 'Electric Kettles', description_en = 'Electric water kettles' WHERE name = 'Jarras Eléctricas';
UPDATE categories SET name_en = 'Lighters', description_en = 'Cigarette lighters' WHERE name = 'Isqueiros';
UPDATE categories SET name_en = 'Perfumes', description_en = 'Fragrances and perfumes' WHERE name = 'Perfumes';
UPDATE categories SET name_en = 'Energy Drinks', description_en = 'Energy drink beverages' WHERE name = 'Energéticos';
UPDATE categories SET name_en = 'Hair Products', description_en = 'Hair care products' WHERE name = 'Pondukas para o cabelo';
UPDATE categories SET name_en = 'Cakes', description_en = 'Cakes and pastries' WHERE name = 'Bolochos';
UPDATE categories SET name_en = 'Fashion & Clothing', description_en = 'Fashion and clothing items' WHERE name = 'Moda & Vestuário';
UPDATE categories SET name_en = 'Men', description_en = 'Men''s products' WHERE name = 'Masculino';
UPDATE categories SET name_en = 'Women', description_en = 'Women''s products' WHERE name = 'Feminino';
UPDATE categories SET name_en = 'New Arrivals', description_en = 'New products' WHERE name = 'Novidades';
UPDATE categories SET name_en = 'Stoves', description_en = 'Kitchen stoves' WHERE name = 'Fogões';
UPDATE categories SET name_en = 'Flowers', description_en = 'Fresh flowers' WHERE name = 'Flores';
UPDATE categories SET name_en = 'Coffee', description_en = 'Coffee products' WHERE name = 'Cafes';
UPDATE categories SET name_en = 'Washing Machines', description_en = 'Laundry washing machines' WHERE name = 'Máquinas de Lavar';
UPDATE categories SET name_en = 'Mattresses', description_en = 'Bed mattresses' WHERE name = 'Colchões';
UPDATE categories SET name_en = 'Miscellaneous', description_en = 'Various products' WHERE name = 'Diversos';

-- Verificar resultado
SELECT id, name, name_en, description, description_en 
FROM categories 
WHERE name_en IS NOT NULL 
LIMIT 10;
