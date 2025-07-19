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
- **Local Development (Docker)**: PostgreSQL runs on port 5432 (user: root, password: root, db: regente)
- **pgAdmin**: Available at localhost:5050 (admin@admin.com / admin)
- **Database schema**: Located in `estructuras-sql/estructura.sql`
- **Staging/Production**: Heroku PostgreSQL with SSL enabled

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
- **Development**: Static output, local PostgreSQL Docker, no SSL
- **Staging**: Server output, Heroku Staging (backend + database) + Vercel Staging (frontend), with SSL
- **Production**: Server output, Heroku Production (backend + database) + Vercel Production (frontend), with SSL
- **CORS origins** configured per environment in backend
- **Database SSL** enabled automatically for staging/production

### Compras (Purchasing) Module
**Complete supply chain management system**:
- **Proveedores**: Supplier management with purchase day scheduling
- **Insumos**: Inventory items with brand, category, and unit tracking
- **Requisiciones**: Staff purchase requests with approval workflow
- **Compras**: Purchase orders with inventory integration
- **Daily Planning**: "Compras del Día" view for daily purchase planning
- Located in `backend/src/controllers/compras.controller.js` and frontend components

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
- **Pricing Logic**: 
  - Combo gets full price
  - Components base price is $0.00
  - Variant additional costs (size, flavor, extra ingredients) are tracked and displayed separately
- **Kitchen Integration**: All components appear in kitchen queue individually
- **Variant Selection**: Sequential selection flow for products requiring flavor/size/ingredient choices
- **Price Display**: Additional variant costs shown in yellow as "+$X.XX" for transparency

### Compras (Purchasing) Module - Detailed
**Complete supply chain management system with daily planning**:

**Core Features**:
- **Proveedores**: Supplier management with purchase day configuration
  - RFC, contact information, addresses
  - Configurable purchase days (Monday-Sunday selection)
  - Integration with daily purchase planning
- **Insumos**: Inventory items with comprehensive tracking
  - Brand field for product identification
  - Categories and units of measurement
  - Supplier associations with reference pricing
- **Requisiciones**: Staff purchase requests with improved workflow
  - Multi-item creation process (no more empty requisitions)
  - Integrated item addition within creation form
  - Urgency levels and completion tracking
- **Compras**: Purchase orders with inventory integration
  - Direct creation from daily planning view
  - Automatic total calculation
  - Integration with requisition items

**Daily Planning Workflow**:
1. **Compras del Día**: Smart daily view showing what to buy
   - Filters suppliers by configured purchase days
   - Combines requisition requests with low inventory alerts
   - Allows direct purchase registration from planning view
   - Real-time inventory status integration

**Technical Implementation**:
- Backend models in `models/` directory (proveedores, insumos, requisiciones, compras, inventario)
- Frontend components in `components/compras/` directory
- Centralized API utilities in `utils/compras-api.js`
- SSR-compatible authentication integration

### Kitchen Workflow Improvements
**Enhanced kitchen operations with stack-based preparation**:
- **Chronological ordering**: Oldest orders appear first (higher priority)
- **Individual stack preparation**: Each product shows total quantity, cooks prepare one unit at a time
- **Customer-based tracking**: Shows customer names instead of order numbers
- **Stack reduction logic**: Clicking "✓" reduces quantity by 1, customer remains visible until all units prepared
- **Compact card design**: Simplified layout with format "Quantity X Product Name Flavor Size Extra"
- **Enumerated notes**: Special instructions numbered and displayed clearly
- **Real-time updates**: 30-second polling for order status changes
- **Cancellation handling**: Separate red-background section for cancelled items
- **Despreparar function**: Allows reverting prepared status for error correction

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

### Git Workflow & Branch Strategy

**Branch Structure**:
- `main`: Production branch (synced manually when ready)
- `development`: Main development branch
- `feature/[feature-name]`: Individual feature branches

**Development Process**:
1. **Start new feature**: `git checkout development` → `git checkout -b feature/nueva-funcionalidad`
2. **Complete feature**: 
   - `git add .`
   - `git commit -m "Implementa nueva funcionalidad"`
   - `git checkout development`
   - `git merge feature/nueva-funcionalidad`
3. **Deploy to production**: 
   - `git checkout main`
   - `git merge development`
   - `git push origin main` (triggers automatic deployments)

**Service Providers**:
- **GitHub**: Source control (`https://github.com/Dexinator/Regente2.0.git`)
- **Docker**: Local development environment (PostgreSQL + pgAdmin)
- **Heroku**: Backend + Database hosting
  - **Staging**: `regente-staging` app for testing
  - **Production**: Production backend + database
- **Vercel**: Frontend deployment (Astro application)
  - **Staging**: Frontend staging environment
  - **Production**: Production frontend deployment

