import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { createHash } from "crypto";

export type AuditPDFData = {
  audit: {
    id: string;
    template_title: string;
    plant_name: string | null;
    auditee_name: string | null;
    auditor_email: string | null;
    finished_at: string | null;
    score: number | null;
    observations: string | null;
    auditee_signature_url: string | null;
  };
  findings: Array<{ code: string; severity: string; description: string | null }>;
  sections: Array<{
    id: string;
    title: string;
    items: Array<{
      id: string;
      question: string;
      norm_clause: string | null;
      response_type: string;
      response: string | null;
      note: string | null;
      unit: string | null;
      photos_count: number;
      finding: { code: string; severity: string } | null;
    }>;
  }>;
};

const ACCENT = "#1E6B4F";
const INK    = "#1A1D1B";
const MUTED  = "#6B7280";
const BORDER = "#E5E7EB";
const NC_RED = "#B3261E";
const WARN   = "#B87700";
const OK     = "#2E7D52";
const BLUE   = "#3B82F6";
const GRAY   = "#9CA3AF";

const SEV_COLOR: Record<string, string> = {
  critica: NC_RED, maior: WARN, menor: BLUE, observacao: GRAY,
};
const SEV_LABEL: Record<string, string> = {
  critica: "Crítica", maior: "Maior", menor: "Menor", observacao: "Observação",
};

function scoreColor(s: number) {
  if (s >= 80) return OK;
  if (s >= 60) return WARN;
  return NC_RED;
}

const RESP_LABEL: Record<string, string> = {
  conforme: "Conforme",
  nc: "Não Conforme",
  na: "N/A",
};
const RESP_COLOR: Record<string, string> = {
  conforme: OK,
  nc: NC_RED,
  na: GRAY,
};

function answerText(item: AuditPDFData["sections"][number]["items"][number]): { text: string; color: string } {
  const { response_type, response, unit, photos_count } = item;

  if (response_type === "conforme_nc_na") {
    if (!response) return { text: "Não respondido", color: MUTED };
    return { text: RESP_LABEL[response] ?? response, color: RESP_COLOR[response] ?? INK };
  }
  if (response_type === "escala") {
    return response ? { text: `${response} / 5`, color: INK } : { text: "Não respondido", color: MUTED };
  }
  if (response_type === "numero") {
    return response ? { text: `${response}${unit ? " " + unit : ""}`, color: INK } : { text: "Não respondido", color: MUTED };
  }
  if (response_type === "multipla") {
    if (!response) return { text: "Não respondido", color: MUTED };
    try {
      const arr = JSON.parse(response) as string[];
      return { text: arr.length ? arr.join(", ") : "Nenhuma opção selecionada", color: INK };
    } catch {
      return { text: response, color: INK };
    }
  }
  if (response_type === "foto") {
    return photos_count > 0
      ? { text: `${photos_count} foto${photos_count !== 1 ? "s" : ""} anexada${photos_count !== 1 ? "s" : ""}`, color: INK }
      : { text: "Sem fotos", color: MUTED };
  }
  if (response_type === "assinatura") {
    return response ? { text: "Assinado", color: OK } : { text: "Não assinado", color: MUTED };
  }
  return response ? { text: response, color: INK } : { text: "Não respondido", color: MUTED };
}

const s = StyleSheet.create({
  page:         { fontFamily: "Helvetica", paddingHorizontal: 48, paddingTop: 36, paddingBottom: 36, color: INK },
  stripe:       { position: "absolute", top: 0, left: 0, right: 0, height: 5, backgroundColor: ACCENT },
  wordmark:     { fontSize: 9, fontFamily: "Helvetica-Bold", letterSpacing: 2, color: ACCENT, marginBottom: 48 },
  h1:           { fontSize: 24, fontFamily: "Helvetica-Bold", color: INK, marginBottom: 8, lineHeight: 1.2 },
  meta:         { fontSize: 10, color: MUTED, marginBottom: 3 },
  scoreBig:     { fontSize: 72, fontFamily: "Helvetica-Bold", marginTop: 36 },
  scoreLabel:   { fontSize: 10, color: MUTED, marginTop: 2 },
  secTitle:     { fontSize: 8, fontFamily: "Helvetica-Bold", color: MUTED, letterSpacing: 1, marginTop: 20, marginBottom: 6, paddingBottom: 3, borderBottom: "0.5pt solid " + BORDER },
  tHead:        { flexDirection: "row", borderBottom: "1pt solid " + BORDER, paddingBottom: 4, marginBottom: 1 },
  tRow:         { flexDirection: "row", borderBottom: "0.5pt solid " + BORDER, paddingVertical: 5 },
  cell:         { fontSize: 9 },
  bold:         { fontFamily: "Helvetica-Bold" },
  footer:       { position: "absolute", bottom: 20, left: 48, right: 48, flexDirection: "row", justifyContent: "space-between" },
  footerText:   { fontSize: 7, color: MUTED },
  pageNum:      { fontSize: 7, color: MUTED },
});

