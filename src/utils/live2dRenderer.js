/**
 * live2dRenderer.js — Live2D Cubism 3 WebGL 渲染器
 * ====================================================
 * 直接基于 WebGL 渲染 Live2D Cubism 3 模型。
 * 依赖全局的 live2dcubismcore.min.js（提供 Live2DCubismCore 命名空间）。
 *
 * 核心流程：
 *   1. 创建 WebGL 上下文、编译着色器
 *   2. 加载 model3.json 配置和 .moc3 模型
 *   3. 加载纹理贴图
 *   4. 渲染循环：model.update() + 重新绘制所有 drawable
 *
 * 注意：这是一个轻量自实现版本，未使用官方 Cubism SDK。
 */

// ==================== 着色器源码 ====================

/** 顶点着色器：2D 位置 + UV + 投影矩阵 */
const VERT = `attribute vec2 aPos;attribute vec2 aUV;varying vec2 vUV;uniform mat4 uMat;void main(){gl_Position=uMat*vec4(aPos,0,1);vUV=aUV;}`

/** 片段着色器：采样纹理 + 颜色混合 */
const FRAG = `precision mediump float;varying vec2 vUV;uniform sampler2D uTex;uniform vec4 uColor;void main(){gl_FragColor=texture2D(uTex,vUV)*uColor;}`

// ==================== 着色器辅助函数 ====================

/**
 * 编译单个着色器
 * @param {WebGLRenderingContext} gl - WebGL 上下文
 * @param {GLenum} t - 着色器类型（VERTEX_SHADER / FRAGMENT_SHADER）
 * @param {string} s - 着色器源码
 * @returns {WebGLShader} 编译好的着色器对象
 */
function mkShader(gl, t, s) { const r = gl.createShader(t); gl.shaderSource(r, s); gl.compileShader(r); return r }

/**
 * 创建并链接着色器程序
 * @param {WebGLRenderingContext} gl
 * @param {WebGLShader} v - 顶点着色器
 * @param {WebGLShader} f - 片段着色器
 * @returns {WebGLProgram}
 */
function mkProg(gl, v, f) { const p = gl.createProgram(); gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p); return p }

// ==================== 纹理加载 ====================

/**
 * 异步加载纹理（HTMLImageElement → WebGLTexture）
 * @param {WebGLRenderingContext} gl
 * @param {string} url - 纹理图片 URL
 * @returns {Promise<WebGLTexture>} 纹理对象
 */
function loadTex(gl, url) {
  return new Promise((ok) => {
    const i = new Image(); i.onload = () => {
      const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, i)
      gl.generateMipmap(gl.TEXTURE_2D); gl.bindTexture(gl.TEXTURE_2D, null); ok(t)
    }; i.src = url
  })
}

// ==================== CubismCore 工具 ====================

/** 懒获取 Live2DCubismCore 全局命名空间 */
function CSM() { return window.Live2DCubismCore }

// ==================== Live2D 渲染器主类 ====================

/**
 * Live2D 渲染器
 * 用法：
 *   const renderer = new Live2DRenderer(canvasEl)
 *   await renderer.init('/path/to/model.model3.json')
 *   renderer.start()
 *   // ... 之后 renderer.stop() / destroy()
 */
export class Live2DRenderer {
  /**
   * @param {HTMLCanvasElement} canvas - 渲染目标 canvas
   */
  constructor(canvas) {
    this.canvas = canvas
    this.gl = null
    this.model = null
    this.moc = null
    this.textures = []
    this.prog = null
    this._raf = 0   // requestAnimationFrame 句柄
    this._t = 0     // 上一次 tick 的时间戳
  }

