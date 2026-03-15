// =====================
// ROLE SWITCHING
// =====================

const REFRESH_INTERVAL = 30000; // 30 seconds
let CURRENT_ROLE = "dataentry";

async function switchRole(role) {
  let authenticate = localStorage.getItem("authenticate");
  if (!authenticate) {
    const password = prompt(
      `Vui lòng nhập mật khẩu cho vai trò "${role}".\n` +
        `Nếu cần hỗ trợ, vui lòng liên hệ quản trị: admin@adcrew.vn.`,
    );

    if (password === null) {
      alert("Bạn đã hủy thao tác.");
      return false;
    }

    if (password.trim() === "") {
      alert("Bạn chưa nhập mật khẩu. Vui lòng thử lại.");
      return false;
    }

    if (password === "ebBf~f5^'7BL(c&7+") {
      authenticate = "admin";
    } else if (password === "OBIMIN") {
      authenticate = "user";
    } else {
      alert("Mật khẩu không chính xác. Truy cập bị từ chối.");
      return false;
    }
    localStorage.setItem("authenticate", authenticate);
  }

  if (role === "marketing" && authenticate === "user") {
    alert(
      "Bạn không đủ thẩm quyền truy cập chức năng này. Vui lòng chọn mục khác.",
    );
    return false;
  }

  CURRENT_ROLE = role;

  document
    .querySelectorAll(".role-tab")
    .forEach((t) => t.classList.toggle("active", t.dataset.role === role));

  document
    .querySelectorAll("[id^=view-]")
    .forEach((v) => (v.style.display = "none"));

  document.getElementById(`view-${role}`).style.display = "";

  await loadRoleData(role);

  return true;
}

// =====================
// DATA LOADING
// =====================

async function loadRoleData(role, manually = true) {
  if (role === "dataentry") await loadParticipants(manually);
  else if (role === "health") await loadHealthQueue(manually);
  else if (role === "doctor") await loadDoctorQueue(manually);
  else if (role === "marketing") await loadMarketing(manually);
}

// =====================
// AUTO REFRESH
// =====================

// Set up refresh timer after DOM is loaded (runs every 30 seconds)
document.addEventListener("DOMContentLoaded", () => {
  setInterval(() => {
    // System idle, do not refresh during posting in background
    if (SYSTEM_PENDING_REQUESTS <= 0) {
      // Skip refresh if a modal is open (common indicator of active user interaction)
      const openModal = document.querySelector(
        '.modal[style*="block"], .modal[style*="flex"]',
      );
      const activeForm = document.activeElement?.closest("form");

      // Only refresh if no modal is open and no form field is focused
      if (!openModal && !activeForm) {
        loadRoleData(CURRENT_ROLE, false);
      }
    } else {
      console.info("System is busy, skip background refreshing!");
    }
  }, REFRESH_INTERVAL);
});
