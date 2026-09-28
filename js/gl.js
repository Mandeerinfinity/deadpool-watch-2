/* Deadpool Watch 2 — WebGL shader background: smoky plasma, volumetric god rays, lens-flare ghosts, pulse shockwaves. */
(function () {
  const G = { ok: false, pulse: 0, mode: 0, lx: 0.5, ly: 0.84, tlx: 0.5, tly: 0.84 };
  const cv = document.getElementById("fxGl");
  let gl = null;
  try { gl = cv.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power", preserveDrawingBuffer: false }); } catch (e) { }
  const col = { c1: [0.82, 0.07, 0.11], c2: [1.0, 0.45, 0.12], t1: [0.82, 0.07, 0.11], t2: [1.0, 0.45, 0.12] };
  G.setTheme = function (hex1, hex2) { const h = x => [1, 3, 5].map(i => parseInt(x.slice(i, i + 2), 16) / 255); col.t1 = h(hex1); col.t2 = h(hex2); };
  G.light = function (x, y) { G.tlx = x; G.tly = y; };
  G.boom = function (s = 1) { G.pulse = Math.max(G.pulse, s); };
  G.frame = () => { }; G.setVisible = () => { };
  if (!gl) { cv.style.display = "none"; DP.gl = G; return; }
  const vs = "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}";
  const fs = `precision mediump float;
uniform vec2 R;uniform float T;uniform vec3 C1;uniform vec3 C2;uniform vec2 L;uniform float P;uniform float M;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+1.),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
void main(){
 vec2 p=(gl_FragCoord.xy-.5*R)/R.y;float t=T*.06;
 vec2 q=vec2(fbm(p*1.5+vec2(t,-t)),fbm(p*1.5+vec2(-t,t)+3.1));
 float s=fbm(p*2.1+q*1.9+vec2(0.,-T*.05));
 vec3 c=mix(vec3(.018,.012,.016),C1*.5,smoothstep(.38,.98,s));
 c=mix(c,C2*.32,smoothstep(.62,1.,fbm(p*3.2+q+T*.035))*.7);
 vec2 lp=(L-.5)*vec2(R.x/R.y,1.);vec2 d=p-lp;float r=length(d);float an=atan(d.y,d.x);
 float ry=pow(n(vec2(an*5.,T*.18))*.6+n(vec2(an*12.,-T*.12))*.4,3.);
 c+=C1*ry*exp(-r*1.5)*1.1*(.6+.4*s);
 c+=C1*.55*exp(-r*r*12.)+vec3(1.,.9,.85)*.22*exp(-r*r*110.);
 vec2 fd=-lp;for(int i=1;i<4;i++){float fi=float(i);vec2 gp=lp+fd*fi*.6;float g=exp(-pow(length(p-gp)*(7.+fi*4.),2.));c+=mix(C2,C1,fi/3.)*g*.2;}
 c+=C1*P*smoothstep(.05,0.,abs(r-(1.-P)*1.3))*.9+C1*P*.12;
 if(M>0.){vec3 rb=.5+.5*cos(6.2832*(vec3(0.,.33,.67)+T*.25+p.x*.6+p.y*.3));c=mix(c,(c.r+c.g+c.b+.12)*rb*1.4,M);}
 c*=smoothstep(1.3,.2,length(p*vec2(.9,1.)));
 c+=(h(gl_FragCoord.xy+fract(T))-.5)*.03;
 gl_FragColor=vec4(c,1.);}`;
  function sh(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
  let prog, U = {};
  try {
    prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error("link");
    gl.useProgram(prog);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(prog, "a"); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    ["R", "T", "C1", "C2", "L", "P", "M"].forEach(k => U[k] = gl.getUniformLocation(prog, k));
    G.ok = true;
  } catch (e) { cv.style.display = "none"; DP.gl = G; return; }
  const SCALE = 0.42;
  function resize() { const w = Math.max(64, Math.round(innerWidth * SCALE)), h = Math.max(64, Math.round(innerHeight * SCALE)); cv.width = w; cv.height = h; gl.viewport(0, 0, w, h); }
  resize(); addEventListener("resize", resize);
  cv.addEventListener("webglcontextlost", e => { e.preventDefault(); G.ok = false; cv.style.display = "none"; });
  let lastT = 0;
  G.frame = function (now) {
    if (!G.ok || !DP.settings || DP.settings.shader === false) return;
    if (now - lastT < 14) return; lastT = now; // cap ~70fps; the shader is soft, no need for 120
    const k = 0.05;
    for (let i = 0; i < 3; i++) { col.c1[i] += (col.t1[i] - col.c1[i]) * k; col.c2[i] += (col.t2[i] - col.c2[i]) * k; }
    G.lx += (G.tlx - G.lx) * 0.06; G.ly += (G.tly - G.ly) * 0.06;
    G.pulse *= 0.955;
    gl.uniform2f(U.R, cv.width, cv.height); gl.uniform1f(U.T, now / 1000);
    gl.uniform3fv(U.C1, col.c1); gl.uniform3fv(U.C2, col.c2); gl.uniform2f(U.L, G.lx, G.ly);
    gl.uniform1f(U.P, G.pulse); gl.uniform1f(U.M, G.mode);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  G.setVisible = on => { cv.style.display = on && G.ok ? "block" : "none"; };
  DP.gl = G;
})();
