# Reglas del Proyecto: Gestión, Integridad y Desarrollo

> **IMPORTANTE**: Estas reglas son de obligado cumplimiento en todas las sesiones y modificaciones sobre este proyecto.

---

## 🚫 1. Prohibición de Creación de Datos de Ejemplo
* **No crear ni insertar nuevos datos de prueba o ejemplo** (clientes, sistemas, dispositivos, etc.) en la base de datos a menos que el usuario lo solicite y **autorice explícitamente**.

## 🚫 2. Prohibición de Eliminación de Datos
* **No borrar, vaciar, truncar ni alterar destructivamente registros existentes** en la base de datos (clientes, sistemas, dispositivos, catálogos, configuraciones) hasta que el usuario lo **autorice explícitamente**.

## ❓ 3. Prohibición de Asumir o Inventar ante Dudas
* **Si existe cualquier duda, ambigüedad o falta de información sobre cómo hacer algo, NO inventar ni asumir**. Preguntar siempre al usuario para aclararlo antes de tomar decisiones o realizar cambios.

## 🔄 4. Recompilación Obligatoria de Contenedores Docker
* **Siempre que se realice cualquier cambio en el código y el aplicativo esté montado en Docker, recompilar y recrear obligatoriamente el/los contenedores afectados (`docker compose up -d --build`)** para asegurar que los cambios surtan efecto de forma real e inmediata.
