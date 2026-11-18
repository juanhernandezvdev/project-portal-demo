# Portal de Proyectos — Demo

Aplicación de ejemplo para dar seguimiento a proyectos, entregables, licencias, documentos, pagos y solicitudes de soporte. La interfaz está construida con React y TypeScript; Firebase Authentication y Cloud Firestore proporcionan los servicios de datos cuando se configura un proyecto propio.

Todos los nombres, registros y datos financieros de la interfaz son ficticios. No uses la demo para procesar pagos ni para almacenar información real.

## Tecnologías

- React y TypeScript
- Vite
- Firebase Authentication y Cloud Firestore
- Tailwind CSS y Lucide

## Empezar

Requiere Node.js y npm.

```bash
npm install
```

Después, copia `.env.example` como `.env.local` (en PowerShell: `Copy-Item .env.example .env.local`).
Completa `.env.local` con la configuración de tu propio proyecto Firebase y con el correo de la cuenta que debe ver las herramientas de administración. Luego ejecuta:

```bash
npm run dev
```

También puedes usar **Explorar como invitado** sin configurar Firebase. La demo usa registros ficticios y los cambios se mantienen solo en memoria durante esa sesión.

Los valores de `.env.local` son locales y no deben subirse al repositorio. Para compilar y revisar el código:

```bash
npm run lint
npm run build
```

## Configuración de Firebase

1. Crea un proyecto Firebase propio y habilita Authentication con correo y contraseña, además de Cloud Firestore.
2. Copia los valores de la configuración de la aplicación web en las variables `VITE_FIREBASE_*` de `.env.local`.
3. Configura `VITE_FIREBASE_ADMIN_EMAIL` con el correo de una cuenta de prueba de ese proyecto.
4. Define reglas de Firestore que autentiquen a cada usuario y limiten el acceso a los proyectos que le corresponden.

La comprobación de administrador del cliente solo controla qué controles muestra la interfaz; no sustituye las reglas de seguridad de Firestore. No conectes esta demo a un proyecto con datos reales.

## Estructura principal

- `src/App.tsx`: vistas, estado de la interfaz y acciones de proyectos.
- `src/firebase.ts`: inicialización de Firebase desde variables de entorno.
- `src/index.css` y `src/App.css`: estilos globales y de la aplicación.
- `public/`: recursos estáticos.

El botón **Poblar Datos Demo** agrega registros ficticios al proyecto seleccionado para facilitar una presentación de la interfaz.
