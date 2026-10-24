import { useEffect, useRef, useState } from 'react';

const vertexSource = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const fragmentSource = `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
  #else
    precision mediump float;
  #endif

  varying vec2 v_uv;
  uniform vec2 u_resolution;
  uniform float u_time;

  void main() {
    float aspect = u_resolution.x / u_resolution.y;
    vec2 p = v_uv * vec2(aspect, 1.0);
    vec3 beige = vec3(0.961, 0.949, 0.929);
    float field = 0.0;
    vec2 gradient = vec2(0.0);
    float baseRadius = 0.253 * sqrt(min(aspect, 1.0))
      * mix(0.68, 1.0, smoothstep(0.5, 1.2, aspect));

    // Keep the broad, freely drifting liquid shapes of the original animation.
    for (int i = 0; i < 7; i++) {
      float index = float(i);
      vec2 center = vec2(
        ((index + 0.5) / 7.0 + 0.025 * sin(u_time * (0.14 + index * 0.014) + index * 1.7)) * aspect,
        0.50 + 0.42 * sin(u_time * (0.18 + index * 0.015) + index * 1.65)
      );
      float size = 0.78 + 0.38 * (0.5 + 0.5 * sin(index * 2.39 + 0.6));
      float radius = baseRadius * size * (0.94 + 0.06 * sin(u_time * 0.20 + index));
      vec2 delta = p - center;
      float angle = index * 0.71 + 0.28 * sin(u_time * 0.13 + index * 0.9);
      float c = cos(angle);
      float s = sin(angle);
      float stretch = 1.06 + 0.24 * (0.5 + 0.5 * sin(index * 2.3 + u_time * 0.15));
      vec2 scale = vec2(1.0 / stretch, stretch);
      vec2 local = vec2(c * delta.x + s * delta.y, -s * delta.x + c * delta.y) * scale / radius;

      float phase = index * 1.9 + u_time * 0.20;
      float bend = 0.13 + 0.08 * sin(index * 1.4);
      float shiftedX = local.x + bend * (sin(1.4 * local.y + phase) - sin(phase));
      float bendDerivative = bend * 1.4 * cos(1.4 * local.y + phase);
      float taper = 0.12 * sin(index * 1.6 + u_time * 0.10);
      float root = sqrt(1.0 + local.y * local.y);
      float width = 1.0 + taper * local.y / root;
      float widthDerivative = taper / (root * root * root);
      vec2 warped = vec2(shiftedX * width, local.y);

      float weight = exp(-dot(warped, warped));
      // Follow the deformation so lighting stays attached to the liquid surface.
      vec2 localGradient = -2.0 * weight * vec2(
        warped.x * width,
        warped.x * (bendDerivative * width + shiftedX * widthDerivative) + local.y
      ) * scale / radius;
      field += weight;
      gradient += vec2(c * localGradient.x - s * localGradient.y, s * localGradient.x + c * localGradient.y);
    }

    // Clear liquid: show the unchanged background through the body, with only
    // directional reflections and a soft silhouette defining its surface.
    float silhouette = smoothstep(0.538, 0.722, field);
    float dome = sqrt(clamp((field - 0.57) / 0.8, 0.0, 1.0));
    vec3 normal = normalize(vec3(-gradient * baseRadius, dome * 1.4 + 0.10));
    float distanceToEdge = (field - 0.63) / max(length(gradient), 0.001);
    float rim = 1.0 - smoothstep(0.0015, 0.018175, abs(distanceToEdge));
    float lightSide = max(dot(normal.xy, normalize(vec2(-0.7, 0.8))), 0.0);
    float shadeSide = max(dot(normal.xy, normalize(vec2(0.7, -0.8))), 0.0);
    float gloss = pow(max(dot(normal, normalize(vec3(-0.4, 0.6, 1.5))), 0.0), 45.0);
    float reflection = pow(max(dot(normal, normalize(vec3(0.6, -0.8, 0.65))), 0.0), 28.0);
    vec3 color = beige;
    color = mix(color, vec3(0.64, 0.65, 0.64), rim * (0.10 + shadeSide * 0.30));
    color = mix(color, vec3(1.0), rim * lightSide * 0.75);
    color = mix(color, vec3(1.0), silhouette * (gloss * 0.70 + reflection * 0.28));
    gl_FragColor = vec4(color, 1.0);
  }
`;

export default function LavaBackground({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [contextVersion, setContextVersion] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false });
    if (!gl) return;

    const createShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
      gl.deleteShader(shader);
      return null;
    };

    const vertex = createShader(gl.VERTEX_SHADER, vertexSource);
    const fragment = createShader(gl.FRAGMENT_SHADER, fragmentSource);
    const program = gl.createProgram();
    const buffer = gl.createBuffer();
    const dispose = () => {
      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
      if (vertex) gl.deleteShader(vertex);
      if (fragment) gl.deleteShader(fragment);
    };
    if (!vertex || !fragment || !program || !buffer) { dispose(); return; }
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { dispose(); return; }

    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const resolution = gl.getUniformLocation(program, 'u_resolution');
    const time = gl.getUniformLocation(program, 'u_time');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    let lost = false;
    let frame = 0;
    let lastFrame = 0;
    let elapsed = 0;

    const draw = () => {
      if (lost) return;
      gl.uniform2f(resolution, canvas.width, canvas.height);
      gl.uniform1f(time, elapsed);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      canvas.dataset.ready = 'true';
    };
    const tick = (timestamp: number) => {
      if (!lastFrame) lastFrame = timestamp;
      if (timestamp - lastFrame >= 1000 / 30) {
        elapsed += Math.min(timestamp - lastFrame, 100) / 1000;
        lastFrame = timestamp;
        draw();
      }
      frame = requestAnimationFrame(tick);
    };
    const syncAnimation = () => {
      cancelAnimationFrame(frame);
      lastFrame = 0;
      draw();
      if (!lost && visible && !document.hidden && !reducedMotion.matches) frame = requestAnimationFrame(tick);
    };
    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 1.25);
      const width = Math.max(1, bounds.width * ratio);
      const height = Math.max(1, bounds.height * ratio);
      const scale = Math.min(1, Math.sqrt(650_000 / (width * height)), 1536 / Math.max(width, height));
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
      draw();
    };
    const onContextLost = (event: Event) => {
      event.preventDefault();
      lost = true;
      cancelAnimationFrame(frame);
      delete canvas.dataset.ready;
    };
    const onContextRestored = () => setContextVersion(version => version + 1);
    const resizeObserver = new ResizeObserver(resize);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncAnimation();
    });
    canvas.addEventListener('webglcontextlost', onContextLost);
    canvas.addEventListener('webglcontextrestored', onContextRestored);
    reducedMotion.addEventListener('change', syncAnimation);
    document.addEventListener('visibilitychange', syncAnimation);
    resizeObserver.observe(canvas);
    intersectionObserver.observe(canvas);
    resize();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      reducedMotion.removeEventListener('change', syncAnimation);
      document.removeEventListener('visibilitychange', syncAnimation);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      delete canvas.dataset.ready;
      dispose();
    };
  }, [contextVersion]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
