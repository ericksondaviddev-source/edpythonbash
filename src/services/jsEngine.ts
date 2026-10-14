import { injectLoopGuard } from '../lib/jsLoopGuard'

/**
 * Motor de JavaScript para los simuladores y la pestaña Visual.
 *
 * Ejecuta el código del alumno en un <iframe> con sandbox="allow-scripts"
 * (origen opaco, sin acceso al padre) usando srcdoc. El harness dentro del
 * iframe:
 *   - instala un DOM de prueba (header, menú, lista de cursos, form) para
 *     que las lecciones de DOM no truenen con querySelector devolviendo null;
 *   - reemplaza console.* por un puente postMessage hacia el padre;
 *   - instala stubs de fetch / localStorage / alert para que el código
 *     funcione sin red y sin bloquear la página;
 *   - cuenta timers pendientes (setTimeout/setInterval) y espera a que
 *     drenen antes de reportar el resultado;
 *   - aplica el guard de bucles (jsLoopGuard) y un timeout del lado del
 *     padre como red de seguridad.
 */

export interface JsRunResult {
  output: string
  error?: string
}

export interface JsVerifyInput {
  setup_code?: string
  test_code?: string
  asserts_stdout?: string[]
  asserts_return?: { caso: string; esperado: number | string | boolean }[]
  asserts_exception?: { caso: string; esperada: string }[]
  asserts_forbidden?: string[]
}

export type JsVerifyResult = { name: string; passed: boolean; detail?: string }

const DEFAULT_TIMEOUT_MS = 5000

/** DOM de prueba: elementos que las lecciones F0.3 buscan con querySelector. */
const FIXTURE_DOM = `
<header class="header" style="padding:8px;background:#eee">Header del curso</header>
<button class="menu-toggle" style="padding:6px 10px">☰ Menú</button>
<ul class="course-list" style="list-style:none;padding:0">
  <li class="course-item" data-id="1">Python</li>
  <li class="course-item" data-id="2">Bash</li>
  <li class="course-item" data-id="3">JavaScript</li>
</ul>
<form id="signup">
  <input id="email" type="email" value="erickson@example.com">
  <input id="name" type="text" value="Erickson">
  <button type="submit">Enviar</button>
</form>
<button id="btn">Botón</button>
<input id="search" type="text" value="py">
<div id="app"></div>
`.trim()

/**
 * Escapa cierres de <script> para que el código del alumno no rompa el
 * tag del harness.
 */
function escapeForScript(code: string): string {
  return code.replace(/<\/script/gi, '<\\/script')
}

/**
 * Construye el HTML del harness (srcdoc del iframe). Función pura: recibe
 * el código crudo del alumno y devuelve el harness completo con el guard
 * de bucles aplicado.
 */
