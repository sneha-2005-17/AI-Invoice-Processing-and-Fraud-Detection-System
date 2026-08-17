const C = {
  ink: "#101820",
  paper: "#F7F3EA",
  teal: "#0F766E",
  teal2: "#14B8A6",
  amber: "#F59E0B",
  red: "#DC2626",
  blue: "#2563EB",
  muted: "#5B6470",
  line: "#D7D0C2",
  white: "#FFFFFF",
  pale: "#EFE7D8",
};

const deck = [
  {
    kicker: "TITLE",
    title: "AI Invoice Processing and Fraud Detection System",
    type: "cover",
  },
  {
    kicker: "PROBLEM",
    title: "Manual invoice verification creates cost, delay, and fraud exposure.",
    type: "split",
    leftTitle: "Existing Problems",
    left: [
      "Organizations process thousands of invoices manually.",
      "Verification takes time and depends heavily on human review.",
    ],
    rightTitle: "Key Challenges",
    right: [
      "Duplicate invoice payments",
      "GST calculation errors",
      "Vendor fraud",
      "Human mistakes",
      "Lack of automation",
    ],
    note: "Need: an intelligent AI system that automatically processes invoices and detects fraud.",
  },
  {
    kicker: "OBJECTIVES",
    title: "The project automates invoice review from extraction to explanation.",
    type: "grid",
    items: [
      "Automate invoice processing",
      "Extract invoice information using OCR",
      "Detect fraudulent invoices",
      "Verify GST compliance",
      "Perform risk scoring",
      "Provide AI-powered explanations",
      "Enable policy verification using RAG",
      "Generate reports and analytics",
    ],
  },
  {
    kicker: "SOLUTION",
    title: "A single AI workflow combines OCR, fraud checks, policy lookup, and reporting.",
    type: "featureGrid",
    items: [
      ["OCR", "OCR-based data extraction"],
      ["Risk", "Fraud detection engine"],
      ["RAG", "RAG-based policy assistant"],
      ["Flow", "Multi-agent workflow"],
      ["Score", "Risk scoring"],
      ["Dash", "Dashboard analytics"],
      ["Sec", "Security controls"],
      ["Audit", "Audit logs"],
    ],
  },
  {
    kicker: "ARCHITECTURE",
    title: "Invoices move through extraction, risk assessment, policy verification, and reporting.",
    type: "flow",
    steps: [
      "User",
      "Invoice Upload",
      "OCR Engine",
      "Data Extraction",
      "Fraud Detection",
      "Risk Assessment",
      "RAG Policy Verification",
      "AI Explanation",
      "Dashboard & Reports",
    ],
    components: ["Frontend", "Backend", "PostgreSQL", "ChromaDB", "Gemini API", "LangGraph"],
  },
  {
    kicker: "STACK",
    title: "The stack pairs a modern web app with Python APIs and AI orchestration.",
    type: "stack",
    groups: [
      ["Frontend", ["Next.js 15", "TypeScript", "Tailwind CSS", "Shadcn UI"]],
      ["Backend", ["FastAPI", "Python"]],
      ["Database", ["PostgreSQL"]],
      ["Vector Database", ["ChromaDB"]],
      ["AI Components", ["Gemini API", "LangChain", "LangGraph"]],
      ["OCR", ["EasyOCR"]],
    ],
  },
  {
    kicker: "SECURITY",
    title: "Authentication, access control, and auditability are built into the workflow.",
    type: "twoColumns",
    columns: [
      ["Authentication", ["User Login", "Admin Login", "JWT Authentication", "Role-Based Access Control"]],
      ["Security Features", ["Prompt injection protection", "API key security", "Rate limiting", "Input validation", "Audit logging", "Sensitive data masking"]],
    ],
  },
  {
    kicker: "OCR",
    title: "OCR converts uploaded PDFs and images into structured invoice records.",
    type: "ocr",
    workflow: ["Invoice PDF/Image", "Text Extraction", "Field Detection", "Database Storage"],
    fields: ["Invoice Number", "Vendor Name", "Invoice Date", "GST Number", "Tax Amount", "Total Amount"],
  },
  {
    kicker: "FRAUD ENGINE",
    title: "Rule-based checks flag duplicates, tax mismatches, abnormal amounts, and risky vendors.",
    type: "checks",
    checks: [
      ["Duplicate Invoice Detection", "Checks repeated invoice numbers."],
      ["GST Validation", "Verifies tax calculations."],
      ["Amount Anomaly Detection", "Detects unusual invoice values."],
      ["Vendor Risk Analysis", "Identifies suspicious vendors."],
    ],
  },
  {
    kicker: "RISK SCORE",
    title: "Each invoice receives a clear risk level from 0 to 100.",
    type: "risk",
  },
  {
    kicker: "RAG",
    title: "Policy-aware answers explain invoice decisions with finance context.",
    type: "rag",
  },
  {
    kicker: "AGENTS",
    title: "LangGraph agents divide the workflow into specialized reasoning steps.",
    type: "agents",
    agents: [
      ["Invoice Analysis Agent", "Extracts invoice information."],
      ["Fraud Detection Agent", "Identifies anomalies."],
      ["Compliance Agent", "Checks policy violations."],
      ["Explanation Agent", "Generates reasoning."],
      ["Report Agent", "Creates downloadable reports."],
    ],
  },
  {
    kicker: "ANALYTICS",
    title: "Dashboards turn processing activity into operational insight.",
    type: "dashboard",
    sections: [
      ["Executive Dashboard", ["Total Invoices", "Fraud Cases", "Compliance Rate"]],
      ["Analytics Dashboard", ["Monthly Fraud Trends", "Risk Distribution", "Vendor Rankings"]],
      ["Audit Dashboard", ["User Activities", "Security Events", "System Logs"]],
    ],
  },
  {
    kicker: "EVALUATION",
    title: "The system can be measured across AI quality, fraud performance, and runtime efficiency.",
    type: "metrics",
    sections: [
      ["AI Evaluation", ["RAG faithfulness", "Precision", "Recall", "Relevance"]],
      ["Fraud Detection", ["Accuracy", "Precision", "Recall", "F1 Score"]],
      ["Performance", ["Response time", "Latency", "Cost per request"]],
    ],
  },
  {
    kicker: "RESULTS",
    title: "The prototype delivers end-to-end automation, with clear paths for production expansion.",
    type: "results",
    achievements: [
      "Automated invoice processing",
      "Fraud detection",
      "AI explanations",
      "Policy verification",
      "Analytics dashboard",
      "Secure authentication",
    ],
    future: [
      "Real-time fraud monitoring",
      "Advanced ML models",
      "ERP integration",
      "SAP integration",
      "Mobile application",
      "Predictive fraud analytics",
    ],
  },
  {
    kicker: "THANK YOU",
    title: "Thank You",
    type: "thanks",
  },
];

