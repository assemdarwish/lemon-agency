/* 3D box truck wrapped with the real artwork (left / right / rear panels cut from the mockups).
   window.mountTruck(container, texBase) → { view(name), zoom(d), destroy() }
   Truck faces -x: cab at negative x, rear doors at +x. Units ≈ metres.
   Plain script (not an ES module) so it also works when index.html is opened straight from disk (file://).
   three.js r128 (UMD build) is pulled from cdnjs the first time; on file:// the textures come from an embedded data-URL copy. */
(function () {
const THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
const loadScript = src => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });

window.mountTruck = async function mountTruck(container, texBase) {
  if (!window.THREE) await loadScript(THREE_URL);
  const THREE = window.THREE;
  let texSrc = n => `${texBase}/${n}.webp`;
  if (location.protocol === 'file:') {            // browsers refuse local files to WebGL → use the embedded copies
    if (!window.TRUCK_TEX) await loadScript(`${texBase}/textures.data.js`);
    texSrc = n => window.TRUCK_TEX[n];
  }
  const W = () => container.clientWidth, H = () => container.clientHeight;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setSize(W(), H());
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, W() / H(), .1, 100);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x3a3030, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 1.7); key.position.set(6, 9, 7); scene.add(key);
  const fill = new THREE.DirectionalLight(0xffe2d6, .6); fill.position.set(-7, 4, -5); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, .5); rim.position.set(0, 5, -9); scene.add(rim);

  const loader = new THREE.TextureLoader();
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const tex = src => new Promise((res, rej) => loader.load(src, t => { t.encoding = THREE.sRGBEncoding; t.anisotropy = maxAniso; res(t); }, undefined, rej));
  const [tLeft, tRight, tRear, tLogo] = await Promise.all(['left', 'right', 'rear', 'cab-logo'].map(n => tex(`${texBase}/${n}.webp`)));

  const mat = (o) => new THREE.MeshStandardMaterial(o);
  const red = mat({ color: 0x7d0c0c, roughness: .5 });
  const alu = mat({ color: 0xc9cdd2, metalness: .85, roughness: .28 });
  const white = mat({ color: 0xf4f4f2, roughness: .32, metalness: .05 });
  const glass = mat({ color: 0x15181c, roughness: .08, metalness: .6 });
  const black = mat({ color: 0x141414, roughness: .8 });
  const rubber = mat({ color: 0x111111, roughness: .95 });
  const rim_ = mat({ color: 0x9aa0a6, metalness: .8, roughness: .35 });
  const panel = t => mat({ map: t, roughness: .42, metalness: .05 });

  const truck = new THREE.Group(); scene.add(truck);
  const add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); truck.add(o); return o; };

  /* ---- cargo box: 4.4 long, 2.2 high, 2.2 wide ---- */
  const L = 4.4, BH = 2.2, BW = 2.2, bx = 1.3, by = 2.15;
  add(new THREE.BoxGeometry(L, BH, BW), [panel(tRear), red, alu, black, panel(tLeft), panel(tRight)], bx, by, 0);
  // aluminium frame on every edge
  const e = .07;
  for (const sy of [-1, 1]) for (const sz of [-1, 1]) add(new THREE.BoxGeometry(L + e, e, e), alu, bx, by + sy * BH / 2, sz * BW / 2);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(new THREE.BoxGeometry(e, BH + e, e), alu, bx + sx * L / 2, by, sz * BW / 2);
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) add(new THREE.BoxGeometry(e, e, BW + e), alu, bx + sx * L / 2, by + sy * BH / 2, 0);

  // red / white reflective tape under the box and on the rear bumper
  const stripe = (() => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 8; const x = c.getContext('2d');
    for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#f4f4f4' : '#d71920'; x.fillRect(i * 32, 0, 32, 8); }
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.wrapS = THREE.RepeatWrapping; t.repeat.set(3, 1); return t;
  })();
  const tape = mat({ map: stripe, roughness: .4 });
  add(new THREE.BoxGeometry(L, .1, BW + .02), [alu, alu, alu, alu, tape, tape], bx, by - BH / 2 - .06, 0);

  /* ---- chassis, rear bumper, lights ---- */
  add(new THREE.BoxGeometry(6.1, .28, 1.0), black, .45, .82, 0);
  const bumper = add(new THREE.BoxGeometry(.12, .16, 2.0), [tape, tape, black, black, black, black], 3.55, .62, 0);
  for (const sz of [-1, 1]) {
    add(new THREE.BoxGeometry(.06, .16, .34), mat({ color: 0xc8161d, emissive: 0x500000, roughness: .3 }), 3.53, .98, sz * .78);
    add(new THREE.BoxGeometry(.06, .16, .12), mat({ color: 0xff9a1a, emissive: 0x402000, roughness: .3 }), 3.53, .98, sz * .98);
    add(new THREE.CylinderGeometry(.32, .32, .5, 24), black, .9, .78, sz * .55).rotation.x = Math.PI / 2; // fuel / air tanks
  }
  bumper.castShadow = true;

  /* ---- cab: extruded side profile, slanted windscreen ---- */
  const prof = new THREE.Shape();
  prof.moveTo(-.95, .62); prof.lineTo(-2.68, .62); prof.lineTo(-2.68, 1.6); prof.lineTo(-2.5, 2.62);
  prof.quadraticCurveTo(-2.45, 2.78, -2.25, 2.78); prof.lineTo(-.95, 2.78); prof.lineTo(-.95, .62);
  const cabGeo = new THREE.ExtrudeGeometry(prof, { depth: 2.1, bevelEnabled: true, bevelSize: .05, bevelThickness: .05, bevelSegments: 3 });
  cabGeo.translate(0, 0, -1.05);
  add(cabGeo, white, 0, 0, 0);

  // windscreen (follows the slanted front)
  const ws = new THREE.BufferGeometry();
  const wv = [-2.735, 1.71, -.9, -2.735, 1.71, .9, -2.585, 2.56, .9, -2.585, 2.56, -.9];
  ws.setAttribute('position', new THREE.Float32BufferAttribute(wv, 3)); ws.setIndex([0, 1, 2, 0, 2, 3]); ws.computeVertexNormals();
  truck.add(new THREE.Mesh(ws, mat({ color: 0x1a1e24, roughness: .05, metalness: .7, side: THREE.DoubleSide })));
  for (const sz of [-1, 1]) {
    // side window + door decal + door line + mirror
    const win = add(new THREE.PlaneGeometry(.95, .72), glass, -1.95, 2.18, sz * 1.106); win.rotation.y = sz < 0 ? Math.PI : 0;
    const logo = add(new THREE.PlaneGeometry(.78, .56), mat({ map: tLogo, roughness: .35 }), -1.55, 1.38, sz * 1.107); logo.rotation.y = sz < 0 ? Math.PI : 0;
    add(new THREE.BoxGeometry(.02, 1.35, .01), mat({ color: 0xc9c9c9, roughness: .5 }), -1.02, 1.7, sz * 1.106);
    add(new THREE.BoxGeometry(.06, .06, .3), black, -2.42, 2.25, sz * 1.22);
    add(new THREE.BoxGeometry(.1, .42, .2), black, -2.45, 2.15, sz * 1.38);
  }
  // front: grille, headlights, bumper
  add(new THREE.BoxGeometry(.04, .5, 1.3), black, -2.72, 1.1, 0);
  add(new THREE.BoxGeometry(.05, .06, .22), mat({ color: 0xd4a33a, metalness: .9, roughness: .25 }), -2.75, 1.14, 0);
  for (const sz of [-1, 1]) add(new THREE.BoxGeometry(.05, .26, .34), mat({ color: 0xdfe7ee, emissive: 0x333333, metalness: .4, roughness: .15 }), -2.71, 1.18, sz * .82);
  add(new THREE.BoxGeometry(.2, .3, 2.2), mat({ color: 0xe9e9e7, roughness: .4 }), -2.78, .62, 0);

  /* ---- wheels ---- */
  const tireGeo = new THREE.CylinderGeometry(.5, .5, .36, 36), hubGeo = new THREE.CylinderGeometry(.3, .3, .38, 24);
  for (const [x, w] of [[-1.85, 1.0], [2.35, 1.0]]) for (const sz of [-1, 1]) {
    add(tireGeo, rubber, x, .5, sz * w).rotation.x = Math.PI / 2;
    add(hubGeo, rim_, x, .5, sz * w).rotation.x = Math.PI / 2;
  }

  /* ---- soft contact shadow ---- */
  const sh = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
    const g = x.createRadialGradient(128, 128, 10, 128, 128, 128); g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, 256, 256); return new THREE.CanvasTexture(c);
  })();
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 3.6), new THREE.MeshBasicMaterial({ map: sh, transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.set(.45, .005, 0); scene.add(shadow);

  /* ---- orbit: drag to rotate, wheel / buttons to zoom, idles into a slow turntable ---- */
  const target = new THREE.Vector3(.4, 1.55, 0);
  let yaw = 2.35, pitch = .22, radius = 12.5, vYaw = 0, goal = null, lastTouch = 0, raf = 0, dead = false;
  const place = () => {
    camera.position.set(target.x + radius * Math.cos(pitch) * Math.cos(yaw), target.y + radius * Math.sin(pitch), target.z + radius * Math.cos(pitch) * Math.sin(yaw));
    camera.lookAt(target);
  };
  let drag = null;
  const el = renderer.domElement;
  el.style.cursor = 'grab'; el.style.touchAction = 'none';
  el.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY }; goal = null; el.setPointerCapture(e.pointerId); el.style.cursor = 'grabbing'; });
  el.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag = { x: e.clientX, y: e.clientY };
    vYaw = dx * .008; yaw += vYaw; pitch = Math.min(1.2, Math.max(.02, pitch + dy * .005)); lastTouch = performance.now();
  });
  const up = () => { drag = null; el.style.cursor = 'grab'; };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  el.addEventListener('wheel', e => { e.preventDefault(); radius = Math.min(18, Math.max(6.5, radius * (1 + Math.sign(e.deltaY) * .08))); lastTouch = performance.now(); }, { passive: false });

  const VIEWS = { front: [Math.PI, .12], left: [Math.PI / 2, .1], rear: [0, .12], right: [-Math.PI / 2, .1], three: [2.35, .22], top: [2.35, 1.05] };
  function view(name) {
    const v = VIEWS[name]; if (!v) return;
    let y = v[0]; while (y - yaw > Math.PI) y -= 2 * Math.PI; while (yaw - y > Math.PI) y += 2 * Math.PI; // shortest turn
    goal = { yaw: y, pitch: v[1] }; lastTouch = performance.now();
  }
  function zoom(d) { radius = Math.min(18, Math.max(6.5, radius * (d > 0 ? 1.15 : .87))); lastTouch = performance.now(); }

  function frame() {
    if (dead) return;
    if (goal) {
      yaw += (goal.yaw - yaw) * .08; pitch += (goal.pitch - pitch) * .08;
      if (Math.abs(goal.yaw - yaw) < .002 && Math.abs(goal.pitch - pitch) < .002) goal = null;
    } else if (!drag) {
      vYaw *= .94; yaw += vYaw;
      if (performance.now() - lastTouch > 4000) yaw += .0025; // turntable when idle
    }
    place();
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  const ro = new ResizeObserver(() => { renderer.setSize(W(), H()); camera.aspect = W() / H(); camera.updateProjectionMatrix(); });
  ro.observe(container);
  frame();

  return {
    view, zoom,
    destroy() { dead = true; cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose(); el.remove(); }
  };
}
})();

