let currentMode = "demo";
let latestNetworks = [];

function setMode(mode) {
  currentMode = mode;
  document.getElementById("demo-mode").classList.toggle("selected", mode === "demo");
  document.getElementById("live-mode").classList.toggle("selected", mode === "live");
  document.getElementById("mode-description").textContent = mode === "demo"
    ? "Demo mode displays fictional sample networks so you can practise safely without scanning the air."
    : "Live mode runs Windows netsh read-only discovery on this computer. Keep Wi-Fi enabled; only visible broadcast metadata is read.";
  setNotice(mode === "demo" ? "Demo mode selected. Results will be simulated." : "Live mode selected. Click Start scan to query this Windows computer.", "");
}

function setNotice(message, type) {
  const el = document.getElementById("notice");
  el.textContent = message;
  el.className = "notice" + (type ? " " + type : "");
}

function signalMarkup(signal) {
  const value = Number(signal) || 0;
  const cls = value >= 70 ? "" : value >= 40 ? "medium" : "low";
  return `<div class="signal-wrap"><div class="signal-track"><div class="signal-fill ${cls}" style="width:${Math.max(0, Math.min(100, value))}%"></div></div><span class="signal-number">${value}%</span></div>`;
}

function renderNetworks(networks) {
  latestNetworks = networks || [];
  const tbody = document.getElementById("network-rows");
  if (!latestNetworks.length) {
    tbody.innerHTML = '<tr><td class="empty" colspan="6">No visible networks returned. Check Wi-Fi is enabled and try again.</td></tr>';
  } else {
    tbody.innerHTML = latestNetworks.map(n => {
      const unknown = !n.security || n.security.toLowerCase().includes("unknown");
      return `<tr>
        <td><span class="ssid">${escapeHtml(n.ssid || "(Unknown SSID)")}</span></td>
        <td><span class="bssid">${escapeHtml(n.bssid || "—")}</span></td>
        <td>${signalMarkup(n.signal)}</td>
        <td>${escapeHtml(String(n.channel ?? "—"))}</td>
        <td><span class="security ${unknown ? "unknown" : ""}">${escapeHtml(n.security || "Unknown")}</span></td>
        <td>${escapeHtml(n.radio || "Unknown")}</td>
      </tr>`;
    }).join("");
  }
  document.getElementById("stat-total").textContent = latestNetworks.length;
  document.getElementById("stat-strong").textContent = latestNetworks.filter(n => Number(n.signal) >= 70).length;
  document.getElementById("stat-unknown").textContent = latestNetworks.filter(n => !n.security || n.security.toLowerCase().includes("unknown")).length;
  document.getElementById("result-count").textContent = `${latestNetworks.length} record${latestNetworks.length === 1 ? "" : "s"}`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[ch]));
}

async function runScan() {
  const button = document.getElementById("scan-button");
  button.disabled = true;
  button.textContent = "Scanning…";
  setNotice(currentMode === "demo" ? "Loading simulated sample results…" : "Running read-only Windows wireless discovery…", "");
  try {
    const response = await fetch(`/api/scan/${currentMode}`, {cache:"no-store"});
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "Scan request failed.");
    renderNetworks(data.networks);
    document.getElementById("stat-time").textContent = data.timestamp;
    document.getElementById("stat-mode").textContent = data.mode === "demo" ? "SIMULATED DATA" : "LIVE WINDOWS SCAN";
    setNotice(data.message + " Scan completed at " + data.timestamp + ".", "success");
  } catch (error) {
    setNotice(error.message + " Try Demo Mode if live scanning is unavailable.", "error");
  } finally {
    button.disabled = false;
    button.textContent = "↻  Start scan";
  }
}

async function copyReport() {
  const checked = [...document.querySelectorAll(".task input:checked")].length;
  const lines = [
    "Wireless Network Scanning & Reconnaissance — Observation Report",
    `Mode: ${currentMode === "demo" ? "Demo (simulated)" : "Live Windows scan"}`,
    `Scan time: ${document.getElementById("stat-time").textContent}`,
    `Networks found: ${latestNetworks.length}`,
    `Strong signals (>=70%): ${latestNetworks.filter(n => Number(n.signal) >= 70).length}`,
    "",
    "Networks:"
  ];
  latestNetworks.forEach((n, i) => lines.push(`${i+1}. SSID: ${n.ssid}; BSSID: ${n.bssid}; Signal: ${n.signal}%; Channel: ${n.channel}; Security: ${n.security}; Radio: ${n.radio}`));
  lines.push("", `Checklist completed: ${checked}/5`, "", "Conclusion: A visible network name does not by itself prove a network is trustworthy.");
  const report = lines.join("\n");
  try {
    await navigator.clipboard.writeText(report);
    document.getElementById("copy-help").textContent = "Report copied. Paste it into your lab notes.";
  } catch {
    const area = document.createElement("textarea");
    area.value = report;
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    document.getElementById("copy-help").textContent = ok ? "Report copied. Paste it into your lab notes." : "Clipboard unavailable. Please copy your results manually.";
  }
}