function bg(slide, ctx, dark = false) {
  ctx.addShape(slide, { x: 0, y: 0, w: 1280, h: 720, fill: dark ? C.ink : C.paper, line: ctx.line("#00000000", 0) });
  ctx.addShape(slide, { x: 0, y: 0, w: 18, h: 720, fill: dark ? C.teal2 : C.teal, line: ctx.line("#00000000", 0) });
  ctx.addShape(slide, { x: 930, y: -80, w: 420, h: 420, fill: dark ? "#18313A" : "#E7DDC8", line: ctx.line("#00000000", 0), geometry: "ellipse" });
  ctx.addShape(slide, { x: 1050, y: 500, w: 260, h: 260, fill: dark ? "#3A2B16" : "#F2D6A0", line: ctx.line("#00000000", 0), geometry: "ellipse" });
}

function txt(ctx, slide, text, x, y, w, h, opt = {}) {
  return ctx.addText(slide, {
    text,
    x,
    y,
    w,
    h,
    fontSize: opt.size ?? 22,
    color: opt.color ?? C.ink,
    bold: opt.bold ?? false,
    typeface: opt.face ?? (opt.title ? ctx.fonts.title : ctx.fonts.body),
    align: opt.align ?? "left",
    valign: opt.valign ?? "top",
    fill: opt.fill ?? "#00000000",
    line: opt.line ?? ctx.line("#00000000", 0),
    insets: opt.insets ?? { left: 0, right: 0, top: 0, bottom: 0 },
    name: opt.name,
  });
}

