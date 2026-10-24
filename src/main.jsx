import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const integrations = [
  { id: "gmail", name: "Gmail", detail: "Incoming attachments", icon: "✉", color: "coral" },
  { id: "drive", name: "Google Drive", detail: "Client folders", icon: "△", color: "blue" },
  { id: "slack", name: "Slack", detail: "Team notifications", icon: "⌁", color: "purple" },
  { id: "hubspot", name: "HubSpot", detail: "CRM notes", icon: "◈", color: "orange" },
  { id: "notion", name: "Notion", detail: "Document log", icon: "N", color: "ink" },
];

const FASTN_WIDGET_ID = import.meta.env.VITE_FASTN_WIDGET_ID || "wgt_651b5e32ea5a";
const FASTN_WORKFLOW_ID = import.meta.env.VITE_FASTN_WORKFLOW_ID || "wf_a1fd67dfd0b2";
const FASTN_EMBED_URL = import.meta.env.VITE_FASTN_EMBED_URL || "";

const initialTenants = {
  acme: {
    name: "Acme Accounting",
    initials: "AA",
    email: "ops@acme-accounting.test",
    files: ["Invoice_Acme_Oct.pdf", "NDA_Globex.pdf"],
    connected: ["gmail", "drive", "slack", "hubspot"],
    rules: [
      { pattern: "Invoice_*", destination: "/Invoices/<client>", channel: "#finance" },
      { pattern: "NDA_* / Contract_*", destination: "/Legal", channel: "#legal" },
    ],
  },
  globex: {
    name: "Globex Bookkeeping",
    initials: "GB",
    email: "hello@globex-books.test",
    files: ["Invoice_Globex_Oct.pdf", "Contract_Acme.pdf"],
    connected: ["gmail", "drive", "slack"],
    rules: [
      { pattern: "Invoice_*", destination: "/Client invoices/<client>", channel: "#accounts" },
      { pattern: "NDA_* / Contract_*", destination: "/Contracts", channel: "#legal" },
    ],
  },
};