export function buildHarness(userCode: string, runId: string): string {
  const safeCode = escapeForScript(injectLoopGuard(userCode))
  return `<!doctype html>
<html>
<head><meta charset="utf-8"><title>js-engine</title></head>
<body>
${FIXTURE_DOM}
<script>
(function () {
  var RUN_ID = '${runId}';
  var pending = 0;
  var finished = false;
  var origSetTimeout = window.setTimeout;
  var origSetInterval = window.setInterval;
  var origClearInterval = window.clearInterval;

  function fmt(v) {
    if (typeof v === 'string') return v;
    if (v === undefined) return 'undefined';
    if (v === null) return 'null';
    if (typeof v === 'function') return v.toString();
    if (typeof v === 'object') {
      try { return JSON.stringify(v); } catch (e) { return String(v); }
    }
    return String(v);
  }
  function errText(e) {
    if (!e) return 'Error desconocido';
    if (e.message) return e.message;
    return String(e);
  }
  function send(level, text) {
    try {
      parent.postMessage({ __jsEngine: true, runId: RUN_ID, type: 'console', level: level, text: text }, '*');
    } catch (e) { /* padre removido */ }
  }
  function finish(err) {
    if (finished) return;
    finished = true;
    try {
      parent.postMessage({ __jsEngine: true, runId: RUN_ID, type: 'done', error: err ? errText(err) : undefined }, '*');
    } catch (e) { /* padre removido */ }
  }
  window.__jsFinish = finish;

  console.log = function () { send('log', Array.prototype.map.call(arguments, fmt).join(' ')); };
  console.info = function () { send('info', Array.prototype.map.call(arguments, fmt).join(' ')); };
  console.warn = function () { send('warn', Array.prototype.map.call(arguments, fmt).join(' ')); };
  console.error = function () { send('error', Array.prototype.map.call(arguments, fmt).join(' ')); };
  console.debug = function () { send('debug', Array.prototype.map.call(arguments, fmt).join(' ')); };

  var mem = {};
  var shim = {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; },
    setItem: function (k, v) { mem[k] = String(v); },
    removeItem: function (k) { delete mem[k]; },
    clear: function () { mem = {}; },
    key: function (i) { return Object.keys(mem)[i] || null; }
  };
  try {
    window.localStorage.setItem('__probe', '1');
    window.localStorage.removeItem('__probe');
  } catch (e) {
    try { Object.defineProperty(window, 'localStorage', { value: shim, configurable: true }); } catch (e2) { /* noop */ }
  }

  window.fetch = function (url) {
    var u = String(url);
    var body;
    if (u.indexOf('/api/courses') !== -1) {
      body = [
        { id: 1, name: 'Python', active: true, price: 10 },
        { id: 2, name: 'Bash', active: false, price: 20 },
        { id: 3, name: 'JavaScript', active: true, price: 30 }
      ];
    } else if (u.indexOf('/api/check-email') !== -1) {
      body = { exists: u.indexOf('taken') !== -1 };
    } else {
      body = { ok: true };
    }
    return Promise.resolve({
      ok: true,
      status: 200,
      json: function () { return Promise.resolve(body); },
      text: function () { return Promise.resolve(JSON.stringify(body)); }
    });
  };

  window.alert = function (m) { send('log', '[alert] ' + fmt(m)); };
  window.confirm = function (m) { send('log', '[confirm] ' + fmt(m)); return true; };
  window.prompt = function (m) { send('log', '[prompt] ' + fmt(m)); return ''; };

  window.setTimeout = function (fn, ms) {
    var rest = Array.prototype.slice.call(arguments, 2);
    pending++;
    return origSetTimeout(function () {
      try {
        if (typeof fn === 'function') fn.apply(null, rest);
        else origSetTimeout(fn, 0);
      } catch (e) { finish(e); }
      pending = Math.max(0, pending - 1);
    }, ms);
  };
  window.setInterval = function (fn, ms) {
    var rest = Array.prototype.slice.call(arguments, 2);
    pending++;
    return origSetInterval(function () {
      try { if (typeof fn === 'function') fn.apply(null, rest); } catch (e) { finish(e); }
    }, ms);
  };
  window.clearInterval = function (id) { pending = Math.max(0, pending - 1); origClearInterval(id); };

  window.onerror = function (msg) { finish({ message: msg }); };

  window.__jsWait = function () {
    var t0 = Date.now();
    function check() {
      if (finished) return;
      if (pending === 0) { finish(null); return; }
      if (Date.now() - t0 > 2500) { finish(null); return; }
      origSetTimeout(check, 50);
    }
    origSetTimeout(check, 50);
  };

  window.courses = [
    { id: 1, name: 'Python', active: true, price: 10 },
    { id: 2, name: 'Bash', active: false, price: 20 },
    { id: 3, name: 'JavaScript', active: true, price: 30 }
  ];
  window.fetchUser = function () { return { id: 1, name: 'Erickson', theme: 'light' }; };
})();
</script>
<script>
(function () {
  var __user = async function () {
${safeCode}
  };
  Promise.resolve()
    .then(__user)
    .then(function () { window.__jsWait(); }, function (e) { window.__jsFinish(e); });
})();
</script>
</body>
</html>`
}

type EngineMessage =
  | { __jsEngine: true; runId: string; type: 'console'; level: string; text: string }
  | { __jsEngine: true; runId: string; type: 'done'; error?: string }

function isEngineMessage(data: unknown): data is EngineMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as { __jsEngine?: unknown }).__jsEngine === true &&
    typeof (data as { runId?: unknown }).runId === 'string'
  )
}

