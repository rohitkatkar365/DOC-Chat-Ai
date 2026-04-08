const PptxGenJS = require("pptxgenjs");

const pptx = new PptxGenJS();

// ─── Theme ────────────────────────────────────────────────────────────────────
const C = {
  navy:       "0D1B2A",  // deep navy  – primary bg
  darkBlue:   "1B2A3B",  // section bg
  accent:     "4F8EF7",  // bright blue accent
  accentAlt:  "6C63FF",  // purple accent
  teal:       "00C9A7",  // green-teal highlight
  orange:     "FF6B35",  // warm orange
  white:      "FFFFFF",
  offWhite:   "EFF4FF",
  lightGray:  "B0BEC5",
  midGray:    "546E7A",
  cardBg:     "162233",  // card / box background
  cardBorder: "253A52",
  textBody:   "CFD8DC",
};

pptx.layout = "LAYOUT_WIDE"; // 13.33 x 7.5 inches
pptx.author  = "DocuChat AI";
pptx.subject = "Client Presentation";
pptx.title   = "DocuChat AI — Client Presentation";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function addBg(slide, color = C.navy) {
  slide.background = { color };
}

// Full-width decorative header bar
function addHeaderBar(slide, h = 0.08) {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: "100%", h,
    fill: { color: C.accent },
    line: { width: 0 },
  });
}

// Thin accent line under title
function accentLine(slide, x, y, w = 1.2, color = C.accent) {
  slide.addShape(pptx.ShapeType.rect, {
    x, y, w, h: 0.045,
    fill: { color },
    line: { width: 0 },
  });
}

// Section label pill (top-left)
function sectionLabel(slide, label, color = C.accent) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.4, y: 0.18, w: 1.8, h: 0.32,
    fill: { color },
    line: { width: 0 },
    rectRadius: 0.08,
  });
  slide.addText(label.toUpperCase(), {
    x: 0.4, y: 0.18, w: 1.8, h: 0.32,
    fontSize: 8, bold: true, color: C.white,
    align: "center", valign: "middle",
    fontFace: "Calibri",
  });
}

// Card box
function addCard(slide, x, y, w, h, fillColor = C.cardBg) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h,
    fill: { color: fillColor },
    line: { color: C.cardBorder, width: 1.2 },
    rectRadius: 0.12,
  });
}

// Gradient-style title block
function slideTitle(slide, text, x = 0.4, y = 0.55, w = 12.5, size = 28) {
  slide.addText(text, {
    x, y, w, h: 0.65,
    fontSize: size, bold: true,
    color: C.white, fontFace: "Calibri",
    align: "left",
  });
}

// Body text
function bodyText(slide, text, x, y, w, h, opts = {}) {
  slide.addText(text, {
    x, y, w, h,
    fontSize: opts.size || 13,
    color: opts.color || C.textBody,
    fontFace: "Calibri",
    align: opts.align || "left",
    valign: opts.valign || "top",
    bold: opts.bold || false,
    italic: opts.italic || false,
    wrap: true,
    ...opts,
  });
}

// Bullet list helper
function bulletList(slide, items, x, y, w, h, opts = {}) {
  const formatted = items.map((item) => {
    if (typeof item === "string") {
      return { text: item, options: { bullet: { code: "25CF", color: opts.bulletColor || C.accent }, indentLevel: 0 } };
    }
    return item;
  });
  slide.addText(formatted, {
    x, y, w, h,
    fontSize: opts.size || 13,
    color: opts.color || C.textBody,
    fontFace: "Calibri",
    paraSpaceBefore: 4,
    paraSpaceAfter: 2,
    lineSpacingMultiple: 1.15,
  });
}

// Number circle
function numCircle(slide, num, cx, cy, r = 0.28, bgColor = C.accent) {
  slide.addShape(pptx.ShapeType.ellipse, {
    x: cx - r, y: cy - r, w: r * 2, h: r * 2,
    fill: { color: bgColor },
    line: { width: 0 },
  });
  slide.addText(String(num), {
    x: cx - r, y: cy - r, w: r * 2, h: r * 2,
    fontSize: 11, bold: true, color: C.white,
    align: "center", valign: "middle",
    fontFace: "Calibri",
  });
}

// Icon circle placeholder (colored circle + emoji/text)
function iconCircle(slide, icon, cx, cy, r = 0.38, bgColor = C.accent) {
  slide.addShape(pptx.ShapeType.ellipse, {
    x: cx - r, y: cy - r, w: r * 2, h: r * 2,
    fill: { color: bgColor },
    line: { width: 0 },
  });
  slide.addText(icon, {
    x: cx - r, y: cy - r, w: r * 2, h: r * 2,
    fontSize: 14, color: C.white,
    align: "center", valign: "middle",
    fontFace: "Segoe UI Emoji",
  });
}

// Footer
function addFooter(slide, pageNum, total) {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 7.28, w: "100%", h: 0.22,
    fill: { color: C.darkBlue },
    line: { width: 0 },
  });
  slide.addText("DocuChat AI  |  Confidential Client Presentation  |  April 2026", {
    x: 0.4, y: 7.28, w: 10, h: 0.22,
    fontSize: 7.5, color: C.midGray, fontFace: "Calibri",
    align: "left", valign: "middle",
  });
  slide.addText(`${pageNum} / ${total}`, {
    x: 12, y: 7.28, w: 1.2, h: 0.22,
    fontSize: 7.5, color: C.midGray, fontFace: "Calibri",
    align: "right", valign: "middle",
  });
}

