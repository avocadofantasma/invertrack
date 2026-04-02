Parse a credit card statement PDF or image file and output JSON ready to import into Invertrack.

## Usage
```
/parse-statement <path-to-file>
```

## Instructions

The user has provided a file path as an argument. Read the file and extract all credit card statement data from it.

**Steps:**
1. Read the file at the path provided in the arguments using the Read tool (for PDFs and images, the tool will display the contents visually)
2. Extract all data visible in the statement
3. Output ONLY a valid JSON object with this exact structure — no explanation, no markdown fences, just the raw JSON:

```
{
  "statementDate": "YYYY-MM-DD",
  "cutDate": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD",
  "totalBalance": 12345.67,
  "minimumPayment": 500.00,
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "Store or merchant name",
      "amount": 123.45,
      "category": "food",
      "installment": {
        "current": 7,
        "total": 12,
        "remainingBalance": 9487.80
      }
    }
  ]
}
```

**Rules:**
- `statementDate`: the statement period end date or issue date
- `cutDate`: fecha de corte (closing date of the billing cycle)
- `dueDate`: fecha límite de pago (payment due date)
- `totalBalance`: total amount owed (positive number, MXN)
- `minimumPayment`: pago mínimo (positive number, MXN)
- `transactions`: all individual charges/purchases visible — amounts are positive numbers
- `category` must be one of: `despensa`, `food`, `cine`, `suscripciones`, `transport`, `entertainment`, `shopping`, `services`, `health`, `education`, `other`
  - `despensa` — supermarkets and grocery stores (Walmart, Soriana, Chedraui, La Comer, Costco, Sam's Club, etc.)
  - `food` — restaurants, fast food, cafes, food delivery (OXXO food, Rappi food, etc.)
  - `cine` — movie theaters (Cinépolis, Cinemex)
  - `suscripciones` — recurring subscription platforms (Netflix, Spotify, Disney+, HBO Max, Apple TV, YouTube Premium, Amazon Prime, Duolingo, iCloud, etc.)
  - `transport` — gas stations, Uber, public transport, tolls, parking
  - `entertainment` — other entertainment not covered by `cine` (concerts, events, gaming)
  - `shopping` — general retail, clothing, electronics, home goods
  - `services` — insurance, utilities, phone bills, bank fees, professional services
  - `health` — pharmacies, hospitals, doctors, gyms
  - `education` — schools, courses, books, stationery
  - `other` — anything that doesn't clearly fit the above
- If a field cannot be determined from the document, use `null`
- All dates in ISO format: YYYY-MM-DD
- Currency is MXN (Mexican pesos)
- Do NOT include payments/credits as transactions — only charges/purchases
- For installment payments (MSI / meses sin intereses / "cargo X de Y"), include an `installment` object:
  - `current`: current installment number (e.g. 7)
  - `total`: total number of installments (e.g. 12)
  - `remainingBalance`: pending balance remaining after this payment — use the value from the MSI summary section ("Saldo pendiente") if available, otherwise calculate as `amount × (total - current)`
- For non-installment transactions, omit the `installment` field entirely

After outputting the JSON, also write it to a `.json` file next to the original file so the user can import it directly into Invertrack. Name it the same as the input file but with `.json` extension (e.g. `estado_marzo.pdf` → `estado_marzo.json`).