  /**
   * 初始化：创建 WebGL 上下文、加载模型与纹理
   * @param {string} model3Path - model3.json 路径
   */
  async init(model3Path) {
    // 1. 创建 WebGL 上下文（开启 alpha + premultiplied）
    const gl = this.canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true })
    if (!gl) throw new Error('WebGL')
    this.gl = gl
    // 2. 编译并链接 shader
    const vs = mkShader(gl, gl.VERTEX_SHADER, VERT)
    const fs = mkShader(gl, gl.FRAGMENT_SHADER, FRAG)
    this.prog = mkProg(gl, vs, fs)

    // 3. 加载 model3.json 与 .moc3 模型文件
    const base = model3Path.substring(0, model3Path.lastIndexOf('/') + 1)
    const m3 = await (await fetch(model3Path)).json()
    const mocBuf = await (await fetch(base + m3.FileReferences.Moc)).arrayBuffer()
    this.moc = CSM().Moc.fromArrayBuffer(mocBuf)
    if (!this.moc) throw new Error('moc3')
    this.model = CSM().Model.fromMoc(this.moc)
    if (!this.model) throw new Error('model')
    // 4. 加载所有纹理贴图
    for (const tp of m3.FileReferences.Textures || []) {
      this.textures.push(await loadTex(gl, base + tp))
    }
  }

  /**
   * 绘制一帧：清屏、设置投影、依次绘制所有 drawable
   * 注意：drawable 的顺序由 drawOrders 决定（需排序保证正确叠加）
   */
  _draw() {
    const gl = this.gl; const m = this.model; const c = this.canvas
    // 根据 devicePixelRatio 调整画布尺寸，避免模糊
    const dpr = window.devicePixelRatio || 1
    let w = c.clientWidth * dpr, h = c.clientHeight * dpr
    if (w < 10) w = 1000; if (h < 10) h = 1000
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h }

    /* 投影矩阵：将模型空间坐标映射到裁剪空间 */
    const ci = m.canvasinfo
    const ppu = ci.PixelsPerUnit || 1
    const mcw = ci.CanvasWidth || 1000; const mch = ci.CanvasHeight || 1400
    const ox = ci.CanvasOriginX || mcw / 2; const oy = ci.CanvasOriginY || mch / 2
    const sx = (2 / mcw) * ppu; const sy = (2 / mch) * ppu
    const tx = ox * 2 / mcw - 1; const ty = oy * 2 / mch - 1
    const mat = new Float32Array([sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, 1, 0, tx, ty, 0, 1])

    gl.viewport(0, 0, w, h)
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT)
    gl.useProgram(this.prog)
    gl.uniformMatrix4fv(gl.getUniformLocation(this.prog, 'uMat'), false, mat)
    // 开启混合并设置 alpha 预乘
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

    /* 按 drawOrders 升序排列 drawable，决定绘制顺序（后画的覆盖在先画的之上） */
    const dd = m.drawables; const N = dd.count
    const orders = []; for (let i = 0; i < N; i++) orders.push({ i, o: dd.drawOrders[i] })
    orders.sort((a, b) => a.o - b.o)

    for (const { i: d } of orders) {
      if (dd.vertexCounts[d] === 0) continue
      const pos = dd.vertexPositions[d], uvs = dd.vertexUvs[d], idx = dd.indices[d]
      if (!pos || !uvs || !idx) continue

      const aPos = gl.getAttribLocation(this.prog, 'aPos')
      const aUV = gl.getAttribLocation(this.prog, 'aUV')
      const uTex = gl.getUniformLocation(this.prog, 'uTex')
      const uColor = gl.getUniformLocation(this.prog, 'uColor')

      // 逐 drawable 上传 vertex 数据到 GPU
      const pb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, pb); gl.bufferData(gl.ARRAY_BUFFER, pos, gl.DYNAMIC_DRAW)
      gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)
      const ub = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, ub); gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.DYNAMIC_DRAW)
      gl.enableVertexAttribArray(aUV); gl.vertexAttribPointer(aUV, 2, gl.FLOAT, false, 0, 0)
      const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.DYNAMIC_DRAW)
      // 绑定对应纹理
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.textures[dd.textureIndices[d]] || this.textures[0] || null)
      gl.uniform1i(uTex, 0)
      // 通过 uColor 传入当前 drawable 的不透明度
      gl.uniform4f(uColor, 1, 1, 1, dd.opacities[d])
      gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0)
      // 释放临时 buffer
      gl.deleteBuffer(pb); gl.deleteBuffer(ub); gl.deleteBuffer(ib)
    }
  }

  /**
   * 帧循环：每帧更新模型状态并重绘
   * 使用箭头函数保证 this 绑定
   */
  _tick = (now) => {
    if (!this.model) return
    this._t = now
    this.model.drawables.resetDynamicFlags()
    this.model.update()
    this._draw()
    this._raf = requestAnimationFrame(this._tick)
  }

  /** 启动渲染循环 */
  start() { this._t = performance.now(); this._raf = requestAnimationFrame(this._tick) }

  /** 停止渲染循环 */
  stop() { cancelAnimationFrame(this._raf); this._raf = 0 }

  /**
   * 销毁渲染器：停止循环、释放 model/moc、删除纹理与 program
   * 在组件卸载时调用以释放 WebGL 资源
   */
  destroy() {
    this.stop()
    if (this.model) { this.model.release(); this.model = null }
    if (this.moc) { this.moc._release(); this.moc = null }
    if (this.gl) {
      this.textures.forEach(t => this.gl.deleteTexture(t))
      if (this.prog) this.gl.deleteProgram(this.prog)
      this.textures = []
    }
  }
}
