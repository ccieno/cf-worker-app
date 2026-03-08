export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/" || path === "/app") {
      return htmlResponse(APP_HTML);
    }

    if (path === "/admin") {
      return htmlResponse(ADMIN_HTML);
    }

    if (path === "/harness") {
      return htmlResponse(HARNESS_HTML);
    }

    if (path === "/api/config") {
      return handleConfig(request, env);
    }

    if (path === "/api/lookup") {
      return handleLookup(request, env);
    }

    if (path === "/api/admin/seed") {
      return handleSeed(request, env);
    }

    if (path === "/api/admin/reset-all") {
      return handleResetAll(request, env);
    }

    return new Response("Not found", { status: 404 });
  }
};

function htmlResponse(html) {
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8"
    }
  });
}

async function handleConfig(request, env) {
  try {
    const row = await env.DB.prepare(`
      SELECT *
      FROM config
      WHERE id = 1
      LIMIT 1
    `).first();

    return Response.json(row ?? {});
  } catch (err) {
    return Response.json(
      { error: String(err?.message || err) },
      { status: 500 }
    );
  }
}

async function handleLookup(request, env) {
  try {
    const body = await request.json().catch(() => ({}));
    const incomingPhone =
      body.phone ||
      body?.variables?.Consumer?.phoneNumber1 ||
      body?.variables?.consumer?.phoneNumber1 ||
      "";
    const incomingEmail = body.email || "";
    const channel = body.channel || "voice";
    const variables = body.variables || {};

    const config = await env.DB.prepare(`
      SELECT *
      FROM config
      WHERE id = 1
      LIMIT 1
    `).first();

    const normalizedPhone = normalizePhone(incomingPhone);

    let result;

    if (config.backend === "custom_crm") {
      result = await lookupMockCrm({
        phone: normalizedPhone,
        email: incomingEmail,
        env
      });
    } else {
      return Response.json({
        error: "Salesforce lookup not implemented yet"
      });
    }

    return Response.json({
      ok: true,
      config,
      engagement: {
        channel,
        phone: incomingPhone,
        normalizedPhone,
        email: incomingEmail,
        variables
      },
      ...result
    });
  } catch (err) {
    return Response.json(
      { error: String(err?.message || err) },
      { status: 500 }
    );
  }
}

async function lookupMockCrm({ phone, email, env }) {
  const token = env.MOCK_API_TOKEN;
  const base = env.MOCK_API_BASE_URL;

  const customerUrl =
    `${base}/demoapp?token=${encodeURIComponent(token)}&number=${encodeURIComponent(phone)}`;

  const casesUrl =
    `${base}/cases?token=${encodeURIComponent(token)}&number=${encodeURIComponent(phone)}`;

  const [customerRes, casesRes] = await Promise.all([
    fetch(customerUrl),
    fetch(casesUrl)
  ]);

  const customers = await customerRes.json();
  const cases = await casesRes.json();

  const customer = Array.isArray(customers) && customers.length
    ? mapMockCustomer(customers[0])
    : null;

  const mappedCases = Array.isArray(cases)
    ? cases.map(mapMockCase)
    : [];

  const primaryRecord = mappedCases.length ? mappedCases[0] : null;
  const recentRecords = mappedCases.slice(1, 4);

  return {
    customer,
    primaryRecord,
    recentRecords
  };
}

function mapMockCustomer(row) {
  return {
    id: String(row.id ?? ""),
    name: row.name || "",
    email: row.email || "",
    phone: row.number || "",
    address: row.location || "",
    tierOrStatus: row.status || ""
  };
}

function mapMockCase(row) {
  return {
    id: String(row.id ?? ""),
    displayNumber: row.number || "",
    subject: row.subject || row.next || "",
    status: row.status || "",
    dueDate: row.due || row.date || "",
    description: row.description || "",
    lastUpdated: row.lastUpdate || ""
  };
}

