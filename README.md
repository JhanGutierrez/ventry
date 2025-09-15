# Ventry
---

## 📡 Dónde está montado el GraphQL

> https://prepared-grouper-21.hasura.app/v1/graphql

---

## 🗄️ Tipo de base de datos utilizada

> PGSQL

---

## 📊 Diagrama de la base de datos

> <img width="792" height="819" alt="Screenshot 2025-09-15 111031" src="https://github.com/user-attachments/assets/24d424d0-333d-40f9-8035-ad951a065564" />

---

## 🌐 Despliegue en la web

> https://ventry.pages.dev/login
> Usuarios de prueba: admin - 123456, johndoe - 123456

---
## ⚙️ Herramients en la nube

Aws para la creación de cloud functions par autenticar usuarios:
- ventry-user-register
- ventry-login

Las variables de ambiente

> HASURA_ADMIN_SECRET
> HASURA_GRAPHQL_ENDPOINT
> JWT_SECRET

---

Ventry es un sistema de gestión de inventario, diseñado con un enfoque **offline-first**. Te permite gestionar productos, almacenes y movimientos de stock incluso cuando pierdes la conexión a internet. Todos los cambios se sincronizan automáticamente cuando se restablece la conectividad.

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

- **Arquitectura offline-first:** Todas las funciones principales (CRUD de productos, almacenes, movimientos, inventario) funcionan sin conexión a internet.
- **Sincronización automática:** Las acciones pendientes se encolan y sincronizan al recuperar la conectividad.
- **Caché con IndexedDB:** Los datos se almacenan localmente para acceso rápido y confiable.
- **Feedback al usuario:** La interfaz notifica sobre el estado offline y los eventos de sincronización.

## Recursos adicionales

Para más información sobre el uso de Angular CLI, incluyendo referencias detalladas de comandos, visita la [documentación oficial de Angular CLI](https://angular.dev/tools/cli).
