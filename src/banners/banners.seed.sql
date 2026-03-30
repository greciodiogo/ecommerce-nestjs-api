-- Seed data for banners table
INSERT INTO banners (title, description, image_url_pt, image_url_en, link_url, `order`, is_active) VALUES
('Banner Promocional 1', 'Promoção de verão - Até 50% de desconto', 'uploads/banner-promo-pt.jpg', 'uploads/banner-promo-en.jpg', '/promotions/summer', 0, TRUE),
('Banner Novidades', 'Confira os novos produtos da temporada', 'uploads/banner-new-pt.jpg', 'uploads/banner-new-en.jpg', '/products/new', 1, TRUE),
('Banner Frete Grátis', 'Frete grátis em compras acima de R$ 100', 'uploads/banner-shipping-pt.jpg', 'uploads/banner-shipping-en.jpg', '/shipping-info', 2, TRUE);