const TOTAL = 20;

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 1 — TITLE
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s, C.navy);

  // Large accent block left
  s.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 0.18, h: "100%",
    fill: { color: C.accent },
    line: { width: 0 },
  });
  // Decorative circle top-right
  s.addShape(pptx.ShapeType.ellipse, {
    x: 10.5, y: -1.2, w: 4, h: 4,
    fill: { color: C.accentAlt, transparency: 85 },
    line: { width: 0 },
  });
  s.addShape(pptx.ShapeType.ellipse, {
    x: 11.5, y: 4, w: 2.8, h: 2.8,
    fill: { color: C.teal, transparency: 80 },
    line: { width: 0 },
  });

  s.addText("DocuChat AI", {
    x: 0.6, y: 1.6, w: 9, h: 1.1,
    fontSize: 52, bold: true, color: C.white,
    fontFace: "Calibri",
  });
  accentLine(s, 0.6, 2.78, 3.5, C.accent);
  accentLine(s, 0.6, 2.92, 2, C.teal);

  s.addText("Intelligent Document Q&A Platform", {
    x: 0.6, y: 3.1, w: 10, h: 0.55,
    fontSize: 22, color: C.offWhite, fontFace: "Calibri",
  });
  s.addText("Ask questions about your documents — get instant, accurate answers powered by AI.", {
    x: 0.6, y: 3.72, w: 8.5, h: 0.7,
    fontSize: 14, color: C.lightGray, fontFace: "Calibri",
    wrap: true,
  });

  // Tags
  const tags = ["PDF", "Excel", "Images", "GPT-4o", "Claude", "Gemini"];
  tags.forEach((t, i) => {
    s.addShape(pptx.ShapeType.roundRect, {
      x: 0.6 + i * 1.65, y: 5.0, w: 1.5, h: 0.33,
      fill: { color: C.cardBg },
      line: { color: C.accent, width: 1 },
      rectRadius: 0.08,
    });
    s.addText(t, {
      x: 0.6 + i * 1.65, y: 5.0, w: 1.5, h: 0.33,
      fontSize: 9.5, color: C.accent, bold: true,
      align: "center", valign: "middle", fontFace: "Calibri",
    });
  });

  s.addText("Client Presentation  |  April 2026  |  Version 1.0", {
    x: 0.6, y: 6.6, w: 10, h: 0.3,
    fontSize: 9, color: C.midGray, fontFace: "Calibri",
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 2 — AGENDA
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s);
  addHeaderBar(s);
  sectionLabel(s, "Agenda");
  slideTitle(s, "What We Will Cover Today");
  accentLine(s, 0.4, 1.27);
  addFooter(s, 2, TOTAL);

  const items = [
    ["01", "What Is DocuChat AI?",       "The product, the problem it solves, and its value proposition"],
    ["02", "Who Is It For?",             "Target users and real-world use cases"],
    ["03", "Key Features",               "A full walkthrough of all capabilities"],
    ["04", "How It Works",               "Step-by-step user journey from login to answer"],
    ["05", "Supported Files & AI Models","Formats, limits, and model options"],
    ["06", "Interface & Screens",        "Visual walkthrough of the application UI"],
    ["07", "Security & Privacy",         "How user data is protected at every layer"],
    ["08", "Technology Stack",           "Plain-language overview of the tech powering the app"],
    ["09", "Setup & Requirements",       "What is needed to deploy and run the application"],
    ["10", "Limitations & FAQ",          "Honest boundaries and common questions answered"],
  ];

  const col1 = items.slice(0, 5);
  const col2 = items.slice(5);

  col1.forEach(([num, title, desc], i) => {
    const y = 1.55 + i * 1.05;
    numCircle(s, num, 0.65, y + 0.22, 0.22, i % 2 === 0 ? C.accent : C.teal);
    s.addText(title, { x: 0.98, y: y, w: 5.2, h: 0.3, fontSize: 12, bold: true, color: C.white, fontFace: "Calibri" });
    s.addText(desc,  { x: 0.98, y: y + 0.28, w: 5.2, h: 0.3, fontSize: 10, color: C.lightGray, fontFace: "Calibri" });
  });

  col2.forEach(([num, title, desc], i) => {
    const y = 1.55 + i * 1.05;
    numCircle(s, num, 7.35, y + 0.22, 0.22, i % 2 === 0 ? C.accentAlt : C.orange);
    s.addText(title, { x: 7.68, y: y, w: 5.2, h: 0.3, fontSize: 12, bold: true, color: C.white, fontFace: "Calibri" });
    s.addText(desc,  { x: 7.68, y: y + 0.28, w: 5.2, h: 0.3, fontSize: 10, color: C.lightGray, fontFace: "Calibri" });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 3 — WHAT IS DOCUCHAT AI
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s);
  addHeaderBar(s);
  sectionLabel(s, "Overview");
  slideTitle(s, "What Is DocuChat AI?");
  accentLine(s, 0.4, 1.27);
  addFooter(s, 3, TOTAL);

  // Problem box
  addCard(s, 0.4, 1.45, 5.8, 2.2, C.cardBg);
  s.addShape(pptx.ShapeType.rect, { x: 0.4, y: 1.45, w: 0.12, h: 2.2, fill: { color: C.orange }, line: { width: 0 } });
  s.addText("The Problem", { x: 0.62, y: 1.55, w: 5.4, h: 0.35, fontSize: 13, bold: true, color: C.orange, fontFace: "Calibri" });
  bodyText(s,
    "Finding specific information inside large documents — contracts, reports, spreadsheets, manuals — is slow, tedious, and error-prone. People spend hours searching when they need answers in minutes.",
    0.62, 1.95, 5.35, 1.5, { size: 12 }
  );

  // Solution box
  addCard(s, 6.55, 1.45, 6.4, 2.2, C.cardBg);
  s.addShape(pptx.ShapeType.rect, { x: 6.55, y: 1.45, w: 0.12, h: 2.2, fill: { color: C.teal }, line: { width: 0 } });
  s.addText("The Solution", { x: 6.77, y: 1.55, w: 6.0, h: 0.35, fontSize: 13, bold: true, color: C.teal, fontFace: "Calibri" });
  bodyText(s,
    "DocuChat AI lets users upload any document and ask questions in plain English — just like chatting with an expert assistant. The AI reads the document, finds the relevant sections, and delivers a clear answer with source references.",
    6.77, 1.95, 6.0, 1.5, { size: 12 }
  );

  // Example queries
  s.addText("Example Questions Users Can Ask:", { x: 0.4, y: 3.85, w: 12.5, h: 0.35, fontSize: 12, bold: true, color: C.accent, fontFace: "Calibri" });

  const queries = [
    '"What is the total revenue for Q3?"',
    '"Summarize the key findings from this report."',
    '"What are the payment terms in this contract?"',
    '"List all the product SKUs in this catalogue."',
  ];
  queries.forEach((q, i) => {
    const x = i < 2 ? 0.4 : 6.7;
    const y = 4.28 + (i % 2) * 0.68;
    addCard(s, x, y, 5.9, 0.52, "1A2D41");
    s.addText(q, { x: x + 0.15, y, w: 5.6, h: 0.52, fontSize: 11.5, color: C.offWhite, fontFace: "Calibri", italic: true, valign: "middle" });
  });

  bodyText(s, "No technical expertise required. If you can type, you can use DocuChat AI.", 0.4, 5.75, 12.5, 0.4, { size: 12, color: C.lightGray, italic: true });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 4 — WHO IS IT FOR
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s);
  addHeaderBar(s);
  sectionLabel(s, "Target Users");
  slideTitle(s, "Who Is DocuChat AI For?");
  accentLine(s, 0.4, 1.27);
  addFooter(s, 4, TOTAL);

  const users = [
    { icon: "💼", label: "Business Professionals", desc: "Reviewing contracts,\nproposals, or reports", color: C.accent },
    { icon: "🔬", label: "Researchers",            desc: "Extracting insights from\nacademic papers & studies", color: C.teal },
    { icon: "📊", label: "Finance Teams",          desc: "Analyzing spreadsheets\nand financial statements", color: C.accentAlt },
    { icon: "⚖️", label: "Legal Staff",            desc: "Reviewing agreements\nor compliance documents", color: C.orange },
    { icon: "🎧", label: "Customer Support",       desc: "Navigating product\nmanuals or policy docs", color: "E91E8C" },
    { icon: "🎓", label: "Students",               desc: "Studying textbooks\nor lecture notes", color: "00BCD4" },
  ];

  users.forEach((u, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.4 + col * 4.3;
    const y = 1.55 + row * 2.55;
    addCard(s, x, y, 4.0, 2.2, C.cardBg);
    iconCircle(s, u.icon, x + 0.55, y + 0.52, 0.4, u.color);
    s.addText(u.label, { x: x + 1.1, y: y + 0.22, w: 2.8, h: 0.38, fontSize: 12.5, bold: true, color: C.white, fontFace: "Calibri", wrap: true });
    s.addText(u.desc,  { x: x + 1.1, y: y + 0.62, w: 2.8, h: 0.65, fontSize: 10.5, color: C.textBody, fontFace: "Calibri", wrap: true });

    // Divider
    s.addShape(pptx.ShapeType.rect, { x: x + 0.2, y: y + 1.45, w: 3.6, h: 0.03, fill: { color: C.cardBorder }, line: { width: 0 } });
    s.addText("No technical skills required", { x: x + 0.2, y: y + 1.56, w: 3.6, h: 0.3, fontSize: 9, color: u.color, fontFace: "Calibri", italic: true });
  });

  bodyText(s, "DocuChat AI is designed for any professional who regularly works with documents and needs fast, reliable answers.", 0.4, 6.68, 12.5, 0.4, { size: 11, color: C.lightGray, italic: true });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 5 — KEY FEATURES (PAGE 1)
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s);
  addHeaderBar(s);
  sectionLabel(s, "Features");
  slideTitle(s, "Key Features — Core Capabilities");
  accentLine(s, 0.4, 1.27);
  addFooter(s, 5, TOTAL);

  const features = [
    { icon: "📄", title: "Document Upload",       desc: "Upload PDFs, spreadsheets, text files, and images. Drag-and-drop supported. Up to 5 files per account, 50 MB each.", color: C.accent },
    { icon: "💬", title: "Natural Language Q&A",  desc: "Ask questions in plain English. No commands, no syntax — just type your question and receive a clear answer.", color: C.teal },
    { icon: "🔗", title: "Source References",      desc: "Every answer includes the exact document name, page number, and a text preview of the source section used.", color: C.accentAlt },
    { icon: "🧠", title: "Conversation Memory",   desc: "The app remembers your last 10 messages, enabling natural follow-up questions and contextual dialogue.", color: C.orange },
    { icon: "⚡", title: "Live Streaming Answers", desc: "AI responses appear word-by-word in real time — no waiting for the full response before reading begins.", color: "E91E8C" },
    { icon: "🤖", title: "Multiple AI Models",    desc: "Choose between GPT-4o, GPT-4o Mini, Claude 3.5 Sonnet, and Gemini 2.5 Flash. Switch models anytime.", color: "00BCD4" },
  ];

  features.forEach((f, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.4 + col * 6.45;
    const y = 1.55 + row * 1.77;
    addCard(s, x, y, 6.1, 1.6, C.cardBg);
    // Color strip top
    s.addShape(pptx.ShapeType.rect, { x, y, w: 6.1, h: 0.07, fill: { color: f.color }, line: { width: 0 } });
    iconCircle(s, f.icon, x + 0.52, y + 0.62, 0.34, f.color);
    s.addText(f.title, { x: x + 1.06, y: y + 0.2, w: 4.85, h: 0.35, fontSize: 13, bold: true, color: C.white, fontFace: "Calibri" });
    bodyText(s, f.desc, x + 1.06, y + 0.58, 4.85, 0.85, { size: 11 });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 6 — KEY FEATURES (PAGE 2)
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s);
  addHeaderBar(s);
  sectionLabel(s, "Features");
  slideTitle(s, "Key Features — Advanced Capabilities");
  accentLine(s, 0.4, 1.27);
  addFooter(s, 6, TOTAL);

  const features2 = [
    { icon: "💡", title: "Follow-up Suggestions",  desc: "After every answer, the AI suggests 3 related questions you might want to ask next, guiding deeper exploration.", color: C.accent },
    { icon: "📤", title: "Chat Export",            desc: "Download your entire Q&A conversation as a text file for records, sharing, or further analysis.", color: C.teal },
    { icon: "🔒", title: "Secure Private Accounts",desc: "Each user has an isolated, password-protected account. No one else can see your documents or conversations.", color: C.accentAlt },
    { icon: "🖼️", title: "Image Understanding",   desc: "Upload images — charts, screenshots, scanned photos — and ask questions about their visual content.", color: C.orange },
    { icon: "✏️", title: "Edit & Regenerate",     desc: "Edit a previous question and re-ask it, or regenerate an answer if you want a different phrasing.", color: "E91E8C" },
    { icon: "🔍", title: "Query Expansion",        desc: "Automatically rephrases your question 2–3 ways to improve retrieval accuracy and answer quality.", color: "00BCD4" },
  ];

  features2.forEach((f, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.4 + col * 6.45;
    const y = 1.55 + row * 1.77;
    addCard(s, x, y, 6.1, 1.6, C.cardBg);
    s.addShape(pptx.ShapeType.rect, { x, y, w: 6.1, h: 0.07, fill: { color: f.color }, line: { width: 0 } });
    iconCircle(s, f.icon, x + 0.52, y + 0.62, 0.34, f.color);
    s.addText(f.title, { x: x + 1.06, y: y + 0.2, w: 4.85, h: 0.35, fontSize: 13, bold: true, color: C.white, fontFace: "Calibri" });
    bodyText(s, f.desc, x + 1.06, y + 0.58, 4.85, 0.85, { size: 11 });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 7 — HOW IT WORKS (FLOW OVERVIEW)
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s);
  addHeaderBar(s);
  sectionLabel(s, "How It Works");
  slideTitle(s, "The User Journey — 5 Simple Steps");
  accentLine(s, 0.4, 1.27);
  addFooter(s, 7, TOTAL);

  const steps = [
    { num: "1", icon: "👤", label: "Create Account",    sub: "Register with name,\nemail & password",    color: C.accent },
    { num: "2", icon: "📂", label: "Upload Documents",  sub: "PDF, Excel, Image\nor Text — up to 5",    color: C.teal },
    { num: "3", icon: "❓", label: "Ask a Question",    sub: "Type in plain English\nin the chat box",    color: C.accentAlt },
    { num: "4", icon: "💬", label: "Get an Answer",     sub: "AI streams a clear\nresponse with sources", color: C.orange },
    { num: "5", icon: "🔄", label: "Continue & Manage", sub: "Follow-up, export,\nswitch models",         color: "E91E8C" },
  ];

  steps.forEach((st, i) => {
    const x = 0.4 + i * 2.5;
    const cy = 3.6;

    // Card
    addCard(s, x, 1.55, 2.2, 3.6, C.cardBg);
    s.addShape(pptx.ShapeType.rect, { x, y: 1.55, w: 2.2, h: 0.1, fill: { color: st.color }, line: { width: 0 } });

    // Step number badge
    s.addShape(pptx.ShapeType.ellipse, { x: x + 0.78, y: 1.75, w: 0.64, h: 0.64, fill: { color: st.color }, line: { width: 0 } });
    s.addText(st.num, { x: x + 0.78, y: 1.75, w: 0.64, h: 0.64, fontSize: 16, bold: true, color: C.white, align: "center", valign: "middle", fontFace: "Calibri" });

    // Icon
    s.addText(st.icon, { x: x + 0.6, y: 2.52, w: 1.0, h: 0.6, fontSize: 22, align: "center", valign: "middle", fontFace: "Segoe UI Emoji" });

    // Label
    s.addText(st.label, { x: x + 0.1, y: 3.18, w: 2.0, h: 0.38, fontSize: 11.5, bold: true, color: C.white, align: "center", fontFace: "Calibri", wrap: true });
    s.addText(st.sub,   { x: x + 0.1, y: 3.6,  w: 2.0, h: 0.7,  fontSize: 9.5,  color: C.textBody,  align: "center", fontFace: "Calibri", wrap: true });

    // Arrow connector (except last)
    if (i < 4) {
      s.addShape(pptx.ShapeType.rect, { x: x + 2.2, y: cy - 0.03, w: 0.3, h: 0.06, fill: { color: C.midGray }, line: { width: 0 } });
      s.addText("▶", { x: x + 2.47, y: cy - 0.17, w: 0.2, h: 0.3, fontSize: 11, color: C.midGray, align: "left", valign: "middle" });
    }
  });

  // Bottom note
  addCard(s, 0.4, 5.42, 12.5, 0.88, "0F1C2E");
  s.addText("🔁  The process is cyclical — you can keep uploading new documents, asking follow-up questions, switching AI models, and exporting results at any time. Your conversation history is preserved across sessions.", {
    x: 0.7, y: 5.5, w: 12.1, h: 0.72,
    fontSize: 11, color: C.lightGray, fontFace: "Calibri", valign: "middle", wrap: true,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 8 — STEPS 1 & 2 DETAIL
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s);
  addHeaderBar(s);
  sectionLabel(s, "How It Works");
  slideTitle(s, "Step 1 — Create Account  &  Step 2 — Upload Documents");
  accentLine(s, 0.4, 1.27);
  addFooter(s, 8, TOTAL);

  // Step 1 panel
  addCard(s, 0.4, 1.52, 5.95, 5.4, C.cardBg);
  s.addShape(pptx.ShapeType.rect, { x: 0.4, y: 1.52, w: 5.95, h: 0.1, fill: { color: C.accent }, line: { width: 0 } });
  numCircle(s, "01", 0.83, 1.92, 0.28, C.accent);
  s.addText("Create Your Account", { x: 1.22, y: 1.73, w: 4.9, h: 0.38, fontSize: 15, bold: true, color: C.white, fontFace: "Calibri" });

  bulletList(s, [
    "Visit the application in your web browser",
    "Click Register — enter your full name, email, and a password (6+ characters)",
    "Your password is encrypted — never stored as plain text",
    "After registering, log in with your email and password",
    "The system issues a secure session key lasting 7 days — no repeated logins",
    "Each account is completely private and isolated from other users",
  ], 0.65, 2.25, 5.55, 4.4, { size: 11.5, bulletColor: C.accent });

  // Step 2 panel
  addCard(s, 6.65, 1.52, 6.3, 5.4, C.cardBg);
  s.addShape(pptx.ShapeType.rect, { x: 6.65, y: 1.52, w: 6.3, h: 0.1, fill: { color: C.teal }, line: { width: 0 } });
  numCircle(s, "02", 7.08, 1.92, 0.28, C.teal);
  s.addText("Upload Your Documents", { x: 7.48, y: 1.73, w: 5.3, h: 0.38, fontSize: 15, bold: true, color: C.white, fontFace: "Calibri" });

  s.addText("What happens behind the scenes:", { x: 6.88, y: 2.27, w: 5.8, h: 0.3, fontSize: 11, bold: true, color: C.teal, fontFace: "Calibri" });

  const steps2 = [
    ["1", "Document is securely received by the server"],
    ["2", "Text is extracted from PDF pages, spreadsheet cells, or images"],
    ["3", "Content is split into small chunks (like cutting a book into paragraphs)"],
    ["4", "Each chunk is converted into a unique AI fingerprint (\"embedding\")"],
    ["5", "Fingerprints are stored in your private document index"],
    ["6", "AI auto-generates a short summary of the document"],
  ];

  steps2.forEach(([n, text], i) => {
    const y = 2.64 + i * 0.65;
    numCircle(s, n, 6.95, y + 0.14, 0.18, C.teal);
    bodyText(s, text, 7.25, y, 5.55, 0.52, { size: 11 });
  });

  bodyText(s, "Accepts: PDF · TXT · XLSX · XLS · PNG · JPG · JPEG · GIF · WEBP\nLimit: 50 MB per file · Up to 5 documents per account", 6.68, 6.32, 6.22, 0.48, { size: 9.5, color: C.lightGray });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 9 — STEPS 3 & 4 DETAIL
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s);
  addHeaderBar(s);
  sectionLabel(s, "How It Works");
  slideTitle(s, "Step 3 — Ask a Question  &  Step 4 — The Answer");
  accentLine(s, 0.4, 1.27);
  addFooter(s, 9, TOTAL);

  // Step 3
  addCard(s, 0.4, 1.52, 5.95, 5.4, C.cardBg);
  s.addShape(pptx.ShapeType.rect, { x: 0.4, y: 1.52, w: 5.95, h: 0.1, fill: { color: C.accentAlt }, line: { width: 0 } });
  numCircle(s, "03", 0.83, 1.92, 0.28, C.accentAlt);
  s.addText("Ask Your Question", { x: 1.22, y: 1.73, w: 4.9, h: 0.38, fontSize: 15, bold: true, color: C.white, fontFace: "Calibri" });

  s.addText("What happens when you press Send:", { x: 0.62, y: 2.27, w: 5.55, h: 0.3, fontSize: 11, bold: true, color: C.accentAlt, fontFace: "Calibri" });

  const q_steps = [
    ["1", "Your question is sent securely to the server"],
    ["2", "The system generates 2–3 alternative phrasings to improve accuracy"],
    ["3", "It searches your document index for the most relevant sections"],
    ["4", "Top matching sections are retrieved (default: 4 sections)"],
    ["5", "Your question + context + conversation history are sent to the AI"],
    ["6", "The AI begins generating its answer"],
  ];

  q_steps.forEach(([n, text], i) => {
    const y = 2.62 + i * 0.65;
    numCircle(s, n, 0.65, y + 0.14, 0.18, C.accentAlt);
    bodyText(s, text, 0.95, y, 5.25, 0.52, { size: 11 });
  });

  bodyText(s, "You can also restrict questions to a specific document using the file filter.", 0.62, 6.35, 5.55, 0.35, { size: 9.5, color: C.lightGray, italic: true });

  // Step 4
  addCard(s, 6.65, 1.52, 6.3, 5.4, C.cardBg);
  s.addShape(pptx.ShapeType.rect, { x: 6.65, y: 1.52, w: 6.3, h: 0.1, fill: { color: C.orange }, line: { width: 0 } });
  numCircle(s, "04", 7.08, 1.92, 0.28, C.orange);
  s.addText("What You Receive", { x: 7.48, y: 1.73, w: 5.3, h: 0.38, fontSize: 15, bold: true, color: C.white, fontFace: "Calibri" });

  const results = [
    { icon: "💬", label: "Live Answer",          desc: "Words stream in real time as the AI formulates its response",      color: C.orange },
    { icon: "📎", label: "Source References",    desc: "Document name, page number, relevance score, and text preview",    color: C.accent },
    { icon: "💡", label: "Follow-up Suggestions", desc: "Three related questions to explore next",                       color: C.teal },
    { icon: "🔍", label: "Processing Trace",     desc: "A transparent log of every step taken to generate the answer",     color: C.accentAlt },
  ];

  results.forEach((r, i) => {
    const y = 2.28 + i * 1.12;
    addCard(s, 6.82, y, 5.95, 0.95, "0F1C2E");
    iconCircle(s, r.icon, 7.14, y + 0.475, 0.28, r.color);
    s.addText(r.label, { x: 7.55, y: y + 0.08, w: 5.0, h: 0.32, fontSize: 12, bold: true, color: C.white, fontFace: "Calibri" });
    bodyText(s, r.desc, 7.55, y + 0.42, 5.0, 0.42, { size: 10.5 });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 10 — SUPPORTED FILE TYPES
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s);
  addHeaderBar(s);
  sectionLabel(s, "File Support");
  slideTitle(s, "Supported File Types");
  accentLine(s, 0.4, 1.27);
  addFooter(s, 10, TOTAL);

  const files = [
    { icon: "📕", ext: ".pdf", name: "PDF Documents",     desc: "Full text extracted from all pages. Page numbers are preserved and referenced in every answer.", color: C.accent },
    { icon: "📗", ext: ".txt", name: "Text Files",         desc: "Plain text documents read as-is. Great for notes, logs, transcripts, and structured text.", color: C.teal },
    { icon: "📘", ext: ".xlsx / .xls", name: "Excel Spreadsheets", desc: "All sheets are converted to a readable table format. The AI understands rows, columns, and values.", color: C.accentAlt },
    { icon: "📷", ext: ".png / .jpg / .jpeg / .gif / .webp", name: "Images", desc: "AI vision model analyzes the image and creates a detailed description. Ask about charts, screenshots, diagrams, or any visual content.", color: C.orange },
  ];

  files.forEach((f, i) => {
    const y = 1.52 + i * 1.35;
    addCard(s, 0.4, y, 12.5, 1.2, C.cardBg);
    s.addShape(pptx.ShapeType.rect, { x: 0.4, y, w: 0.1, h: 1.2, fill: { color: f.color }, line: { width: 0 } });
    iconCircle(s, f.icon, 0.92, y + 0.6, 0.35, f.color);
    s.addShape(pptx.ShapeType.roundRect, { x: 1.42, y: y + 0.12, w: 2.0, h: 0.35, fill: { color: f.color, transparency: 15 }, line: { color: f.color, width: 1 }, rectRadius: 0.06 });
    s.addText(f.ext, { x: 1.42, y: y + 0.12, w: 2.0, h: 0.35, fontSize: 9.5, bold: true, color: C.white, align: "center", valign: "middle", fontFace: "Calibri" });
    s.addText(f.name, { x: 3.6, y: y + 0.1, w: 9.1, h: 0.35, fontSize: 13, bold: true, color: C.white, fontFace: "Calibri" });
    bodyText(s, f.desc, 3.6, y + 0.5, 9.1, 0.6, { size: 11.5 });
  });

  // Limits row
  addCard(s, 0.4, 6.98, 12.5, 0.45, "0F1C2E");
  s.addText("File Size Limit: 50 MB per file", { x: 0.7, y: 6.98, w: 5.5, h: 0.45, fontSize: 11, bold: true, color: C.accent, valign: "middle", fontFace: "Calibri" });
  s.addShape(pptx.ShapeType.rect, { x: 6.4, y: 7.08, w: 0.04, h: 0.25, fill: { color: C.midGray }, line: { width: 0 } });
  s.addText("Document Limit: Up to 5 files per user account", { x: 6.6, y: 6.98, w: 6.1, h: 0.45, fontSize: 11, bold: true, color: C.teal, valign: "middle", fontFace: "Calibri" });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 11 — AI MODELS
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s);
  addHeaderBar(s);
  sectionLabel(s, "AI Models");
  slideTitle(s, "Available AI Models");
  accentLine(s, 0.4, 1.27);
  addFooter(s, 11, TOTAL);

  const models = [
    { name: "GPT-4o",          provider: "OpenAI",      badge: "Most Capable",    icon: "🔵", desc: "The most powerful model — excellent at reasoning, synthesis, and handling long, complex documents. Best for critical analysis.", bestFor: "In-depth analysis, complex reasoning", color: C.accent },
    { name: "GPT-4o Mini",     provider: "OpenAI",      badge: "Fastest",         icon: "🔵", desc: "A faster, more cost-effective version of GPT-4o. Great for high-volume use or when speed is more important than depth.", bestFor: "Quick lookups, high-frequency queries", color: "5BC0EB" },
    { name: "Claude 3.5 Sonnet", provider: "Anthropic", badge: "Best for Long Docs", icon: "🟠", desc: "Developed by Anthropic — exceptional at reading and reasoning over long documents. Particularly strong for legal and technical content.", bestFor: "Long documents, legal & technical text", color: C.orange },
    { name: "Gemini 2.5 Flash", provider: "Google",    badge: "Structured Data",  icon: "🟢", desc: "Google's fast AI model — excels at understanding structured data like spreadsheets and tabular information.", bestFor: "Spreadsheets, financial data, tables", color: C.teal },
  ];

  models.forEach((m, i) => {
    const x = 0.4 + (i % 2) * 6.45;
    const y = 1.52 + Math.floor(i / 2) * 2.55;
    addCard(s, x, y, 6.1, 2.3, C.cardBg);
    s.addShape(pptx.ShapeType.rect, { x, y, w: 6.1, h: 0.09, fill: { color: m.color }, line: { width: 0 } });

    // Badge
    s.addShape(pptx.ShapeType.roundRect, { x: x + 0.2, y: y + 0.18, w: 1.8, h: 0.3, fill: { color: m.color, transparency: 20 }, line: { color: m.color, width: 1 }, rectRadius: 0.06 });
    s.addText(m.badge, { x: x + 0.2, y: y + 0.18, w: 1.8, h: 0.3, fontSize: 8.5, bold: true, color: C.white, align: "center", valign: "middle", fontFace: "Calibri" });

    s.addText(m.name, { x: x + 2.15, y: y + 0.14, w: 3.7, h: 0.4, fontSize: 16, bold: true, color: C.white, fontFace: "Calibri", align: "right" });
    s.addText("by " + m.provider, { x: x + 2.15, y: y + 0.52, w: 3.7, h: 0.25, fontSize: 9, color: C.lightGray, fontFace: "Calibri", align: "right" });

    s.addShape(pptx.ShapeType.rect, { x: x + 0.2, y: y + 0.88, w: 5.7, h: 0.03, fill: { color: C.cardBorder }, line: { width: 0 } });
    bodyText(s, m.desc, x + 0.2, y + 0.98, 5.7, 0.82, { size: 11 });
    s.addText("Best for: " + m.bestFor, { x: x + 0.2, y: y + 1.9, w: 5.7, h: 0.28, fontSize: 10, bold: true, color: m.color, fontFace: "Calibri" });
  });

  bodyText(s, "All models are accessed via OpenRouter — a unified service that connects to multiple AI providers. You can switch models at any time from the Settings panel.", 0.4, 6.9, 12.5, 0.4, { size: 10.5, color: C.lightGray, italic: true });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 12 — APPLICATION INTERFACE
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s);
  addHeaderBar(s);
  sectionLabel(s, "Interface");
  slideTitle(s, "Application Interface — Screen Layout");
  accentLine(s, 0.4, 1.27);
  addFooter(s, 12, TOTAL);

  // Main screen wireframe simulation
  // Outer frame
  addCard(s, 0.4, 1.52, 12.5, 5.55, "0A1525");

  // Header bar of the app
  s.addShape(pptx.ShapeType.rect, { x: 0.4, y: 1.52, w: 12.5, h: 0.45, fill: { color: "0D1B2A" }, line: { width: 0 } });
  s.addText("DocuChat AI", { x: 0.6, y: 1.56, w: 3, h: 0.38, fontSize: 11, bold: true, color: C.accent, fontFace: "Calibri", valign: "middle" });
  s.addText("Welcome, User      Sign Out", { x: 9.5, y: 1.56, w: 3.2, h: 0.38, fontSize: 9, color: C.lightGray, fontFace: "Calibri", valign: "middle", align: "right" });

  // Sidebar
  s.addShape(pptx.ShapeType.rect, { x: 0.4, y: 1.97, w: 2.8, h: 5.1, fill: { color: C.darkBlue }, line: { width: 0 } });
  s.addText("MY DOCUMENTS", { x: 0.55, y: 2.05, w: 2.5, h: 0.25, fontSize: 7.5, bold: true, color: C.accent, fontFace: "Calibri" });
  ["report_q3.pdf", "contract.pdf", "data.xlsx"].forEach((name, i) => {
    s.addShape(pptx.ShapeType.roundRect, { x: 0.52, y: 2.38 + i * 0.48, w: 2.5, h: 0.38, fill: { color: C.cardBg }, line: { color: C.cardBorder, width: 0.8 }, rectRadius: 0.05 });
    s.addText("📄 " + name, { x: 0.6, y: 2.38 + i * 0.48, w: 2.34, h: 0.38, fontSize: 8, color: C.textBody, fontFace: "Calibri", valign: "middle" });
  });

  s.addText("SETTINGS", { x: 0.55, y: 3.95, w: 2.5, h: 0.25, fontSize: 7.5, bold: true, color: C.accent, fontFace: "Calibri" });
  [["AI Model", "GPT-4o"], ["Chain Type", "Stuff"], ["Retrieval (k)", "4"]].forEach(([k, v], i) => {
    s.addText(k + ": " + v, { x: 0.6, y: 4.28 + i * 0.4, w: 2.5, h: 0.32, fontSize: 8.5, color: C.textBody, fontFace: "Calibri" });
  });

  ["⬆ Upload Files", "🗑 Clear Chat", "📤 Export Chat"].forEach((btn, i) => {
    s.addShape(pptx.ShapeType.roundRect, { x: 0.52, y: 5.62 + i * 0.42, w: 2.5, h: 0.32, fill: { color: i === 0 ? C.accent : C.cardBg }, line: { color: C.cardBorder, width: 0.8 }, rectRadius: 0.07 });
    s.addText(btn, { x: 0.52, y: 5.62 + i * 0.42, w: 2.5, h: 0.32, fontSize: 8, color: i === 0 ? C.white : C.textBody, align: "center", valign: "middle", fontFace: "Calibri" });
  });

  // Chat area
  s.addShape(pptx.ShapeType.rect, { x: 3.2, y: 1.97, w: 9.7, h: 5.1, fill: { color: "0A1520" }, line: { width: 0 } });

  // User message bubble
  s.addShape(pptx.ShapeType.roundRect, { x: 7.5, y: 2.1, w: 5.2, h: 0.5, fill: { color: "1E3A5F" }, line: { width: 0 }, rectRadius: 0.1 });
  s.addText("What is the revenue growth for Q3?", { x: 7.65, y: 2.1, w: 5.0, h: 0.5, fontSize: 8.5, color: C.white, valign: "middle", fontFace: "Calibri" });

  // AI message bubble
  s.addShape(pptx.ShapeType.roundRect, { x: 3.3, y: 2.75, w: 8.0, h: 0.9, fill: { color: C.cardBg }, line: { width: 0 }, rectRadius: 0.1 });
  s.addText("Based on the Q3 report, revenue grew by 18.4% compared to the previous quarter, reaching $4.2M...", { x: 3.45, y: 2.78, w: 7.7, h: 0.84, fontSize: 8.5, color: C.textBody, valign: "middle", fontFace: "Calibri", wrap: true });

  // Source & Suggestion strips
  s.addShape(pptx.ShapeType.rect, { x: 3.3, y: 3.72, w: 7.98, h: 0.28, fill: { color: "0D2035" }, line: { width: 0 } });
  s.addText("📎 Source: report_q3.pdf  Page 4  |  Relevance: 0.94", { x: 3.4, y: 3.72, w: 7.78, h: 0.28, fontSize: 7.5, color: C.accent, valign: "middle", fontFace: "Calibri" });

  ["Tell me more about Q4 projections", "What were the main cost drivers?"].forEach((sug, i) => {
    s.addShape(pptx.ShapeType.roundRect, { x: 3.3 + i * 4.1, y: 4.1, w: 3.85, h: 0.28, fill: { color: "0D2035" }, line: { color: C.accent, width: 0.8 }, rectRadius: 0.06 });
    s.addText("💡 " + sug, { x: 3.38 + i * 4.1, y: 4.1, w: 3.7, h: 0.28, fontSize: 7.5, color: C.accent, valign: "middle", fontFace: "Calibri" });
  });

  // Input box
  s.addShape(pptx.ShapeType.rect, { x: 3.2, y: 6.62, w: 9.7, h: 0.45, fill: { color: "0D1B2A" }, line: { width: 0 } });
  s.addShape(pptx.ShapeType.roundRect, { x: 3.32, y: 6.67, w: 8.9, h: 0.33, fill: { color: C.cardBg }, line: { color: C.cardBorder, width: 0.8 }, rectRadius: 0.06 });
  s.addText("Type your question here and press Enter to send...", { x: 3.42, y: 6.67, w: 8.7, h: 0.33, fontSize: 7.5, color: C.midGray, valign: "middle", fontFace: "Calibri" });

  // Labels
  const annotations = [
    { x: 0.4, y: 7.2, text: "Sidebar: Documents & Settings", color: C.teal },
    { x: 6.0, y: 7.2, text: "Chat Area: Messages, Sources & Suggestions", color: C.accent },
  ];
  annotations.forEach(a => {
    s.addText("▲ " + a.text, { x: a.x, y: a.y, w: 5.5, h: 0.25, fontSize: 9, color: a.color, fontFace: "Calibri", bold: true });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 13 — SETTINGS PANEL
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s);
  addHeaderBar(s);
  sectionLabel(s, "Interface");
  slideTitle(s, "Customization — Settings Panel");
  accentLine(s, 0.4, 1.27);
  addFooter(s, 13, TOTAL);

  const settings = [
    {
      name: "AI Model Selection",
      icon: "🤖",
      options: "GPT-4o  |  GPT-4o Mini  |  Claude 3.5 Sonnet  |  Gemini 2.5 Flash",
      desc: "Choose which AI model generates your answers. Each model has different strengths — switch at any time, even mid-conversation.",
      tip: "Default: GPT-4o",
      color: C.accent,
    },
    {
      name: "Chain Type",
      icon: "🔗",
      options: "Stuff  |  Map Reduce  |  Refine  |  Map Rerank",
      desc: "Controls how the AI processes multiple document sections. 'Stuff' works best for most cases. 'Map Reduce' handles very long documents.",
      tip: "Default: Stuff",
      color: C.teal,
    },
    {
      name: "Retrieval Count (k)",
      icon: "🔢",
      options: "1  to  10",
      desc: "How many document sections the AI reads before generating an answer. Higher values = more context, but slower responses.",
      tip: "Default: 4",
      color: C.accentAlt,
    },
    {
      name: "Query Expansion",
      icon: "🔍",
      options: "On  |  Off",
      desc: "When enabled, the system automatically rephrases your question 2–3 ways before searching, improving retrieval accuracy.",
      tip: "Default: On",
      color: C.orange,
    },
  ];

  settings.forEach((st, i) => {
    const row = Math.floor(i / 2);
    const col = i % 2;
    const x = 0.4 + col * 6.45;
    const y = 1.52 + row * 2.55;
    addCard(s, x, y, 6.1, 2.3, C.cardBg);
    s.addShape(pptx.ShapeType.rect, { x, y, w: 6.1, h: 0.08, fill: { color: st.color }, line: { width: 0 } });

    iconCircle(s, st.icon, x + 0.52, y + 0.5, 0.33, st.color);
    s.addText(st.name, { x: x + 1.05, y: y + 0.18, w: 4.85, h: 0.35, fontSize: 13.5, bold: true, color: C.white, fontFace: "Calibri" });

    s.addShape(pptx.ShapeType.roundRect, { x: x + 0.2, y: y + 0.68, w: 5.7, h: 0.3, fill: { color: "0F1C2E" }, line: { color: C.cardBorder, width: 0.8 }, rectRadius: 0.06 });
    s.addText(st.options, { x: x + 0.3, y: y + 0.68, w: 5.5, h: 0.3, fontSize: 10, color: st.color, bold: true, valign: "middle", fontFace: "Calibri" });

    bodyText(s, st.desc, x + 0.2, y + 1.1, 5.7, 0.8, { size: 11 });
    s.addText("⚙  " + st.tip, { x: x + 0.2, y: y + 2.0, w: 5.7, h: 0.24, fontSize: 9.5, color: st.color, fontFace: "Calibri", bold: true });
  });

  bodyText(s, "All settings are automatically saved in the browser and remembered across sessions. No configuration required from the user each time.", 0.4, 6.88, 12.5, 0.4, { size: 10.5, color: C.lightGray, italic: true });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 14 — SECURITY & PRIVACY
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s);
  addHeaderBar(s);
  sectionLabel(s, "Security");
  slideTitle(s, "Security & Privacy");
  accentLine(s, 0.4, 1.27);
  addFooter(s, 14, TOTAL);

  // 3 main security pillars
  const pillars = [
    {
      icon: "🔐", title: "Account Security", color: C.accent,
      points: [
        "Passwords are one-way encrypted — never stored as plain text",
        "Secure session tokens (JWT) expire automatically after 7 days",
        "Each user account is fully isolated — no shared data between users",
      ],
    },
    {
      icon: "📁", title: "Document Security", color: C.teal,
      points: [
        "Files stored on Cloudinary — a professional, enterprise-grade cloud platform",
        "Each user's AI document index is privately keyed to their account only",
        "Deleted documents are permanently removed from both storage and the AI index",
      ],
    },
    {
      icon: "🛡️", title: "Access Control", color: C.accentAlt,
      points: [
        "All sensitive actions require a valid login token — unauthenticated requests blocked",
        "Rate limiting: 100 requests per 15 minutes per user — prevents misuse",
        "CORS protection: app only accepts requests from approved web addresses",
      ],
    },
  ];

  pillars.forEach((p, i) => {
    const x = 0.4 + i * 4.22;
    addCard(s, x, 1.52, 4.0, 3.5, C.cardBg);
    s.addShape(pptx.ShapeType.rect, { x, y: 1.52, w: 4.0, h: 0.09, fill: { color: p.color }, line: { width: 0 } });
    iconCircle(s, p.icon, x + 2.0, 2.05, 0.38, p.color);
    s.addText(p.title, { x: x + 0.15, y: 2.55, w: 3.7, h: 0.38, fontSize: 13, bold: true, color: C.white, align: "center", fontFace: "Calibri" });
    bulletList(s, p.points, x + 0.18, 3.02, 3.65, 2.0, { size: 10.5, bulletColor: p.color });
  });

  // Data storage table
  s.addText("Where Your Data Lives", { x: 0.4, y: 5.22, w: 12.5, h: 0.38, fontSize: 14, bold: true, color: C.white, fontFace: "Calibri" });

  const tableData = [
    ["Data Type", "Storage Location", "Access"],
    ["User accounts (name, email)", "MongoDB database", "Your account only"],
    ["Chat history & conversations", "MongoDB database", "Your account only"],
    ["Uploaded documents (files)", "Cloudinary cloud storage", "Your account only"],
    ["AI document index (embeddings)", "Server file system", "Your account only"],
  ];

  tableData.forEach((row, ri) => {
    const isHeader = ri === 0;
    const y = 5.65 + ri * 0.3;
    const colors = [C.navy, "0F1C2E", C.cardBg, "0F1C2E", C.cardBg];
    s.addShape(pptx.ShapeType.rect, { x: 0.4, y, w: 12.5, h: 0.3, fill: { color: isHeader ? C.accent : colors[ri] }, line: { width: 0 } });
    const colW = [4.5, 4.5, 3.5];
    const colX = [0.5, 5.05, 9.6];
    row.forEach((cell, ci) => {
      s.addText(cell, { x: colX[ci], y, w: colW[ci], h: 0.3, fontSize: isHeader ? 10 : 9.5, bold: isHeader, color: isHeader ? C.white : C.textBody, valign: "middle", fontFace: "Calibri" });
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 15 — TECHNOLOGY OVERVIEW
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s);
  addHeaderBar(s);
  sectionLabel(s, "Technology");
  slideTitle(s, "How the Technology Works — Simply Explained");
  accentLine(s, 0.4, 1.27);
  addFooter(s, 15, TOTAL);

  const tech = [
    {
      icon: "🖥️", title: "Frontend — What You See",
      tech: "React.js",
      analogy: "Like the dashboard of a car",
      desc: "The visual interface — chat bubbles, sidebar, buttons — runs in your web browser. Built with React, the same technology used by Facebook and Instagram.",
      color: C.accent,
    },
    {
      icon: "⚙️", title: "Backend — The Engine",
      tech: "Node.js + Express",
      analogy: "Like the engine under the hood",
      desc: "The server that processes uploads, runs AI queries, and manages data. Fast, reliable, and trusted by companies like Netflix and LinkedIn.",
      color: C.teal,
    },
    {
      icon: "🗄️", title: "Database — The Memory",
      tech: "MongoDB",
      analogy: "Like a filing cabinet",
      desc: "Stores user accounts and conversation history. Modern and flexible — used by Adobe, eBay, and thousands of enterprises worldwide.",
      color: C.accentAlt,
    },
    {
      icon: "🧠", title: "AI Brain — The Intelligence",
      tech: "LangChain + OpenRouter",
      analogy: "Like the brain of the system",
      desc: "LangChain orchestrates how documents are processed and answers generated. OpenRouter connects to GPT-4o, Claude, and Gemini through a single gateway.",
      color: C.orange,
    },
    {
      icon: "🔍", title: "Semantic Search — The Understanding",
      tech: "Vector Embeddings",
      analogy: "Like a meaning-based index",
      desc: "Documents are converted into mathematical fingerprints. When you ask a question, the system finds the closest matching fingerprints — understanding meaning, not just keywords.",
      color: "E91E8C",
    },
    {
      icon: "☁️", title: "File Storage — The Vault",
      tech: "Cloudinary",
      analogy: "Like a secure cloud drive",
      desc: "All uploaded files are stored in Cloudinary — an enterprise cloud storage service trusted by thousands of businesses for secure and reliable file management.",
      color: "00BCD4",
    },
  ];

  tech.forEach((t, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.4 + col * 4.22;
    const y = 1.52 + row * 2.55;
    addCard(s, x, y, 3.97, 2.3, C.cardBg);
    s.addShape(pptx.ShapeType.rect, { x, y, w: 3.97, h: 0.08, fill: { color: t.color }, line: { width: 0 } });
    iconCircle(s, t.icon, x + 0.52, y + 0.5, 0.3, t.color);
    s.addText(t.title, { x: x + 0.98, y: y + 0.15, w: 2.85, h: 0.38, fontSize: 10.5, bold: true, color: C.white, fontFace: "Calibri", wrap: true });
    s.addShape(pptx.ShapeType.roundRect, { x: x + 0.98, y: y + 0.55, w: 2.85, h: 0.25, fill: { color: t.color, transparency: 20 }, line: { color: t.color, width: 0.8 }, rectRadius: 0.05 });
    s.addText(t.tech, { x: x + 0.98, y: y + 0.55, w: 2.85, h: 0.25, fontSize: 8.5, bold: true, color: C.white, align: "center", valign: "middle", fontFace: "Calibri" });
    bodyText(s, t.desc, x + 0.18, y + 0.92, 3.6, 1.3, { size: 9.5 });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 16 — SETUP REQUIREMENTS
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s);
  addHeaderBar(s);
  sectionLabel(s, "Setup");
  slideTitle(s, "Setup & Deployment Requirements");
  accentLine(s, 0.4, 1.27);
  addFooter(s, 16, TOTAL);

  // Prerequisites
  addCard(s, 0.4, 1.52, 5.9, 2.2, C.cardBg);
  s.addShape(pptx.ShapeType.rect, { x: 0.4, y: 1.52, w: 0.1, h: 2.2, fill: { color: C.accent }, line: { width: 0 } });
  s.addText("Software Prerequisites", { x: 0.62, y: 1.62, w: 5.5, h: 0.35, fontSize: 13, bold: true, color: C.white, fontFace: "Calibri" });
  bulletList(s, ["Node.js version 16 or higher", "MongoDB (local install or MongoDB Atlas cloud)", "Any modern web browser (Chrome, Firefox, Edge, Safari)"], 0.62, 2.06, 5.55, 1.5, { size: 12 });

  // External services
  addCard(s, 6.65, 1.52, 6.3, 2.2, C.cardBg);
  s.addShape(pptx.ShapeType.rect, { x: 6.65, y: 1.52, w: 0.1, h: 2.2, fill: { color: C.teal }, line: { width: 0 } });
  s.addText("External Services Required", { x: 6.87, y: 1.62, w: 5.9, h: 0.35, fontSize: 13, bold: true, color: C.white, fontFace: "Calibri" });

  const services = [
    { name: "OpenRouter", purpose: "Access to all AI models (GPT-4, Claude, Gemini)", color: C.accent },
    { name: "Cloudinary", purpose: "Secure file storage for uploaded documents", color: C.teal },
    { name: "MongoDB", purpose: "Database for users and chat history", color: "00ED64" },
  ];
  services.forEach((sv, i) => {
    const y = 2.08 + i * 0.52;
    s.addShape(pptx.ShapeType.roundRect, { x: 6.82, y, w: 1.5, h: 0.35, fill: { color: sv.color, transparency: 15 }, line: { color: sv.color, width: 1 }, rectRadius: 0.06 });
    s.addText(sv.name, { x: 6.82, y, w: 1.5, h: 0.35, fontSize: 9, bold: true, color: C.white, align: "center", valign: "middle", fontFace: "Calibri" });
    bodyText(s, sv.purpose, 8.5, y, 4.35, 0.35, { size: 10.5, valign: "middle" });
  });

  // Startup steps
  s.addText("Startup Process", { x: 0.4, y: 3.92, w: 12.5, h: 0.38, fontSize: 14, bold: true, color: C.white, fontFace: "Calibri" });

  const startupSteps = [
    { n: "1", text: "Configure the environment file with API keys and database connection string", color: C.accent },
    { n: "2", text: "Install dependencies for both the backend server and the frontend interface", color: C.teal },
    { n: "3", text: "Start the backend server — it will run on port 3001", color: C.accentAlt },
    { n: "4", text: "Start the frontend development server — it will run on port 5173", color: C.orange },
    { n: "5", text: "Open a browser and navigate to http://localhost:5173 to access the application", color: "E91E8C" },
  ];

  startupSteps.forEach((step, i) => {
    const x = 0.4;
    const y = 4.42 + i * 0.47;
    numCircle(s, step.n, x + 0.28, y + 0.13, 0.22, step.color);
    bodyText(s, step.text, x + 0.65, y, 12.0, 0.42, { size: 12 });
  });

  addCard(s, 0.4, 6.82, 12.5, 0.4, "0F1C2E");
  s.addText("⚠  For production deployment, the application should be hosted on a secure server with HTTPS enabled. Contact the development team for cloud deployment guidance.", {
    x: 0.6, y: 6.82, w: 12.1, h: 0.4, fontSize: 10, color: C.orange, fontFace: "Calibri", valign: "middle",
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 17 — LIMITATIONS
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s);
  addHeaderBar(s);
  sectionLabel(s, "Limitations");
  slideTitle(s, "Current Limitations & Boundaries");
  accentLine(s, 0.4, 1.27);
  addFooter(s, 17, TOTAL);

  s.addText("We believe in full transparency. Here are the current boundaries of the application:", { x: 0.4, y: 1.42, w: 12.5, h: 0.32, fontSize: 12, color: C.lightGray, fontFace: "Calibri", italic: true });

  const limits = [
    { icon: "📂", title: "5 Documents Per User",       desc: "Each account can hold up to 5 documents at a time. Old documents can be deleted to make room for new ones.",           color: C.accent },
    { icon: "⚖️", title: "50 MB Per File",             desc: "Individual uploaded files cannot exceed 50 MB in size. This covers the vast majority of business documents.",            color: C.teal },
    { icon: "💬", title: "10 Messages of Context",     desc: "The AI considers only your last 10 messages when answering. Older conversation history is not actively used.",           color: C.accentAlt },
    { icon: "🔢", title: "4 Sections by Default",      desc: "The AI reads the top 4 most relevant document sections per question. This is configurable up to 10 in settings.",      color: C.orange },
    { icon: "🌐", title: "Internet Required",          desc: "AI model access requires a live internet connection to OpenRouter. Offline mode is not currently supported.",             color: "E91E8C" },
    { icon: "📝", title: "Read-Only Documents",        desc: "The application reads and analyzes documents only. It cannot edit, modify, or write back to your files.",               color: "00BCD4" },
    { icon: "🖼️", title: "Descriptive Image Analysis", desc: "For images, the AI generates a description. It does not perform character-level OCR extraction from scanned documents.", color: "FF9800" },
    { icon: "💾", title: "Local Vector Storage",       desc: "Document AI indexes are stored on the application server's file system, not in a dedicated cloud vector database.",     color: "9C27B0" },
  ];

  limits.forEach((l, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.4 + col * 6.45;
    const y = 1.85 + row * 1.2;
    addCard(s, x, y, 6.1, 1.05, C.cardBg);
    s.addShape(pptx.ShapeType.rect, { x, y, w: 0.09, h: 1.05, fill: { color: l.color }, line: { width: 0 } });
    iconCircle(s, l.icon, x + 0.5, y + 0.525, 0.27, l.color);
    s.addText(l.title, { x: x + 0.95, y: y + 0.07, w: 5.0, h: 0.3, fontSize: 11.5, bold: true, color: C.white, fontFace: "Calibri" });
    bodyText(s, l.desc, x + 0.95, y + 0.4, 5.0, 0.58, { size: 10 });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 18 — FAQ (PART 1)
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s);
  addHeaderBar(s);
  sectionLabel(s, "FAQ");
  slideTitle(s, "Frequently Asked Questions — Part 1");
  accentLine(s, 0.4, 1.27);
  addFooter(s, 18, TOTAL);

  const faqs = [
    {
      q: "Can multiple users use the application simultaneously?",
      a: "Yes. The system supports multiple concurrent users. Each user has a completely isolated account — documents and conversations are never shared between users.",
    },
    {
      q: "Will the AI answer questions about topics not in my documents?",
      a: "No. By default, the AI is instructed to answer only based on uploaded documents. If relevant information is not found, it will say so rather than inventing an answer.",
    },
    {
      q: "Can I upload a new document while keeping my existing ones?",
      a: "Yes. You can have up to 5 documents at a time. Add or remove individual documents as needed without affecting the others.",
    },
    {
      q: "Is my data shared with any third parties?",
      a: "Your data is not sold or shared for commercial purposes. The only third parties involved are: OpenRouter (AI processing), Cloudinary (file storage), and MongoDB (database). All are enterprise-grade, trusted services.",
    },
    {
      q: "Can I ask questions in languages other than English?",
      a: "Yes. All supported AI models (GPT-4o, Claude, Gemini) support multiple languages. Questions and answers can be in any language these models support.",
    },
  ];

  faqs.forEach((f, i) => {
    const y = 1.55 + i * 1.09;
    addCard(s, 0.4, y, 12.5, 0.98, C.cardBg);
    s.addShape(pptx.ShapeType.rect, { x: 0.4, y, w: 0.09, h: 0.98, fill: { color: C.accent }, line: { width: 0 } });
    s.addText("Q", { x: 0.55, y: y + 0.04, w: 0.28, h: 0.28, fontSize: 11, bold: true, color: C.accent, align: "center", valign: "middle", fontFace: "Calibri" });
    s.addText(f.q, { x: 0.95, y: y + 0.06, w: 11.7, h: 0.3, fontSize: 11.5, bold: true, color: C.white, fontFace: "Calibri" });
    s.addShape(pptx.ShapeType.rect, { x: 0.95, y: y + 0.42, w: 11.7, h: 0.02, fill: { color: C.cardBorder }, line: { width: 0 } });
    bodyText(s, f.a, 0.95, y + 0.5, 11.7, 0.42, { size: 10.5 });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 19 — FAQ (PART 2)
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s);
  addHeaderBar(s);
  sectionLabel(s, "FAQ");
  slideTitle(s, "Frequently Asked Questions — Part 2");
  accentLine(s, 0.4, 1.27);
  addFooter(s, 19, TOTAL);

  const faqs2 = [
    {
      q: "What happens if I delete a document?",
      a: "The file is permanently removed from Cloudinary storage and its data is erased from your AI index. Existing chat answers referencing it remain in history, but future questions will no longer draw from that document.",
    },
    {
      q: "Can I export my conversation history?",
      a: "Yes. Click 'Export Chat' in the sidebar to download your entire conversation as a plain text Markdown file, which can be opened in any text editor or word processor.",
    },
    {
      q: "How accurate are the AI answers?",
      a: "Accuracy depends on the clarity and quality of uploaded documents. Every answer includes a source reference (document name, page number, relevance score), allowing you to verify any answer directly in the original file.",
    },
    {
      q: "Can I switch AI models mid-conversation?",
      a: "Yes. Open the Settings panel in the sidebar and select a different model. The next question you ask will use the newly selected model. Previous answers are not affected.",
    },
    {
      q: "What is 'Chain Type' and which should I choose?",
      a: "Chain Type controls how the AI processes multiple document sections. 'Stuff' (default) works for most cases. 'Map Reduce' is better for very long documents. 'Refine' gives detailed analysis. 'Map Rerank' is best for precise factual queries.",
    },
  ];

  faqs2.forEach((f, i) => {
    const y = 1.55 + i * 1.09;
    addCard(s, 0.4, y, 12.5, 0.98, C.cardBg);
    s.addShape(pptx.ShapeType.rect, { x: 0.4, y, w: 0.09, h: 0.98, fill: { color: C.teal }, line: { width: 0 } });
    s.addText("Q", { x: 0.55, y: y + 0.04, w: 0.28, h: 0.28, fontSize: 11, bold: true, color: C.teal, align: "center", valign: "middle", fontFace: "Calibri" });
    s.addText(f.q, { x: 0.95, y: y + 0.06, w: 11.7, h: 0.3, fontSize: 11.5, bold: true, color: C.white, fontFace: "Calibri" });
    s.addShape(pptx.ShapeType.rect, { x: 0.95, y: y + 0.42, w: 11.7, h: 0.02, fill: { color: C.cardBorder }, line: { width: 0 } });
    bodyText(s, f.a, 0.95, y + 0.5, 11.7, 0.42, { size: 10.5 });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 20 — CLOSING / THANK YOU
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s, C.navy);

  // Decorative elements
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.18, h: "100%", fill: { color: C.accent }, line: { width: 0 } });
  s.addShape(pptx.ShapeType.ellipse, { x: 9.8, y: -1.5, w: 5, h: 5, fill: { color: C.accentAlt, transparency: 88 }, line: { width: 0 } });
  s.addShape(pptx.ShapeType.ellipse, { x: 10.5, y: 4.5, w: 3.5, h: 3.5, fill: { color: C.teal, transparency: 82 }, line: { width: 0 } });

  s.addText("Thank You", { x: 0.6, y: 1.5, w: 9, h: 1.1, fontSize: 52, bold: true, color: C.white, fontFace: "Calibri" });
  accentLine(s, 0.6, 2.72, 3.5, C.accent);
  accentLine(s, 0.6, 2.86, 2, C.teal);

  s.addText("DocuChat AI — Intelligent Document Q&A", { x: 0.6, y: 3.05, w: 10, h: 0.5, fontSize: 20, color: C.offWhite, fontFace: "Calibri" });

  s.addText("Summary of What DocuChat AI Delivers:", { x: 0.6, y: 3.72, w: 8.5, h: 0.35, fontSize: 13, bold: true, color: C.accent, fontFace: "Calibri" });

  const summaryPoints = [
    "Upload any document — PDF, Excel, Text, or Image",
    "Ask questions in plain language and get instant AI-powered answers",
    "Every answer is backed by exact source references from your documents",
    "Multi-model support: GPT-4o, Claude 3.5, Gemini 2.5",
    "Secure, private accounts — your data belongs only to you",
    "Real-time streaming responses with follow-up suggestions",
  ];

  summaryPoints.forEach((pt, i) => {
    const col = i < 3 ? 0 : 1;
    const row = i % 3;
    const x = 0.6 + col * 6.3;
    const y = 4.15 + row * 0.52;
    s.addShape(pptx.ShapeType.ellipse, { x, y: y + 0.08, w: 0.2, h: 0.2, fill: { color: C.teal }, line: { width: 0 } });
    s.addText(pt, { x: x + 0.3, y, w: 5.8, h: 0.42, fontSize: 11.5, color: C.textBody, fontFace: "Calibri", valign: "middle" });
  });

  // Bottom bar
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 6.9, w: "100%", h: 0.6, fill: { color: C.darkBlue }, line: { width: 0 } });
  s.addText("DocuChat AI  ·  Client Presentation  ·  Version 1.0  ·  April 2026  ·  Confidential", {
    x: 0.4, y: 6.9, w: 12.5, h: 0.6, fontSize: 9.5, color: C.midGray, align: "center", valign: "middle", fontFace: "Calibri",
  });
}

// ─── Save ─────────────────────────────────────────────────────────────────────
pptx.writeFile({ fileName: "D:/PDF Q&A Bot JS/Presentation.pptx" })
  .then(() => console.log("Presentation.pptx created successfully."))
  .catch((err) => console.error("Error:", err));
