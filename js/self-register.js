// =====================
// SELF REGISTRATION
// =====================

async function addParticipant() {
  const name = document.getElementById("f-name").value.trim();
  const birthYear = document.getElementById("f-birthYear").value.trim();
  const gender = document.getElementById("f-gender").value;
  const phone = document.getElementById("f-phone").value.trim();
  const address = document.getElementById("f-address").value.trim();
  const consent = document.getElementById("f-consent").checked;

  // Clear previous errors
  clearErrors();

  let hasError = false;

  if (!name) {
    showError("err-name", "Vui lòng nhập họ tên");
    hasError = true;
  }
  if (!birthYear) {
    showError("err-birthYear", "Vui lòng nhập năm sinh");
    hasError = true;
  }
  const currentYear = new Date().getFullYear();
  if (currentYear - birthYear > 130 ) {
    showError("err-birthYear", "Năm sinh không phù hợp. Vui lòng kiểm tra lại");
    hasError = true;
  }

  if (!gender) {
    showError("err-gender", "Vui lòng chọn giới tính");
    hasError = true;
  }
  if (!phone) {
    showError("err-phone", "Vui lòng nhập số Zalo");
    hasError = true;
  } else if (phone.length < 10) {
    showError("err-phone", "Số Zalo không hợp lệ");
    hasError = true;
  }
  if (!consent) {
    showError("err-consent", "Bạn cần đồng ý để tiếp tục");
    hasError = true;
  }

  if (hasError) return;

  const btn = document.getElementById("submit-btn");
  setLoading(btn, true, null, "Đang ghi thông tin khách hàng");

  const id = "P" + Date.now();
  const now = new Date().toISOString();

  try {
    await apiPost("append", "Participants", {
      data: [id, name, birthYear, gender, phone, address, consent, "pending", now],
    });

    // Show success screen
    showSuccess(name);
  } catch (e) {
    toast("Đã có lỗi xảy ra. Vui lòng thử lại.", "error");
  }
  setLoading(btn, false);
}

function clearParticipantForm() {
  ["f-name", "f-birthYear", "f-phone", "f-address"].forEach(
    (id) => (document.getElementById(id).value = ""),
  );
  document.getElementById("f-gender").value = "";
  document.getElementById("f-consent").checked = false;
  clearErrors();
}

function clearErrors() {
  document
    .querySelectorAll(".field-error")
    .forEach((el) => (el.textContent = ""));
  document
    .querySelectorAll(".form-input, .form-select")
    .forEach((el) => el.classList.remove("input-error"));
}

function showError(targetId, message) {
  const errEl = document.getElementById(targetId);
  if (errEl) errEl.textContent = message;

  // Highlight the related input
  const inputId = targetId.replace("err-", "f-");
  const inputEl = document.getElementById(inputId);
  if (inputEl) inputEl.classList.add("input-error");
}

function showSuccess(name) {
  document.getElementById("registration-form").style.display = "none";
  document.getElementById("success-screen").style.display = "flex";
  document.getElementById("success-name").textContent = name;
}

function registerAnother() {
  clearParticipantForm();
  document.getElementById("success-screen").style.display = "none";
  document.getElementById("registration-form").style.display = "block";
}
