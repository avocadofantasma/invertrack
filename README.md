# Invertrack 📈

**Control de inversiones para SOFIPOs, bancos y casas de bolsa en México.**

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)

## Features

- 🏦 **Multi-institución**: Nu (cajitas), Didi, Mercado Pago, Openbank, GBM+, Bitso, y más
- 📊 **Sub-cuentas**: Maneja múltiples cajitas de Nu, ETFs y acciones en GBM+, etc.
- ⚠️ **Alertas de límite**: Detecta topes duros (Nu Turbo) y tasas reducidas (Didi, MercadoPago)
- 📈 **Tasa efectiva**: Calcula automáticamente la tasa mezclada cuando sobrepasas el máximo
- 🔮 **Proyecciones**: A 6 y 12 meses con interés compuesto
- 🧮 **Simulador "¿Qué pasaría si...?"**: Proyecta abonos mensuales con interés compuesto
- 📡 **Datos de mercado en vivo**: CoinGecko (crypto) y Yahoo Finance (acciones/ETFs)
- 💾 **Export/Import JSON**: Backup manual de tus datos
- 🌙 **Dark mode**: Diseño oscuro elegante por defecto

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: Zustand (persistent localStorage)
- **Data fetching**: TanStack React Query
- **Charts**: Recharts
- **Animations**: Framer Motion
- **UI**: Custom design system (shadcn-inspired)
- **Notifications**: Sonner

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## Project Structure

```
src/
├── app/
│   ├── api/market/       # Yahoo Finance proxy API route
│   ├── globals.css        # Tailwind + custom styles
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Main page (setup/dashboard router)
│   └── providers.tsx      # React Query provider
├── components/
│   ├── setup-wizard.tsx   # Onboarding flow
│   ├── dashboard.tsx      # Main dashboard
│   ├── accounts-table.tsx # Accounts with institution grouping
│   ├── movements-list.tsx # Transaction history
│   ├── add-movement-modal.tsx
│   ├── projections-chart.tsx  # Recharts projections
│   ├── what-if-simulator.tsx  # Monthly contribution simulator
│   └── data-manager.tsx   # Export/Import/Reset
├── hooks/
│   └── use-market-data.ts # React Query hooks for market APIs
└── lib/
    ├── types.ts           # TypeScript types + defaults
    ├── utils.ts           # Formatting + helpers
    ├── calculations.ts    # Financial engine
    ├── store.ts           # Zustand state management
    └── market-data.ts     # CoinGecko + Yahoo Finance APIs
```

## How It Works

### Data Flow

```
Cuentas (config) → Movimientos (registros) → Cálculos → Resumen + Proyecciones
```

1. **Cuentas**: Define instituciones, sub-cuentas, tasas, límites
2. **Movimientos**: Registra depósitos, retiros, reinversiones
3. **Motor de cálculos**: Saldos, tasas efectivas, alertas, interés compuesto
4. **Dashboard**: Visualiza todo en tiempo real

### Limit Types

| Tipo | Ejemplo | Comportamiento |
|------|---------|----------------|
| **Sin límite** | Nu Cuenta Inteligente | Sin tope |
| **Tope duro** | Nu Cajita Turbo ($50k) | No puedes invertir más |
| **Tope + Reduce** | Didi ($100k → 5%), MercadoPago ($50k → 3%) | La tasa baja al exceder |

### Effective Rate Calculation

For "Tope + Reduce" accounts exceeding the limit:

```
effectiveRate = (maxAmount × normalRate + (balance - maxAmount) × reducedRate) / balance
```

## Market Data APIs

- **CoinGecko** (free, no key): Crypto prices and returns
- **Yahoo Finance** (proxied via API route): Stocks and ETFs
- **Fallback values**: If APIs fail, uses historical averages

## Customization

### Adding a New Institution

1. Go through the setup wizard, or
2. Edit `src/lib/types.ts` → `DEFAULT_ACCOUNTS` array

### Changing Default Rates

Edit the account data in `src/lib/types.ts`. Rates are stored as decimals (0.15 = 15%).

## License

MIT