function header(slide, ctx, d, dark = false) {
  const color = dark ? C.white : C.ink;
  ctx.addShape(slide, { x: 58, y: 48, w: 34, h: 4, fill: dark ? C.teal2 : C.teal, line: ctx.line("#00000000", 0), name: "kicker-marker" });
  txt(ctx, slide, d.kicker, 104, 35, 360, 30, { size: 12, color: dark ? "#B7DCD8" : C.teal, bold: true, valign: "middle", name: "kicker-label" });
  txt(ctx, slide, d.title, 58, 78, 800, 88, { size: 34, color, bold: true, title: true });
  txt(ctx, slide, String(ctx.slideNumber).padStart(2, "0"), 1168, 48, 54, 22, { size: 13, color: dark ? "#B7C3CB" : C.muted, align: "right" });
}

function footer(slide, ctx, dark = false) {
  txt(ctx, slide, "AI Invoice Processing and Fraud Detection System", 58, 676, 620, 18, { size: 10, color: dark ? "#9FB0BA" : C.muted });
}

function bullet(ctx, slide, text, x, y, w, idx, color = C.teal) {
  const yy = y + idx * 44;
  ctx.addShape(slide, { x, y: yy + 8, w: 10, h: 10, fill: color, line: ctx.line("#00000000", 0), geometry: "ellipse" });
  txt(ctx, slide, text, x: x + 24, y: yy, w, h: 36, { size: 19, color: C.ink });
}

function card(ctx, slide, x, y, w, h, title, body, accent = C.teal) {
  ctx.addShape(slide, { x, y, w, h, fill: C.white, line: ctx.line(C.line, 1), name: `card-${title}` });
  ctx.addShape(slide, { x, y, w: 7, h, fill: accent, line: ctx.line("#00000000", 0) });
  txt(ctx, slide, title, x: x + 22, y: y + 18, w: w - 36, h: 28, { size: 18, bold: true });
  if (Array.isArray(body)) {
    body.forEach((b, i) => bullet(ctx, slide, b, x + 24, y + 58, w - 56, i, accent));
  } else {
    txt(ctx, slide, body, x + 22, y + 54, w - 36, h - 66, { size: 17, color: C.muted });
  }
}

function slideCover(slide, ctx) {
  bg(slide, ctx, true);
  txt(ctx, slide, "AI Invoice Processing\nand Fraud Detection\nSystem", 70, 102, 780, 210, { size: 48, color: C.white, bold: true, title: true });
  ctx.addShape(slide, { x: 70, y: 340, w: 240, h: 5, fill: C.teal2, line: ctx.line("#00000000", 0) });
  txt(ctx, slide, "Presented By", 74, 384, 220, 24, { size: 14, color: "#B7DCD8", bold: true });
  txt(ctx, slide, "Sneha Singa\nB.Tech - Artificial Intelligence\nAnurag University", 74, 414, 460, 92, { size: 22, color: C.white });
  txt(ctx, slide, "Guide", 630, 384, 130, 24, { size: 14, color: "#B7DCD8", bold: true });
  txt(ctx, slide, "Faculty Name", 630, 414, 280, 32, { size: 22, color: C.white });
  txt(ctx, slide, "Academic Year", 630, 486, 180, 24, { size: 14, color: "#B7DCD8", bold: true });
  txt(ctx, slide, "2025-2026", 630, 516, 220, 32, { size: 22, color: C.white });
  ctx.addShape(slide, { x: 970, y: 140, w: 150, h: 150, fill: C.teal, line: ctx.line("#00000000", 0), geometry: "ellipse" });
  txt(ctx, slide, "AI", 1005, 180, 82, 62, { size: 48, color: C.white, bold: true, align: "center", valign: "middle" });
  footer(slide, ctx, true);
}

function splitSlide(slide, ctx, d) {
  bg(slide, ctx);
  header(slide, ctx, d);
  card(ctx, slide, 70, 220, 500, 270, d.leftTitle, d.left, C.teal);
  card(ctx, slide, 630, 220, 500, 270, d.rightTitle, d.right, C.amber);
  ctx.addShape(slide, { x: 70, y: 530, w: 1060, h: 74, fill: "#E7F4F2", line: ctx.line("#B6DAD4", 1) });
  txt(ctx, slide, d.note, 96, 548, 1008, 36, { size: 21, color: C.ink, bold: true, valign: "middle" });
  footer(slide, ctx);
}

