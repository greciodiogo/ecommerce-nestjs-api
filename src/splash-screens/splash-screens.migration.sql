-- Migration para criar a tabela splash_screens
-- Execute este script no banco de dados PostgreSQL

CREATE TABLE IF NOT EXISTS public.splash_screens (
    id serial NOT NULL,
    title character varying(255) NOT NULL,
    description text NULL,
    image_url character varying(500) NOT NULL,
    "order" integer NOT NULL DEFAULT 0,
    duration integer NOT NULL DEFAULT 3000,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT splash_screens_pkey PRIMARY KEY (id)
);

-- Criar índice para melhorar performance nas consultas
CREATE INDEX IF NOT EXISTS idx_splash_screens_order ON public.splash_screens("order");
CREATE INDEX IF NOT EXISTS idx_splash_screens_is_active ON public.splash_screens(is_active);

-- Comentários para documentação
COMMENT ON TABLE public.splash_screens IS 'Tabela para gerenciar as telas de splash do aplicativo móvel';
COMMENT ON COLUMN public.splash_screens.title IS 'Título do splash screen';
COMMENT ON COLUMN public.splash_screens.description IS 'Descrição opcional do splash screen';
COMMENT ON COLUMN public.splash_screens.image_url IS 'URL da imagem a ser exibida';
COMMENT ON COLUMN public.splash_screens."order" IS 'Ordem de exibição (menor valor aparece primeiro)';
COMMENT ON COLUMN public.splash_screens.duration IS 'Duração da exibição em milissegundos';
COMMENT ON COLUMN public.splash_screens.is_active IS 'Indica se o splash screen está ativo';
