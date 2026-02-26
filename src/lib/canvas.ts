type GetContext = HTMLCanvasElement['getContext']

/**
 * Patches HTMLCanvasElement.prototype so getContext('2d') uses willReadFrequently: true
 * when no options are passed. Call once at app bootstrap so all canvases (including
 * Fabric.js internal upper/cache canvases) get the hint and the browser warning is avoided.
 * @see https://html.spec.whatwg.org/multipage/canvas.html#concept-canvas-will-read-frequently
 */
let canvas2DWillReadFrequentlyPatched = false

export function patchCanvas2DWillReadFrequently(): void {
  if (typeof HTMLCanvasElement === 'undefined' || canvas2DWillReadFrequentlyPatched) return
  canvas2DWillReadFrequentlyPatched = true
  const proto = HTMLCanvasElement.prototype
  // Must use unbound method: native getContext requires `this` to be the canvas element.
  // Binding to proto would make .call(canvasEl, ...) still use proto as `this` → Illegal invocation.
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const nativeGetContext = proto.getContext
  function wrapper(
    this: HTMLCanvasElement,
    contextId: '2d' | 'webgl' | 'webgl2' | 'bitmaprenderer',
    options?: unknown
  ): RenderingContext | null {
    if (contextId === '2d' && (options === undefined || options === null)) {
      return nativeGetContext.call(this, '2d', { willReadFrequently: true })
    }
    return nativeGetContext.call(this, contextId, options)
  }
  proto.getContext = wrapper as GetContext
}

/**
 * Ensures a canvas element's 2D context is created with willReadFrequently: true.
 * Prefer calling patchCanvas2DWillReadFrequently() once at bootstrap so Fabric.js
 * internal canvases (e.g. upper canvas) are also covered.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext
 */
export function setCanvas2DWillReadFrequently(canvasEl: HTMLCanvasElement): void {
  const original = canvasEl.getContext.bind(canvasEl)
  const wrapper = ((contextId: '2d' | 'webgl' | 'webgl2' | 'bitmaprenderer', options?: unknown) => {
    if (contextId === '2d' && (options === undefined || options === null)) {
      return original('2d', { willReadFrequently: true })
    }
    return original(contextId, options)
  }) as GetContext
  canvasEl.getContext = wrapper
}
