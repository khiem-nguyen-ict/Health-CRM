// =====================
// ROLE SWITCHING
// =====================

const REFRESH_INTERVAL = 30000; // 30 seconds
let CURRENT_ROLE = "dataentry";

function switchRole(role) {
  CURRENT_ROLE = role;
  document
    .querySelectorAll(".role-tab")
    .forEach((t) => t.classList.toggle("active", t.dataset.role === role));
  document
    .querySelectorAll("[id^=view-]")
    .forEach((v) => (v.style.display = "none"));
  document.getElementById(`view-${role}`).style.display = "";
  loadRoleData(role);
}

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
