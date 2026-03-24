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
      "category": "food|transport|entertainment|shopping|services|health|education|other"
    }
  ]
}

Rules:
- All amounts should be positive numbers (the sign is implied by context — purchases are expenses)
- Dates must be valid ISO format
- If you cannot determine a field, use null
- Extract ALL transactions visible in the statement
- Categories should be one of: food, transport, entertainment, shopping, services, health, education, other
- Currency is MXN (Mexican pesos)`;

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
      // For PDFs, send as file input
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
        temperature: 0.1,
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

    // Clean potential markdown wrapping
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    try {
      const parsed = JSON.parse(cleaned);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI response as JSON", raw: text },
        { status: 422 }
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