### Development Notes
- Backend uses ES modules (`type: "module"` in package.json)
- Frontend builds differently for development (static) vs production (server)
- Database schema changes should be documented in `estructuras-sql/`
- All new features should follow existing controller/model/route pattern
- Frontend components should use existing API utilities for consistency
- **Variant additions**: Check `categoria_producto_tipo_variante` table before modifying code
- **Kitchen improvements**: Focus on chronological ordering and error correction features
- **SSR Compatibility**: Use `typeof window !== 'undefined'` checks for localStorage access
- **Purchasing module**: Complete workflow from requisition to daily purchase planning
- **Feature workflow**: Always create feature branches from `development`, merge back when complete

### Recent Improvements (Latest Updates)

**Insumos Management**:
- Added "marca" (brand) field to insumos table and full frontend/backend support
- Enhanced InsumosPanel with brand column and form field
- Updated API endpoints to handle brand information

**Requisiciones Workflow**:
- **Fixed Error 400**: Resolved "Bad Request" error when creating requisitions
- **Improved UX**: Complete requisition creation with items in single form
- **Multi-item creation**: Add multiple items before creating requisition
- **Validation**: Prevents empty requisitions and duplicate items
- **Real-time feedback**: Shows item count in creation button
- **Item management**: Add/remove items within creation form

**SSR Compatibility**:
- Fixed localStorage errors during server-side rendering
- Added proper window checks in auth utilities
- Enhanced component initialization for hydration compatibility

**Daily Purchase Planning**:
- Integrated supplier purchase day configuration
- Smart filtering by weekdays for purchase planning
- Combined requisition and inventory data in single view
- Direct purchase registration from daily planning interface

**UX Improvements Based on User Feedback (Latest)**:
- **ListaOrdenes**: Reduced card height, moved customer name next to order number
- **GestionOrden**: Relocated customer name to header, optimized summary card layout
- **AgregarProducto**: 
  - Added customer name display, removed category tags from product cards
  - Fixed sentencia (combo) variant selection flow to work identically to CrearOrden
  - Implemented sentencia deletion functionality
  - Corrected variant pricing display for combo components
- **PedidosCocina**: Complete redesign with stack-based preparation logic
  - New compact format: "Quantity X Product Name Flavor Size Extra"
  - Customer names instead of order numbers
  - Individual preparation tracking (one unit at a time)
  - Enumerated notes display
  - Smaller preparation button with checkmark symbol

**Sentencias System Improvements**:
- **SentenciasPanel**: Product-specific variant loading when creating/editing combos
- **CrearOrden & AgregarProducto**: Unified sentencia handling with sequential variant selection
- **Variant Pricing**: Additional costs from flavors, sizes, and ingredients now properly calculated and displayed
- **Deletion Feature**: Users can remove entire sentencias (combos) including all component products

### Database Migration Notes (January 2025)

**Production Database Updated**:
- Added complete purchasing module tables (proveedores, insumos, requisiciones, compras, inventario)
- Added sentencias (combos) system tables
- Modified `detalles_orden` table to support sentencias with new columns:
  - `nombre_sentencia`, `descripcion_sentencia` for combo display
  - `sentencia_id`, `es_sentencia_principal`, `sentencia_detalle_orden_padre_id` for combo tracking
- `producto_id` now allows NULL for sentencia principal records
- Fixed `marcarProductoComoPreparado` to include `empleado_id` when splitting records for partial preparation

**Important**: When migrating, always preserve production customer data (presos table) as it may contain more records than staging

### Product Cancellation System (Fixed January 2025)

**Issue Fixed**: Product cancellations were not updating order totals or showing in kitchen view.

**Cancellation Flow**:
1. **GestionOrden**: Meseros can cancel products that are not prepared
   - Cancellation creates a new `detalles_orden` record with negative quantity and price
   - Supports partial cancellations with variant tracking (flavor, size, ingredients)
   - Modal shows available quantity considering previous cancellations
   
2. **Backend Updates**:
   - `cancelarProductoOrden` now recalculates `total_bruto` and `total` after cancellation
   - Maintains applied discounts (promotional codes and customer grades)
   - Query in `getProductosPorPreparar` changed from `cantidad > 0` to `cantidad != 0` to include cancellations
   
3. **PedidosCocina Display**:
   - Shows adjusted quantities after cancellations
   - Displays cancellation notes with reason
   - Products fully cancelled (quantity ≤ 0) are removed from view
   - Red border indicates products with cancellations

**Technical Implementation**:
- Cancellations stored as negative quantity records in `detalles_orden`
- Total calculation uses ABS(precio_unitario) * cantidad for accurate totals
- Frontend groups products and processes cancellations to show net quantities