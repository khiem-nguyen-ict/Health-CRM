// =====================
// STEP 1: DATA ENTRY
// =====================

let allParticipants = []; // Local data

function filterLocalParticipants() {
  const searchTerm = document
    .getElementById("s1-search")
    .value.toLowerCase()
    .trim();

  const participants = allParticipants;

  const filtered = participants.filter((participant) => {
    return Object.values(participant).some((value) =>
      String(value).toLowerCase().includes(searchTerm),
    );
  });

  renderParticipants(filtered);
}

async function loadParticipants() {
  document.getElementById("s1-search").value = "";
  const btn = document.querySelector('[onclick="loadParticipants()"]');
  setLoading(btn, true, null, "Đang lấy danh sách khách hàng");

  const rows = await apiGet("Participants", "status", "pending");
  const pending = rows.filter((r) => r.status === "pending");
  pending.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  allParticipants = pending;
  renderParticipants(allParticipants);
  setLoading(btn, false);
}

function renderParticipants(rows) {
  const tbody = document.getElementById("participant-list");
  const pending = rows.filter((r) => r.status === "pending"); // ← CHỈ LỌC PENDING
  document.getElementById("list-count").textContent = pending.length;
  if (!pending.length) {
    tbody.innerHTML = `<tr><td colspan="5">${IconAllDone({ message: "Không có kết quả nào - hàng chờ trống hoặc không khớp với tìm kiếm." })}</td></tr>`;
    return;
  }
  tbody.innerHTML = pending
    .map(
      (r) => `
<tr>
  <td class="td-name">${r.name || ""}</td>
  <td>${r.birthYear || ""}</td>
  <td class="td-phone">${r.phone || ""}</td>
</tr>`,
    )
    .join("");
}

async function addParticipant() {
  const name = document.getElementById("f-name").value.trim();
  const birthYear = document.getElementById("f-birthYear").value.trim();
  const gender = document.getElementById("f-gender").value;
  const phone = document.getElementById("f-phone").value.trim();
  const address = document.getElementById("f-address").value.trim();
  const consent = document.getElementById("f-consent").checked;

  if (!name || !birthYear || !gender || !phone) {
    toast("Vui lòng điền đủ thông tin bắt buộc (*)", "error");
    return;
  }

  const currentYear = new Date().getFullYear();
  if (currentYear - birthYear > 130) {
    toast("Năm sinh không phù hợp. Vui lòng kiểm tra lại", "error");
    return;
  }

  if (!consent) {
    toast("Cần xác nhận đồng ý của người tham gia", "error");
    return;
  }
  if (phone.length < 10) {
    toast("Số điện thoại không hợp lệ", "error");
    return;
  }

  const btn = document.querySelector('[onclick="addParticipant()"]');
  setLoading(btn, true, null, "Đang ghi thông tin khách hàng");
  const id = "P" + Date.now();
  const now = new Date().toISOString();
  const newParticipant = {
    id,
    name,
    birthYear,
    gender,
    phone,
    address,
    consent,
    status: "pending",
    createdAt: now,
  };

  await apiPost("append", "Participants", {
    data: [
      id,
      name,
      birthYear,
      gender,
      phone,
      address,
      consent,
      "pending",
      now,
    ],
  });
  setLoading(btn, false);
  toast(`Đã lưu: ${name}`, "success");
  clearParticipantForm();

  allParticipants.unshift(newParticipant);

  renderParticipants(allParticipants);
}

function clearParticipantForm() {
  ["f-name", "f-birthYear", "f-phone", "f-address"].forEach(
    (id) => (document.getElementById(id).value = ""),
  );
  document.getElementById("f-gender").value = "";
  document.getElementById("f-consent").checked = false;
}
