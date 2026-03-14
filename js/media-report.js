function renderPostureReport(
  containerId,
  paticipant,
  frontResult,
  sideResult,
  photoFront,
  photoSide,
) {
  var el = document.getElementById(containerId);
  if (!el) return;

  var statusColor = {
    normal: {
      bg: "#e8f5e9",
      text: "#2e7d32",
      label: "Bình thường",
      dot: "#43a047",
    },
    mild: { bg: "#fff8e1", text: "#f57f17", label: "Nhẹ", dot: "#ffb300" },
    moderate: { bg: "#fff3e0", text: "#e65100", label: "Vừa", dot: "#ef6c00" },
    severe: { bg: "#ffebee", text: "#c62828", label: "Nặng", dot: "#e53935" },
  };

  function badge(status) {
    var s = statusColor[status] || statusColor.normal;
    return [
      '<span style="',
      "display:inline-flex;align-items:center;gap:5px;",
      "background:" + s.bg + ";",
      "color:" + s.text + ";",
      "padding:3px 10px 3px 7px;",
      "border-radius:3px;",
      "font-size:10.5px;",
      "font-weight:700;",
      "letter-spacing:.4px;",
      "border:1px solid " + s.text + "22;",
      '">',
      '<span style="width:6px;height:6px;border-radius:50%;background:' +
        s.dot +
        ';flex-shrink:0;"></span>',
      s.label.toUpperCase(),
      "</span>",
    ].join("");
  }

  function metricRow(label, label2, item, isLast) {
    if (!item) return "";
    var s = statusColor[item.status] || statusColor.normal;
    var bar = Math.min(100, Math.abs(item.value) * 5);
    var borderStyle = isLast ? "none" : "1px solid #eaeef3";
    return [
      '<tr style="border-bottom:' + borderStyle + ';">',

      // Mã chỉ số
      "<td style=\"padding:9px 12px 9px 0;font-size:10px;color:#8a9ab0;font-family:'Courier New',monospace;font-weight:700;white-space:nowrap;width:28px;\">" +
        label +
        "</td>",

      // Tên chỉ số
      '<td style="padding:9px 16px 9px 8px;font-size:12.5px;color:#1a2535;font-weight:500;white-space:nowrap;">' +
        label2 +
        "</td>",

      // Thanh tiến độ
      '<td style="padding:9px 16px;width:130px;">',
      '  <div style="position:relative;background:#edf1f7;border-radius:2px;height:5px;overflow:hidden;">',
      '    <div style="position:absolute;left:0;top:0;background:' +
        s.dot +
        ";width:" +
        bar +
        '%;height:100%;border-radius:2px;"></div>',
      "  </div>",
      "</td>",

      // Giá trị đo
      '<td style="padding:9px 16px;font-size:12px;font-weight:700;color:' +
        s.text +
        ";text-align:right;white-space:nowrap;font-family:'Courier New',monospace;width:50px;\">" +
        item.value +
        item.unit +
        "</td>",

      // Badge trạng thái
      '<td style="padding:9px 0;text-align:right;white-space:nowrap;">' +
        badge(item.status) +
        "</td>",

      "</tr>",
    ].join("");
  }

  function photoBox(src, label) {
    if (!src) return "";
    return [
      '<div style="flex:1;min-width:0;text-align:center;">',
      '  <div style="',
      "    border:1px solid #dce3ed;",
      "    border-radius:4px;",
      "    overflow:hidden;",
      "    background:#f7f9fc;",
      '  ">',
      '    <img src="' + src + '" style="',
      "      width:100%;",
      "      display:block;",
      "      object-fit:contain;",
      "      max-height:260px;",
      "      height:auto;",
      '    " />',
      "  </div>",
      '  <div style="',
      "    text-align:center;",
      "    font-size:10px;",
      "    color:#8a9ab0;",
      "    margin-top:5px;",
      "    letter-spacing:.5px;",
      "    text-transform:uppercase;",
      "    font-weight:600;",
      '  ">' + label + "</div>",
      "</div>",
    ].join("");
  }

  function sectionHeader(code, title) {
    return [
      '<div style="',
      "  display:flex;",
      "  align-items:center;",
      "  gap:10px;",
      "  margin-bottom:0;",
      "  padding:8px 0;",
      "  border-bottom:2px solid #1a3a6b;",
      '">',
      '  <span style="',
      "    font-size:10px;",
      "    font-weight:800;",
      "    color:#fff;",
      "    background:#1a3a6b;",
      "    padding:3px 8px;",
      "    border-radius:3px;",
      "    letter-spacing:.6px;",
      "    font-family:'Courier New',monospace;",
      '  ">' + code + "</span>",
      '  <span style="',
      "    font-size:11px;",
      "    font-weight:700;",
      "    color:#1a3a6b;",
      "    letter-spacing:.8px;",
      "    text-transform:uppercase;",
      '  ">' + title + "</span>",
      "</div>",
    ].join("");
  }

  // ── Overall score ──────────────────────────────────────────────────────────
  var allStatuses = [];
  if (frontResult && frontResult.detected) {
    ["A1", "A2", "A3", "A4", "A5", "A6"].forEach(function (k) {
      if (frontResult[k]) allStatuses.push(frontResult[k].status);
    });
  }
  if (sideResult && sideResult.detected && sideResult.B1) {
    allStatuses.push(sideResult.B1.status);
  }

  //   var scoreMap = { normal: 0, mild: 1, moderate: 2, severe: 3 };
  //   var worst = allStatuses.reduce(function (w, s) {
  //     return (scoreMap[s] || 0) > (scoreMap[w] || 0) ? s : w;
  //   }, "normal");

  var scoreMap = { normal: 0, mild: 1, moderate: 2, severe: 3 };

  var scores = allStatuses.map(function (s) {
    return scoreMap[s] || 0;
  });

  var avgScore =
    scores.reduce(function (sum, v) {
      return sum + v;
    }, 0) / scores.length;

  var overall;

  if (avgScore < 0.5) overall = "normal";
  else if (avgScore < 1.5) overall = "mild";
  else if (avgScore < 2.5) overall = "moderate";
  else overall = "severe";

  var overallColor = statusColor[overall];

  //var overallColor = statusColor[worst];

  var now = new Date();
  var dateStr =
    now.getDate().toString().padStart(2, "0") +
    "/" +
    (now.getMonth() + 1).toString().padStart(2, "0") +
    "/" +
    now.getFullYear();
  var timeStr =
    now.getHours().toString().padStart(2, "0") +
    ":" +
    now.getMinutes().toString().padStart(2, "0");

  var reportId = paticipant.id;

  // ── Render ─────────────────────────────────────────────────────────────────
  var html = [
    // ── Wrapper ngoài: mô phỏng trang giấy A4 ──────────────────────────────
    '<div style="',
    "font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;",
    "background:#fff;",
    "width:100%;",
    "max-width:780px;",
    "margin:0 auto;",
    "box-shadow:0 0 0 1px #c8d3e0, 0 8px 40px rgba(0,0,0,.18);",
    "border-radius:2px;",
    "overflow:hidden;",
    "color:#1a2535;",
    '">',

    // ══ PHẦN ĐẦU TRANG ══════════════════════════════════════════════════════
    '<div style="',
    "background:linear-gradient(135deg,#0d2b5e 0%,#1a3a6b 60%,#1e4d8c 100%);",
    "padding:22px 32px 18px;",
    "position:relative;",
    "overflow:hidden;",
    '">',

    // Watermark trang trí
    '<div style="',
    "position:absolute;right:-30px;top:-30px;",
    "width:160px;height:160px;",
    "border-radius:50%;",
    "border:2px solid rgba(255,255,255,.06);",
    '"></div>',
    '<div style="',
    "position:absolute;right:20px;top:20px;",
    "width:100px;height:100px;",
    "border-radius:50%;",
    "border:1px solid rgba(255,255,255,.04);",
    '"></div>',

    // Tên cơ sở y tế & logo chữ
    '<div style="display:flex;align-items:flex-start;justify-content:space-between;position:relative;z-index:1;">',
    "  <div>",
    '    <div style="',
    "      font-size:11px;",
    "      font-weight:700;",
    "      color:#a8c4e8;",
    "      letter-spacing:2px;",
    "      text-transform:uppercase;",
    "      font-family:'Arial',sans-serif;",
    "      margin-bottom:4px;",
    '    ">Dữ liệu được chuẩn đoán bởi ADCREW AI</div>',
    '    <div style="',
    "      font-size:22px;",
    "      font-weight:700;",
    "      color:#ffffff;",
    "      letter-spacing:.5px;",
    "      line-height:1.2;",
    '    ">Báo Cáo Đánh Giá Tư Thế</div>',
    '    <div style="',
    "      font-size:11px;",
    "      color:#7bacd4;",
    "      margin-top:4px;",
    "      font-family:'Arial',sans-serif;",
    "      font-style:italic;",
    '    ">Phân tích tư thế tự động bằng AI · MediaPipe Pose Estimation</div>',
    "  </div>",

    // Biểu tượng chữ thập y tế
    '  <div style="',
    "    width:52px;height:52px;",
    "    border:2px solid rgba(255,255,255,.25);",
    "    border-radius:6px;",
    "    display:flex;align-items:center;justify-content:center;",
    "    flex-shrink:0;",
    "    margin-top:2px;",
    '  ">',
    '    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">',
    '      <path d="M12 2v20M2 12h20" stroke="rgba(255,255,255,.7)" stroke-width="3" stroke-linecap="round"/>',
    "    </svg>",
    "  </div>",
    "</div>",

    // Dải thông tin báo cáo
    '<div style="',
    "display:flex;gap:0;",
    "margin-top:16px;",
    "border-top:1px solid rgba(255,255,255,.12);",
    "padding-top:12px;",
    "font-family:'Arial',sans-serif;",
    "position:relative;z-index:1;",
    '">',

    [
      { label: "Mã báo cáo", value: reportId },
      { label: "Ngày thực hiện", value: dateStr },
      { label: "Giờ", value: timeStr },
      {
        label: "Kết quả tổng thể",
        value: overallColor.label.toUpperCase(),
        highlight: true,
        color: overallColor,
      },
    ]
      .map(function (item, i) {
        var borderLeft =
          i > 0 ? "border-left:1px solid rgba(255,255,255,.12);" : "";
        var valueStyle = item.highlight
          ? "font-size:12px;font-weight:800;color:" +
            item.color.dot +
            ";letter-spacing:.5px;"
          : "font-size:12px;font-weight:700;color:#fff;";
        return [
          '<div style="flex:1;padding:0 16px 0 ' +
            (i === 0 ? "0" : "16px") +
            ";" +
            borderLeft +
            '">',
          '  <div style="font-size:9.5px;color:#7bacd4;letter-spacing:.8px;text-transform:uppercase;margin-bottom:3px;">' +
            item.label +
            "</div>",
          '  <div style="' + valueStyle + '">' + item.value + "</div>",
          "</div>",
        ].join("");
      })
      .join(""),

    "</div></div>",
    // ═══════════════════════════════════════════════════════════════════════

    // ══ NỘI DUNG CHÍNH ══════════════════════════════════════════════════════
    '<div style="padding:24px 32px;">',

    // ── Ảnh chụp ──────────────────────────────────────────────────────────
    photoFront || photoSide
      ? [
          '<div style="margin-bottom:22px;">',
          sectionHeader("IMG", "Ảnh Chụp Kiểm Tra"),
          '<div style="display:flex;gap:16px;margin-top:14px;">',
          photoBox(photoFront, "Mặt Trước"),
          photoBox(photoSide, "Hình Nhìn Nghiêng"),
          "</div>",
          "</div>",
          '<div style="border-top:1px dashed #dce3ed;margin-bottom:22px;"></div>',
        ].join("")
      : "",

    // ── Phần A: Mặt trước ─────────────────────────────────────────────────
    frontResult && frontResult.detected
      ? [
          '<div style="margin-bottom:22px;">',
          sectionHeader("A", "Phân Tích Mặt Trước"),

          frontResult.confidence
            ? [
                '<div style="',
                "display:inline-flex;align-items:center;gap:6px;",
                "background:#f0f4fa;",
                "border:1px solid #dce3ed;",
                "border-radius:3px;",
                "padding:5px 12px;",
                "margin:10px 0 4px;",
                "font-family:'Arial',sans-serif;",
                '">',
                '  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#1a3a6b" stroke-width="2"/><path d="M12 8v4l3 3" stroke="#1a3a6b" stroke-width="2" stroke-linecap="round"/></svg>',
                '  <span style="font-size:10.5px;color:#5a6a80;font-weight:600;letter-spacing:.3px;">Độ tin cậy phân tích: <strong style="color:#1a3a6b;">' +
                  frontResult.confidence +
                  "%</strong></span>",
                "</div>",
              ].join("")
            : "",

          '<table style="width:100%;border-collapse:collapse;margin-top:8px;">',

          // Header bảng
          "<thead>",
          '<tr style="background:#f7f9fc;border-bottom:2px solid #dce3ed;">',
          "  <th style=\"padding:7px 12px 7px 0;font-size:9.5px;color:#8a9ab0;font-weight:700;text-align:left;letter-spacing:.8px;text-transform:uppercase;font-family:'Arial',sans-serif;width:28px;\">Mã</th>",
          "  <th style=\"padding:7px 8px;font-size:9.5px;color:#8a9ab0;font-weight:700;text-align:left;letter-spacing:.8px;text-transform:uppercase;font-family:'Arial',sans-serif;\">Chỉ số đánh giá</th>",
          "  <th style=\"padding:7px 16px;font-size:9.5px;color:#8a9ab0;font-weight:700;text-align:left;letter-spacing:.8px;text-transform:uppercase;font-family:'Arial',sans-serif;width:130px;\">Mức độ</th>",
          "  <th style=\"padding:7px 16px;font-size:9.5px;color:#8a9ab0;font-weight:700;text-align:right;letter-spacing:.8px;text-transform:uppercase;font-family:'Arial',sans-serif;width:50px;\">Giá trị</th>",
          "  <th style=\"padding:7px 0;font-size:9.5px;color:#8a9ab0;font-weight:700;text-align:right;letter-spacing:.8px;text-transform:uppercase;font-family:'Arial',sans-serif;\">Kết quả</th>",
          "</tr>",
          "</thead>",

          "<tbody>",
          metricRow("A1", "Căn chỉnh cơ thể", frontResult.A1, false),
          metricRow("A2", "Nghiêng đầu", frontResult.A2, false),
          metricRow("A3", "Căn chỉnh vai", frontResult.A3, false),
          metricRow("A4", "Nghiêng xương chậu", frontResult.A4, false),
          metricRow("A5", "Đầu gối", frontResult.A5, false),
          metricRow("A6", "Bàn chân", frontResult.A6, true),
          "</tbody>",
          "</table>",
          "</div>",
          '<div style="border-top:1px dashed #dce3ed;margin-bottom:22px;"></div>',
        ].join("")
      : frontResult && !frontResult.detected
        ? [
            '<div style="margin-bottom:22px;">',
            sectionHeader("A", "Phân Tích Mặt Trước"),
            '<div style="',
            "margin-top:12px;",
            "padding:12px 16px;",
            "background:#fafbfc;",
            "border:1px solid #dce3ed;",
            "border-left:3px solid #f57f17;",
            "border-radius:3px;",
            "font-family:'Arial',sans-serif;",
            "font-size:12px;",
            "color:#5a6a80;",
            '">⚠ ' + frontResult.message + "</div>",
            "</div>",
          ].join("")
        : "",

    // ── Phần B: Mặt bên ───────────────────────────────────────────────────
    sideResult && sideResult.detected
      ? [
          '<div style="margin-bottom:22px;">',
          sectionHeader("B", "Phân Tích Hình Nhìn Nghiêng"),
          '<table style="width:100%;border-collapse:collapse;margin-top:8px;">',

          "<thead>",
          '<tr style="background:#f7f9fc;border-bottom:2px solid #dce3ed;">',
          "  <th style=\"padding:7px 12px 7px 0;font-size:9.5px;color:#8a9ab0;font-weight:700;text-align:left;letter-spacing:.8px;text-transform:uppercase;font-family:'Arial',sans-serif;width:28px;\">Mã</th>",
          "  <th style=\"padding:7px 8px;font-size:9.5px;color:#8a9ab0;font-weight:700;text-align:left;letter-spacing:.8px;text-transform:uppercase;font-family:'Arial',sans-serif;\">Chỉ số đánh giá</th>",
          "  <th style=\"padding:7px 16px;font-size:9.5px;color:#8a9ab0;font-weight:700;text-align:left;letter-spacing:.8px;text-transform:uppercase;font-family:'Arial',sans-serif;width:130px;\">Mức độ</th>",
          "  <th style=\"padding:7px 16px;font-size:9.5px;color:#8a9ab0;font-weight:700;text-align:right;letter-spacing:.8px;text-transform:uppercase;font-family:'Arial',sans-serif;width:50px;\">Giá trị</th>",
          "  <th style=\"padding:7px 0;font-size:9.5px;color:#8a9ab0;font-weight:700;text-align:right;letter-spacing:.8px;text-transform:uppercase;font-family:'Arial',sans-serif;\">Kết quả</th>",
          "</tr>",
          "</thead>",

          "<tbody>",
          metricRow("B1", "Căn chỉnh cơ thể", sideResult.B1, true),
          "</tbody>",
          "</table>",
          "</div>",
          '<div style="border-top:1px dashed #dce3ed;margin-bottom:22px;"></div>',
        ].join("")
      : sideResult && !sideResult.detected
        ? [
            '<div style="margin-bottom:22px;">',
            sectionHeader("B", "Phân Tích Hình Nhìn Nghiêng"),
            '<div style="',
            "margin-top:12px;padding:12px 16px;background:#fafbfc;",
            "border:1px solid #dce3ed;border-left:3px solid #f57f17;",
            "border-radius:3px;font-family:'Arial',sans-serif;font-size:12px;color:#5a6a80;",
            '">⚠ ' + sideResult.message + "</div>",
            "</div>",
          ].join("")
        : "",

    // ── Nhận xét lâm sàng ─────────────────────────────────────────────────
    (frontResult && frontResult.detected) || (sideResult && sideResult.detected)
      ? [
          '<div style="margin-bottom:22px;">',
          sectionHeader("RX", "Nhận Xét Lâm Sàng"),
          '<div style="',
          "margin-top:12px;",
          "background:#f7f9fc;",
          "border:1px solid #dce3ed;",
          "border-radius:3px;",
          "overflow:hidden;",
          '">',

          // Dải kết quả tổng thể
          '<div style="',
          "display:flex;align-items:center;gap:12px;",
          "padding:10px 16px;",
          "background:" + overallColor.bg + ";",
          "border-bottom:1px solid " + overallColor.text + "33;",
          '">',
          '  <span style="',
          "    font-size:10px;font-weight:800;",
          "    color:" + overallColor.text + ";",
          "    letter-spacing:1px;text-transform:uppercase;",
          "    font-family:'Arial',sans-serif;",
          '  ">Kết quả tổng thể:</span>',
          '  <span style="',
          "    font-size:12px;font-weight:800;",
          "    color:" + overallColor.text + ";",
          "    letter-spacing:.5px;",
          "    font-family:'Arial',sans-serif;",
          '  ">' + overallColor.label.toUpperCase() + "</span>",
          "</div>",

          // Nội dung nhận xét
          '<div style="padding:14px 16px;">',
          frontResult && frontResult.detected
            ? [
                '<div style="',
                "display:flex;gap:10px;",
                "padding:8px 0;",
                "border-bottom:1px solid #eaeef3;",
                "font-family:'Arial',sans-serif;",
                '">',
                '  <span style="',
                "    font-size:10px;font-weight:700;color:#8a9ab0;",
                "    letter-spacing:.6px;text-transform:uppercase;",
                "    width:60px;flex-shrink:0;padding-top:1px;",
                '  ">Mặt trước</span>',
                '  <span style="font-size:12.5px;color:#1a2535;line-height:1.55;">' +
                  frontResult.summary +
                  "</span>",
                "</div>",
              ].join("")
            : "",

          sideResult && sideResult.detected
            ? [
                '<div style="',
                "display:flex;gap:10px;",
                "padding:8px 0 0;",
                "font-family:'Arial',sans-serif;",
                '">',
                '  <span style="',
                "    font-size:10px;font-weight:700;color:#8a9ab0;",
                "    letter-spacing:.6px;text-transform:uppercase;",
                "    width:60px;flex-shrink:0;padding-top:1px;",
                '  ">Mặt bên</span>',
                '  <span style="font-size:12.5px;color:#1a2535;line-height:1.55;">' +
                  sideResult.summary +
                  "</span>",
                "</div>",
              ].join("")
            : "",

          "</div>",
          "</div>",
          "</div>",
        ].join("")
      : "",

    // ── Chú thích / Legend ────────────────────────────────────────────────
    '<div style="',
    "display:flex;align-items:center;gap:10px;flex-wrap:wrap;",
    "padding:10px 14px;",
    "background:#f7f9fc;",
    "border:1px solid #dce3ed;",
    "border-radius:3px;",
    "margin-bottom:4px;",
    '">',
    "  <span style=\"font-size:9.5px;font-weight:700;color:#8a9ab0;letter-spacing:.8px;text-transform:uppercase;font-family:'Arial',sans-serif;margin-right:4px;\">Phân loại:</span>",
    Object.keys(statusColor)
      .map(function (k) {
        var s = statusColor[k];
        return [
          '<span style="',
          "display:inline-flex;align-items:center;gap:5px;",
          "font-size:10.5px;",
          "color:" + s.text + ";",
          "font-family:'Arial',sans-serif;",
          "font-weight:600;",
          '">',
          '<span style="width:7px;height:7px;border-radius:50%;background:' +
            s.dot +
            ';"></span>',
          s.label,
          "</span>",
        ].join("");
      })
      .join('<span style="color:#dce3ed;margin:0 2px;">|</span>'),
    "</div>",

    "</div>",
    // ═══ KẾT THÚC NỘI DUNG ═══════════════════════════════════════════════

    // ══ CHÂN TRANG ══════════════════════════════════════════════════════════
    '<div style="',
    "background:#f0f4fa;",
    "border-top:1px solid #dce3ed;",
    "padding:10px 32px;",
    "display:flex;",
    "align-items:center;",
    "justify-content:space-between;",
    '">',
    "  <div style=\"font-size:9.5px;color:#8a9ab0;font-family:'Arial',sans-serif;line-height:1.5;\">",
    "    Báo cáo được tạo tự động bởi ADCREW AI · Chỉ mang tính chất tham khảo<br/>",
    "    Không thay thế chẩn đoán hoặc tư vấn chuyên môn từ chuyên gia.<br/>",
    '    <span style="font-size:7px;color:#7a8ca0;padding-top:24px;">',
    "      Hệ thống đạt ~7.5/10 dựa trên độ ổn định thị giác máy tính, xử lý nhiễu và tính đơn giản kiến trúc; ",
    "      hiệu quả tổng thể cao hơn nhiều startup posture AI (~6/10) và có thể hỗ trợ đánh giá tư thế khi kết hợp chuyên môn lâm sàng.",
    "    </span>",
    "  </div>",
    "  <div style=\"font-size:9.5px;color:#aab4c0;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace;text-align:right;\">",
    "    " +
      reportId +
      '<br/><span style="color:#c8d0da;">' +
      dateStr +
      " · " +
      timeStr +
      "</span>",
    "  </div>",
    "</div>",
    // ═══════════════════════════════════════════════════════════════════════

    "</div>", // đóng wrapper
  ].join("");

  el.innerHTML = html;
}