function App() {
  const [tenantId, setTenantId] = useState("acme");
  const [tenantData, setTenantData] = useState(() => {
    try { return JSON.parse(localStorage.getItem("docdrop-tenants")) || initialTenants; } catch { return initialTenants; }
  });
  const [activeTab, setActiveTab] = useState("overview");
  const [activity, setActivity] = useState([]);
  const [processing, setProcessing] = useState(false);
  const tenant = tenantData[tenantId];

  const connectedCount = tenant.connected.length;
  const latestFile = useMemo(() => tenant.files[0], [tenant.files]);

  function saveTenant(nextTenant) {
    const next = { ...tenantData, [tenantId]: nextTenant };
    setTenantData(next);
    localStorage.setItem("docdrop-tenants", JSON.stringify(next));
  }

  async function processFile(fileName = latestFile) {
    setProcessing(true);
    const payload = { tenantId: `tenant_${tenantId}`, fileName, fileId: `demo-${Date.now()}`, sender: tenant.email };
    try {
      const response = await fetch(import.meta.env.VITE_FASTN_TRIGGER_URL || "https://webhooks.fastn.dev/prod/triggers/personal_0978161c45b729395e36/webhooks/docdrop-inbound-router", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error(`Fastn returned ${response.status}`);
      const result = await response.json();
      setActivity((items) => [
        { fileName, destination: result.destination || "Fastn workflow", time: "Just now", tenant: tenant.name, status: result.status || "Routed successfully" },
        ...items,
      ]);
      setActiveTab("activity");
    } catch (error) {
      setActivity((items) => [{ fileName, destination: "Not routed", time: "Just now", tenant: tenant.name, status: `Failed: ${error.message}` }, ...items]);
      setActiveTab("activity");
    } finally { setProcessing(false); }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">D</span><span>docdrop</span></div>
        <div className="workspace-label">WORKSPACE</div>
        <div className="tenant-picker"><span className="avatar">{tenant.initials}</span><span className="tenant-copy"><strong>{tenant.name}</strong><small>Personal workspace</small></span><span>⌄</span></div>
        <div className="tenant-switcher">
          {Object.entries(tenantData).map(([id, item]) => <button key={id} className={tenantId === id ? "tenant-option selected" : "tenant-option"} onClick={() => { setTenantId(id); setActiveTab("overview"); }}>{item.initials}<span>{item.name}</span></button>)}
        </div>
        <nav>
          <button className={activeTab === "overview" ? "nav-item active" : "nav-item"} onClick={() => setActiveTab("overview")}><span>◫</span> Overview</button>
          <button className={activeTab === "integrations" ? "nav-item active" : "nav-item"} onClick={() => setActiveTab("integrations")}><span>◎</span> Integrations <b>{connectedCount}</b></button>
          <button className={activeTab === "rules" ? "nav-item active" : "nav-item"} onClick={() => setActiveTab("rules")}><span>⌘</span> Routing rules</button>
          <button className={activeTab === "activity" ? "nav-item active" : "nav-item"} onClick={() => setActiveTab("activity")}><span>≡</span> Activity</button>
        </nav>
        <div className="sidebar-bottom"><button className="nav-item"><span>?</span> Help center</button><div className="user-chip"><span className="user-avatar">AS</span><span><strong>Ali Shahnawaz</strong><small>Owner</small></span><span>⋯</span></div></div>
      </aside>

      <main className="main">
        <header className="topbar"><div><span className="eyebrow">WORKSPACE / {tenant.name.toUpperCase()}</span><h1>{activeTab === "overview" ? "Good morning, Ali" : activeTab[0].toUpperCase() + activeTab.slice(1)}</h1></div><button className="outline-button">⌘ <span>Command menu</span></button></header>
        <div className="content">
          {activeTab === "overview" && <Overview tenant={tenant} connectedCount={connectedCount} latestFile={latestFile} processing={processing} processFile={processFile} setActiveTab={setActiveTab} />}
          {activeTab === "integrations" && <Integrations tenant={tenant} tenantId={tenantId} setActiveTab={setActiveTab} />}
          {activeTab === "rules" && <Rules tenant={tenant} onSave={saveTenant} />}
          {activeTab === "activity" && <Activity activity={activity} tenant={tenant} />}
        </div>
      </main>
    </div>
  );
}

function Overview({ tenant, connectedCount, latestFile, processing, processFile, setActiveTab }) {
  return <><section className="hero"><div><span className="status-pill"><i /> All systems operational</span><h2>Route every document<br /><em>without the busywork.</em></h2><p>DocDrop watches your inbox, understands your file names, and sends each document to the right place.</p><div className="hero-actions"><button className="primary-button" onClick={() => processFile()}>Process a test file <span>→</span></button><button className="text-button" onClick={() => setActiveTab("integrations")}>Manage connections <span>↗</span></button></div></div><div className="hero-art"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="drop-card"><span className="file-icon">PDF</span><strong>{processing ? "Processing..." : latestFile}</strong><small>{processing ? "Routing to your connected tools" : "Ready to be routed"}</small><div className="progress"><i /></div></div><span className="spark spark-one">✦</span><span className="spark spark-two">✧</span></div></section>
    <div className="section-heading"><div><span className="eyebrow">YOUR PIPELINE</span><h3>Everything connected</h3></div><button className="text-button" onClick={() => setActiveTab("integrations")}>View all connections →</button></div>
    <div className="integration-grid">{integrations.map((item) => <IntegrationCard key={item.id} item={item} connected={tenant.connected.includes(item.id)} />)}</div>
    <section className="lower-grid"><div className="panel"><div className="panel-heading"><div><span className="eyebrow">AUTOMATION</span><h3>How your files flow</h3></div><span className="live-dot">Live</span></div><div className="flow"><FlowStep icon="✉" title="New attachment" text="Gmail inbox" color="coral" /><span className="flow-arrow">→</span><FlowStep icon="✦" title="Classify" text="Your routing rules" color="yellow" /><span className="flow-arrow">→</span><FlowStep icon="◈" title="Deliver" text="4 destinations" color="blue" /></div></div><div className="panel stat-panel"><span className="eyebrow">THIS MONTH</span><div className="stat">24 <small>documents routed</small></div><div className="stat-change">↑ 18% <span>vs. last month</span></div><div className="mini-bars"><i /><i /><i /><i /><i /><i /><i /></div></div></section>
  </>;
}

function IntegrationCard({ item, connected }) {
  return <div className="integration-card"><div className={`integration-icon ${item.color}`}>{item.icon}</div><div className="integration-info"><strong>{item.name}</strong><small>{item.detail}</small></div><span className={connected ? "connected" : "not-connected"}>{connected ? "Connected" : "Connect"}</span></div>;
}

function Integrations({ tenant, tenantId, setActiveTab }) {
  async function connect(item) {
    if (FASTN_EMBED_URL) {
      window.open(FASTN_EMBED_URL, "_blank", "noopener,noreferrer");
      return;
    }
    const response = await fetch(`/api/embed-token?tenantId=tenant_${tenantId}&userId=demo-user`);
    const body = await response.json();
    if (!response.ok) {
      window.alert(body.error || `Unable to open the fastn widget for ${item.name}.`);
      return;
    }
    const url = body.iframeUrl || body.embedUrl || body.url;
    if (!url) {
      window.alert("Fastn returned no embed URL. Check the Vercel function response.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }
  return <><div className="page-intro"><div><span className="eyebrow">CONNECTIONS</span><h2>Your tools, in one flow.</h2><p>Connect accounts for <strong>{tenant.name}</strong>. Each workspace stays isolated.</p></div><span className="tenant-badge"><span className="avatar">{tenant.initials}</span>{tenant.name}</span></div><div className="notice"><span>✦</span><div><strong>Fastn widget connected</strong><p>DocDrop widget <code>{FASTN_WIDGET_ID}</code> exposes all five tenant-scoped connectors. Workflow <code>{FASTN_WORKFLOW_ID}</code> routes documents without sharing credentials.</p></div></div>{FASTN_EMBED_URL ? <iframe className="fastn-frame" title="DocDrop fastn connections" src={FASTN_EMBED_URL} /> : <div className="embed-note"><span className="code-tag">&lt;/&gt;</span><div><strong>Secure widget token is server-side</strong><p>Click any Connect account button. DocDrop will request a tenant-scoped fastn token from your Vercel function.</p></div><span className="ready-pill">Widget ready</span></div>}<div className="integration-list">{integrations.map((item) => <div className="integration-row" key={item.id}><IntegrationCard item={item} connected={tenant.connected.includes(item.id)} /><button onClick={() => connect(item)} className={tenant.connected.includes(item.id) ? "row-button" : "row-button primary-small"}>{tenant.connected.includes(item.id) ? "Manage" : "Connect account"} <span>→</span></button></div>)}</div><div className="embed-note"><span className="code-tag">↗</span><div><strong>Tenant isolation is enabled</strong><p>Active tenant: <code>{tenantId}</code>. Backend webhook target: <code>{FASTN_WORKFLOW_ID}</code>.</p></div><button className="text-button" onClick={() => setActiveTab("overview")}>Back to overview</button></div></>;
}

function Rules({ tenant, onSave }) {
  const [rules, setRules] = useState(tenant.rules);
  const [editing, setEditing] = useState(null);
  function update(index, field, value) { setRules((items) => items.map((item, i) => i === index ? { ...item, [field]: value } : item)); }
  function addRule() { setRules((items) => [...items, { pattern: "New_*", destination: "/New folder", channel: "#general" }]); setEditing(rules.length); }
  function save() { onSave({ ...tenant, rules }); setEditing(null); }
  return <><div className="page-intro"><div><span className="eyebrow">AUTOMATION RULES</span><h2>Simple rules. Zero sorting.</h2><p>Rules are private to <strong>{tenant.name}</strong> and saved in this browser.</p></div><div><button className="outline-button" onClick={addRule}>+ Add rule</button> <button className="primary-button" onClick={save}>Save changes</button></div></div><div className="rules-list">{rules.map((rule, index) => <div className="rule-row" key={`${rule.pattern}-${index}`}><span className="rule-number">0{index + 1}</span>{editing === index ? <div className="rule-editor"><input value={rule.pattern} onChange={(e) => update(index, "pattern", e.target.value)} aria-label="Filename pattern" /><input value={rule.destination} onChange={(e) => update(index, "destination", e.target.value)} aria-label="Drive destination" /><input value={rule.channel} onChange={(e) => update(index, "channel", e.target.value)} aria-label="Slack channel" /><button className="text-button" onClick={() => setEditing(null)}>Done</button></div> : <div onClick={() => setEditing(index)} className="rule-clickable"><strong>When filename matches <code>{rule.pattern}</code></strong><small>Route to <b>{rule.destination}</b> and notify <b>{rule.channel}</b></small></div>}<button className="row-button" onClick={() => setEditing(editing === index ? null : index)}>{editing === index ? "Close" : "Edit"}</button></div>)}<div className="rule-row fallback"><span className="rule-number">0{rules.length + 1}</span><div><strong>Anything else</strong><small>Route to <b>/Unsorted</b> and flag for review</small></div><span className="fallback-pill">Fallback</span></div></div></>;
}

function Activity({ activity, tenant }) {
  return <><div className="page-intro"><div><span className="eyebrow">DOCUMENT ACTIVITY</span><h2>Recent file runs.</h2><p>Only activity from <strong>{tenant.name}</strong> is shown.</p></div><button className="outline-button">Export CSV ↗</button></div><div className="activity-table"><div className="table-head"><span>DOCUMENT</span><span>DESTINATION</span><span>STATUS</span><span>TIME</span></div>{activity.length === 0 ? <div className="empty-state"><span>✦</span><strong>No documents processed yet</strong><p>Run the test file from Overview to see tenant-isolated activity here.</p></div> : activity.map((item, index) => <div className="table-row" key={`${item.fileName}-${index}`}><span><span className="file-icon small">PDF</span><strong>{item.fileName}</strong></span><span>{item.destination}</span><span className="success-text">● {item.status}</span><span>{item.time}</span></div>)}</div></>;
}

function FlowStep({ icon, title, text, color }) { return <div className="flow-step"><span className={`flow-icon ${color}`}>{icon}</span><strong>{title}</strong><small>{text}</small></div>; }

createRoot(document.getElementById("root")).render(<App />);
