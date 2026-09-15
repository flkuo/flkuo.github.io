function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

let records = JSON.parse(localStorage.getItem("fallprev_selfcheck_records")) || [];
document.addEventListener("DOMContentLoaded", updateRecordTable);

function addRecord(tool, detail, result) {
  const time = new Date().toLocaleString('zh-TW', { hour12: false });
  records.push({ time, tool, detail, result });
  localStorage.setItem("fallprev_selfcheck_records", JSON.stringify(records));
  updateRecordTable();
}

function updateRecordTable() {
  const tbody = document.querySelector("#recordTable tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  records.forEach((r, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${escapeHtml(r.time)}</td><td>${escapeHtml(r.tool)}</td><td>${escapeHtml(r.detail)}</td><td>${escapeHtml(r.result)}</td><td><button class="btn-remove" onclick="removeRecord(${index})">❌</button></td>`;
    tbody.appendChild(tr);
  });
  const countEl = document.getElementById("recordCount");
  if (countEl) countEl.innerText = records.length;
}

function removeRecord(index) {
  records.splice(index, 1);
  localStorage.setItem("fallprev_selfcheck_records", JSON.stringify(records));
  updateRecordTable();
}

function clearAllRecords() {
  if (records.length === 0) return;
  records = [];
  localStorage.setItem("fallprev_selfcheck_records", JSON.stringify(records));
  updateRecordTable();
}

