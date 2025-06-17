# Promotions Module

The Promotions module provides functionality to manage promotional campaigns with category-based discounts.

## Features

- Create, read, update, and delete promotions
- Set promotion validity periods (start and end dates)
- Apply discounts to specific product categories
- Toggle promotion active/inactive status
- Get active promotions for current date
- Get promotions by category
- Import/export promotion data

## Entity Structure

### Promotion Entity
- `id`: Unique identifier
- `name`: Promotion name
- `description`: Promotion description
- `startDate`: Promotion start date
- `endDate`: Promotion end date
- `discount`: Discount percentage (0-100)
- `isActive`: Whether the promotion is active
- `categories`: Many-to-many relationship with categories

## API Endpoints

### Create Promotion
```
POST /promotions
Authorization: Admin, Manager
Body: {
  "name": "Summer Sale",
  "description": "Summer sale with 20% discount",
  "startDate": "2024-06-01T00:00:00.000Z",
  "endDate": "2024-08-31T23:59:59.000Z",
  "discount": 20,
  "categoryIds": [1, 2, 3],
  "isActive": true
}
```

### Get All Promotions
```
GET /promotions
```

### Get Active Promotions
```
GET /promotions/active
```

### Get Promotions by Category
```
GET /promotions/category/:categoryId
```

### Get Specific Promotion
```
GET /promotions/:id
```

### Update Promotion
```
PATCH /promotions/:id
Authorization: Admin, Manager
Body: {
  "name": "Updated Name",
  "discount": 25
}
```

### Toggle Promotion Status
```
PATCH /promotions/:id/toggle
Authorization: Admin, Manager
```

### Delete Promotion
```
DELETE /promotions/:id
Authorization: Admin, Manager
```

## Validation Rules

- `name`: Required string
- `description`: Required string
- `startDate`: Required valid date string
- `endDate`: Required valid date string, must be after startDate
- `discount`: Required number between 0 and 100
- `categoryIds`: Required array of valid category IDs
- `isActive`: Optional boolean, defaults to true

## Business Logic

- Promotions are considered active if:
  - `isActive` is true
  - Current date is between `startDate` and `endDate`
- Discount percentage is stored as a decimal (e.g., 20.5 for 20.5%)
- Categories must exist before creating a promotion
- Date validation ensures startDate is before endDate

## Import/Export

The module supports importing and exporting promotion data through the main import/export system:

- Export format includes all promotion data with category IDs
- Import requires categories to be imported first (dependency)
- Supports JSON, CSV, and Excel formats

## Testing

Run the e2e tests:
```bash
npm run test:e2e promotions.e2e-spec.ts
```

## Usage Examples

### Creating a Summer Sale
```typescript
const summerSale = await promotionsService.createPromotion({
  name: "Summer Sale 2024",
  description: "Get 25% off on all summer products",
  startDate: "2024-06-01T00:00:00.000Z",
  endDate: "2024-08-31T23:59:59.000Z",
  discount: 25,
  categoryIds: [1, 2, 3], // Beach, Outdoor, Sports categories
  isActive: true
});
```

### Getting Active Promotions for a Category
```typescript
const activePromotions = await promotionsService.getPromotionsByCategory(1);
```

### Toggling Promotion Status
```typescript
const updatedPromotion = await promotionsService.togglePromotionStatus(1);
``` 