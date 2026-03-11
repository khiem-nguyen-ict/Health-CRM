// =====================
// STEP 3: DOCTOR
// =====================

let allDoctorQueue = [];
let allDoctorQueueHealthRows = [];
let selectedParticipantInDoctorTab = null;

function filterLocalDoctorQueue() {
  const searchTerm = document
    .getElementById("d-search")
    .value.toLowerCase()
    .trim();

  const data = allDoctorQueue;

  const filtered = data.filter((participant) => {
    return Object.values(participant).some((value) =>
      String(value).toLowerCase().includes(searchTerm),
    );
  });

  reanderDoctorQueueRows(filtered);
}

function reanderDoctorQueueRows(rows) {
  const tbody = document.getElementById("doctor-queue");

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty"><div class="empty-icon">🩺</div><p>Không có bệnh nhân chờ tư vấn</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = rows
    .map((r) => {
      const hd = allDoctorQueueHealthRows.find((h) => h.participantId === r.id);
      return `<tr>
      <td class="td-name">${r.name}</td>
      <td class="td-phone">${r.phone}</td>
      <td>${hd ? hd.pain || "N/A" : "Chưa có"}</td>
      <td>${statusBadge(r.status)}</td>
      <td class="td-phone">${formatDateTimeVN(r.createdAt)}</td>
      <td><button class="btn btn-amber btn-sm" onclick="selectParticipantDoctor('${r.id}')">🩺 Tư vấn</button></td>
    </tr>`;
    })
    .join("");
}

async function loadDoctorQueue(manually = true) {
  const btn = document.querySelector('[onclick="loadDoctorQueue()"]');
  if (manually) {
    document.getElementById("d-search").value = "";
    setLoading(btn, true, null, "Đang lấy danh sách chờ tư vấn");
  }
  const rows = await apiGet("Participants", "status", "health");
  const healthRows = await apiGet("HealthData");
  const ready = rows.filter((r) => r.status === "health");
  ready.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  allDoctorQueue = ready;
  allDoctorQueueHealthRows = healthRows;

  if (manually) {
    reanderDoctorQueueRows(allDoctorQueue);
    setLoading(btn, false);
  } else filterLocalDoctorQueue();
}

async function selectParticipantDoctor(id) {
  selectedParticipantInDoctorTab = allDoctorQueue.find((r) => r.id === id);
  if (!selectedParticipantInDoctorTab) {
    alert("Có gì đó sai sai! Tải lại dữ liệu xem sao?");
    return;
  }
  // Load
  const doctorName = sessionStorage.getItem("doctorName") || "";
  document.getElementById("d-doctor-name").value = doctorName;

  const hd = allDoctorQueueHealthRows.find((h) => h.participantId === id);

  document.getElementById("d-results").innerHTML = "";
  document.getElementById("d-form").style.display = "block";

  document.getElementById("d-patient-info").innerHTML = `
    <div class="patient-avatar">${String(selectedParticipantInDoctorTab.name || "?")[0]}</div>
    <div class="patient-info">
      <div class="patient-name">${selectedParticipantInDoctorTab.name}</div>
      <div class="patient-meta">
        <span>📞 ${selectedParticipantInDoctorTab.phone}</span>
        <span>🎂 Sinh năm ${selectedParticipantInDoctorTab.birthYear} <b>(${new Date().getFullYear() - selectedParticipantInDoctorTab.birthYear + 1} tuổi)</b> · ${selectedParticipantInDoctorTab.gender}</span>
        <span>📍 ${selectedParticipantInDoctorTab.address || "N/A"}</span>
      </div>
    </div>`;

  document.getElementById("d-health-data").innerHTML = hd
    ? `<div class="metric-grid">
      <div class="metric-card"><div class="metric-label">Chiều cao</div><div class="metric-value">${hd.height || "--"}<span class="metric-unit"> cm</span></div></div>
      <div class="metric-card"><div class="metric-label">Cân nặng</div><div class="metric-value">${hd.weight || "--"}<span class="metric-unit"> kg</span></div></div>
      <div class="metric-card"><div class="metric-label">BMI</div><div class="metric-value">${hd.bmi || "--"}</div></div>
      <div class="metric-card"><div class="metric-label">Huyết áp</div><div class="metric-value" style="font-size:1.1rem">${hd.bp || "--"}<span class="metric-unit"> mmHg</span></div></div>
    </div>
    <div class="highlight-amber"><strong>Vùng đau:</strong> ${hd.pain || "N/A"}<br><strong>Ghi chú:</strong> ${hd.notes || "N/A"}</div>
    ${hd.photoUrl ? `<div style="margin-bottom:14px"><img src="${hd.photoUrl}" style="width:100%;border-radius:10px;object-fit:cover" /></div>` : '<div class="highlight-amber" style="margin-bottom:10px;font-size:.82rem">Không có ảnh</div>'}
    `
    : `<div class="highlight-amber">Chưa có dữ liệu sức khỏe</div>`;

  scrollToForm("d-form");
}

function cancelDoctor() {
  selectedParticipantInDoctorTab = null;
  document.getElementById("d-form").style.display = "none";
  document.getElementById("d-results").innerHTML = "";
  //document.getElementById("d-doctor-name").value = "";
  document.getElementById("d-diagnosis").value = null;
  document.getElementById("d-advice").value = null;
  document.getElementById("d-product").value = null;
  document.getElementById("d-outcome").value = null;
}

async function saveConsultation() {
  if (!selectedParticipantInDoctorTab) return;
  const doctorName = document.getElementById("d-doctor-name").value.trim();
  const diagnosis = document.getElementById("d-diagnosis").value;
  const advice = document.getElementById("d-advice").value.trim();
  const product = document.getElementById("d-product").value.trim();
  const outcome = document.getElementById("d-outcome").value;

  if (!doctorName || !advice) {
    toast("Vui lòng nhập tên chuyên gia và nội dung tư vấn", "error");
    return;
  }

  // Save doctor for next time use
  sessionStorage.setItem("doctorName", doctorName);

  const btn = document.querySelector('[onclick="saveConsultation()"]');
  setLoading(btn, true, null, "Đang lưu thông tin tư vấn");
  const id = "C" + Date.now();
  await apiPost("append", "Consultations", {
    data: [
      id,
      selectedParticipantInDoctorTab.id,
      doctorName,
      diagnosis,
      advice,
      product,
      outcome,
      new Date().toISOString(),
    ],
  });
  await apiPost("update", "Participants", {
    id: selectedParticipantInDoctorTab.id,
    updates: { status: "consulted" },
  });

  // Auto add to marketing
  const mId = "M" + Date.now();
  await apiPost("append", "Marketing", {
    data: [
      mId,
      selectedParticipantInDoctorTab.id,
      selectedParticipantInDoctorTab.name,
      selectedParticipantInDoctorTab.phone,
      "",
      "",
      "",
      false,
    ],
  });
  setLoading(btn, false);
  toast(`Đã lưu tư vấn: ${selectedParticipantInDoctorTab.name}`, "success");

  allDoctorQueue = allDoctorQueue.filter(
    (item) => item.id !== selectedParticipantInDoctorTab.id,
  );
  cancelDoctor();
  reanderDoctorQueueRows(allDoctorQueue);
}
