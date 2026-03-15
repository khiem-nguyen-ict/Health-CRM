/**
 * media-pipe.js
 * Posture analysis using MediaPipe Pose
 * Patched version: improved math + stabilization
 */

var MediaPipePosture = (function () {
  var _poseLandmarker = null;
  var _initPromise = null;
  var _lastLandmarks = null;

  var CDN =
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs";

  var WASM =
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";

  var MODEL =
    "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task";

  function _ensureInit() {
    if (_poseLandmarker) return Promise.resolve();
    if (_initPromise) return _initPromise;

    _initPromise = import(CDN)
      .then(function (mp) {
        return mp.FilesetResolver.forVisionTasks(WASM).then(function (vision) {
          return mp.PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: MODEL,
              delegate: "GPU",
            },
            runningMode: "IMAGE",
            numPoses: 1,
          });
        });
      })
      .then(function (lm) {
        _poseLandmarker = lm;
      });

    return _initPromise;
  }

  function analyzePosture(input, view) {
    view = view || "front";

    return _ensureInit()
      .then(function () {
        return _toImageElement(input);
      })
      .then(function (imgEl) {
        var result = _poseLandmarker.detect(imgEl);

        if (!result.landmarks || result.landmarks.length === 0) {
          return {
            detected: false,
            view: view,
            message: "Không phát hiện người trong ảnh",
          };
        }

        var lm = _smoothLandmarks(result.landmarks[0]);

        return view === "side" ? _calcSide(lm) : _calcFront(lm);
      });
  }

  function _calcFront(lm) {
    lm = _normalizeTilt(lm);

    var shoulderMid = _mid(lm[11], lm[12]);
    var hipMid = _mid(lm[23], lm[24]);

    var A1 = Math.abs(_lateralAngle(shoulderMid, hipMid));
    var A2 = Math.abs(_horizontalAngle(lm[7], lm[8]));
    var A3 = Math.abs(_horizontalAngle(lm[11], lm[12]));
    var A4 = Math.abs(_horizontalAngle(lm[23], lm[24]));
    var A5 = Math.abs(_horizontalAngle(lm[25], lm[26]));
    var A6 = Math.abs(_horizontalAngle(lm[27], lm[28]));

    var confidence = _avgVisibility([
      lm[7],
      lm[8],
      lm[11],
      lm[12],
      lm[23],
      lm[24],
      lm[25],
      lm[26],
    ]);

    return {
      detected: true,
      view: "front",

      A1: {
        label: "Body Alignment",
        value: A1,
        unit: "°",
        ideal: 0,
        status: _tiltStatus(A1),
      },

      A2: {
        label: "Head Tilt",
        value: A2,
        unit: "°",
        ideal: 0,
        status: _tiltStatus(A2),
      },

      A3: {
        label: "Shoulder Alignment",
        value: A3,
        unit: "°",
        ideal: 0,
        status: _tiltStatus(A3),
      },

      A4: {
        label: "Pelvic Tilt",
        value: A4,
        unit: "°",
        ideal: 0,
        status: _tiltStatus(A4),
      },

      A5: {
        label: "Knees",
        value: A5,
        unit: "°",
        ideal: 0,
        status: _tiltStatus(A5),
      },

      A6: {
        label: "Feet",
        value: A6,
        unit: "°",
        ideal: 0,
        status: _tiltStatus(A6),
      },

      confidence: Math.round(Math.min(1, confidence) * 100),

      summary: _frontSummary(A1, A2, A3, A4),
    };
  }

  function _calcSide(lm) {
    var useLeft = lm[11].visibility > lm[12].visibility;

    var ear = useLeft ? lm[7] : lm[8];
    var shoulder = useLeft ? lm[11] : lm[12];
    var hip = useLeft ? lm[23] : lm[24];

    var dx = ear.x - shoulder.x;
    var dy = Math.abs(ear.y - shoulder.y);

    var B1 = Math.abs(+(Math.atan(dx / dy) * (180 / Math.PI)).toFixed(1));

    var spineAngle = _angle3(ear, shoulder, hip);

    var confidence = _avgVisibility([ear, shoulder, hip]);

    return {
      detected: true,
      view: "side",

      B1: {
        label: "Body Alignment",
        value: B1,
        unit: "°",
        ideal: 0,
        status: _spineStatus(spineAngle),
      },

      spineAngle: Math.round(spineAngle),

      confidence: Math.round(Math.min(1, confidence) * 100),

      summary: _sideMessage(spineAngle),
    };
  }

  function _tiltStatus(deg) {
    var d = Math.abs(deg);

    if (d <= 2) return "normal";
    if (d <= 5) return "mild";
    if (d <= 10) return "moderate";
    return "severe";
  }

  function _spineStatus(angle) {
    if (angle > 165) return "normal";
    if (angle > 145) return "mild";
    if (angle > 125) return "moderate";
    return "severe";
  }

  function _frontSummary(A1, A2, A3, A4) {
    var issues = [];

    if (Math.abs(A2) > 2) issues.push("Đầu nghiêng " + Math.abs(A2) + "°");
    if (Math.abs(A3) > 2) issues.push("Vai lệch " + Math.abs(A3) + "°");
    if (Math.abs(A4) > 2) issues.push("Hông lệch " + Math.abs(A4) + "°");
    if (Math.abs(A1) > 2) issues.push("Trục thân lệch " + Math.abs(A1) + "°");

    return issues.length === 0
      ? "Tư thế mặt trước bình thường"
      : "Phát hiện: " + issues.join(", ");
  }

  function _sideMessage(angle) {
    if (angle > 165) return "Tư thế mặt bên tốt - cột sống thẳng";
    if (angle > 145) return "Hơi gù nhẹ - cần chú ý tư thế";
    if (angle > 125) return "Gù vừa - nên tập luyện điều chỉnh";
    return "Gù nặng - khuyến nghị khám chuyên khoa";
  }

  function _horizontalAngle(left, right) {
    var dy = right.y - left.y;
    var dx = right.x - left.x;

    if (dx === 0) return 0;

    var rad = Math.atan(dy / dx);

    return +(rad * (180 / Math.PI)).toFixed(1);
  }

  function _lateralAngle(top, bottom) {
    var dx = bottom.x - top.x;
    var dy = bottom.y - top.y;

    if (dy === 0) return 0;

    var rad = Math.atan(dx / dy);

    return +(rad * (180 / Math.PI)).toFixed(1);
  }

  function _angle3(A, B, C) {
    var BA = { x: A.x - B.x, y: A.y - B.y };
    var BC = { x: C.x - B.x, y: C.y - B.y };

    var dot = BA.x * BC.x + BA.y * BC.y;

    var mag =
      Math.sqrt(BA.x * BA.x + BA.y * BA.y) *
      Math.sqrt(BC.x * BC.x + BC.y * BC.y);

    if (mag === 0) return 180;

    var cos = dot / mag;

    cos = Math.max(-1, Math.min(1, cos));

    return Math.acos(cos) * (180 / Math.PI);
  }

  function _mid(a, b) {
    return {
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2,
    };
  }

  function _avgVisibility(points) {
    return (
      points.reduce(function (s, p) {
        return s + (p.visibility || 0);
      }, 0) / points.length
    );
  }

  function _smoothLandmarks(lm) {
    if (!_lastLandmarks) {
      _lastLandmarks = lm;
      return lm;
    }

    var alpha = 0.6;

    var smoothed = lm.map(function (p, i) {
      var prev = _lastLandmarks[i];

      return {
        x: prev.x * alpha + p.x * (1 - alpha),
        y: prev.y * alpha + p.y * (1 - alpha),
        z: p.z,
        visibility: p.visibility,
      };
    });

    _lastLandmarks = smoothed;

    return smoothed;
  }

  function _normalizeTilt(lm) {
    var left = lm[11];
    var right = lm[12];

    var dy = right.y - left.y;
    var dx = right.x - left.x;

    var angle = Math.atan2(dy, dx);

    if (Math.abs(angle) < 0.02) return lm;

    var cos = Math.cos(-angle);
    var sin = Math.sin(-angle);

    var cx = (left.x + right.x) / 2;
    var cy = (left.y + right.y) / 2;

    return lm.map(function (p) {
      var x = p.x - cx;
      var y = p.y - cy;

      return {
        x: x * cos - y * sin + cx,
        y: x * sin + y * cos + cy,
        z: p.z,
        visibility: p.visibility,
      };
    });
  }

  function _toImageElement(input) {
    return new Promise(function (resolve, reject) {
      if (input instanceof HTMLImageElement) {
        resolve(input);
        return;
      }

      var src = input instanceof HTMLCanvasElement ? input.toDataURL() : input;

      var img = new Image();

      img.onload = function () {
        resolve(img);
      };

      img.onerror = reject;

      img.src = src;
    });
  }

  return {
    analyzePosture: analyzePosture,
  };
})();
