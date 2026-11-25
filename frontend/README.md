# RetailFlow · Frontend

Panel web en **React 18 + Vite** para gestionar el catálogo y los pedidos de RetailFlow.

- **Catálogo:** CRUD de productos con buscador y alertas de stock bajo o agotado.
- **Nuevo pedido:** carrito con control de stock; el total final lo calcula `order-service`.
- **Pedidos:** filtros por estado, barra de progreso, botones para cambiar el estado e historial de eventos guardado en MongoDB.
- **Estado de los microservicios:** un indicador en la barra lateral muestra si cada servicio responde.

## Desarrollo local

Con el backend arriba (`docker compose up -d` en la raíz):

```bash
cd frontend
npm install
npm run dev
```

Abre http://localhost:5173.

Vite reenvía `/api/products` a `localhost:8081` y `/api/orders` a `localhost:8082`. Por eso no hace falta configurar CORS en Spring.

## Con Docker

El `Dockerfile` compila la app y la sirve con nginx. nginx también hace de proxy hacia `product-service` y `order-service` dentro de la red de Docker Compose.

```bash
docker compose up -d --build frontend
```

Abre http://localhost:3000.