class JsEngine {
  /**
   * Ejecuta `code` en un iframe aislado y devuelve la salida de consola
   * acumulada más un error si lo hubo.
   */
  async run(code: string, opts?: { timeoutMs?: number }): Promise<JsRunResult> {
    const timeoutMs = opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS
    const runId = `js-${Date.now()}-${Math.random().toString(36).slice(2)}`

    return new Promise<JsRunResult>((resolve) => {
      const lines: string[] = []
      let settled = false
      let iframe: HTMLIFrameElement | null = null
      let timer: ReturnType<typeof setTimeout> | null = null

      const cleanup = () => {
        window.removeEventListener('message', onMessage)
        if (timer !== null) clearTimeout(timer)
        iframe?.remove()
      }

      const finish = (result: JsRunResult) => {
        if (settled) return
        settled = true
        cleanup()
        resolve(result)
      }

      const onMessage = (event: MessageEvent) => {
        const data = event.data
        if (!isEngineMessage(data) || data.runId !== runId) return
        if (data.type === 'console') {
          lines.push(data.text)
          return
        }
        if (data.type === 'done') {
          finish({ output: lines.join('\n'), error: data.error })
        }
      }

      timer = setTimeout(() => {
        finish({
          output: lines.join('\n'),
          error: 'La ejecución superó el tiempo límite (¿bucle infinito?)',
        })
      }, timeoutMs)

      window.addEventListener('message', onMessage)

      iframe = document.createElement('iframe')
      iframe.setAttribute('sandbox', 'allow-scripts')
      iframe.setAttribute('title', 'js-engine')
      iframe.style.display = 'none'
      iframe.srcdoc = buildHarness(code, runId)
      document.body.appendChild(iframe)
    })
  }

  /**
   * Verifica el código del alumno contra los asserts del simulador.
   * Cada assert se evalúa en un iframe fresco (aislamiento total).
   */
  async verify(simulator: JsVerifyInput, userCode: string): Promise<JsVerifyResult[]> {
    const results: JsVerifyResult[] = []
    const setup = (simulator.setup_code || '') + '\n' + userCode

    const first = await this.run(setup)
    if (first.error) {
      return [{ name: 'El código se ejecuta sin errores', passed: false, detail: first.error }]
    }

    if (simulator.test_code) {
      const out = await this.run(setup + '\n' + simulator.test_code)
      const passed = out.output.includes('PASS') && !out.output.includes('FAIL')
      results.push({
        name: 'Tests del ejercicio (test_code)',
        passed,
        detail: out.output || out.error,
      })
    }

    for (const expected of simulator.asserts_stdout || []) {
      const out = await this.run(setup)
      results.push({ name: `Salida contiene: ${expected}`, passed: out.output.includes(expected) })
    }

    for (const { caso, esperado } of simulator.asserts_return || []) {
      const expectedJson = JSON.stringify(esperado)
      const out = await this.run(setup + '\nconsole.log(JSON.stringify((' + caso + ')));')
      const lastLine = out.output.trim().split('\n').pop() || ''
      results.push({
        name: `${caso} == ${expectedJson}`,
        passed: lastLine === expectedJson && !out.error,
        detail: out.error || (lastLine !== expectedJson ? `obtuvo ${lastLine}` : undefined),
      })
    }

    for (const { caso, esperada } of simulator.asserts_exception || []) {
      const probe =
        setup +
        '\ntry { ' +
        caso +
        '; console.log("FAIL: no lanzo excepcion"); } catch (e) { console.log((e && e.name === "' +
        esperada +
        '") ? "PASS" : ("FAIL: esperaba ' +
        esperada +
        ", obtuvo \" + (e && e.name))); }"
      const out = await this.run(probe)
      const passed = out.output.includes('PASS') && !out.output.includes('FAIL')
      results.push({ name: `${caso} lanza ${esperada}`, passed, detail: out.output || out.error })
    }

    for (const forbidden of simulator.asserts_forbidden || []) {
      results.push({ name: `No usa: ${forbidden}`, passed: !userCode.includes(forbidden) })
    }

    return results
  }
}

let instance: JsEngine | null = null

export function getJsEngine(): JsEngine {
  if (!instance) instance = new JsEngine()
  return instance
}

export { JsEngine }