function csvField(v) {
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function exportRecords() {
  if (records.length === 0) { alert("目前沒有評估紀錄可供匯出"); return; }
  let csv = "時間,評估工具,輸入摘要,結果\n";
  records.forEach(r => {
    csv += `${csvField(r.time)},${csvField(r.tool)},${csvField(r.detail)},${csvField(r.result)}\n`;
  });
  downloadCSV(csv, '居家防跌自我評估紀錄.csv');
}

function downloadCSV(csv, filename) {
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

/* ---------- 1. STEADI 三個關鍵問題 ---------- */
function computeSteadi() {
  const q1 = document.querySelector("input[name='steadi1']:checked");
  const q2 = document.querySelector("input[name='steadi2']:checked");
  const q3 = document.querySelector("input[name='steadi3']:checked");
  if (!q1 || !q2 || !q3) { alert("請完整回答三個問題"); return; }
  const anyYes = [q1.value, q2.value, q3.value].includes("是");
  const result = anyYes
    ? "⚠️ 跌倒風險提高，建議進行下方的 TUG 測試，或洽詢專業人員"
    : "✅ 三題皆為「否」，跌倒風險較低，建議維持現有運動習慣，每年重新評估一次";
  document.getElementById("steadiResult").innerText = result;
  addRecord("STEADI 三個關鍵問題", `不穩：${q1.value}／擔心跌倒：${q2.value}／曾跌倒：${q3.value}`, result);
}

/* ---------- 2. TUG 測試 ---------- */
function computeTUG() {
  const sec = parseFloat(document.getElementById("tugSecInput").value);
  if (isNaN(sec) || sec < 0) { alert("請輸入有效的 TUG 測試秒數"); return; }
  const ageBand = document.getElementById("tugAgeBand").value;
  let msg = sec >= 12
    ? `⚠️ 完成時間 ${sec} 秒，達居家判讀切點（12 秒）以上，建議洽詢醫師或物理治療師`
    : `✅ 完成時間 ${sec} 秒，在居家判讀切點（12 秒）以內，建議維持現有運動習慣`;
  const ageRefs = { "60-69": "> 9 秒", "70-79": "> 10.2 秒", "80-89": "> 12.7 秒" };
  if (ageBand && ageRefs[ageBand]) {
    msg += `（年齡對照參考值〔${ageBand} 歲〕：${ageRefs[ageBand]} 需留意，僅供參考）`;
  }
  if (sec >= 15) { msg += "；亦達臨床專業篩檢切點（15 秒以上）"; }
  document.getElementById("tugResult").innerText = msg;
  addRecord("TUG 測試（計時起走）", `秒數：${sec}${ageBand ? '／年齡層：' + ageBand + ' 歲' : ''}`, msg);
}

/* ---------- 3. 簡易平衡測試 ---------- */
function computeBalance() {
  const sec = parseFloat(document.getElementById("balanceSecInput").value);
  if (isNaN(sec) || sec < 0) { alert("請輸入單腳站立秒數"); return; }
  const result = sec < 5
    ? `⚠️ 單腳站立 ${sec} 秒，未達 5 秒，建議進一步評估平衡能力`
    : `✅ 單腳站立 ${sec} 秒，已達 5 秒以上基礎平衡表現`;
  document.getElementById("balanceResult").innerText = result;
  addRecord("簡易平衡測試", `單腳站立秒數：${sec}`, result);
}

/* ---------- 4. 功能性前伸測試 ---------- */
function computeReach() {
  const cm = parseFloat(document.getElementById("reachInput").value);
  if (isNaN(cm) || cm < 0) { alert("請輸入前伸距離（公分）"); return; }
  const result = cm < 15
    ? `⚠️ 前伸距離 ${cm} 公分，小於 15 公分，預測有高度跌倒復發風險`
    : `✅ 前伸距離 ${cm} 公分，達 15 公分以上`;
  document.getElementById("reachResult").innerText = result;
  addRecord("功能性前伸測試", `前伸距離：${cm} 公分`, result);
}

/* ---------- 5. 交替登階測試 ---------- */
function computeStep() {
  const sec = parseFloat(document.getElementById("stepSecInput").value);
  if (isNaN(sec) || sec < 0) { alert("請輸入完成 8 階所需秒數"); return; }
  const result = sec > 10
    ? `⚠️ 完成時間 ${sec} 秒，超過 10 秒，預測有跌倒風險`
    : `✅ 完成時間 ${sec} 秒，在 10 秒以內`;
  document.getElementById("stepResult").innerText = result;
  addRecord("交替登階測試", `完成 8 階時間：${sec} 秒`, result);
}

/* ---------- 6. 五次坐到站測試（STS） ---------- */
function computeSTS() {
  const sec = parseFloat(document.getElementById("stsSecInput").value);
  if (isNaN(sec) || sec < 0) { alert("請輸入連續五次坐到站所需秒數"); return; }
  const result = sec >= 12
    ? `⚠️ 完成時間 ${sec} 秒，達 12 秒以上，預測有下肢無力與跌倒風險`
    : `✅ 完成時間 ${sec} 秒，未達 12 秒`;
  document.getElementById("stsResult").innerText = result;
  addRecord("五次坐到站測試（STS）", `完成五次時間：${sec} 秒`, result);
}

/* ---------- 7. 30 秒坐站測試 ---------- */
function computeSTS30() {
  const count = parseInt(document.getElementById("sts30Input").value, 10);
  if (isNaN(count) || count < 0) { alert("請輸入 30 秒內完成的次數"); return; }
  const result = `已完成 ${count} 次。次數偏低可能代表下肢肌力不足；正式風險判讀請洽醫師或物理治療師，取得依年齡與性別區分之參考標準。`;
  document.getElementById("sts30Result").innerText = result;
  addRecord("30 秒坐站測試", `完成次數：${count}`, result);
}

/* ---------- 8. PAR-Q 運動前篩檢 ---------- */
function computeParQ() {
  const names = ["parq1", "parq2", "parq3", "parq4", "parq5", "parq6", "parq7"];
  const values = [];
  for (const n of names) {
    const el = document.querySelector(`input[name='${n}']:checked`);
    if (!el) { alert("請完整回答全部七題"); return; }
    values.push(el.value);
  }
  const anyYes = values.includes("是");
  const result = anyYes
    ? "⚠️ 需諮詢醫師後再進行激烈運動，不應直接進行"
    : "✅ 可安全參與運動計畫";
  document.getElementById("parqResult").innerText = result;
  addRecord("PAR-Q 運動前篩檢", `「是」題數：${values.filter(v => v === "是").length}／7`, result);
}

/* ---------- 9. FRAIL 量表（虛弱評估） ---------- */
function computeFrail() {
  const names = ["frail1", "frail2", "frail3", "frail4", "frail5"];
  const values = [];
  for (const n of names) {
    const el = document.querySelector(`input[name='${n}']:checked`);
    if (!el) { alert("請完整回答全部五題"); return; }
    values.push(el.value);
  }
  const yesCount = values.filter(v => v === "是").length;
  const result = `「是」共 ${yesCount} 題。手冊附件僅提供 FRAIL 量表第 1 步問題，未提供完整分級標準，本頁不進行風險分級；如有任一題回答「是」，建議仍洽醫師或老年醫學科進一步評估體能狀態。`;
  document.getElementById("frailResult").innerText = result;
  addRecord("FRAIL 量表（虛弱評估）", `「是」題數：${yesCount}／5`, result);
}

/* ---------- 10. 居家環境安全防跌檢核表 ---------- */
const HOME_AREAS = ["地板", "燈光照明", "樓梯踏階", "浴室與淋浴區", "廚房", "客廳與臥房", "服裝鞋具"];
function computeHomeCheck() {
  const unchecked = [];
  HOME_AREAS.forEach((area, i) => {
    const el = document.getElementById("home" + i);
    if (el && !el.checked) unchecked.push(area);
  });
  const result = unchecked.length === 0
    ? "✅ 七大居家安全項目均已確認符合安全要求"
    : `⚠️ 尚有 ${unchecked.length} 項待改善：${unchecked.join("、")}`;
  document.getElementById("homeResult").innerText = result;
  addRecord("居家環境安全防跌檢核表", `已確認：${HOME_AREAS.length - unchecked.length}／${HOME_AREAS.length} 項`, result);
}

/* ---------- 11. 跌倒高危險因子自評篩檢表 ---------- */
function computeRiskSelf() {
  const names = ["risk1", "risk2", "risk3", "risk4", "risk5"];
  const values = [];
  for (const n of names) {
    const el = document.querySelector(`input[name='${n}']:checked`);
    if (!el) { alert("請完整回答全部五題"); return; }
    values.push(el.value);
  }
  const anyYes = values.includes("是");
  const result = anyYes
    ? "⚠️ 屬於臨床之「跌倒高危險群」，應儘快前往家醫科、老年醫學科或物理治療科進行全方位專業跌倒因子評估"
    : "✅ 目前五項皆為「否」，未符合高危險群條件";
  document.getElementById("riskSelfResult").innerText = result;
  addRecord("跌倒高危險因子自評篩檢表", `「是」題數：${values.filter(v => v === "是").length}／5`, result);
}
