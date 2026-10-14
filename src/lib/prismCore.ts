import Prism from 'prismjs'

/**
 * Prism core con el global fijado de forma explícita.
 *
 * Los componentes de lenguaje (prismjs/components/prism-python, …) referencian
 * el identificador global `Prism`. En el build de producción, el code-splitting
 * puede hacer que esos componentes se evalúen antes de que el core escriba
 * `_self.Prism`, lo que rompe la página con "Prism is not defined".
 * Fijar el global aquí, y cargar los lenguajes desde prismLanguages.ts
 * (que importa este módulo primero), garantiza el orden correcto.
 */
if (typeof window !== 'undefined') {
  ;(window as unknown as { Prism: typeof Prism }).Prism = Prism
}

export default Prism