export function AuditPDF({ audit, findings, sections }: AuditPDFData) {
  const hash = createHash("sha256")
    .update(`${audit.id}:${audit.finished_at ?? ""}:${findings.length}`)
    .digest("hex")
    .slice(0, 12)
    .toUpperCase();

  const date = audit.finished_at
    ? new Date(audit.finished_at).toLocaleDateString("pt-BR")
    : "—";

  const ncBySev = findings.reduce<Record<string, number>>((acc, f) => {
    acc[f.severity] = (acc[f.severity] ?? 0) + 1;
    return acc;
  }, {});

  const pageFooter = (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>NEXORA · Relatório de Auditoria · {date}</Text>
      <Text style={s.footerText}>Integridade: {hash}</Text>
    </View>
  );

  return (
    <Document title={`Auditoria — ${audit.template_title}`} author="NEXORA">

      {/* ── Capa ──────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <View style={s.stripe} fixed />
        <Text style={s.wordmark}>NEXORA</Text>

        <Text style={s.h1}>{audit.template_title}</Text>
        {audit.plant_name    && <Text style={s.meta}>Planta: {audit.plant_name}</Text>}
        {audit.auditee_name  && <Text style={s.meta}>Auditado: {audit.auditee_name}</Text>}
        {audit.auditor_email && <Text style={s.meta}>Auditor: {audit.auditor_email}</Text>}
        <Text style={s.meta}>Data: {date}</Text>

        {audit.score !== null && (
          <>
            <Text style={{ ...s.scoreBig, color: scoreColor(audit.score) }}>{audit.score}%</Text>
            <Text style={s.scoreLabel}>Score de conformidade</Text>
          </>
        )}

        {/* Resumo de severidades */}
        {findings.length > 0 && (
          <View style={{ marginTop: 28 }}>
            <Text style={{ ...s.meta, marginBottom: 6 }}>
              {findings.length} não conformidade{findings.length !== 1 ? "s" : ""} registrada{findings.length !== 1 ? "s" : ""}
            </Text>
            <View style={{ flexDirection: "row" }}>
              {(["critica", "maior", "menor", "observacao"] as const)
                .filter((sv) => ncBySev[sv])
                .map((sv) => (
                  <View key={sv} style={{ flexDirection: "row", alignItems: "center", marginRight: 16 }}>
                    <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: SEV_COLOR[sv], marginRight: 4 }} />
                    <Text style={{ fontSize: 9, color: MUTED }}>
                      {ncBySev[sv]} {SEV_LABEL[sv]}
                    </Text>
                  </View>
                ))}
            </View>
          </View>
        )}

        {pageFooter}
      </Page>

      {/* ── Checklist completo ───────────────────────── */}
      <Page size="A4" style={s.page} wrap>
        <View style={s.stripe} fixed />
        <Text style={s.wordmark}>NEXORA</Text>
        <Text style={s.secTitle}>CHECKLIST COMPLETO</Text>

        {sections.map((section) => (
          <View key={section.id}>
            <Text
              style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: ACCENT, marginTop: 10, marginBottom: 4 }}
            >
              {section.title}
            </Text>

            {section.items.map((item) => {
              const { text, color } = answerText(item);
              return (
                <View
                  key={item.id}
                  style={{ borderBottom: "0.5pt solid " + BORDER, paddingVertical: 5 }}
                  wrap={false}
                >
                  <Text style={{ fontSize: 9.5, color: INK }}>{item.question}</Text>
                  {item.norm_clause && (
                    <Text style={{ fontSize: 7.5, color: MUTED }}>{item.norm_clause}</Text>
                  )}
                  <Text style={{ fontSize: 9, color, fontFamily: "Helvetica-Bold", marginTop: 2 }}>
                    {text}
                  </Text>
                  {item.note && (
                    <Text style={{ fontSize: 8, color: MUTED, marginTop: 1 }}>Nota: {item.note}</Text>
                  )}
                  {item.finding && (
                    <Text
                      style={{
                        fontSize: 8,
                        color: SEV_COLOR[item.finding.severity] ?? MUTED,
                        marginTop: 1,
                      }}
                    >
                      {item.finding.code} · {SEV_LABEL[item.finding.severity] ?? item.finding.severity}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        ))}

        <Text
          style={{ ...s.pageNum, position: "absolute", bottom: 20, left: "50%" }}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
        {pageFooter}
      </Page>

      {/* ── NCs + Observações + Assinatura ────────────── */}
      <Page size="A4" style={s.page}>
        <View style={s.stripe} fixed />
        <Text style={{ ...s.wordmark }}>NEXORA</Text>

        {findings.length > 0 && (
          <>
            <Text style={s.secTitle}>NÃO CONFORMIDADES</Text>

            <View style={s.tHead}>
              <Text style={{ ...s.cell, ...s.bold, width: 80 }}>Código</Text>
              <Text style={{ ...s.cell, ...s.bold, width: 75 }}>Severidade</Text>
              <Text style={{ ...s.cell, ...s.bold, flex: 1 }}>Descrição</Text>
            </View>

            {findings.map((f) => (
              <View key={f.code} style={s.tRow} wrap={false}>
                <Text style={{ ...s.cell, width: 80, color: MUTED, fontFamily: "Helvetica" }}>
                  {f.code}
                </Text>
                <Text style={{ ...s.cell, width: 75, color: SEV_COLOR[f.severity] ?? MUTED }}>
                  {SEV_LABEL[f.severity] ?? f.severity}
                </Text>
                <Text style={{ ...s.cell, flex: 1 }}>{f.description || "—"}</Text>
              </View>
            ))}
          </>
        )}

        {audit.observations && (
          <>
            <Text style={s.secTitle}>OBSERVAÇÕES GERAIS</Text>
            <Text style={{ fontSize: 10, lineHeight: 1.5, color: INK }}>{audit.observations}</Text>
          </>
        )}

        {audit.auditee_signature_url && (
          <>
            <Text style={s.secTitle}>ASSINATURA DO AUDITADO</Text>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image, not an HTML img */}
            <Image src={audit.auditee_signature_url} style={{ height: 56, objectFit: "contain", alignSelf: "flex-start" }} />
            {audit.auditee_name && (
              <Text style={{ fontSize: 9, color: MUTED, marginTop: 4 }}>{audit.auditee_name}</Text>
            )}
          </>
        )}

        {/* Paginação */}
        <Text
          style={{ ...s.pageNum, position: "absolute", bottom: 20, left: "50%" }}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
        {pageFooter}
      </Page>
    </Document>
  );
}
