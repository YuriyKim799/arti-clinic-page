import React, { useEffect, useRef } from 'react';
import styles from './HeroBg3D.module.scss';

type Vec3 = [number, number, number];

export type HeroBg3DProps = {
  className?: string;
  colors?: [string, string, string?]; // HEX/rgb(a)
  speed?: number;
  glow?: number;
  dprCap?: number;
  reduceMotion?: boolean;
};

const DEFAULT_COLORS: [string, string, string] = [
  '#E8F4FF',
  '#BCD9FF',
  '#DFF5EF',
];

function cssColorToVec3(c: string): Vec3 {
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return [1, 1, 1];
  ctx.fillStyle = c;
  const m = ctx.fillStyle.match(/\d+/g);
  if (!m) return [1, 1, 1];
  const [r, g, b] = m.map((n) => parseInt(n, 10));
  return [r / 255, g / 255, b / 255];
}

export default function HeroBg3D({
  className,
  colors = DEFAULT_COLORS,
  speed = 1.0,
  glow = 0.7,
  dprCap = 1.75,
  reduceMotion,
}: HeroBg3DProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // SSR guard
    if (typeof window === 'undefined') return;

    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    const gl = canvasEl.getContext('webgl', {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: 'low-power',
    }) as WebGLRenderingContext | null;

    if (!gl) {
      // Fallback: пусть работает CSS-фон, канвас можно скрыть
      canvasEl.style.display = 'none';
      return;
    }

    // Локальные non-null ссылки, чтобы TS не ныл в замыканиях
    const _gl = gl;
    const _canvas = canvasEl;

    // Палитра
    const [c1, c2, c3] = [
      cssColorToVec3(colors[0]),
      cssColorToVec3(colors[1]),
      cssColorToVec3(colors[2] || colors[0]),
    ];

    // ---------- ШЕЙДЕРЫ ----------
    const vert = `
      attribute vec2 a_pos;
      varying vec2 vUv;
      void main() {
        vUv = (a_pos + 1.0) * 0.5;
        gl_Position = vec4(a_pos, 0.0, 1.0);
      }
    `;

    const frag = `
      precision mediump float;
      varying vec2 vUv;
      uniform float u_time;
      uniform vec2  u_res;
      uniform vec3  u_c1;
      uniform vec3  u_c2;
      uniform vec3  u_c3;
      uniform float u_speed;
      uniform float u_glow;

      vec3 mod289(vec3 x){return x - floor(x*(1.0/289.0))*289.0;}
      vec2 mod289(vec2 x){return x - floor(x*(1.0/289.0))*289.0;}
      vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);}
      float snoise(vec2 v){
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                            -0.577350269189626, 0.024390243902439);
        vec2 i = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m; m = m*m;
        vec3 x = 2.0*fract(p*0.0243902439) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314*(a0*a0 + h*h);
        vec3 g;
        g.x  = a0.x * x0.x + h.x * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      void main(){
        float asp = u_res.x / max(u_res.y, 1.0);
        vec2 p = (vUv - 0.5) * vec2(asp, 1.0);

        float t  = u_time * u_speed;
        float n1 = snoise(p * 0.6 + vec2( 0.07*t, -0.05*t));
        float n2 = snoise(p * 1.2 + vec2(-0.03*t,  0.04*t));
        float n3 = snoise(p * 2.4 + vec2( 0.02*t,  0.015*t));
        float n  = n1 * 0.6 + n2 * 0.3 + n3 * 0.1;

        vec3 color = mix(u_c1, u_c2, smoothstep(-0.3, 0.6, n));
        color = mix(color, u_c3,  smoothstep( 0.2, 0.85, n));

        float glowMask = smoothstep(0.9, 0.2, length(p * 0.9)) * 0.8
                       + smoothstep(0.95, 0.3, abs(p.x + p.y) * 0.9) * 0.6;
        glowMask = clamp(glowMask, 0.0, 1.0);

        float flicker = 0.5 + 0.5 * sin(0.6*t + n*2.5);
        color += u_glow * glowMask * (0.25 + 0.35 * flicker);
        color = pow(color, vec3(0.95));
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const compile = (type: number, src: string): WebGLShader | null => {
      const s = _gl.createShader(type);
      if (!s) return null;
      _gl.shaderSource(s, src);
      _gl.compileShader(s);
      if (!_gl.getShaderParameter(s, _gl.COMPILE_STATUS)) {
        console.error(_gl.getShaderInfoLog(s) || 'Shader compile error');
        _gl.deleteShader(s);
        return null;
      }
      return s;
    };

    const vs = compile(_gl.VERTEX_SHADER, vert);
    const fs = compile(_gl.FRAGMENT_SHADER, frag);
    if (!vs || !fs) return;

    const prog = _gl.createProgram();
    if (!prog) return;
    _gl.attachShader(prog, vs);
    _gl.attachShader(prog, fs);
    _gl.linkProgram(prog);
    if (!_gl.getProgramParameter(prog, _gl.LINK_STATUS)) {
      console.error(_gl.getProgramInfoLog(prog) || 'Program link error');
      return;
    }
    _gl.useProgram(prog);

    // Буфер полноэкранного квадрата
    const a_pos = _gl.getAttribLocation(prog, 'a_pos');
    const buf = _gl.createBuffer();
    _gl.bindBuffer(_gl.ARRAY_BUFFER, buf);
    const quad = new Float32Array([-1, -1, 1, -1, -1, 1, 1, -1, 1, 1, -1, 1]);
    _gl.bufferData(_gl.ARRAY_BUFFER, quad, _gl.STATIC_DRAW);
    _gl.enableVertexAttribArray(a_pos);
    _gl.vertexAttribPointer(a_pos, 2, _gl.FLOAT, false, 0, 0);

    // Юниформы
    const u_time = _gl.getUniformLocation(prog, 'u_time');
    const u_res = _gl.getUniformLocation(prog, 'u_res');
    const u_c1 = _gl.getUniformLocation(prog, 'u_c1');
    const u_c2 = _gl.getUniformLocation(prog, 'u_c2');
    const u_c3 = _gl.getUniformLocation(prog, 'u_c3');
    const u_speed = _gl.getUniformLocation(prog, 'u_speed');
    const u_glow = _gl.getUniformLocation(prog, 'u_glow');

    // Установка постоянных юниформ
    _gl.uniform3fv(u_c1, new Float32Array(c1));
    _gl.uniform3fv(u_c2, new Float32Array(c2));
    _gl.uniform3fv(u_c3, new Float32Array(c3));
    _gl.uniform1f(u_speed, speed);
    _gl.uniform1f(u_glow, glow);

    // DPI/resize
    const fit = () => {
      const cap = Math.max(1, dprCap || 1.75);
      const dpr = Math.min(window.devicePixelRatio || 1, cap);
      const w = Math.max(1, Math.floor(_canvas.clientWidth * dpr));
      const h = Math.max(1, Math.floor(_canvas.clientHeight * dpr));
      if (_canvas.width !== w || _canvas.height !== h) {
        _canvas.width = w;
        _canvas.height = h;
        _gl.viewport(0, 0, w, h);
        _gl.uniform2f(u_res, w, h);
      }
    };

    // Если в стилях не задано — зададим 100%
    if (!_canvas.style.width) _canvas.style.width = '100%';
    if (!_canvas.style.height) _canvas.style.height = '100%';

    const mediaPref = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const honorReducedMotion =
      reduceMotion ?? (mediaPref ? mediaPref.matches : false);

    let raf = 0;
    const start = performance.now();

    const frame = (now: number) => {
      if (document.hidden) {
        raf = window.requestAnimationFrame(frame);
        return;
      }
      fit();
      const t = honorReducedMotion ? 0 : (now - start) / 1000.0;
      _gl.uniform1f(u_time, t);

      _gl.disable(_gl.DEPTH_TEST);
      _gl.disable(_gl.STENCIL_TEST);
      _gl.disable(_gl.BLEND);
      _gl.drawArrays(_gl.TRIANGLES, 0, 6);

      raf = window.requestAnimationFrame(frame);
    };

    raf = window.requestAnimationFrame(frame);

    const onResize = () => fit();
    window.addEventListener('resize', onResize, { passive: true });
    const onPrefChange = () => {
      /* honorReducedMotion читается на маунте; можно держать как есть */
    };
    mediaPref?.addEventListener?.('change', onPrefChange as EventListener);

    // ---------- cleanup ----------
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      mediaPref?.removeEventListener?.('change', onPrefChange as EventListener);

      // Освобождение ресурсов WebGL
      _gl.bindBuffer(_gl.ARRAY_BUFFER, null);
      if (buf) _gl.deleteBuffer(buf);
      if (vs) _gl.deleteShader(vs);
      if (fs) _gl.deleteShader(fs);
      _gl.useProgram(null);
      _gl.deleteProgram(prog);
    };
  }, [colors, speed, glow, dprCap, reduceMotion]);

  return (
    <canvas
      ref={canvasRef}
      className={`${styles.canvas} ${className || ''}`}
      aria-hidden
    />
  );
}
