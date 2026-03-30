# Módulo de Splash Screens

Este módulo gerencia as telas de splash exibidas no aplicativo móvel.

## Estrutura

```
splash-screens/
├── dto/
│   ├── splash-screen-create.dto.ts    # DTO para criação
│   └── splash-screen-update.dto.ts    # DTO para atualização
├── models/
│   └── splash-screen.entity.ts        # Entidade TypeORM
├── splash-screens.controller.ts       # Controller com endpoints REST
├── splash-screens.service.ts          # Lógica de negócio
├── splash-screens.module.ts           # Módulo NestJS
├── splash-screens.migration.sql       # Script SQL para criar tabela
└── README.md                          # Este arquivo
```

## Endpoints da API

### Endpoints Administrativos (requer autenticação Admin)

- `GET /splash-screens` - Lista todos os splash screens
- `GET /splash-screens/:id` - Busca um splash screen específico
- `POST /splash-screens` - Cria um novo splash screen
- `PATCH /splash-screens/:id` - Atualiza um splash screen
- `DELETE /splash-screens/:id` - Remove um splash screen
- `PUT /splash-screens/reorder` - Reordena os splash screens

### Endpoints Públicos

- `GET /splash-screens/active` - Lista apenas splash screens ativos (para o app móvel)

## Modelo de Dados

```typescript
{
  id: number;
  title: string;              // Título do splash
  description?: string;       // Descrição opcional
  imageUrl: string;           // URL da imagem
  order: number;              // Ordem de exibição (0, 1, 2...)
  duration: number;           // Duração em ms (padrão: 3000)
  isActive: boolean;          // Se está ativo
  createdAt: Date;
  updatedAt: Date;
}
```

## Instalação

1. Execute o script SQL para criar a tabela:
```bash
psql -U seu_usuario -d seu_banco -f splash-screens.migration.sql
```

2. O módulo já está registrado no `app.module.ts`

## Uso no Frontend

O módulo Angular está disponível em `/splash-screens` no painel administrativo.

### Funcionalidades:
- ✅ Listagem com drag-and-drop para reordenar
- ✅ Criar novo splash screen
- ✅ Editar splash screen existente
- ✅ Ativar/desativar splash screens
- ✅ Excluir splash screens
- ✅ Preview da imagem

## Uso no App Móvel

Para buscar os splash screens ativos no app móvel:

```typescript
// Endpoint público (não requer autenticação)
GET /splash-screens/active

// Resposta:
[
  {
    id: 1,
    title: "Bem-vindo",
    imageUrl: "https://...",
    duration: 3000,
    order: 0
  },
  // ...
]
```

## Validações

- `title`: obrigatório, máximo 255 caracteres
- `imageUrl`: obrigatório, máximo 500 caracteres
- `order`: obrigatório, mínimo 0
- `duration`: obrigatório, mínimo 1000ms
- `isActive`: booleano, padrão true

## Permissões

Apenas usuários com role `Admin` podem gerenciar splash screens.
