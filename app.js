const money = (n) => {
  if (n == null || Number.isNaN(n)) return "—";
  if (n >= 1000) {
    return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  }
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
};

const moneyRange = (low, high) => {
  if (low == null && high == null) return "—";
  if (low === high) return money(low);
  return `${money(low)}–${money(high)}`;
};

const providerClass = (provider) => {
  const p = (provider || "").toLowerCase();
  if (p.includes("open")) return "openai";
  if (p.includes("anthropic")) return "anthropic";
  if (p.includes("xai") || p.includes("x ai")) return "xai";
  if (p.includes("google")) return "google";
  if (p.includes("cursor")) return "cursor";
  if (p.includes("github")) return "github";
  if (p.includes("minimax")) return "minimax";
  if (p.includes("meta")) return "meta";
  if (p.includes("xiaomi")) return "xiaomi";
  if (p.includes("z.ai") || p.includes("zhipu")) return "zai";
  return "";
};

const planLabel = (p) => `${p.product} ${p.planName}${p.model ? ` · ${p.model}` : ""}`;

const isMeasured = (p) => p.measured === true;

const isApi = (p) => p.category === "api";

const priceLabel = (p) => (isApi(p) ? `${money(p.stickerUSD)} spend` : `${money(p.stickerUSD)}/mo`);

let CODING = {};

const coding = (p) => {
  const c = p.codingKey ? CODING[p.codingKey] : null;
  if (!c || p.apiEqUSD == null) return null;
  const perSolved = c.costPerTask / (c.score / 100);
  const solved = p.apiEqUSD / perSolved;
  return { c, perSolved, solved, perDollar: solved / p.stickerUSD };
};

const num = (n) => Math.round(n).toLocaleString("en-US");

const scoreCell = (p) => {
  const k = coding(p);
  if (!k) return `<span class="na">—</span>`;
  return `<span class="tasks">${k.c.score}</span><span class="plan-provider source-asof">${k.c.harness}, ${k.c.effort}</span>`;
};

const solvedCell = (p) => {
  const k = coding(p);
  if (!k) return `<span class="na">—</span>`;
  const title = `${k.c.label} in ${k.c.harness} (${k.c.effort}): $${k.c.costPerTask.toFixed(2)} per task at score ${k.c.score} → $${k.perSolved.toFixed(2)} per solved task`;
  return `<span class="tasks" title="${title}">${num(k.solved)}${isApi(p) ? "" : "/mo"}</span><span class="plan-provider source-asof">${k.perDollar.toFixed(1)} per $</span>`;
};

const sourceMap = (sources) =>
  Object.fromEntries((sources || []).map((s) => [s.id, s]));

