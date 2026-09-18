---
trigger: always_on
description: Reglas estrictas de integridad de datos, no suposición y consulta obligatoria ante dudas
---

# Reglas del Proyecto

1. **NO CREAR DATOS DE EJEMPLO SIN AUTORIZACIÓN**:
   - No generar, insertar ni sembrar datos de prueba o ejemplo ficticios en la base de datos a menos que el usuario lo solicite y autorice explícitamente.

2. **NO ELIMINAR DATOS SIN AUTORIZACIÓN**:
   - No borrar, purgar, truncar ni alterar destructivamente registros en la base de datos hasta que el usuario dé su autorización expresa.

3. **NO INVENTAR ANTE DUDAS (PREGUNTAR SIEMPRE)**:
   - Si surge cualquier duda, ambigüedad o falta de requisitos sobre cómo hacer algo, **no inventar ni asumir**. Preguntar directamente al usuario para confirmar el enfoque.

4. **RECOMPILACIÓN OBLIGATORIA DE CONTENEDORES DOCKER**:
   - Siempre que se realice cualquier cambio en el código y el aplicativo esté montado en Docker, **recompilar y recrear obligatoriamente el/los contenedores afectados (`docker compose up -d --build`)** para que los cambios surtan efecto de forma inmediata y real.
