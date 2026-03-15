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

async function loadParticipants(manually = true) {
  const btn = document.querySelector('[onclick="loadParticipants()"]');
  if (manually) {
    document.getElementById("s1-search").value = "";
    setLoading(btn, true, null, "Đang lấy danh sách khách hàng");
  }
  const rows = await apiGet("Participants", "status", "pending");
  const pending = rows.filter((r) => r.status === "pending");
  pending.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (_.isEqual(allParticipants, pending)) {
    if (manually) {
      setLoading(btn, false);
    }
    if (allParticipants.length <= 0) {
      // fix bug: reset view
      renderParticipants([]);
    }
    return;
  }
  allParticipants = pending;
  if (manually) {
    renderParticipants(allParticipants);
    setLoading(btn, false);
  } else filterLocalParticipants();
}

function renderParticipants(rows) {
  const tbody = document.getElementById("participant-list");
  document.getElementById("list-count").textContent = rows.length;
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="5">${IconAllDone({ message: "Không có kết quả nào - hàng chờ trống hoặc không khớp với tìm kiếm." })}</td></tr>`;
    return;
  }
  tbody.innerHTML = rows
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

  // Trick to save waiting time, save later
  clearParticipantForm();
  toast(`Đã lưu: ${name}`, "success");
  allParticipants.unshift(newParticipant);
  renderParticipants(allParticipants);
  setLoading(btn, false);

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
}

function clearParticipantForm() {
  ["f-name", "f-birthYear", "f-phone", "f-address"].forEach(
    (id) => (document.getElementById(id).value = ""),
  );
  document.getElementById("f-gender").value = "";
  document.getElementById("f-consent").checked = false;
}