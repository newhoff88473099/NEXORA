import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { PROMPTS } from "@/lib/ai/prompts";

const BodySchema = z.object({
  feature: z.enum(["find_description", "suggest_analysis", "generate_checklist"]),
  payload: z.record(z.string(), z.unknown()),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Não autorizado" }, { status: 401 });

  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Payload inválido" }, { status: 400 });

  const { feature, payload } = parsed.data;

  const { data: membership } = await supabase
    .from("memberships")
    .select("org_id")
    .eq("user_id", user.id)
    .single();

  let system = "";
  let userMsg = "";

  if (feature === "find_description") {
    const p = payload as { question?: string; norm_clause?: string; note?: string };
    system = PROMPTS.find_description_system;
    userMsg = `Item auditado: ${p.question ?? ""}\nCláusula normativa: ${p.norm_clause || "N/A"}\nNota do auditor: ${p.note || "(sem nota)"}`;
  } else if (feature === "suggest_analysis") {
    const p = payload as { description?: string; severity?: string };
    system = PROMPTS.suggest_analysis_system;
    userMsg = `NC: ${p.description ?? ""}\nSeveridade: ${p.severity ?? ""}`;
  } else {
    const p = payload as { input?: string };
    system = PROMPTS.generate_checklist_system;
    userMsg = p.input ?? "";
  }

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return Response.json({ error: "Serviço de IA não configurado" }, { status: 503 });

  console.log("[ai-assist] key length:", apiKey.length, "feature:", feature);

  const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001",
      max_tokens: feature === "generate_checklist" ? 4096 : 512,
      system,
      messages: [{ role: "user", content: userMsg }],
    }),
  });

  if (!aiRes.ok) {
    const errBody = await aiRes.text();
    console.error("[ai-assist] Anthropic error:", aiRes.status, errBody);
    return Response.json({ error: `Erro no serviço de IA (${aiRes.status})`, detail: errBody }, { status: 502 });
  }

  const aiData = await aiRes.json() as {
    content?: Array<{ type: string; text: string }>;
    usage?: { input_tokens: number; output_tokens: number };
  };
  const text = aiData.content?.find((c) => c.type === "text")?.text ?? "";

  if (membership?.org_id) {
    void supabase.from("ai_usage").insert({
      org_id: membership.org_id,
      user_id: user.id,
      feature,
      tokens_in: aiData.usage?.input_tokens ?? 0,
      tokens_out: aiData.usage?.output_tokens ?? 0,
    });
  }

  return Response.json({ text });
}
