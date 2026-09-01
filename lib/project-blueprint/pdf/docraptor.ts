import "server-only";

export type GeneratePdfUaInput = {
  html: string;
  documentName: string;
  test?: boolean;
};

export type GeneratePdfUaResult =
  | { ok: true; pdf: Buffer; contentType: "application/pdf" }
  | {
      ok: false;
      code: "PDF_UNAVAILABLE" | "PDF_FAILED";
      error: string;
    };

/**
 * Generate an accessible PDF/UA document via DocRaptor.
 * Returns PDF_UNAVAILABLE when DOCRAPTOR_API_KEY is unset.
 */
export async function generatePdfUa(
  input: GeneratePdfUaInput,
): Promise<GeneratePdfUaResult> {
  const apiKey = process.env.DOCRAPTOR_API_KEY;

  if (!apiKey) {
    return {
      ok: false,
      code: "PDF_UNAVAILABLE",
      error:
        "PDF generation is unavailable (PLACEHOLDER — DOCRAPTOR_API_KEY not configured). Use the HTML document instead.",
    };
  }

  try {
    const auth = Buffer.from(`${apiKey}:`).toString("base64");
    const response = await fetch("https://api.docraptor.com/docs", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "pdf",
        name: input.documentName,
        document_content: input.html,
        test: input.test ?? process.env.NODE_ENV !== "production",
        // PDF/UA tagged output when available on the account plan
        tag: true,
        pipeline: "10.1",
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("DocRaptor failed", response.status, detail);
      return {
        ok: false,
        code: "PDF_FAILED",
        error: "PDF generation failed. Offer the HTML document fallback.",
      };
    }

    const arrayBuffer = await response.arrayBuffer();
    return {
      ok: true,
      pdf: Buffer.from(arrayBuffer),
      contentType: "application/pdf",
    };
  } catch (error) {
    console.error("generatePdfUa failed", error);
    return {
      ok: false,
      code: "PDF_FAILED",
      error: "PDF generation failed. Offer the HTML document fallback.",
    };
  }
}
