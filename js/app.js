// =====================
// CONFIG & STATE
// =====================
const CONFIG = {
  url: "https://script.google.com/macros/s/AKfycbyfbr3Hg2T-l1-23Y2Xx1ajtgE8ORWdIeHgdfrgfOJjeO_0fwsm0TDmlIWore9Argna/exec",
  ssId: "1iY0VJaIvLGDYi2A4TsBXAXu6jgTz-GhXd8p75Gpg4iw",
};

var SYSTEM_PENDING_REQUESTS = 0;
const __TEST_MODE = false;

function formatDateTimeVN(isoString) {
  const date = new Date(isoString);

  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function statusBadge(status) {
  const map = {
    pending:
      '<span class="badge badge-blue" style="font-size:.72rem">Chờ đo</span>',
    health:
      '<span class="badge badge-green" style="font-size:.72rem">Đã đo SK</span>',
    consulted:
      '<span class="badge badge-amber" style="font-size:.72rem">Đã tư vấn</span>',
    marketed:
      '<span class="badge badge-purple" style="font-size:.72rem">Đã marketing</span>',
  };
  return (
    map[status] ||
    `<span class="badge" style="font-size:.72rem;background:rgba(100,116,139,.15);color:#64748b">${status || "?"}</span>`
  );
}

const SKIP_INIT = true;

async function loadConfigAndStart(role = "dataentry") {
  startApp(role);
}

function openAppStartUpScreen() {
  document.getElementById("overlay").style.display = "flex";
}

function updateUI() {
  document.getElementById("overlay").style.display = "none";
  document.getElementById("app").style.display = "block";
  document.getElementById("conn-label").textContent = "Google Sheets";
  document.getElementById("conn-dot").style.background = "var(--green)";
}

async function startApp(role) {
  if (!SKIP_INIT) {
    await initSheets();
    if (role) {
      if (await switchRole(role)) updateUI();
    }
  } else if (role) {
    if (await switchRole(role)) updateUI();
  }
}

function scrollToForm(elemId) {
  const el = document.getElementById(elemId);
  const offset = 76;

  const y = el.getBoundingClientRect().top + window.pageYOffset - offset;

  window.scrollTo({
    top: y,
    behavior: "smooth",
  });
}

// =====================
// API LAYER
// =====================

async function apiGet(sheet = "all", filterCol = null, filterVal = null) {
  SYSTEM_PENDING_REQUESTS++;
  let fetchUrl = `${CONFIG.url}?action=getAll&sheet=${sheet}&ss=${CONFIG.ssId}`;
  if (filterCol && filterVal) {
    const params = new URLSearchParams({
      filterCol: filterCol,
      filterVal: filterVal,
    });

    fetchUrl += `&${params.toString()}`;
  }
  try {
    const r = await fetch(fetchUrl, {
      method: "GET",
      redirect: "follow",
      mode: "cors",
    });
    const text = await r.text();
    const d = JSON.parse(text);
    if (!d.data) {
      toast("Lỗi kết nối với Google Sheet không có dữ liệu!", "error");
      return {};
    }
    SYSTEM_PENDING_REQUESTS--;
    return d.data;
  } catch (e) {
    SYSTEM_PENDING_REQUESTS--;
    toast("Lỗi kết nối Google Sheet: " + e.message, "error");
    return {};
  }
}

async function apiPost(action, sheet, payload) {
  SYSTEM_PENDING_REQUESTS++;
  try {
    const r = await fetch(CONFIG.url, {
      method: "POST",
      redirect: "follow",
      mode: "cors",
      body: JSON.stringify({
        action,
        sheet,
        data: payload.data,
        id: payload.id,
        updates: payload.updates,
        ee: CONFIG.ssId,
      }),
    });
    const text = await r.text();
    SYSTEM_PENDING_REQUESTS--;
    return JSON.parse(text);
  } catch (e) {
    SYSTEM_PENDING_REQUESTS--;
    toast(
      `Lỗi ghi dữ liệu. Bạn vui lòng nhập lại thông tin cho ${payload.name ?? "khách vừa rồi"}. ` +
        e.message,
      "error",
    );
    return null;
  }
}

async function initSheets() {
  try {
    await fetch(CONFIG.url, {
      method: "POST",
      body: JSON.stringify({ action: "init", sheet: "all", ee: CONFIG.ssId }),
    });
  } catch (e) {}
}

// =====================
// TOAST
// =====================
function toast(msg, type = "info") {
  const icons = { success: "✅", error: "❌", info: "ℹ️" };
  const el = document.createElement("div");
  el.className = `toast-item ${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type]}</span><span>${msg}</span>`;
  document.getElementById("toast").appendChild(el);
  setTimeout(() => {
    el.style.animation = "slideDown .25s ease reverse";
    setTimeout(() => el.remove(), 220);
  }, 3500);
}

function setLoading(btn, loading, originalHTML = null, message = "Đang xử lý") {
  if (loading) {
    if (btn) {
      btn.dataset.orig = btn.innerHTML;
      btn.innerHTML = `<span class="btn-text">${btn.innerHTML}</span>`;
      btn.classList.add("btn-loading");
      btn.disabled = true;
    }
    // Inject keyframes once
    if (!document.getElementById("__loading-styles")) {
      const style = document.createElement("style");
      style.id = "__loading-styles";
      style.textContent = `
        @keyframes __pulse-ring {
          0%   { transform: scale(.8); opacity: .8; }
          50%  { transform: scale(1.3); opacity: .3; }
          100% { transform: scale(.8); opacity: .8; }
        }
        @keyframes __ecg {
          0%   { stroke-dashoffset: 200; }
          100% { stroke-dashoffset: -200; }
        }
        @keyframes __fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        #__loading-lock {
          animation: __fade-in .2s ease;
        }
        #__loading-lock .__ring {
          animation: __pulse-ring 1.2s ease-in-out infinite;
        }
        #__loading-lock .__ecg-path {
          stroke-dasharray: 200;
          animation: __ecg 1.4s linear infinite;
        }
        #__loading-lock .__label {
          animation: __pulse-ring 1.2s ease-in-out infinite;
        }
      `;
      document.head.appendChild(style);
    }

    const lock = document.createElement("div");
    lock.id = "__loading-lock";
    Object.assign(lock.style, {
      position: "fixed",
      inset: "0",
      zIndex: "99998",
      cursor: "wait",
      backgroundColor: "rgba(15, 23, 42, 0.55)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    });

    lock.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;gap:20px">

        <!-- Pulse ring + heart -->
        <div style="position:relative;width:80px;height:80px;display:flex;align-items:center;justify-content:center;">
          <div class="__ring" style="
            position:absolute;inset:0;
            border-radius:50%;
            border: 3px solid rgba(16,185,129,0.5);
            box-shadow: 0 0 18px rgba(16,185,129,0.4);
          "></div>
          <div style="font-size:2.2rem;line-height:1;">❤️</div>
        </div>

        <!-- ECG line -->
        <svg width="160" height="40" viewBox="0 0 160 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path class="__ecg-path"
            d="M0 20 L30 20 L38 20 L44 4 L50 36 L56 20 L66 20 L72 20 L80 20 L88 20 L94 4 L100 36 L106 20 L116 20 L160 20"
            stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
            fill="none"
          />
        </svg>

        <!-- Label -->
        <div class="__label" style="
          color:#fff;font-size:.85rem;font-weight:600;
          letter-spacing:.5px;opacity:.85;
        ">${message}...</div>

      </div>
    `;

    document.body.appendChild(lock);
  } else {
    if (btn) {
      btn.innerHTML = originalHTML || btn.dataset.orig || btn.innerHTML;
      btn.classList.remove("btn-loading");
      btn.disabled = false;
    }
    document.getElementById("__loading-lock")?.remove();
  }
}

// =====================
// ICON COMPONENTS
// =====================

function IconAllDone({
  size = 72,
  message = "Không tìm thấy ai - thử tải lại hoặc thay đổi từ khóa tìm kiếm.",
} = {}) {
  return `
    <div style="display:flex;flex-direction:column;align-items:center;gap:14px;padding:16px 0;">
      <svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Background circle -->
        <circle cx="32" cy="32" r="30" fill="#eff6ff" stroke="#bfdbfe" stroke-width="1.5"/>

        <!-- Head -->
        <circle cx="32" cy="17" r="7" fill="#93c5fd" stroke="#60a5fa" stroke-width="1"/>

        <!-- Body / hospital gown -->
        <path d="M16 54 Q16 30 32 30 Q48 30 48 54 Z" fill="#bfdbfe" stroke="#93c5fd" stroke-width="1"/>

        <!-- Arms -->
        <path d="M16 38 Q10 40 11 47" stroke="#93c5fd" stroke-width="3" stroke-linecap="round"/>
        <path d="M48 38 Q54 40 53 47" stroke="#93c5fd" stroke-width="3" stroke-linecap="round"/>

        <!-- Medical cross on chest -->
        <rect x="29.5" y="34" width="5" height="13" rx="2.5" fill="#10b981"/>
        <rect x="24"   y="39" width="16" height="5"  rx="2.5" fill="#10b981"/>

        <!-- Done badge -->
        <circle cx="48" cy="48" r="9" fill="#10b981" stroke="#fff" stroke-width="2"/>
        <path d="M44 48 L47 51.5 L52.5 44.5" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>

      <p style="color:#64748b;font-size:.86rem;text-align:center;line-height:1.6;max-width:260px;">${message}</p>
    </div>
  `;
}

function playShutterSound() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();

  // Click cơ học ngắn
  const bufferSize = ctx.sampleRate * 0.08;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 6);
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(1.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

  source.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}
