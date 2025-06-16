# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Backend Development
```bash
cd backend
npm install
npm run dev      # Development with file watching
npm start        # Production start
```

### Frontend Development  
```bash
cd frontend
npm install
npm run dev      # Development server (localhost:4321)
npm run build    # Production build
npm run preview  # Preview production build
```

### Docker Development
```bash
docker-compose up -d        # Start all services
docker-compose down         # Stop all services
docker-compose logs backend # View backend logs
```

### Database Commands
- PostgreSQL runs on port 5432 (user: root, password: root, db: regente)
- pgAdmin available at localhost:5050 (admin@admin.com / admin)
- Database schema is in `estructuras-sql/estructura.sql`

## Architecture Overview

### Tech Stack
- **Frontend**: Astro + React + TailwindCSS 4.0
- **Backend**: Express.js + PostgreSQL + JWT Authentication
- **Database**: PostgreSQL 16+ with connection pooling
- **Deployment**: Vercel (frontend) + Heroku (backend + database)

### Project Structure
```
regente2.0/
├── backend/          # Express.js API
│   ├── src/
│   │   ├── controllers/   # Route handlers
│   │   ├── models/        # Database query functions
│   │   ├── routes/        # Express route definitions
│   │   ├── middlewares/   # Auth and other middleware
│   │   └── config/        # Database and app config
├── frontend/         # Astro + React frontend
│   └── src/
│       ├── components/    # React components
│       ├── pages/         # Astro pages (file-based routing)
│       ├── layouts/       # Astro layouts
│       └── utils/         # Frontend utilities
├── documentacion/    # Project documentation
└── estructuras-sql/ # Database schemas and queries
```

### Core System Concepts

**Business Domain**: Restaurant POS system for a themed establishment called "El Penitenciario" where customers are called "presos" (prisoners).

**User Roles & Permissions**:
- `admin`: Full system access
- `mesero`: Order management, customer service
- `cocinero`: Kitchen operations, order preparation
- `financiero`: Financial reports and payments  
- `gerente`: Management reports and oversight

**Key Data Models**:
- `presos`: Customers with loyalty tracking
- `productos`: Menu items with variants (sabores/tamanos)
- `ordenes`: Orders with real-time status tracking
- `detalles_orden`: Order line items with preparation states
- `empleados`: Staff with role-based authentication
- `pagos`: Payment processing with tips

### Authentication & Authorization
- JWT tokens stored in localStorage
- Backend middleware: `verifyToken()` and `authorizeRoles()`
- Frontend utilities in `utils/auth.js` for token management
- Role-based access control throughout the application

### API Architecture
- RESTful API with modular route structure
- All routes protected by JWT authentication
- CORS configured for staging/production domains
- Request logging middleware for debugging
- Consistent error handling with JSON responses

### Frontend Architecture  
- **Astro**: Static site generation with SSR for production
- **React**: Interactive components with hooks
- **TailwindCSS 4.0**: Utility-first styling with Vite plugin
- **File-based routing**: Pages in `src/pages/` directory
- **Layout system**: Shared layouts in `src/layouts/`
- **API utilities**: Centralized HTTP client in `utils/api.js`

### Database Design
- **Connection pooling** with SSL for production environments
- **Foreign key constraints** maintain data integrity
- **ENUM constraints** for status fields (e.g., orden estado: 'abierta'|'cerrada')
- **Timestamps** track order creation and updates
- **Cascading deletes** for order details when orders are deleted

### Environment Configuration
- **Development**: Static output, local PostgreSQL, no SSL
- **Staging**: Server output, Heroku PostgreSQL with SSL
- **Production**: Server output, Vercel + Heroku with SSL
- **CORS origins** configured per environment in backend
- **Database SSL** enabled automatically for production/staging

### Compras (Purchasing) Module
Recent addition for supply chain management:
- **Proveedores**: Supplier management
- **Insumos**: Inventory/supply items  
- **Requisiciones**: Purchase requisitions
- **Compras**: Purchase orders
- Located in `backend/src/controllers/compras.controller.js` and related files

### Product Variants System
**Complex multi-level variant system** handling:
- **Sabores**: Flavors for different product categories (pulque flavors, food flavors)
- **Tamaños**: Sizes (primarily for pulques: "Medio litro", "Litro", "5 Litros")
- **Ingredientes Extra**: Additional ingredients (primarily for food)

**Key Tables**:
- `sabores`: Stores ALL variants despite name (flavors, sizes, ingredients)
- `categorias_variantes`: Groups variant types by function
- `categoria_producto_tipo_variante`: Defines which variants apply to which product categories
- `producto_sabor`: Links specific products to available variants
- `detalles_orden`: Stores orders with variant IDs (`sabor_id`, `tamano_id`, `ingrediente_id`)

**Pricing**: `Final Price = Base Price + Flavor Price + Size Price + Extra Ingredient Price`

### Sentencias (Combo) System
**Combo management with component tracking**:
- `sentencia_id`: References the combo definition
- `es_sentencia_principal`: Identifies main combo record 
- `sentencia_detalle_orden_padre_id`: Links components to main record
- **Pricing Logic**: Combo gets full price, components get $0.00
- **Kitchen Integration**: All components appear in kitchen queue individually

### Compras (Purchasing) Module
**Complete supply chain management**:
- **Proveedores**: Supplier management (RFC, contact info, addresses)
- **Insumos**: Inventory items with categories and units
- **Requisiciones**: Internal purchase requests with approval workflow
- **Compras**: Purchase orders with pricing analysis
- **Price Analysis**: Historical pricing, supplier comparison, cost optimization

### Kitchen Workflow Improvements
**Enhanced kitchen operations**:
- **Chronological ordering**: Oldest orders appear first (higher priority)
- **Cancellation handling**: Separate red-background section for cancelled items
- **Despreparar function**: Allows reverting prepared status for error correction
- **Real-time updates**: 30-second polling for order status changes
- **Order grouping**: Products grouped by order for better organization

### Frontend Component Architecture
**Sequential variant selection flow**:
1. Product selection
2. Quantity definition  
3. Flavor selection (if applicable)
4. Size selection (if applicable)
5. Extra ingredient selection (if applicable)
6. Special notes

**Smart variant detection**: System automatically checks available variants per product and shows relevant selectors only.

**Shared components**:
- `SentenciaSelector.jsx`: Combo selection for both order creation and modification
- Consistent API utilities in `utils/api.js` and `utils/auth.js`
- Role-based navigation and component access

### Key Integration Points
- **Frontend-Backend**: API calls through `utils/api.js` with automatic JWT token inclusion
- **Database-Backend**: Connection pooling through `config/db.js`
- **Auth flow**: Login → JWT token → localStorage → API headers
- **Role permissions**: Backend middleware validates roles per endpoint
- **Real-time updates**: Kitchen status updates through PUT endpoints
- **Variant system**: Dynamic UI based on product category configuration
- **Combo system**: Two-phase processing (main combo + individual components)

### Development Notes
- Backend uses ES modules (`type: "module"` in package.json)
- Frontend builds differently for development (static) vs production (server)
- Database schema changes should be documented in `estructuras-sql/`
- All new features should follow existing controller/model/route pattern
- Frontend components should use existing API utilities for consistency
- **Variant additions**: Check `categoria_producto_tipo_variante` table before modifying code
- **Kitchen improvements**: Focus on chronological ordering and error correction features
- **Purchasing module**: Complete workflow from requisition to purchase analysis