async function handleSeed(request, env) {
  const body = await request.json();
  const scenarioKey = body.scenarioKey;

  const seed = await env.DB.prepare(`
    SELECT *
    FROM seeds
    WHERE scenario_key = ?
  `).bind(scenarioKey).first();

  const preset = getBrandPreset(
    seed.backend === "custom_crm" ? "custom_crm" : "salesforce"
  );

  await env.DB.prepare(`
    UPDATE config
    SET brand=?,
        backend=?,
        app_title=?,
        customer_label=?,
        primary_record_label=?,
        create_label=?,
        recent_records_label=?,
        customer_tier_label=?,
        logo_url=?,
        primary_hex=?,
        secondary_hex=?,
        accent_hex=?,
        updated_at=datetime('now')
    WHERE id=1
  `).bind(
    preset.brand,
    preset.backend,
    preset.app_title,
    preset.customer_label,
    preset.primary_record_label,
    preset.create_label,
    preset.recent_records_label,
    preset.customer_tier_label,
    preset.logo_url,
    preset.primary_hex,
    preset.secondary_hex,
    preset.accent_hex
  ).run();

  return Response.json({ ok: true, scenarioKey, backend: preset.backend });
}

async function handleResetAll(request, env) {
  const preset = getBrandPreset("custom_crm");

  await env.DB.prepare(`
    UPDATE config
    SET brand=?,
        backend=?,
        app_title=?,
        customer_label=?,
        primary_record_label=?,
        create_label=?,
        recent_records_label=?,
        customer_tier_label=?,
        logo_url=?,
        primary_hex=?,
        secondary_hex=?,
        accent_hex=?,
        updated_at=datetime('now')
    WHERE id=1
  `).bind(
    preset.brand,
    preset.backend,
    preset.app_title,
    preset.customer_label,
    preset.primary_record_label,
    preset.create_label,
    preset.recent_records_label,
    preset.customer_tier_label,
    preset.logo_url,
    preset.primary_hex,
    preset.secondary_hex,
    preset.accent_hex
  ).run();

  return Response.json({ ok: true, backend: "custom_crm" });
}

function normalizePhone(input) {
  if (!input) return "";

  let value = String(input).replace(/[\s()-]/g, "");

  if (value.startsWith("+44")) return value;
  if (value.startsWith("44")) return "+" + value;
  if (value.startsWith("0")) return "+44" + value.slice(1);

  return value;
}

function getBrandPreset(key) {
  const presets = {
    salesforce: {
      brand: "salesforce",
      backend: "salesforce",
      app_title: "Salesforce Orders Connector",
      customer_label: "Customer",
      primary_record_label: "Order",
      create_label: "New Order",
      recent_records_label: "Recent Orders",
      customer_tier_label: "Customer Tier",
      logo_url: "/assets/logos/salesforce.png",
      primary_hex: "#00A1E0",
      secondary_hex: "#F4F6F9",
      accent_hex: "#0176D3"
    },
    custom_crm: {
      brand: "custom_crm",
      backend: "custom_crm",
      app_title: "Custom CRM Connector",
      customer_label: "Client",
      primary_record_label: "Appointment",
      create_label: "New Appointment",
      recent_records_label: "Recent Appointments",
      customer_tier_label: "Client Status",
      logo_url: "/assets/logos/custom-crm.png",
      primary_hex: "#6B7280",
      secondary_hex: "#F3F4F6",
      accent_hex: "#374151"
    }
  };

  return presets[key] || presets.custom_crm;
}

