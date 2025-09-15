# Ventry
---

## 📡 Dónde está montado el GraphQL

> [Coloca aquí la URL o endpoint donde tienes desplegado tu servidor GraphQL, por ejemplo: https://mi-servidor.com/graphql]

---

## 🗄️ Tipo de base de datos utilizada

> [Indica aquí el tipo de base de datos que usas, por ejemplo: PostgreSQL, MySQL, MongoDB, etc.]

---

## 📊 Diagrama UML de la base de datos

> [Incluye aquí una imagen o enlace al diagrama UML que usaste para modelar la base de datos. Puedes arrastrar la imagen o poner un link.]

---

## 🌐 Despliegue en la web

> [Explica aquí cómo y dónde desplegaste la aplicación web. Ejemplo: Vercel, Netlify, GitHub Pages, etc. Incluye pasos si es necesario.]

---
## ⚙️ Variables de ambiente

Las variables de ambiente se gestionan en el archivo `.env` (o en los archivos de entorno de Angular como `environment.ts` y `environment.prod.ts`).

> [Agrega aquí ejemplos de las variables necesarias, por ejemplo: API_URL, GRAPHQL_ENDPOINT, etc.]

---

## 🗂️ Estructura de carpetas públicas y privadas

En la estructura de Angular, puedes tener una carpeta pública para recursos estáticos y el resto del código en carpetas privadas.

> [Describe aquí cómo organizas tu estructura de carpetas, por ejemplo: `public/` para assets públicos, `src/` para el código fuente privado.]

---

Ventry es un sistema de gestión de inventario robusto, diseñado con un enfoque **offline-first**. Te permite gestionar productos, almacenes y movimientos de stock incluso cuando pierdes la conexión a internet. Todos los cambios se sincronizan automáticamente cuando se restablece la conectividad.

---

## 🚀 Cómo ejecutar el proyecto

1. **Instala las dependencias:**

	```bash
	npm install
	```

2. **Inicia el servidor de desarrollo:**

	```bash
	ng serve
	```

3. **Abre la aplicación:**

	Ve a [http://localhost:4200/](http://localhost:4200/) en tu navegador. La app se recargará automáticamente a medida que realices cambios.

---

## 📴 Cómo probar el modo offline

Ventry está construido para funcionar perfectamente sin conexión. Para probar esta funcionalidad:

1. **Abre la app en tu navegador.**
2. **Abre las DevTools (F12) y ve a la pestaña 'Network'.**
3. **Cambia el estado de red a 'Offline'.**
4. Intenta crear, actualizar o eliminar productos, almacenes o movimientos. Verás una notificación indicando que tus cambios se guardaron localmente.
5. **Restaura tu conexión** (vuelve a poner la red en 'Online').
6. La app sincronizará automáticamente tus cambios con el servidor y te notificará cuando la sincronización esté completa.

**Tip:** También puedes cerrar y volver a abrir el navegador estando offline. Tus datos persistirán y se sincronizarán al reconectarte.

---

## 📝 Requisitos Mínimos Ejecutables (MER)

Este proyecto demuestra:

- **Arquitectura offline-first:** Todas las funciones principales (CRUD de productos, almacenes, movimientos) funcionan sin conexión a internet.
- **Sincronización automática:** Las acciones pendientes se encolan y sincronizan al recuperar la conectividad.
- **Caché con IndexedDB:** Los datos se almacenan localmente para acceso rápido y confiable.
- **Feedback al usuario:** La interfaz notifica sobre el estado offline y los eventos de sincronización.

---

## Development server

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Recursos adicionales

Para más información sobre el uso de Angular CLI, incluyendo referencias detalladas de comandos, visita la [documentación oficial de Angular CLI](https://angular.dev/tools/cli).