function gridSlide(slide, ctx, d) {
  bg(slide, ctx);
  header(slide, ctx, d);
  const positions = d.items.map((item, i) => [80 + (i % 4) * 275, 225 + Math.floor(i / 4) * 170, item]);
  positions.forEach(([x, y, item], i) => {
    ctx.addShape(slide, { x, y, w: 238, h: 120, fill: C.white, line: ctx.line(C.line, 1) });
    ctx.addShape(slide, { x: x + 18, y: y + 18, w: 34, h: 34, fill: i % 2 ? C.amber : C.teal, line: ctx.line("#00000000", 0), geometry: "ellipse" });
    txt(ctx, slide, String(i + 1), x + 18, y + 21, 34, 20, { size: 15, color: C.white, bold: true, align: "center" });
    txt(ctx, slide, item, x + 18, y + 62, 196, 42, { size: 18, bold: true });
  });
  footer(slide, ctx);
}

function featureGrid(slide, ctx, d) {
  bg(slide, ctx);
  header(slide, ctx, d);
  d.items.forEach(([label, body], i) => {
    const x = 78 + (i % 4) * 270;
    const y = 220 + Math.floor(i / 4) * 160;
    ctx.addShape(slide, { x, y, w: 232, h: 112, fill: C.white, line: ctx.line(C.line, 1) });
    txt(ctx, slide, label, x + 18, y + 18, 70, 24, { size: 15, color: i % 3 === 1 ? C.amber : C.teal, bold: true });
    txt(ctx, slide, body, x + 18, y + 52, 190, 42, { size: 18, bold: true });
  });
  footer(slide, ctx);
}

function flowSlide(slide, ctx, d) {
  bg(slide, ctx);
  header(slide, ctx, d);
  const x = 84;
  d.steps.forEach((s, i) => {
    const y = 205 + i * 43;
    const w = i === 8 ? 280 : 230;
    ctx.addShape(slide, { x, y, w, h: 30, fill: i < 4 ? "#E7F4F2" : i < 7 ? "#FFF3D7" : "#FEE2E2", line: ctx.line(C.line, 1) });
    txt(ctx, slide, s, x + 14, y + 5, w - 28, 18, { size: 15, bold: true, valign: "middle" });
    if (i < d.steps.length - 1) txt(ctx, slide, "v", x + 105, y + 30, 20, 18, { size: 14, color: C.muted, align: "center" });
  });
  txt(ctx, slide, "Core Components", 470, 212, 300, 30, { size: 24, bold: true, title: true });
  d.components.forEach((c, i) => {
    const x2 = 470 + (i % 2) * 280;
    const y2 = 270 + Math.floor(i / 2) * 90;
    ctx.addShape(slide, { x: x2, y: y2, w: 230, h: 58, fill: C.white, line: ctx.line(C.line, 1) });
    txt(ctx, slide, c, x2 + 18, y2 + 17, 194, 24, { size: 20, bold: true, valign: "middle" });
  });
  footer(slide, ctx);
}

function stackSlide(slide, ctx, d) {
  bg(slide, ctx);
  header(slide, ctx, d);
  d.groups.forEach(([name, items], i) => {
    const x = 76 + (i % 3) * 360;
    const y = 215 + Math.floor(i / 3) * 190;
    card(ctx, slide, x, y, 310, 142, name, items, [C.teal, C.blue, C.amber][i % 3]);
  });
  footer(slide, ctx);
}

function twoColumns(slide, ctx, d) {
  bg(slide, ctx);
  header(slide, ctx, d);
  d.columns.forEach(([name, items], i) => card(ctx, slide, 90 + i * 560, 220, 480, 320, name, items, i ? C.amber : C.teal));
  footer(slide, ctx);
}

