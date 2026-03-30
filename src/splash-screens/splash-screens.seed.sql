-- Dados de exemplo para testar o módulo de splash screens
-- Execute após criar a tabela

-- Limpar dados existentes (opcional)
-- TRUNCATE TABLE public.splash_screens RESTART IDENTITY CASCADE;

-- Inserir splash screens de exemplo
INSERT INTO public.splash_screens (title, description, image_url, "order", duration, is_active) VALUES
('Bem-vindo ao Encontrar', 'Descubra os melhores produtos e ofertas', 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800', 0, 3000, true),
('Ofertas Especiais', 'Aproveite descontos de até 50%', 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=800', 1, 3000, true),
('Entrega Rápida', 'Receba seus produtos com segurança', 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=800', 2, 3000, true);

-- Verificar inserção
SELECT * FROM public.splash_screens ORDER BY "order";
