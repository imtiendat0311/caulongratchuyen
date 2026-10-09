'use client';

import React, { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Color, Triangle } from 'ogl';
import './Iridescence.css';

export interface IridescenceProps {
  color?: [number, number, number] | string;
  speed?: number;
  amplitude?: number;
  mouseReact?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const parseColor = (col: [number, number, number] | string): [number, number, number] => {
  if (Array.isArray(col)) {
    return col;
  }
  let hex = col.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  const res = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!res) return [1, 1, 1];
  return [
    parseInt(res[1], 16) / 255,
    parseInt(res[2], 16) / 255,
    parseInt(res[3], 16) / 255
  ];
};

const vertexShader = `
attribute vec2 uv;
attribute vec2 position;

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`;

const fragmentShader = `
precision highp float;

uniform float uTime;
uniform vec3 uColor;
uniform vec3 uResolution;
uniform vec2 uMouse;
uniform float uAmplitude;
uniform float uSpeed;

varying vec2 vUv;

void main() {
  float mr = min(uResolution.x, uResolution.y);
  vec2 uv = (vUv.xy * 2.0 - 1.0) * uResolution.xy / mr;

  uv += (uMouse - vec2(0.5)) * uAmplitude;

  float d = -uTime * 0.5 * uSpeed;
  float a = 0.0;
  for (float i = 0.0; i < 8.0; ++i) {
    a += cos(i - d - a * uv.x);
    d += sin(uv.y * i + a);
  }
  d += uTime * 0.5 * uSpeed;
  vec3 col = vec3(cos(uv * vec2(d, a)) * 0.6 + 0.4, cos(a + d) * 0.5 + 0.5);
  col = cos(col * cos(vec3(d, a, 2.5)) * 0.5 + 0.5) * uColor;
  gl_FragColor = vec4(col, 1.0);
}
`;

export const Iridescence: React.FC<IridescenceProps> = ({
  color = [1, 1, 1],
  speed = 1.0,
  amplitude = 0.1,
  mouseReact = true,
  className = '',
  style
}) => {
  const ctnDom = useRef<HTMLDivElement>(null);
  const mousePos = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    if (!ctnDom.current) return;
    const ctn = ctnDom.current;

    let renderer: Renderer;
    try {
      renderer = new Renderer({
        alpha: true,
        dpr: Math.min(window.devicePixelRatio || 1, 2)
      });
    } catch {
      // Fallback if WebGL fails
      return;
    }

    const gl = renderer.gl;
    if (!gl) return;

    gl.clearColor(1, 1, 1, 1);

    const rgb = parseColor(color);
    let program: Program;

    function resize() {
      if (!ctn) return;
      const width = Math.max(1, ctn.offsetWidth);
      const height = Math.max(1, ctn.offsetHeight);
      renderer.setSize(width, height);
      if (program) {
        program.uniforms.uResolution.value = new Color(
          gl.canvas.width,
          gl.canvas.height,
          gl.canvas.width / Math.max(1, gl.canvas.height)
        );
      }
    }

    window.addEventListener('resize', resize, false);

    const ro = new ResizeObserver(resize);
    ro.observe(ctn);

    resize();

    const geometry = new Triangle(gl);
    program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new Color(...rgb) },
        uResolution: {
          value: new Color(
            gl.canvas.width,
            gl.canvas.height,
            gl.canvas.width / Math.max(1, gl.canvas.height)
          )
        },
        uMouse: {
          value: new Float32Array([mousePos.current.x, mousePos.current.y])
        },
        uAmplitude: { value: amplitude },
        uSpeed: { value: speed }
      }
    });

    const mesh = new Mesh(gl, { geometry, program });
    let animateId: number;

    function update(t: number) {
      animateId = requestAnimationFrame(update);
      if (program) {
        program.uniforms.uTime.value = t * 0.001;
      }
      renderer.render({ scene: mesh });
    }
    animateId = requestAnimationFrame(update);

    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    ctn.appendChild(canvas);

    function handleMouseMove(e: MouseEvent) {
      if (!ctn) return;
      const rect = ctn.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1.0 - (e.clientY - rect.top) / rect.height;
      mousePos.current = { x, y };
      if (program) {
        program.uniforms.uMouse.value[0] = x;
        program.uniforms.uMouse.value[1] = y;
      }
    }

    if (mouseReact) {
      ctn.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
    }

    return () => {
      cancelAnimationFrame(animateId);
      window.removeEventListener('resize', resize);
      ro.disconnect();
      if (mouseReact) {
        ctn.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mousemove', handleMouseMove);
      }
      try {
        if (ctn.contains(canvas)) {
          ctn.removeChild(canvas);
        }
      } catch {}
      try {
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      } catch {}
    };
  }, [color, speed, amplitude, mouseReact]);

  return (
    <div
      ref={ctnDom}
      style={style}
      className={`iridescence-container ${className}`.trim()}
    />
  );
};

export default Iridescence;