function ocrSlide(slide, ctx, d) {
  bg(slide, ctx);
  header(slide, ctx, d);
  txt(ctx, slide, "OCR Workflow", 82, 216, 270, 30, { size: 24, bold: true, title: true });
  d.workflow.forEach((s, i) => {
    const y = 270 + i * 70;
    ctx.addShape(slide, { x: 88, y, w: 300, h: 46, fill: i === 0 ? "#E7F4F2" : C.white, line: ctx.line(C.line, 1) });
    txt(ctx, slide, s, 110, y + 12, 256, 20, { size: 18, bold: true, valign: "middle" });
    if (i < d.workflow.length - 1) txt(ctx, slide, "v", 228, y + 49, 20, 16, { size: 14, color: C.teal, align: "center" });
  });
  txt(ctx, slide, "Extracted Fields", 520, 216, 300, 30, { size: 24, bold: true, title: true });
  d.fields.forEach((f, i) => {
    const x = 520 + (i % 2) * 280;
    const y = 278 + Math.floor(i / 2) * 80;
    ctx.addShape(slide, { x, y, w: 240, h: 52, fill: C.white, line: ctx.line(C.line, 1) });
    txt(ctx, slide, f, x + 16, y + 16, 208, 20, { size: 18, bold: true });
  });
  footer(slide, ctx);
}

function checksSlide(slide, ctx, d) {
  bg(slide, ctx);
  header(slide, ctx, d);
  d.checks.forEach(([name, body], i) => {
    const x = 88 + (i % 2) * 520;
    const y = 228 + Math.floor(i / 2) * 170;
    card(ctx, slide, x, y, 450, 120, name, body, i < 2 ? C.teal : C.amber);
  });
  footer(slide, ctx);
}

function riskSlide(slide, ctx) {
  bg(slide, ctx);
  header(slide, ctx, deck[9]);
  const levels = [["Low Risk", "0-30", C.teal], ["Medium Risk", "31-70", C.amber], ["High Risk", "71-100", C.red]];
  levels.forEach(([name, score, color], i) => {
    const x = 86 + i * 330;
    ctx.addShape(slide, { x, y: 230, w: 280, h: 108, fill: C.white, line: ctx.line(C.line, 1) });
    txt(ctx, slide, name, x + 20, 250, 230, 26, { size: 22, bold: true, color });
    txt(ctx, slide, `Score: ${score}`, x + 20, 288, 220, 28, { size: 26, bold: true });
  });
  ctx.addShape(slide, { x: 112, y: 405, w: 920, h: 116, fill: "#FFF3D7", line: ctx.line("#F2C66B", 1) });
  txt(ctx, slide, "Example: Invoice INV-101", 140, 425, 360, 28, { size: 24, bold: true });
  txt(ctx, slide, "Risk Score: 85", 670, 425, 260, 28, { size: 26, bold: true, color: C.red });
  ["Duplicate invoice", "GST mismatch", "Abnormal amount"].forEach((r, i) => bullet(ctx, slide, r, 146, 472, 320, i, C.red));
  footer(slide, ctx);
}

function ragSlide(slide, ctx) {
  bg(slide, ctx);
  header(slide, ctx, deck[10]);
  card(ctx, slide, 80, 220, 310, 210, "Documents Uploaded", ["Finance Policies", "GST Guidelines", "Vendor Rules"], C.teal);
  ctx.addShape(slide, { x: 450, y: 235, w: 270, h: 76, fill: C.white, line: ctx.line(C.line, 1) });
  txt(ctx, slide, "User Query", 470, 250, 200, 20, { size: 16, color: C.teal, bold: true });
  txt(ctx, slide, '"Why was Invoice INV-101 rejected?"', 470, 280, 230, 22, { size: 17, bold: true });
  ctx.addShape(slide, { x: 450, y: 350, w: 420, h: 128, fill: "#E7F4F2", line: ctx.line("#B6DAD4", 1) });
  txt(ctx, slide, "AI Response", 474, 370, 160, 20, { size: 16, color: C.teal, bold: true });
  txt(ctx, slide, "Invoice was rejected because it violates Finance Policy Section 4.2 regarding duplicate invoice submission.", 474, 400, 360, 54, { size: 18, bold: true });
  card(ctx, slide, 910, 220, 250, 210, "Benefits", ["Accurate responses", "Source citations", "Reduced hallucinations"], C.amber);
  footer(slide, ctx);
}

