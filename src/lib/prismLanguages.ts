import Prism from './prismCore'
import markupSrc from 'prismjs/components/prism-markup?raw'
import cssSrc from 'prismjs/components/prism-css?raw'
import pythonSrc from 'prismjs/components/prism-python?raw'
import bashSrc from 'prismjs/components/prism-bash?raw'

/**
 * Registra las gramáticas de Prism en tiempo de ejecución.
 *
 * Los archivos de prismjs/components son scripts CJS que referencian el
 * identificador global `Prism`. En el build con Rolldown se concatenan en
 * un mismo chunk con el core, en un orden que hace que los componentes se
 * evalúen ANTES de que el global exista ("Prism is not defined"). Para no
 * depender del orden del bundler, importamos su código como texto (?raw)
 * y lo ejecutamos con `Prism` como parámetro, controlando el orden nosotros.
 */
const SOURCES = [markupSrc, cssSrc, pythonSrc, bashSrc]

let loaded = false

export function ensurePrismLanguages(): Promise<typeof Prism> {
  if (!loaded) {
    for (const src of SOURCES) {
      new Function('Prism', src)(Prism)
    }
    loaded = true
  }
  return Promise.resolve(Prism)
}

export default Prism