async function loadData() {
  const res = await fetch("data/plans.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load plans.json (${res.status})`);
  return res.json();
}

function filterAndSort(plans, { provider, sort, codingOnly, measuredOnly, includeApi, minScore }) {
  let rows = [...plans];
  if (minScore > 0) rows = rows.filter((p) => (coding(p)?.c.score ?? -1) >= minScore);
  if (!includeApi) rows = rows.filter((p) => !isApi(p));
  if (codingOnly) rows = rows.filter((p) => p.codingRelevant);
  if (measuredOnly) rows = rows.filter(isMeasured);
  if (provider !== "all") rows = rows.filter((p) => p.provider === provider);

  const val = (p) => p.apiEqUSD ?? -1;
  const mult = (p) => p.multiplier ?? -1;
  const spd = (p) => coding(p)?.perDollar ?? -1;

  rows.sort((a, b) => {
    switch (sort) {
      case "apiEq":
        return val(b) - val(a);
      case "sticker":
        return a.stickerUSD - b.stickerUSD;
      case "solved":
        return spd(b) - spd(a) || val(b) - val(a);
      case "provider":
        return a.provider.localeCompare(b.provider) || a.stickerUSD - b.stickerUSD;
      case "multiplier":
      default:
        return mult(b) - mult(a) || val(b) - val(a);
    }
  });
  return rows;
}

function renderHero(plans) {
  const measured = plans.filter((p) => isMeasured(p) && p.apiEqUSD != null);
  const top = measured.reduce((best, p) => (p.apiEqUSD > (best?.apiEqUSD ?? -1) ? p : best), null);
  const bestMult = measured.reduce((best, p) => (p.multiplier > (best?.multiplier ?? -1) ? p : best), null);
  const midAt = (provider, sticker) =>
    measured.find((p) => p.provider === provider && p.stickerUSD === sticker && p.modelTier === "mid");
  const claudeMid = midAt("Anthropic", 200);
  const openaiMid = midAt("OpenAI", 200);
  const gap = claudeMid && openaiMid ? claudeMid.apiEqUSD / openaiMid.apiEqUSD : null;

  const root = document.getElementById("hero-stats");
  root.innerHTML = `
    <article class="stat-card">
      <p class="stat-label">Highest API-eq ceiling</p>
      <p class="stat-value">${money(top?.apiEqUSD)}</p>
      <p class="stat-sub">${top ? `${planLabel(top)} · pay ${money(top.stickerUSD)}` : "—"}</p>
    </article>
    <article class="stat-card">
      <p class="stat-label">Best multiplier (measured)</p>
      <p class="stat-value">${bestMult ? `${bestMult.multiplier}×` : "—"}</p>
      <p class="stat-sub">${bestMult ? planLabel(bestMult) : "—"}</p>
    </article>
    <article class="stat-card">
      <p class="stat-label">Claude vs ChatGPT at $200</p>
      <p class="stat-value">${gap ? `${gap.toFixed(1)}×` : "—"}</p>
      <p class="stat-sub">${gap ? `${claudeMid.model} ${money(claudeMid.apiEqUSD)} vs ${openaiMid.model} ${money(openaiMid.apiEqUSD)} (mid-tier models)` : "—"}</p>
    </article>
  `;
}

function renderProviderOptions(plans) {
  const select = document.getElementById("provider-filter");
  const providers = [...new Set(plans.map((p) => p.provider))].sort();
  for (const p of providers) {
    const opt = document.createElement("option");
    opt.value = p;
    opt.textContent = p;
    select.appendChild(opt);
  }
}

function renderTable(rows, sources) {
  const tbody = document.getElementById("plans-body");
  tbody.innerHTML = rows
    .map((p) => {
      const src = p.sourceId ? sources[p.sourceId] : null;
      const multLabel =
        p.multiplier == null
          ? null
          : Number.isInteger(p.multiplier)
            ? `${p.multiplier}×`
            : `${p.multiplier.toFixed(1)}×`;
      const mult =
        multLabel != null
          ? `<span class="multiplier">${multLabel}</span>`
          : `<span class="na">—</span>`;
      const api =
        p.apiEqUSD != null
          ? `<span class="api-eq">${money(p.apiEqUSD)}</span>`
          : `<span class="na">not measured</span>`;
      const range =
        p.apiEqLowUSD != null
          ? moneyRange(p.apiEqLowUSD, p.apiEqHighUSD)
          : "—";
      const conf = p.confidence
        ? `<span class="badge ${p.confidence}">${p.confidence}</span>`
        : `<span class="na">—</span>`;
      const asOf = p.asOf ? `<span class="plan-provider source-asof">as of ${p.asOf}</span>` : "";
      const sourceCell = src
        ? `<a class="source-link" href="${src.url}" target="_blank" rel="noopener">${src.name}</a>${asOf}`
        : `<span class="na">n/a</span>`;

      return `
        <tr>
          <td>
            <div class="plan-cell">
              <span class="plan-name">${planLabel(p)}</span>
              <span class="plan-provider">${p.provider}${p.includes ? ` · ${p.includes}` : ""}</span>
            </div>
          </td>
          <td class="num sticker">${priceLabel(p)}</td>
          <td class="num">${api}</td>
          <td class="num range">${range}</td>
          <td class="num">${mult}</td>
          <td class="num">${scoreCell(p)}</td>
          <td class="num">${solvedCell(p)}</td>
          <td>${conf}</td>
          <td>${sourceCell}</td>
        </tr>
      `;
    })
    .join("");
}

function renderCards(rows, sources) {
  const root = document.getElementById("plan-cards");
  root.innerHTML = rows
    .map((p) => {
      const src = p.sourceId ? sources[p.sourceId] : null;
      const k = coding(p);
      return `
        <article class="plan-card">
          <h3>${planLabel(p)}</h3>
          <div class="meta">${p.provider} · ${p.confidence || "unknown"} confidence${p.asOf ? ` · as of ${p.asOf}` : ""}</div>
          <div class="metrics">
            <div class="metric"><span>You pay</span><strong class="sticker">${priceLabel(p)}</strong></div>
            <div class="metric"><span>API-eq</span><strong class="api-eq">${p.apiEqUSD != null ? money(p.apiEqUSD) : "—"}</strong></div>
            <div class="metric"><span>Range</span><strong>${moneyRange(p.apiEqLowUSD, p.apiEqHighUSD)}</strong></div>
            <div class="metric"><span>Multiplier</span><strong class="multiplier">${p.multiplier != null ? p.multiplier + "×" : "—"}</strong></div>
            <div class="metric"><span>Coding score</span><strong class="tasks">${k ? `${k.c.score} (${k.c.harness})` : "—"}</strong></div>
            <div class="metric"><span>Solved tasks</span><strong class="tasks">${k ? `${num(k.solved)}${isApi(p) ? "" : "/mo"} · ${k.perDollar.toFixed(1)} per $` : "—"}</strong></div>
          </div>
          <p class="notes">${p.notes || ""}${src ? ` <a href="${src.url}" target="_blank" rel="noopener">Source</a>` : ""}</p>
        </article>
      `;
    })
    .join("");
}

function renderChart(rows) {
  const root = document.getElementById("subsidy-chart");
  const chartable = rows.filter((p) => p.apiEqUSD != null);
  const max = Math.max(...chartable.map((p) => p.apiEqUSD), 1);

  root.innerHTML = chartable
    .map((p) => {
      const pct = Math.max(0.8, (p.apiEqUSD / max) * 100);
      const stickerPct = Math.max(0.15, (p.stickerUSD / max) * 100);
      const cls = providerClass(p.provider);
      return `
        <div class="bar-row">
          <div class="bar-label">${planLabel(p)}</div>
          <div class="bar-track" title="Sticker ${money(p.stickerUSD)} vs API-eq ${money(p.apiEqUSD)}">
            <div class="bar-fill ${cls}" data-width="${pct}"></div>
            <div class="bar-sticker" style="left:${stickerPct}%"></div>
          </div>
          <div class="bar-value">${money(p.apiEqUSD)}</div>
        </div>
      `;
    })
    .join("");

  requestAnimationFrame(() => {
    root.querySelectorAll(".bar-fill").forEach((el) => {
      el.style.width = `${el.dataset.width}%`;
    });
  });
}

function renderCodingTable(codingData) {
  const root = document.getElementById("coding-body");
  if (!root) return;
  const rows = Object.entries(codingData).filter(([k]) => !k.startsWith("_"));
  root.innerHTML = rows
    .sort(([, a], [, b]) => a.costPerTask / a.score - b.costPerTask / b.score)
    .map(
      ([, t]) => `
        <tr>
          <td><a class="source-link" href="${t.url}" target="_blank" rel="noopener">${t.label}</a></td>
          <td>${t.harness}, ${t.effort}</td>
          <td class="num">${t.score}</td>
          <td class="num">$${t.costPerTask.toFixed(2)}</td>
          <td class="num">$${(t.costPerTask / (t.score / 100)).toFixed(2)}</td>
        </tr>`
    )
    .join("");
  const note = document.getElementById("coding-note");
  if (note && codingData._note) note.textContent = codingData._note;
}

function renderSources(sources) {
  const list = document.getElementById("sources-list");
  list.innerHTML = sources
    .map(
      (s) =>
        `<li><a href="${s.url}" target="_blank" rel="noopener">${s.name}</a> — ${s.note}</li>`
    )
    .join("");
}

function wireControls(data) {
  const state = () => ({
    provider: document.getElementById("provider-filter").value,
    sort: document.getElementById("sort-by").value,
    codingOnly: document.getElementById("coding-only").checked,
    measuredOnly: document.getElementById("measured-only").checked,
    includeApi: document.getElementById("include-api").checked,
    minScore: Number(document.getElementById("min-score").value),
  });

  const sources = sourceMap(data.sources);
  const paint = () => {
    const rows = filterAndSort(data.plans, state());
    renderTable(rows, sources);
    renderCards(rows, sources);
    renderChart(rows);
  };

  for (const id of ["provider-filter", "sort-by", "coding-only", "measured-only", "include-api", "min-score"]) {
    document.getElementById(id).addEventListener("change", paint);
  }
  paint();
}

async function main() {
  try {
    const data = await loadData();
    CODING = data.codingAgent || {};
    document.getElementById("updated-label").textContent = `Data as of ${data.updatedAt}`;
    document.getElementById("methodology-text").textContent = data.methodology;
    renderHero(data.plans);
    renderProviderOptions(data.plans);
    renderSources(data.sources);
    renderCodingTable(CODING);
    wireControls(data);
  } catch (err) {
    document.getElementById("plans-body").innerHTML =
      `<tr><td colspan="9">Failed to load data: ${err.message}</td></tr>`;
    console.error(err);
  }
}

main();