function agentsSlide(slide, ctx, d) {
  bg(slide, ctx);
  header(slide, ctx, d);
  d.agents.forEach(([name, body], i) => {
    const x = 90 + i * 205;
    ctx.addShape(slide, { x, y: 250, w: 170, h: 150, fill: C.white, line: ctx.line(C.line, 1) });
    txt(ctx, slide, `0${i + 1}`, x + 18, 270, 45, 28, { size: 22, color: i % 2 ? C.amber : C.teal, bold: true });
    txt(ctx, slide, name, x + 18, 312, 134, 44, { size: 17, bold: true });
    txt(ctx, slide, body, x + 18, 368, 134, 36, { size: 14, color: C.muted });
    if (i < d.agents.length - 1) txt(ctx, slide, ">", x + 178, 310, 20, 28, { size: 22, color: C.muted, bold: true });
  });
  footer(slide, ctx);
}

function dashboardSlide(slide, ctx, d) {
  bg(slide, ctx);
  header(slide, ctx, d);
  d.sections.forEach(([name, items], i) => card(ctx, slide, 88 + i * 350, 230, 300, 245, name, items, [C.teal, C.blue, C.amber][i]));
  footer(slide, ctx);
}

function metricsSlide(slide, ctx, d) {
  bg(slide, ctx);
  header(slide, ctx, d);
  d.sections.forEach(([name, items], i) => {
    const x = 86 + i * 350;
    ctx.addShape(slide, { x, y: 228, w: 300, h: 250, fill: C.white, line: ctx.line(C.line, 1) });
    txt(ctx, slide, name, x + 22, 252, 250, 28, { size: 22, bold: true, color: [C.teal, C.red, C.blue][i] });
    items.forEach((item, j) => bullet(ctx, slide, item, x + 24, 310, 230, j, [C.teal, C.red, C.blue][i]));
  });
  footer(slide, ctx);
}

function resultsSlide(slide, ctx, d) {
  bg(slide, ctx);
  header(slide, ctx, d);
  card(ctx, slide, 92, 220, 460, 330, "Achievements", d.achievements, C.teal);
  card(ctx, slide, 650, 220, 460, 330, "Future Enhancements", d.future, C.amber);
  footer(slide, ctx);
}

function thanksSlide(slide, ctx) {
  bg(slide, ctx, true);
  txt(ctx, slide, "Thank You", 100, 230, 560, 90, { size: 64, color: C.white, bold: true, title: true });
  ctx.addShape(slide, { x: 104, y: 330, w: 240, h: 5, fill: C.teal2, line: ctx.line("#00000000", 0) });
  txt(ctx, slide, "AI Invoice Processing and Fraud Detection System", 104, 370, 560, 36, { size: 24, color: "#D7E6E3" });
  txt(ctx, slide, "Sneha Singa | B.Tech - Artificial Intelligence | Anurag University", 104, 430, 720, 26, { size: 18, color: "#B7C3CB" });
  footer(slide, ctx, true);
}

export async function renderSlide(presentation, ctx, slideNumber) {
  const slide = presentation.slides.add();
  const d = deck[slideNumber - 1];
  if (d.type === "cover") slideCover(slide, ctx);
  else if (d.type === "split") splitSlide(slide, ctx, d);
  else if (d.type === "grid") gridSlide(slide, ctx, d);
  else if (d.type === "featureGrid") featureGrid(slide, ctx, d);
  else if (d.type === "flow") flowSlide(slide, ctx, d);
  else if (d.type === "stack") stackSlide(slide, ctx, d);
  else if (d.type === "twoColumns") twoColumns(slide, ctx, d);
  else if (d.type === "ocr") ocrSlide(slide, ctx, d);
  else if (d.type === "checks") checksSlide(slide, ctx, d);
  else if (d.type === "risk") riskSlide(slide, ctx);
  else if (d.type === "rag") ragSlide(slide, ctx);
  else if (d.type === "agents") agentsSlide(slide, ctx, d);
  else if (d.type === "dashboard") dashboardSlide(slide, ctx, d);
  else if (d.type === "metrics") metricsSlide(slide, ctx, d);
  else if (d.type === "results") resultsSlide(slide, ctx, d);
  else if (d.type === "thanks") thanksSlide(slide, ctx);
  return slide;
}
