/* 動態地球 — 零外部相依的 canvas 點陣地球。
   陸地點來自 land-dots.js（window.LAND_DOTS，離線由 ne_110m_land 取樣）。
   標出黃芳誼比較研究的據點，並以大圓弧從台北連出。
   支援自轉、拖曳旋轉、prefers-reduced-motion、Retina。 */
(function () {
  'use strict';

  var canvas = document.getElementById('globe');
  var LAND = window.LAND_DOTS;
  if (!canvas || !LAND) return;
  var ctx = canvas.getContext('2d');

  // 研究據點 [lat, lon, 是否主據點]
  var HUBS = [
    [25.03, 121.56, 1],  // 台北（主）
    [35.68, 139.69, 0],  // 東京
    [37.57, 126.98, 0],  // 首爾
    [35.01, 135.77, 0],  // 京都
    [29.65, -82.32, 0],  // 佛羅里達
    [38.90, -77.04, 0],  // 華盛頓
    [53.96,  -1.08, 0],  // 約克
    [52.52,  13.40, 0]   // 柏林
  ];
  var ARCS = [[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7]]; // 皆從台北連出

  var AUTO = 0.0030;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var rot = 2.0, tilt = -0.38;
  var dragging = false, lastX = 0, lastY = 0, vRot = 0;
  var spinning = !reduce;
  var W = 0, H = 0, R = 0, cx = 0, cy = 0, dpr = 1;

  function resize() {
    var rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width; H = rect.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    R = Math.min(W, H) * 0.46;
    cx = W / 2; cy = H / 2;
  }

  // (lat,lon)度 → 旋轉＋傾斜後座標；z>0 為前半球
  function project(latDeg, lonDeg) {
    var la = latDeg * Math.PI / 180;
    var lo = lonDeg * Math.PI / 180 + rot;
    var cla = Math.cos(la);
    var x = cla * Math.cos(lo), y = Math.sin(la), z = cla * Math.sin(lo);
    var ct = Math.cos(tilt), st = Math.sin(tilt);
    var y2 = y * ct - z * st, z2 = y * st + z * ct;
    return { x: cx + R * x, y: cy - R * y2, z: z2 };
  }
  function toVec(latDeg, lonDeg) {
    var la = latDeg * Math.PI / 180, lo = lonDeg * Math.PI / 180;
    return { x: Math.cos(la) * Math.cos(lo), y: Math.sin(la), z: Math.cos(la) * Math.sin(lo) };
  }
  function projVec(v) {
    var x = v.x * Math.cos(rot) - v.z * Math.sin(rot);
    var z0 = v.x * Math.sin(rot) + v.z * Math.cos(rot);
    var ct = Math.cos(tilt), st = Math.sin(tilt);
    var y2 = v.y * ct - z0 * st, z2 = v.y * st + z0 * ct;
    return { x: cx + R * x, y: cy - R * y2, z: z2 };
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // 球體：暖色徑向漸層製造體積
    var g = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.2, cx, cy, R);
    g.addColorStop(0, 'rgba(122,183,232,0.98)');
    g.addColorStop(0.7, 'rgba(46,116,181,0.95)');
    g.addColorStop(1, 'rgba(23,71,120,0.92)');
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fillStyle = g; ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7);
    ctx.strokeStyle = 'rgba(255,255,255,0.38)'; ctx.lineWidth = 1; ctx.stroke();

    // 經緯網格
    ctx.strokeStyle = 'rgba(255,255,255,0.20)'; ctx.lineWidth = 1;
    for (var la = -60; la <= 60; la += 30) drawRing('lat', la);
    for (var lo = 0; lo < 360; lo += 30) drawRing('lon', lo);

    // 陸地點
    for (var i = 0; i < LAND.length; i += 2) {
      var p = project(LAND[i] / 10, LAND[i + 1] / 10);
      if (p.z <= 0) continue;
      ctx.globalAlpha = 0.45 + p.z * 0.5;
      ctx.beginPath(); ctx.arc(p.x, p.y, 0.9 + p.z * 1.3, 0, 7);
      ctx.fillStyle = '#ffffff'; ctx.fill();
    }
    ctx.globalAlpha = 1;

    // 弧線
    for (var a = 0; a < ARCS.length; a++) drawArc(HUBS[ARCS[a][0]], HUBS[ARCS[a][1]]);

    // 據點
    for (var h = 0; h < HUBS.length; h++) {
      var m = project(HUBS[h][0], HUBS[h][1]);
      if (m.z <= 0) continue;
      var home = HUBS[h][2];
      ctx.beginPath(); ctx.arc(m.x, m.y, home ? 9 : 6.5, 0, 7);
      ctx.fillStyle = home ? 'rgba(255,255,255,0.42)' : 'rgba(255,255,255,0.26)'; ctx.fill();
      ctx.beginPath(); ctx.arc(m.x, m.y, home ? 4 : 3, 0, 7);
      ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.beginPath(); ctx.arc(m.x, m.y, home ? 4 : 3, 0, 7);
      ctx.strokeStyle = 'rgba(23,71,120,0.75)'; ctx.lineWidth = 1; ctx.stroke();
    }
  }

  function drawRing(kind, val) {
    ctx.beginPath(); var started = false, p;
    if (kind === 'lat') {
      for (var lo = 0; lo <= 360; lo += 6) {
        p = project(val, lo);
        if (p.z <= 0) { started = false; continue; }
        started ? ctx.lineTo(p.x, p.y) : (ctx.moveTo(p.x, p.y), started = true);
      }
    } else {
      for (var la = -90; la <= 90; la += 6) {
        p = project(la, val);
        if (p.z <= 0) { started = false; continue; }
        started ? ctx.lineTo(p.x, p.y) : (ctx.moveTo(p.x, p.y), started = true);
      }
    }
    ctx.stroke();
  }

  function drawArc(A, B) {
    var a = toVec(A[0], A[1]), b = toVec(B[0], B[1]);
    var dot = Math.max(-1, Math.min(1, a.x * b.x + a.y * b.y + a.z * b.z));
    var omega = Math.acos(dot);
    if (omega < 1e-4) return;
    var so = Math.sin(omega), steps = 48;
    ctx.beginPath(); var started = false;
    for (var s = 0; s <= steps; s++) {
      var t = s / steps;
      var c1 = Math.sin((1 - t) * omega) / so, c2 = Math.sin(t * omega) / so;
      var p = projVec({ x: a.x * c1 + b.x * c2, y: a.y * c1 + b.y * c2, z: a.z * c1 + b.z * c2 });
      if (p.z <= 0) { started = false; continue; }
      started ? ctx.lineTo(p.x, p.y) : (ctx.moveTo(p.x, p.y), started = true);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.62)'; ctx.lineWidth = 1.2; ctx.stroke();
  }

  function frame() {
    if (spinning && !dragging) rot += AUTO;
    if (!dragging && Math.abs(vRot) > 1e-5) { rot += vRot; vRot *= 0.94; }
    draw();
    requestAnimationFrame(frame);
  }

  canvas.addEventListener('pointerdown', function (e) {
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var dx = e.clientX - lastX, dy = e.clientY - lastY;
    rot += dx * 0.006; vRot = dx * 0.006;
    tilt = Math.max(-1.2, Math.min(1.2, tilt + dy * 0.004));
    lastX = e.clientX; lastY = e.clientY;
  });
  function endDrag() { dragging = false; }
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener('resize', resize);

  resize();
  draw();
  if (!reduce) requestAnimationFrame(frame);
})();