const APP_HTML = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Agent App</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background: #f5f5f7;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.1);
    }
    .header {
      font-weight: bold;
      font-size: 18px;
      margin-bottom: 12px;
    }
    .row {
      margin-bottom: 6px;
    }
    .muted {
      color: #666;
    }
    .record {
      border-top: 1px solid #eee;
      padding-top: 10px;
      margin-top: 10px;
    }
    pre {
      white-space: pre-wrap;
      word-break: break-word;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div id="app">Loading...</div>

  <script>
    async function run() {
      const params = new URLSearchParams(window.location.search);
      const phone = params.get("phone") || "+447700900010";

      const res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "voice",
          phone: phone
        })
      });

      const data = await res.json();
      const config = data.config || {};

      let html = "";

      html += "<div class='card'>";
      html += "<div class='header'>" + (config.app_title || "Integration Demo") + "</div>";
      html += "</div>";

      if (data.customer) {
        html += "<div class='card'>";
        html += "<div class='header'>" + (config.customer_label || "Customer") + "</div>";
        html += "<div class='row'><b>Name:</b> " + (data.customer.name || "") + "</div>";
        html += "<div class='row'><b>Email:</b> " + (data.customer.email || "") + "</div>";
        html += "<div class='row'><b>Phone:</b> " + (data.customer.phone || "") + "</div>";
        html += "<div class='row'><b>" + (config.customer_tier_label || "Status") + ":</b> " + (data.customer.tierOrStatus || "") + "</div>";
        html += "</div>";
      } else {
        html += "<div class='card'><div class='muted'>No customer found</div></div>";
      }

      if (data.primaryRecord) {
        html += "<div class='card'>";
        html += "<div class='header'>" + (config.primary_record_label || "Record") + "</div>";
        html += "<div class='row'><b>Subject:</b> " + (data.primaryRecord.subject || "") + "</div>";
        html += "<div class='row'><b>Status:</b> " + (data.primaryRecord.status || "") + "</div>";
        html += "<div class='row'><b>Due:</b> " + (data.primaryRecord.dueDate || "") + "</div>";
        html += "</div>";
      } else {
        html += "<div class='card'><div class='muted'>No open records found</div></div>";
      }

      if (data.recentRecords && data.recentRecords.length) {
        html += "<div class='card'>";
        html += "<div class='header'>" + (config.recent_records_label || "Recent Records") + "</div>";

        data.recentRecords.forEach(function(r) {
          html += "<div class='record'>";
          html += "<div><b>" + (r.subject || "") + "</b></div>";
          html += "<div class='muted'>" + (r.status || "") + " • " + (r.dueDate || "") + "</div>";
          html += "</div>";
        });

        html += "</div>";
      }

      html += "<div class='card'>";
      html += "<div class='header'>Debug</div>";
      html += "<pre>" + JSON.stringify(data, null, 2) + "</pre>";
      html += "</div>";

      document.getElementById("app").innerHTML = html;
    }

    run();
  </script>
</body>
</html>
`;

const ADMIN_HTML = `
<!doctype html>
<html>
<body>
<h2>Admin</h2>
<button onclick="seed('matched_open_order')">Seed Standard Order</button>
<button onclick="seed('vip_customer')">Seed VIP</button>
<button onclick="seed('matched_no_open_order')">Seed No Open Order</button>
<button onclick="seed('no_customer_match')">Seed Unknown Customer</button>
<button onclick="seed('custom_crm_appointment')">Seed Custom CRM</button>
<button onclick="resetAll()">Reset All</button>
<pre id="out">Ready</pre>
<script>
async function seed(k){
 const r=await fetch("/api/admin/seed",{
   method:"POST",
   headers:{"Content-Type":"application/json"},
   body:JSON.stringify({scenarioKey:k})
 });
 const d=await r.json();
 document.getElementById("out").textContent =
   JSON.stringify(d,null,2);
}
async function resetAll(){
 const r=await fetch("/api/admin/reset-all",{ method:"POST" });
 const d=await r.json();
 document.getElementById("out").textContent =
   JSON.stringify(d,null,2);
}
</script>
</body>
</html>
`;

const HARNESS_HTML = `
<!doctype html>
<html>
<body>
<h2>Harness</h2>
<p>Test harness coming soon.</p>
</body>
</html>
`;