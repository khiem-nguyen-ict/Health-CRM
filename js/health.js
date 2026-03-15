// =====================
// STEP 2: HEALTH
// =====================

let PHOTO_DATA_FRONT = null;
let PHOTO_DATA_SIDE = null;
let REPORT_AS_PHOTO = null;
let webcamStream = null; // ← cache stream, chỉ xin quyền 1 lần
let activePhotoSlot = "front"; // 'front' | 'side'
let webcamCurrentFacing = "environment"; // Start with back camera if available

let selectedParticipantInHealthTab = null;
let allHealthQueue = [];

// Legacy alias: saveHealth() đọc PHOTO_DATA → trả về ảnh report mặt trước
Object.defineProperty(window, "PHOTO_DATA", {
  get: () => PHOTO_DATA_FRONT,
  set: (v) => {
    PHOTO_DATA_FRONT = v;
  },
});

function renderHealhQueueRows(rows) {
  const tbody = document.getElementById("health-queue");

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="5">${IconAllDone({ message: "Không có kết quả nào - hàng chờ trống hoặc không khớp với tìm kiếm." })}</td></tr>`;
    return;
  }
  tbody.innerHTML = rows
    .map(
      (r) => `
    <tr>
      <td class="td-name">${r.name}</td>
      <td class="td-phone">${r.phone}</td>
      <td>${statusBadge(r.status)}</td>
      <td class="td-phone">${formatDateTimeVN(r.createdAt)}</td>
      <td><button class="btn btn-green btn-sm" onclick="selectParticipantHealth('${r.id}')">📋 Nhập dữ liệu</button></td>
    </tr>`,
    )
    .join("");
}

function filterLocalHealthQueue() {
  const searchTerm = document
    .getElementById("h-search")
    .value.toLowerCase()
    .trim();

  const healthQueue = allHealthQueue;

  const filtered = healthQueue.filter((participant) => {
    return Object.values(participant).some((value) =>
      String(value).toLowerCase().includes(searchTerm),
    );
  });

  renderHealhQueueRows(filtered);
}

async function loadHealthQueue(manually = true) {
  const btn = document.querySelector('[onclick="loadHealthQueue()"]');
  if (manually) {
    document.getElementById("h-search").value = "";
    setLoading(
      btn,
      true,
      null,
      "Đang lấy danh sách chờ cập nhật thông tin sức khỏe",
    );
  }
  const rows = await apiGet("Participants", "status", "pending");

  const pending = rows.filter((r) => r.status === "pending");
  pending.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (_.isEqual(allHealthQueue, pending)) {
    if (manually) {
      setLoading(btn, false);
    }
    if(allHealthQueue.length <= 0) {
        // fix bug: reset view
        renderHealhQueueRows([]);
    }
    return;
  }
  allHealthQueue = pending;
  if (manually) {
    renderHealhQueueRows(pending);
    setLoading(btn, false);
  } else filterLocalHealthQueue();
}

async function selectParticipantHealth(id) {
  selectedParticipantInHealthTab = allHealthQueue.find((r) => r.id === id);
  if (!selectedParticipantInHealthTab) {
    alert("Có gì đó sai sai! Tải lại dữ liệu xem sao?");
    return;
  }

  document.getElementById("h-results").innerHTML = "";
  document.getElementById("h-form").style.display = "block";
  document.getElementById("h-patient-info").innerHTML = `
    <div class="patient-avatar">${String(selectedParticipantInHealthTab.name || "?")[0]}</div>
    <div class="patient-info">
      <div class="patient-name">${selectedParticipantInHealthTab.name}</div>
      <div class="patient-meta">
        <span>📞 ${selectedParticipantInHealthTab.phone}</span>
        <span>🎂 Sinh năm ${selectedParticipantInHealthTab.birthYear} <b>(${new Date().getFullYear() - selectedParticipantInHealthTab.birthYear + 1} tuổi)</b> · ${selectedParticipantInHealthTab.gender}</span>
        <span>📍 ${selectedParticipantInHealthTab.address || "N/A"}</span>
      </div>
    </div>`;

  // Reset cả 2 slot ảnh
  PHOTO_DATA_FRONT = null;
  PHOTO_DATA_SIDE = null;
  resetPhotoSlot("front");
  resetPhotoSlot("side");

  // Xoá report cũ
  document.getElementById("pose-media-pipe-report").innerHTML = "";

  // BMI auto calc
  ["h-height", "h-weight"].forEach((fieldId) =>
    document.getElementById(fieldId).addEventListener("input", calcBMI),
  );

  scrollToForm("h-form");
}

/** Đưa một slot ảnh về trạng thái ban đầu (chưa có ảnh) */
function resetPhotoSlot(slot) {
  const areaId = slot === "front" ? "photo-area-front" : "photo-area-side";
  const label =
    slot === "front"
      ? "Nhấn để chụp<br>ảnh mặt trước"
      : "Nhấn để chụp<br>ảnh nhìn nghiêng";
  const area = document.getElementById(areaId);
  if (!area) return;
  area.style.border = "2px dashed var(--border)";
  area.innerHTML = `
    <div style="font-size:1.8rem">📷</div>
    <div style="font-size:.75rem;color:var(--muted);text-align:center;">${label}</div>`;
  area.onclick = () => openWebcam(slot);
  area.onmouseenter = null;
  area.onmouseleave = null;
}

function calcBMI() {
  const h = parseFloat(document.getElementById("h-height").value);
  const w = parseFloat(document.getElementById("h-weight").value);
  if (h && w) {
    const bmi = (w / Math.pow(h / 100, 2)).toFixed(1);
    document.getElementById("h-bmi").value = bmi;
  }
}

function cancelHealth() {
  selectedParticipantInHealthTab = null;
  document.getElementById("h-form").style.display = "none";
  document.getElementById("h-results").innerHTML = "";

  document.getElementById("h-height").value = null;
  document.getElementById("h-weight").value = null;
  document.getElementById("h-bmi").value = null;
  document.getElementById("h-bp").value = null;
  document.getElementById("h-pain").value = null;
  document.getElementById("h-notes").value = null;

  PHOTO_DATA_FRONT = null;
  PHOTO_DATA_SIDE = null;
  resetPhotoSlot("front");
  resetPhotoSlot("side");

  // Xoá report cũ
  document.getElementById("pose-media-pipe-report").innerHTML = "";
}

async function saveHealth() {
  if (!selectedParticipantInHealthTab) return;

  let localSelectedParticipant = selectedParticipantInHealthTab;

  const height = document.getElementById("h-height").value;
  const weight = document.getElementById("h-weight").value;
  const bmi = document.getElementById("h-bmi").value;
  const bp = document.getElementById("h-bp").value;
  const pain = document.getElementById("h-pain").value;
  const notes = document.getElementById("h-notes").value;

  if (!height || height < 50 || height > 250) {
    toast(`Chiều cao chưa nhập hoặc không đúng.`, "error");
    return;
  }

  if (!weight || weight < 10 || weight > 150) {
    toast(`Cân nặng chưa nhập hoặc không phù hợp.`, "error");
    return;
  }

  const btn = document.querySelector('[onclick="saveHealth()"]');
  setLoading(btn, true, null, "Đang lưu thông tin sức khỏe");
  const id = "H" + Date.now();

  // Trick to save posting time
  allHealthQueue = allHealthQueue.filter(
    (item) => item.id !== localSelectedParticipant.id,
  );
  cancelHealth();
  renderHealhQueueRows(allHealthQueue);
  setLoading(btn, false);
  toast(
    `Đã lưu dữ liệu sức khỏe: ${localSelectedParticipant.name}`,
    "success",
  );

  await apiPost("append", "HealthData", {
    data: [
      id,
      localSelectedParticipant.id,
      height,
      weight,
      bmi,
      bp,
      pain,
      notes,
      REPORT_AS_PHOTO || "",
      new Date().toISOString(),
    ],
  });
  await apiPost("update", "Participants", {
    id: localSelectedParticipant.id,
    updates: { status: "health" },
  });
}

// =====================
// WEBCAM
// =====================

// [CHANGED 1/3] openWebcam: nếu đã có stream thì tái sử dụng, không gọi getUserMedia lại
async function openWebcam(slot = "front") {
  activePhotoSlot = slot;
  document.getElementById("webcam-modal").classList.add("open");

  const video = document.getElementById("webcam-video");

  if (webcamStream) {
    video.srcObject = webcamStream; // tái sử dụng stream cũ, không hỏi quyền
    return;
  }

  try {
    webcamStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: webcamCurrentFacing },
    });
    video.srcObject = webcamStream;
  } catch {
    // Fallback to any camera if preferred facing mode not available
    try {
      webcamStream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = webcamStream;
    } catch (fallbackError) {
      toast("Không thể truy cập camera. Thử chọn file ảnh.", "error");
      closeWebcam();
    }
  }
}

// [CHANGED 2/3] closeWebcam: chỉ ẩn modal, KHÔNG stop track → giữ quyền camera
function closeWebcam() {
  document.getElementById("webcam-modal").classList.remove("open");
}

// [CHANGED 3/3] capturePhoto: không thay đổi gì, giữ nguyên
async function capturePhoto() {
  playShutterSound();
  const video = document.getElementById("webcam-video");
  const canvas = document.getElementById("webcam-canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext("2d").drawImage(video, 0, 0);
  const data = canvas.toDataURL("image/jpeg", 0.5);
  closeWebcam();
  toast("Đã chụp ảnh thành công", "success");
  await setPhotoPreview(data, activePhotoSlot);
}

// [CHANGED 4/3] switchWebcamFacing: chuyển đổi giữa camera trước và sau
function switchWebcamFacing() {
  // Toggle between front and back camera
  webcamCurrentFacing = webcamCurrentFacing === "user" ? "environment" : "user";

  // If we have an active stream, restart it with the new facing mode
  if (webcamStream) {
    // Stop existing tracks
    webcamStream.getTracks().forEach((track) => track.stop());
    webcamStream = null;

    // Reopen webcam with new facing mode
    openWebcam(activePhotoSlot);
  }
}

function handlePhotoFile(e, slot = "front") {
  const file = e.target.files[0];
  if (!file) return;
  // Reset input để có thể chọn lại cùng file
  e.target.value = "";
  const reader = new FileReader();
  reader.onload = async (ev) => {
    await setPhotoPreview(ev.target.result, slot);
    toast("Đã tải ảnh thảnh công!", "success");
  };
  reader.readAsDataURL(file);
}

async function setPhotoPreview(src, slot = "front") {
  // Lưu vào đúng slot
  if (slot === "front") {
    PHOTO_DATA_FRONT = src;
  } else {
    PHOTO_DATA_SIDE = src;
  }

  // Hiển thị thumbnail trong slot tương ứng
  const areaId = slot === "front" ? "photo-area-front" : "photo-area-side";
  const area = document.getElementById(areaId);
  area.style.border = "2px solid var(--primary, #4caf50)";
  area.innerHTML = `
    <img src="${src}" />
    <div class="photo-overlay-hover" style="
      position:absolute;inset:0;
      background:rgba(0,0,0,.4);
      opacity:0;
      transition:opacity .2s;
      border-radius:8px;
      display:flex;align-items:center;justify-content:center;
    ">
      <span style="color:#fff;font-size:.85rem;">🔄 Chụp lại</span>
    </div>`;
  area.style.position = "relative";
  area.onclick = () => openWebcam(slot);
  area.onmouseenter = () =>
    (area.querySelector(".photo-overlay-hover").style.opacity = "1");
  area.onmouseleave = () =>
    (area.querySelector(".photo-overlay-hover").style.opacity = "0");

  // Chỉ phân tích khi cả 2 ảnh đã có
  if (!PHOTO_DATA_FRONT || !PHOTO_DATA_SIDE) return;

  setLoading(
    null,
    true,
    null,
    "Đang phân tích tư thế, kết quả sẽ có trong giây lát",
  );

  // Ảnh mặt trước → trả về A1–A6
  const front = await MediaPipePosture.analyzePosture(
    PHOTO_DATA_FRONT,
    "front",
  );

  // Ảnh mặt phải → trả về B1
  const side = await MediaPipePosture.analyzePosture(PHOTO_DATA_SIDE, "side");

  renderPostureReport(
    "pose-media-pipe-report",
    selectedParticipantInHealthTab,
    front,
    side,
    PHOTO_DATA_FRONT,
    PHOTO_DATA_SIDE,
  );

  // ── Xuất report thành ảnh và lưu vào REPORT_AS_PHOTO ────────────────
  try {
    const reportEl = document.getElementById("pose-media-pipe-report");
    const canvas = await html2canvas(reportEl, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });
    REPORT_AS_PHOTO = canvas.toDataURL("image/jpeg", 0.7);
  } catch (err) {
    console.warn("Không thể xuất report thành ảnh:", err);
    toast(`Có lỗi trong quá trình phân tích. Vui lòng chụp ảnh và thử lại.`, "error");
    setLoading(null, false);
    return;
  }
  // ─────────────────────────────────────────────────────────────────────

  setLoading(null, false);
  toast(`Vui lòng nhập các chỉ số sức khỏe xương khớp.`, "success");
  scrollToForm("health-index-div");
}

// Giải phóng camera khi đóng tab / reload trang
window.addEventListener("pagehide", () => {
  if (webcamStream) {
    webcamStream.getTracks().forEach((t) => t.stop());
    webcamStream = null;
  }
});
