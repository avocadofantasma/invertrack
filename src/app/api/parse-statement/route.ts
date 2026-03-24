import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const apiKey = formData.get("apiKey") as string | null;

    if (!file || !apiKey) {
      return NextResponse.json(
        { error: "file and apiKey are required" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = file.type || "application/octet-stream";

    // Determine if it's an image or PDF
    const isImage = mimeType.startsWith("image/");
    const isPDF = mimeType === "application/pdf";

    if (!isImage && !isPDF) {
      return NextResponse.json(
        { error: "Only images (JPG, PNG) and PDF files are supported" },
        { status: 400 }
      );
    }

    const systemPrompt = `You are a financial document parser. Extract credit card statement data from the uploaded document.
Return ONLY valid JSON with this exact structure (no markdown, no code blocks):
{
  "statementDate": "YYYY-MM-DD",
  "cutDate": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD",
  "totalBalance": 12345.67,
  "minimumPayment": 500.00,
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "Store name or description",
      "amount": 123.45,
      "category": "food|transport|entertainment|shopping|services|health|education|other",
      "installment": {
        "current": 7,
        "total": 12,
        "remainingBalance": 9487.80
      }
    }
  ]
}

Rules:
- All amounts should be positive numbers (the sign is implied by context — purchases are expenses)
- Dates must be valid ISO format
- If you cannot determine a field, use null
- Extract ALL transactions visible in the statement
- Categories should be one of: food, transport, entertainment, shopping, services, health, education, other
- Currency is MXN (Mexican pesos)
- For installment payments (MSI / meses sin intereses / "cargo X de Y"), include the installment field with:
  - current: the current installment number
  - total: the total number of installments
  - remainingBalance: the pending balance remaining after this payment (from the MSI summary section if available, otherwise calculate: amount * (total - current))
- For non-installment transactions, omit the installment field entirely`;

    const content: Array<Record<string, unknown>> = [
      {
        type: "text",
        text: "Parse this credit card statement and extract all the data. Return only the JSON object.",
      },
    ];

    if (isImage) {
      content.push({
        type: "image_url",
        image_url: {
          url: `data:${mimeType};base64,${base64}`,
        },
      });
    } else {
      // For PDFs, use file content type
      content.push({
        type: "file",
        file: {
          filename: file.name,
          file_data: `data:${mimeType};base64,${base64}`,
        },
      });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content },
        ],
        max_completion_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: `OpenAI API error: ${errData.error?.message || response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";

    // Try multiple strategies to extract JSON
    let parsed = null;

    // Strategy 1: direct parse
    try { parsed = JSON.parse(text.trim()); } catch {}

    // Strategy 2: strip markdown code fences
    if (!parsed) {
      try {
        const stripped = text.replace(/```(?:json)?\n?/g, "").replace(/```\n?/g, "").trim();
        parsed = JSON.parse(stripped);
      } catch {}
    }

    // Strategy 3: find first { ... last } in the text
    if (!parsed) {
      try {
        const start = text.indexOf("{");
        const end = text.lastIndexOf("}");
        if (start !== -1 && end !== -1) {
          parsed = JSON.parse(text.slice(start, end + 1));
        }
      } catch {}
    }

    if (parsed) {
      return NextResponse.json(parsed);
    }

    return NextResponse.json(
      { error: "No se pudo leer la respuesta de la IA. Intenta con una imagen más clara.", raw: text.slice(0, 500) },
      { status: 422 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
