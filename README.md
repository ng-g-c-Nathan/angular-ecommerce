# Electrotech

Full-stack e-commerce platform for electronics retail, built with an Angular 17 SPA and a Spring Boot REST API. The system supports two roles — customer and administrator — with distinct flows for each.

---

## Screenshots

![Home](https://raw.githubusercontent.com/ng-g-c-Nathan/angular-ecommerce/main/Capturas%20de%20pantalla/PaginaPrincipalComponent.png)

![Catalog](https://raw.githubusercontent.com/ng-g-c-Nathan/angular-ecommerce/main/Capturas%20de%20pantalla/MostrarCatalogoProductosComponent.png)

![Cart](https://raw.githubusercontent.com/ng-g-c-Nathan/angular-ecommerce/main/Capturas%20de%20pantalla/GestionarCarritoComprasComponent.png)

![Wishlist](https://raw.githubusercontent.com/ng-g-c-Nathan/angular-ecommerce/main/Capturas%20de%20pantalla/GestionarListaDeseosComponent.png)

![Purchase History](https://raw.githubusercontent.com/ng-g-c-Nathan/angular-ecommerce/main/Capturas%20de%20pantalla/HistorialDeComprasComponent.png)

![My Orders](https://raw.githubusercontent.com/ng-g-c-Nathan/angular-ecommerce/main/Capturas%20de%20pantalla/VerMisPedidosComponent.png)

![Order Checkout](https://raw.githubusercontent.com/ng-g-c-Nathan/angular-ecommerce/main/Capturas%20de%20pantalla/GestionarPedidosComponent.png)

![Profile](https://raw.githubusercontent.com/ng-g-c-Nathan/angular-ecommerce/main/Capturas%20de%20pantalla/PersonalizarDatosClienteComponent.png)

![Invoices](https://raw.githubusercontent.com/ng-g-c-Nathan/angular-ecommerce/main/Capturas%20de%20pantalla/GenerarFacturasComponent.png)

![Admin — Products](https://raw.githubusercontent.com/ng-g-c-Nathan/angular-ecommerce/main/Capturas%20de%20pantalla/GestionarProductosComponent.png)

---

## Tech Stack

**Frontend**
- Angular 17
- TypeScript
- Bootstrap 5
- Angular Animations
- ngx-sonner (toast notifications)
- Lucide Angular (icons)
- RxJS (switchMap, forkJoin, takeUntil)

**Backend**
- Java 17 + Spring Boot
- Spring Data JPA
- Spring Security
- MySQL
- JavaMail (automated email workflows)
- iText (PDF generation)

**Integrations**
- PayPal REST API (checkout)
- Vector Space Model — VSM (semantic product search, custom implementation)

---

## Features

**Customer**
- Browse catalog with filters (most sold, most expensive, cheapest) and custom VSM semantic search
- Add products to cart and wishlist, move items between them
- Editable cart quantities with stock validation and pagination
- Checkout with PayPal integration
- Order tracking with status display
- Refund request flow with reason input and automated email notification
- Purchase history with payment method and per-product detail
- Profile editor: personal data, address, RFC, upload and delete profile photo
- Invoice request and PDF preview with fiscal data (RFC, CFDI, tax regime)

**Administrator**
- Product management: add, edit, delete — with GIF image upload and live preview
- Order management: approve or reject pending orders
- Invoice authorization with embedded PDF viewer
- Sales analytics dashboard with charts and date filters
- Refund management: accept or reject with automated reimbursement email

**Technical highlights**
- VSM (Vector Space Model) for semantic product search — custom implementation
- All subscriptions managed with `takeUntil(destroy$)` to prevent memory leaks
- Nested HTTP calls replaced with `switchMap` and `forkJoin`
- Blob URLs revoked on component destroy
- Role-based access validated on `ngOnInit` before data loads
- Toast notifications replace all `window.confirm` dialogs
- Generic error messages shown to users; technical errors isolated

---

## Project Structure

```
src/
  app/
    componentes/
    servicio/
      crud.service.ts
      global.service.ts
      Clases/         # DTOs and domain models
  environments/
```

---

## Installation

**Prerequisites:** Node.js 18+, Angular CLI 17, Java 17, MySQL

```bash
# Frontend
git clone https://github.com/ng-g-c-Nathan/angular-ecommerce.git
cd angular-ecommerce/frontend
npm install
ng serve

# Backend
cd ../backend
./mvnw spring-boot:run
```

Configure `src/environments/environment.ts` with your API base URL, and `application.properties` with your database credentials and mail settings.

---
