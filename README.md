# 📦 Inventario de Dispositivos por Cliente

![Versión](https://img.shields.io/badge/versión-2.7.0-blue.svg)
![Licencia](https://img.shields.io/badge/licencia-MIT-green.svg)
![React](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite%20%7C%20TypeScript-61DAFB?logo=react)
![Node.js](https://img.shields.io/badge/Backend-Node.js%2020%20%7C%20Express-339933?logo=node.js)
![PostgreSQL](https://img.shields.io/badge/Base%20de%20Datos-PostgreSQL%2015-4169E1?logo=postgresql)
![Oracle](https://img.shields.io/badge/Integración-Oracle%20ERP%20Beta%2010-F80000?logo=oracle)
![Docker](https://img.shields.io/badge/Despliegue-Docker%20Compose%20%7C%20Nginx-2496ED?logo=docker)

Plataforma Web integral para la **gestión, auditoría y control de inventario de dispositivos informáticos y sistemas de seguridad** organizados jerárquicamente por Cliente, Sistema y Subsistema técnico (Red, CCTV, Interfonía, Control de Accesos e Intrusión/Alarma), con integración directa a **Oracle ERP Beta 10**, archivado en cascada, gestión documental con visor de Excel integrado, exportación corporativa en Excel/PDF, notas técnicas y copias de seguridad.

---

## 📐 1. Arquitectura del Sistema

La solución utiliza una arquitectura desacoplada basada en microservicios contenerizados y orquestados mediante **Docker Compose**:

```
                                  [ Usuario / Navegador Web ]
                                              │
                                      ( Puerto 3000 / HTTP )
                                              ▼
                              ┌─────────────────────────────────┐
                              │    inventario_frontend          │
                              │  (Nginx 1.25 + React 18 SPA)    │
                              └────────────────┬────────────────┘
                                               │ Proxy /api/ & /uploads/
                                               ▼
                              ┌─────────────────────────────────┐       (Conexión TCP / 1521)
                              │     inventario_backend          │ ───────────────────────────────► ┌──────────────────────────┐
                              │ (Node.js 20 + Express API REST) │                                  │  Oracle ERP Beta 10      │
                              └────────────────┬────────────────┘                                  │  (Consulta / Importación)│
                                               │ Prisma ORM (TCP 5432)                             └──────────────────────────┘
                                               ▼
                              ┌─────────────────────────────────┐
                              │    inventario_postgres          │
                              │    (PostgreSQL 15-Alpine)       │
                              └─────────────────────────────────┘
```

### 🔹 Componentes Principales:
* **Frontend SPA (`inventario_frontend`)**: Desarrollado en **React 18**, **TypeScript**, **Vite** y **Tailwind / Lucide Icons**. Incluye interfaz adaptativa con modo oscuro automático, componentes reutilizables (`CustomSelect`), pestañas de filtrado de estado (Activos / Archivados / Todos), visor de archivos adjuntos (con soporte nativo para previsualización interactiva de **Excel**), exportador dual (**Excel con tablas nativas y PDF corporativo para clientes**), modales de importación y asistentes de lote.
* **Backend API REST (`inventario_backend`)**: Desarrollado en **Node.js 20** con **Express** y **TypeScript**. Incorpora autenticación mediante **JWT**, control de permisos granulares, cifrado **AES-256-GCM** para credenciales de equipos, subida de archivos multipart con **Multer**, conector **OracleDB** (`oracledb`) para ERP Beta 10, motor de copias de seguridad y documentación interactiva con **Swagger UI**.
* **Base de Datos (`inventario_postgres`)**: Instancia de **PostgreSQL 15** gestionada mediante **Prisma ORM**. Maneja integridad referencial en cascada, índices optimizados y persistencia volumétrica.
* **Integración Externa (ERP Beta 10)**: Conector de solo lectura contra bases de datos Oracle para sincronización e importación masiva de Clientes y Sistemas.
* **Orquestación & Autoarranque**: Configuración en **Docker Compose** con proxy inverso Nginx y scripts de inicio desasistido para Windows Task Scheduler.

---

## 🗄️ 2. Modelo de Datos y Entidades

El modelo relacional en Prisma soporta jerarquías organizativas completas, archivado en cascada, gestión documental y credenciales cifradas:

```mermaid
erDiagram
    User ||--o{ SystemNote : "registra"
    User ||--o{ SystemAttachment : "sube"
    Client ||--o{ System : "posee (cascada)"
    Client ||--o{ Device : "pertenece a"
    Subsystem ||--o{ System : "clasifica"
    Subsystem ||--o{ DeviceType : "agrupa"
    Subsystem ||--o{ Device : "pertenece a"
    DeviceType ||--o{ Device : "define tipo de"
    DeviceStatus ||--o{ Device : "estado de"
    System ||--o{ Device : "contiene (cascada)"
    System ||--o{ SystemNote : "registra (cascada)"
    SystemAttachment }o--|| System : "adjunto a (cascada)"

    User {
        string id PK
        string username UK
        string passwordHash
        string name
        string role "ADMIN / USER"
        string permissions "JSON Permisos"
    }

    Client {
        string id PK
        string name "Nombre Comercial"
        string legalName "Nombre Fiscal"
        string cif "NIF / CIF"
        string manualId "ID Manual / ERP"
        string notes "Observaciones"
        boolean isArchived "Estado Archivado"
    }

    Subsystem {
        string id PK
        string name UK "Red, CCTV, Intrusión, etc."
        string color "Hexadecimal"
        string icon "Icono Lucide"
        string description
    }

    DeviceType {
        string id PK
        string name "Cámara IP, Switch PoE, etc."
        string description
        string subsystemId FK
    }

    DeviceStatus {
        string id PK
        string name UK "Operativo, Baja, etc."
        string color "Hexadecimal"
        string description
    }

    System {
        string id PK
        string name "Nombre del Sistema"
        string code "Código / Nº Abonado"
        string description
        string notes
        string clientId FK
        string subsystemId FK
        boolean isArchived "Estado Archivado"
    }

    SystemNote {
        string id PK
        string systemId FK
        string title "Título / Etiqueta"
        string content "Texto de la nota"
        string createdBy "Usuario autor"
    }

    SystemAttachment {
        string id PK
        string systemId FK
        string filename "Nombre original"
        string storedName "Nombre en disco"
        string filePath "Ruta"
        string mimeType "application/pdf, image/..."
        int fileSize "Bytes"
        string createdBy
    }

    Device {
        string id PK
        string assignedName "Nombre Asignado"
        string brand "Marca"
        string model "Modelo"
        string serialNumber "Nº Serie"
        string ipAddress "Dirección IP"
        string subnetMask "Máscara de Subred"
        string gateway "Puerta de Enlace"
        string macAddress "Dirección MAC"
        string rackCabinet "Armario / Rack"
        string switchName "Switch Ref."
        string switchPort "Puerto Switch"
        string credentialsEncrypted "JSON cifrado AES-256-GCM"
        string communicationPorts "JSON Puertos"
        string systemId FK
        string clientId FK
        string subsystemId FK
        string deviceTypeId FK
        string statusId FK
    }
```

---

## ✨ 3. Características y Funcionalidades Principales

### 🏢 Gestión de Clientes y Sistemas con Archivado Inteligente
* Organización jerárquica: **Cliente** ➔ **Sistemas** ➔ **Dispositivos**.
* **Archivado en Cascada**: Al archivar un cliente, todos sus sistemas asociados se archivan automáticamente dentro de una transacción en base de datos. Al desarchivar el cliente, se recuperan todos sus sistemas.
* **Pestañas de Filtrado**: Selector rápido para conmutar entre registros `Activos`, `Archivados` o `Todos` con contadores en tiempo real.
* Búsqueda global instantánea por nombre comercial, razón social, NIF o ID de cliente.

### 🔌 Integración Directa con Oracle ERP Beta 10
* Conector de base de datos Oracle para consultar el ERP empresarial en tiempo real.
* Búsqueda unificada de clientes por nombre, razón social, CIF o ID en Beta 10.
* **Importación en 1 Clic**: Importa el cliente y sus sistemas técnicos registrados (CCTV, Intrusión, Incendio, Control de accesos) mapeándolos automáticamente a la estructura del inventario.

### 📷 Inventario Técnico Detallado de Dispositivos
* Ficha técnica completa por equipo: Marca, Modelo, Nº de Serie, Configuración de Red (Dirección IP, Máscara de Subred, Puerta de Enlace / Gateway), Dirección MAC, Armario/Rack, Switch de conexión y Puerto de red.
* **Estados y Distintivos**: Colores configurables (*Operativo*, *Falta instalación*, *En mantenimiento*, *Baja*).
* **Filtros Avanzados**: Desplegables customizados (`CustomSelect`) con búsqueda integrada por Subsistema y Estado.
* **Eliminación Masiva por Sistema**: Opción para vaciar todos los dispositivos de un sistema con confirmación de seguridad.

### 📑 Exportación Dual: Excel y PDF con Gestión de Credenciales
* **Selector Unificado de Exportación**: Ventana modal interactiva accesible desde el menú *Opciones* del sistema.
* **Exportación a Excel (`.xlsx`)**:
  - Generación de **tablas nativas de Microsoft Excel (`TableStyleMedium9`)** con filtros desplegables automáticos, filas alternas sombreadas (*Zebra Striping*) e inmovilización de paneles (*Freeze Panes*).
  - Tipografía Segoe UI, anchos automáticos y alineaciones ajustadas por tipo de dato.
* **Exportación a PDF (`.pdf`)**:
  - Dossier corporativo maquetado en A4 horizontal (*Landscape*), diseñado especialmente para presentación a clientes.
  - Cabecera oficial con metadatos del Cliente y Sistema, tablas de equipos agrupadas por subsistema y pie de página confidencial con paginación dinámica (*Página X de Y*).
* **Control de Privacidad / Credenciales**:
  - Opción para incluir o excluir contraseñas y accesos.
  - Si se activa en PDF, incorpora la columna `CREDENCIALES` en formato directo `usuario/contraseña`.

### 📊 Importación Masiva Oficial en Excel (`importacion_dispositivos.xlsx`)
* **Plantilla Estructurada de 19 Campos**: Descarga directa de la plantilla oficial con los campos estandarizados:
  `SUBSISTEMA`, `TIPO_DISPOSITIVO`, `ESTADO`, `NOMBRE`, `MARCA`, `MODELO`, `NUMERO_SERIE`, `IP`, `MASCARA`, `PUERTA_ENLACE`, `MAC`, `RACK`, `SWITCH`, `SWITCH_PUERTO`, `USUARIO_DESCRIPCION`, `USUARIO`, `CONTRASEÑA`, `PUERTO`, `PUERTO_NOMBRE`.
* **Guía de Campos Integrada**: Segunda pestaña con explicaciones de obligatoriedad y ejemplos para CCTV, Red, Intrusión, Control de Accesos e Interfonía.
* **Detección Interactiva de Nuevos Catálogos**: Al importar, detecta automáticamente si el archivo contiene subsistemas o tipos de dispositivos no registrados y solicita confirmación al usuario antes de registrarlos.

### 📎 Visor Preliminar de Archivos y Hojas Excel en Adjuntos
* **Visor Integrado de Excel**: Previsualización directa de libros `.xlsx`, `.xls`, `.ods`, `.xlsm` sin descargas externas.
* **Navegación Multi-Hoja**: Pestañas superiores para alternar entre hojas con recuento de filas.
* **Buscador en Tiempo Real**: Filtrado dinámico de celdas y filas en la hoja activa.
* **Previsualización Multimedia**: Soporte integrado para PDF, imágenes (PNG, JPG, SVG, WebP), archivos de texto y código, audio y vídeo.

### 🔐 Bóveda de Credenciales Cifradas (AES-256-GCM)
* Almacenamiento seguro de múltiples cuentas de acceso por dispositivo (Administrador, Operador, RTSP, etc.).
* Cifrado en reposo simétrico con vector de inicialización (IV) único y verificación de integridad (GCM Tag).

### 💾 Copias de Seguridad y Restauración
* Generación y exportación de backups integrales de la base de datos en formato JSON descargable.
* Asistente de restauración directa desde la interfaz para recuperación ante desastres.

### 👥 Gestión de Usuarios y Permisos
* Control de acceso mediante tokens JWT con expiración configurable.
* Roles de usuario (`ADMIN` / `USER`) con panel de administración de cuentas y contraseñas.

---

## ⚙️ 4. Configuración de Variables de Entorno (`.env`)

Crea un archivo `.env` en la raíz del proyecto tomando como base `.env.example`:

```env
# ==========================================
# CONFIGURACIÓN DE VARIABLES DE ENTORNO (DOCKER)
# Inventario de Dispositivos por Cliente
# ==========================================

# Credenciales y Configuración de PostgreSQL
POSTGRES_DB=inventario_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgrespassword
POSTGRES_PORT=5432

# Configuración y Secretos de Backend API
BACKEND_PORT=3001
JWT_SECRET=supersecret_jwt_key_inventario_2026
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# Puerto de la Aplicación Frontend Web
FRONTEND_PORT=3000

# Conexión Oracle ERP Beta 10
ORACLE_HOST=172.16.90.20
ORACLE_PORT=1521
ORACLE_SERVICE_NAME=BETA10
ORACLE_USER=satya_only_reader
ORACLE_PASSWORD=tu_password_oracle
```

---

## 🚀 5. Despliegue con Docker Compose

### Requisitos Previos:
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) (v20+) o Docker Engine con Docker Compose v2.

### Pasos de Puesta en Marcha:

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/nbcloud97/0001_INVENTARIO_DISPOSITIVOS.git
   cd 0001_INVENTARIO_DISPOSITIVOS
   ```

2. **Configurar el entorno**:
   ```bash
   cp .env.example .env
   # Editar .env con los secretos y credenciales deseadas
   ```

3. **Construir y arrancar los contenedores**:
   ```bash
   docker compose up -d --build
   ```

4. **Acceso a la plataforma**:
   * **Aplicación Web**: [http://localhost:3000](http://localhost:3000)
   * **API Backend**: [http://localhost:3001/health](http://localhost:3001/health)
   * **Documentación Swagger API**: [http://localhost:3001/api/docs](http://localhost:3001/api/docs)

5. **Credenciales iniciales**:
   * **Usuario:** `admin`
   * **Contraseña:** `admin123`

---

## 🖥️ 6. Configuración de Autoarranque en Windows

El proyecto incluye scripts automatizados para programar el inicio de los contenedores Docker automáticamente al encender el equipo Windows (como servicio de sistema desasistido sin necesidad de login previo):

1. Hacer clic derecho sobre `INSTALAR_AUTOARRANQUE_WINDOWS.bat`.
2. Seleccionar **Ejecutar como administrador**.
3. El script creará la tarea programada `Inventario_AutoStart_OnBoot` en el Programador de Tareas de Windows vinculada a `scripts/run_docker_compose.bat`.

---

## 📚 7. Catálogo de Endpoints de la API REST

La API se documenta interactivamente en `/api/docs`. A continuación se resume la tabla de endpoints principales:

| Módulo | Método | Endpoint | Descripción |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/v1/auth/login` | Iniciar sesión y obtener token JWT |
| | `GET` | `/api/v1/auth/me` | Verificar identidad del token activo |
| **Clientes** | `GET` | `/api/v1/clients` | Listar clientes (soporta filtros `search` e `isArchived`) |
| | `POST` | `/api/v1/clients` | Registrar un nuevo cliente |
| | `PUT` | `/api/v1/clients/:id` | Actualizar cliente / archivar (cascada a sistemas) |
| | `DELETE` | `/api/v1/clients/:id` | Eliminar cliente y sus dependencias |
| **Sistemas** | `GET` | `/api/v1/systems` | Listar sistemas con conteo de dispositivos |
| | `POST` | `/api/v1/systems` | Crear sistema vinculado a cliente y subsistema |
| | `PUT` | `/api/v1/systems/:id` | Modificar sistema o alternar archivado |
| | `DELETE` | `/api/v1/systems/:id` | Eliminar sistema |
| **Notas** | `GET` | `/api/v1/systems/:systemId/notes` | Obtener notas técnicas de un sistema |
| | `POST` | `/api/v1/systems/notes` | Añadir nueva nota a un sistema |
| | `DELETE` | `/api/v1/systems/notes/:id` | Eliminar nota técnica |
| **Adjuntos** | `GET` | `/api/v1/systems/:systemId/attachments` | Listar adjuntos de un sistema |
| | `POST` | `/api/v1/systems/attachments` | Subir archivo adjunto (Multipart) |
| | `GET` | `/api/v1/systems/attachments/:id/download` | Descargar archivo adjunto |
| | `GET` | `/api/v1/systems/attachments/:id/preview` | Previsualizar adjunto (PDF / Imagen / Excel) |
| | `DELETE` | `/api/v1/systems/attachments/:id` | Borrar archivo adjunto |
| **Dispositivos** | `GET` | `/api/v1/devices` | Consultar dispositivos filtrados |
| | `POST` | `/api/v1/devices` | Crear dispositivo individual |
| | `POST` | `/api/v1/devices/bulk` | Creación secuencial en lote (Asistente) |
| | `POST` | `/api/v1/devices/import` | Importación masiva desde archivo Excel |
| | `GET` | `/api/v1/devices/:id/credentials` | Obtener credenciales descifradas (AES-256) |
| | `PUT` | `/api/v1/devices/:id` | Actualizar datos del dispositivo |
| | `DELETE` | `/api/v1/devices/:id` | Eliminar dispositivo |
| | `DELETE` | `/api/v1/systems/:systemId/devices` | Eliminar todos los dispositivos de un sistema |
| **Subsistemas** | `GET` | `/api/v1/subsystems` | Listado de subsistemas de seguridad |
| | `POST` | `/api/v1/subsystems` | Crear nuevo subsistema |
| **Tipos** | `GET` | `/api/v1/device-types` | Catálogo de tipos de equipo |
| | `POST` | `/api/v1/device-types` | Registrar tipo de equipo en subsistema |
| **Estados** | `GET` | `/api/v1/device-statuses` | Listado de estados de equipo |
| | `POST` | `/api/v1/device-statuses` | Crear nuevo estado con color |
| **Beta 10** | `GET` | `/api/v1/beta10/search` | Buscar clientes en base de datos Oracle ERP |
| | `GET` | `/api/v1/beta10/clients/:idcliente/systems` | Obtener sistemas del cliente en Beta 10 |
| | `POST` | `/api/v1/beta10/import` | Importar cliente y sistemas seleccionados |
| **Backups** | `GET` | `/api/v1/backup/stats` | Estadísticas del almacén de datos |
| | `GET` | `/api/v1/backup/export` | Generar y descargar archivo de copia de seguridad |
| | `POST` | `/api/v1/backup/restore` | Restaurar base de datos desde archivo JSON |
| **Usuarios** | `GET` | `/api/v1/users` | Listado de usuarios del sistema |
| | `POST` | `/api/v1/users` | Crear usuario con rol y permisos |
| | `PUT` | `/api/v1/users/:id` | Modificar usuario o actualizar contraseña |
| | `DELETE` | `/api/v1/users/:id` | Eliminar usuario |

---

## 💻 8. Desarrollo Local (Sin Docker)

```bash
# 1. Configuración de Backend
cd backend
npm install
# Asegurar DATABASE_URL en backend/.env
npx prisma db push
npm run db:seed
npm run dev

# 2. Configuración de Frontend
cd ../frontend
npm install
npm run dev
```

---

## 📄 9. Licencia

Este proyecto está bajo la Licencia **MIT**. Libre para uso, modificación y distribución empresarial.
