# Plan de migración: localStorage → Turso

## Contexto

Actualmente todos los datos viven en `localStorage` bajo la clave `invertrack-data`, gestionados por Zustand en `src/lib/store.ts`. El objetivo es migrar a Turso (SQLite en la nube) para poder acceder y registrar datos desde el teléfono, y preparar el terreno para un endpoint de AI en lenguaje natural.

Stack: Next.js 14, TypeScript, Zustand, sin backend actualmente.

---

## Modelo de datos actual

13 entidades en `AppState`:

| Entidad | Tipo de dato | Notas |
|---|---|---|
| `accounts` | Array de objetos planos | Configuración de cuentas de inversión |
| `movements` | Array | Depósitos/retiros por cuenta |
| `initialBalances` | Array | Balance inicial por cuenta |
| `monthlyContributions` | Array | Aportaciones mensuales automáticas |
| `marketData` | Record (ticker → datos) | Caché de precios, se puede refrescar |
| `incomeSources` | Array | Fuentes de ingreso configuradas |
| `incomeEntries` | Array | Ingresos registrados |
| `fixedExpenses` | Array | Gastos fijos configurados |
| `expenseEntries` | Array | Gastos registrados |
| `creditCards` | Array | Tarjetas de crédito |
| `creditCardStatements` | Array con `transactions` anidadas | Estados de cuenta con transacciones |
| `loans` | Array | Préstamos |
| `loanPayments` | Array | Pagos de préstamos |
| `monthlyBudgets` | Array con `incomeTargets`/`expenseLimits` anidados | Presupuestos mensuales complejos |
| `financeSettings` | Objeto | Configuración (API key, días recordatorio) |
| `dismissedReminders` | Array de strings | IDs de recordatorios descartados |

---

## Estrategia de schema en Turso

Dado que varias entidades tienen objetos anidados complejos (`CreditCardStatement.transactions`, `MonthlyBudget.incomeTargets/expenseLimits`, `Account` con muchos campos opcionales), la estrategia más simple es **una tabla por entidad, con una columna `data JSON`**. Evita mapear cada campo a columnas y mantiene la migración trivial.

```sql
-- Patrón general
CREATE TABLE IF NOT EXISTS <entity> (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL  -- JSON serializado
);

-- Entidades sin id propio
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL  -- JSON serializado
);
```

Tablas concretas:
- `accounts`, `movements`, `initial_balances`, `monthly_contributions`
- `income_sources`, `income_entries`
- `fixed_expenses`, `expense_entries`
- `credit_cards`, `credit_card_statements`
- `loans`, `loan_payments`
- `monthly_budgets`
- `app_config` → guarda `marketData`, `financeSettings`, `setupComplete`, `dismissedReminders`

---

## Pasos de implementación

### Fase 1 — Setup de Turso

1. Crear cuenta en [turso.tech](https://turso.tech) (free tier)
2. Crear base de datos: `turso db create invertrack`
3. Obtener URL y auth token: `turso db show invertrack --url` y `turso db tokens create invertrack`
4. Agregar al `.env.local`:
   ```
   TURSO_DATABASE_URL=libsql://...
   TURSO_AUTH_TOKEN=...
   ```

### Fase 2 — Instalar dependencias

```bash
pnpm add @libsql/client
```

### Fase 3 — Cliente y schema

Crear `src/lib/db.ts`:
```ts
import { createClient } from "@libsql/client";

export const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});
```

Crear `src/lib/db-schema.ts` con el SQL de inicialización (CREATE TABLE IF NOT EXISTS para cada entidad).

Crear API route `src/app/api/init-db/route.ts` que ejecute el schema al primer arranque (o hacerlo en `next.config.js`).

### Fase 4 — API routes de datos

Reemplazar `loadFromStorage` / `saveToStorage` con API routes:

```
GET  /api/data          → devuelve AppState completo (para hydrate inicial)
POST /api/data/[entity] → upsert de un registro
DELETE /api/data/[entity]/[id] → eliminar registro
```

Alternativamente, una sola route `POST /api/data` que recibe el AppState completo y hace upsert masivo (más simple, menos eficiente).

### Fase 5 — Modificar el store

Cambios en `src/lib/store.ts`:

1. Eliminar `loadFromStorage` y `saveToStorage`
2. Cambiar `hydrate()` para hacer `fetch('/api/data')` en lugar de leer localStorage
3. Cambiar la función `update()` para hacer `fetch('/api/data/[entity]', { method: 'POST', body: ... })` además de (o en lugar de) `saveToStorage`
4. Mantener Zustand como capa de estado en memoria — solo cambia la persistencia

### Fase 6 — Migración de datos existentes

Script de migración único (ejecutar una vez desde el browser o Node):

```ts
// El exportData() del store ya genera el JSON completo
// Pegarlo en un script que haga fetch('/api/migrate', { method: 'POST', body: exportData() })
// La API route lo procesa e inserta todo en Turso
```

O más simple: usar el botón "Exportar" existente, guardar el JSON, y crear una ruta `POST /api/import` que cargue ese JSON a Turso.

### Fase 7 — Endpoint de AI (lenguaje natural)

Una vez en Turso, agregar:

```
POST /api/chat
Body: { message: "Gasté 350 en gasolina ayer" }
```

Flujo interno:
1. Llamar Claude API con `tool_use` definiendo las herramientas: `add_expense_entry`, `add_income_entry`, `add_movement`
2. Claude parsea el mensaje y devuelve la llamada a herramienta con los parámetros
3. El API route ejecuta el INSERT en Turso
4. Responde con confirmación

Desde el teléfono: cualquier app de shortcuts (iOS Shortcuts, Siri, o una PWA mínima) puede hacer POST a este endpoint.

---

## Consideraciones

- **Sin auth**: la app sigue siendo solo para ti, sin autenticación. La URL de Turso con token es suficiente seguridad para uso personal.
- **marketData**: no vale la pena migrar a Turso, es caché de precios. Puede quedar en localStorage o en memoria (se refresca al abrir la app).
- **financeSettings.openaiApiKey**: actualmente guarda una API key en localStorage. Moverla a `.env.local` o variable de entorno del servidor es más seguro.
- **Rollback**: el `exportData()` existente permite volver a localStorage en cualquier momento.
- **Offline**: si quieres funcionar sin internet, puedes mantener Zustand como capa de escritura optimista y sincronizar con Turso en background.

---

## Orden recomendado de ejecución

1. Fase 1 + 2 (setup, ~30 min)
2. Fase 3 (schema + cliente, ~1 hora)
3. Fase 4 + 5 (API routes + store, ~3-4 horas — el cambio más grande)
4. Fase 6 (migración de datos, ~30 min)
5. Fase 7 (AI, ~2 horas, en otra sesión)
