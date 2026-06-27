# Propuesta — Nanytaxi: Sistema de Gestión para Negocio de Taxis

**Estado**: Borrador / Propuesta inicial  
**Fecha**: 2026-06-24  
**Autor**: Gentle AI (Orquestrador SDD)

---

## 1. Problema de negocio

La administradora del negocio (adulta, no nativa digital) lleva actualmente el control de sus 2–5 taxis **en papel**. Esto implica:

- Dificultad para saber al instante el estado de pagos de cada motorista.
- Riesgo constante de **vencer seguros** (SOAT, tecnomecánica, etc.) sin aviso.
- Sin visibilidad del ahorro acumulado por cada taxi.
- Proceso manual propenso a errores y pérdida de información.

## 2. Solución propuesta

Una **aplicación web** accesible desde el navegador (computadora, tablet o celular) que permita a la administradora:

1. **Gestionar motoristas** y sus taxis asociados.
2. **Registrar pagos diarios** (cuota fija por día).
3. **Controlar vencimientos** de seguros y documentos.
4. **Monitorear ahorros diarios** acumulados por cada taxi.
5. **Ver un tablero resumen** con alertas y estado general.

### Principios de diseño

- **Interfaz gigante**: botones grandes, tipografía amplia, alto contraste.
- **Flujo mínimo de clics**: las acciones comunes (como marcar un pago del día) deben requerir 1–2 toques.
- **Navegación simple**: barra inferior con las secciones principales, siempre visible.
- **Sin jerga técnica**: etiquetas en lenguaje cotidiano ("Motoristas", "Pagos", "Vencimientos").
- **Audaz en alertas**: las notificaciones de vencimiento deben ser visualmente inconfundibles.

## 3. Alcance (primera versión)

### Sí incluye

| Funcionalidad | Descripción |
|---|---|
| **Gestión de motoristas** | CRUD: nombre, placa del taxi, día de descanso elegido. |
| **Gestión de taxis** | CRUD: placa, ahorro diario asignado. |
| **Pagos diarios** | Registro de cuota fija diaria por motorista. Fecha, monto, motorista. |
| **Vencimientos** | Registro de seguros con tipo (SOAT, tecnomecánica, tarjeta de operaciones, impuestos, contractual, extracontractual) y fecha de vencimiento. Alertas duales: 30 días y 7 días antes. |
| **Ahorro diario** | Registro del ahorro diario por taxi. Visualización del acumulado. |
| **Tablero principal** | Resumen del día: próximos vencimientos, pagos pendientes/resumidos del día. |
| **Persistencia local** | Los datos se guardan en el navegador (almacenamiento local) para empezar sin servidor. |

### No incluye (por ahora)

- Acceso multi-usuario (motoristas). Se evaluará más adelante.
- Sincronización en la nube o backend remoto.
- Reportes avanzados o exportación a Excel/PDF.
- Versión móvil nativa (la web app será responsiva).
- Notificaciones push (alertas solo visibles al abrir la app).

## 4. Stack tecnológico propuesto

| Capa | Tecnología | Razón |
|---|---|---|
| **Framework frontend** | React + Vite | Ecosistema maduro, componentes, fácil de mantener. |
| **Lenguaje** | TypeScript | Tipado para reducir errores. |
| **Estilos** | Tailwind CSS | Utilidades rápidas, diseño consistente, fácil de hacer grande/accesible. |
| **Ruteo** | React Router | Navegación SPA estándar. |
| **Almacenamiento** | localStorage + Dexie.js (IndexedDB wrapper) | Persistencia local sin servidor, escalable a futuro. |
| **Testing** | Vitest + Testing Library | Se agregará cuando haya funcionalidad que probar. |

> **Nota**: Si más adelante se necesita backend, la arquitectura actual permite migrar a una API REST sin reescribir la UI.

## 5. Arquitectura de navegación

```
[Tablero]  [Motoristas]  [Taxis]  [Pagos]  [Vencimientos]
```

5 pestañas en la barra inferior, siempre visibles. Cada una lleva a su sección correspondiente.

## 6. Supuestos y riesgos

### Supuestos

- La administradora tiene un dispositivo con navegador web moderno (Chrome, Edge).
- Los pagos son siempre en efectivo y se registran manualmente.
- Cada taxi tiene un solo motorista asociado (o uno principal).
- El ahorro diario es un monto fijo por taxi que se acumula para el motorista.

### Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Pérdida de datos locales (navegador) | Alto | Implementar exportación/backup manual desde el inicio. |
| Resistencia al cambio (de papel a app) | Medio | Diseño ultra-intuitivo, onboard simple. |
| Crecimiento futuro no contemplado | Bajo | Arquitectura preparada para migrar a backend. |

## 7. Criterios de éxito

- La administradora puede registrar un pago diario en **menos de 10 segundos**.
- Los vencimientos de seguros son visibles con **al menos 30 días de anticipación**.
- La interfaz requiere **0 instrucciones escritas** para ser usada (todo autoevidente).
- No se pierde información aunque se cierre el navegador.

---

**Próximo paso**: Si esta propuesta está alineada con lo que tenés en mente, pasamos a la **especificación detallada** (spec), donde definimos cada pantalla, cada campo, y cada flujo en detalle.
