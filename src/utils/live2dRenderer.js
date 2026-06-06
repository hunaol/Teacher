/**
 * Live2D Cubism 3 WebGL 渲染器
 * 依赖 live2dcubismcore.min.js
 */
const VERT = `attribute vec2 aPos;attribute vec2 aUV;varying vec2 vUV;uniform mat4 uMat;void main(){gl_Position=uMat*vec4(aPos,0,1);vUV=aUV;}`
const FRAG = `precision mediump float;varying vec2 vUV;uniform sampler2D uTex;uniform vec4 uColor;void main(){gl_FragColor=texture2D(uTex,vUV)*uColor;}`

function mkShader(gl, t, s) { const r = gl.createShader(t); gl.shaderSource(r, s); gl.compileShader(r); return r }
function mkProg(gl, v, f) { const p = gl.createProgram(); gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p); return p }

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

function CSM() { return window.Live2DCubismCore }

export class Live2DRenderer {
  constructor(canvas) {
    this.canvas = canvas; this.gl = null; this.model = null; this.moc = null
    this.textures = []; this.prog = null; this._raf = 0; this._t = 0
  }

  async init(model3Path) {
    const gl = this.canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true })
    if (!gl) throw new Error('WebGL')
    this.gl = gl
    const vs = mkShader(gl, gl.VERTEX_SHADER, VERT)
    const fs = mkShader(gl, gl.FRAGMENT_SHADER, FRAG)
    this.prog = mkProg(gl, vs, fs)

    const base = model3Path.substring(0, model3Path.lastIndexOf('/') + 1)
    const m3 = await (await fetch(model3Path)).json()
    const mocBuf = await (await fetch(base + m3.FileReferences.Moc)).arrayBuffer()
    this.moc = CSM().Moc.fromArrayBuffer(mocBuf)
    if (!this.moc) throw new Error('moc3')
    this.model = CSM().Model.fromMoc(this.moc)
    if (!this.model) throw new Error('model')
    for (const tp of m3.FileReferences.Textures || []) {
      this.textures.push(await loadTex(gl, base + tp))
    }
  }

  _draw() {
    const gl = this.gl; const m = this.model; const c = this.canvas
    const dpr = window.devicePixelRatio || 1
    let w = c.clientWidth * dpr, h = c.clientHeight * dpr
    if (w < 10) w = 1000; if (h < 10) h = 1000
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h }

    /* 投影：CanvasInfo */
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
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

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

      const pb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, pb); gl.bufferData(gl.ARRAY_BUFFER, pos, gl.DYNAMIC_DRAW)
      gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)
      const ub = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, ub); gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.DYNAMIC_DRAW)
      gl.enableVertexAttribArray(aUV); gl.vertexAttribPointer(aUV, 2, gl.FLOAT, false, 0, 0)
      const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.DYNAMIC_DRAW)
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.textures[dd.textureIndices[d]] || this.textures[0] || null)
      gl.uniform1i(uTex, 0)
      gl.uniform4f(uColor, 1, 1, 1, dd.opacities[d])
      gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0)
      gl.deleteBuffer(pb); gl.deleteBuffer(ub); gl.deleteBuffer(ib)
    }
  }

  _tick = (now) => {
    if (!this.model) return
    this._t = now
    this.model.drawables.resetDynamicFlags()
    this.model.update()
    this._draw()
    this._raf = requestAnimationFrame(this._tick)
  }

  start() { this._t = performance.now(); this._raf = requestAnimationFrame(this._tick) }
  stop() { cancelAnimationFrame(this._raf); this._raf = 0 }
  destroy() {
    this.stop()
    if (this.model) { this.model.release(); this.model = null }
    if (this.moc) { this.moc._release(); this.moc = null }
    if (this.gl) { this.textures.forEach(t => this.gl.deleteTexture(t)); if (this.prog) this.gl.deleteProgram(this.prog); this.textures = [] }
  }
}
