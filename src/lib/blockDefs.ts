export type BlockCategory = 'estructura' | 'funciones' | 'control' | 'salida' | 'errores'

export const BLOCK_CATEGORIES: BlockCategory[] = [
  'estructura',
  'funciones',
  'control',
  'salida',
  'errores',
]

export interface BlockDef {
  id: string
  /** familia original (variable, function, condition, loop, print, import, pipe, error) */
  type: string
  category: BlockCategory
  code: string
  color: string
}

export const PYTHON_BLOCKS: BlockDef[] = [
  { id: 'py-var', type: 'variable', category: 'estructura', code: 'x = 10', color: 'bg-blue-500' },
  { id: 'py-import', type: 'import', category: 'estructura', code: 'import modulo', color: 'bg-teal-500' },
  { id: 'py-func', type: 'function', category: 'funciones', code: 'def nombre():\n    pass', color: 'bg-green-500' },
  { id: 'py-return', type: 'function', category: 'funciones', code: 'return valor', color: 'bg-green-600' },
  { id: 'py-if', type: 'condition', category: 'control', code: 'if condicion:\n    pass', color: 'bg-yellow-500' },
  { id: 'py-else', type: 'condition', category: 'control', code: 'else:\n    pass', color: 'bg-yellow-600' },
  { id: 'py-for', type: 'loop', category: 'control', code: 'for item in lista:\n    pass', color: 'bg-purple-500' },
  { id: 'py-while', type: 'loop', category: 'control', code: 'while condicion:\n    pass', color: 'bg-purple-600' },
  { id: 'py-print', type: 'print', category: 'salida', code: 'print()', color: 'bg-red-500' },
  { id: 'py-try', type: 'error', category: 'errores', code: 'try:\n    pass\nexcept Exception as e:\n    pass', color: 'bg-orange-500' },
]

export const BASH_BLOCKS: BlockDef[] = [
  { id: 'sh-var', type: 'variable', category: 'estructura', code: 'NAME="valor"', color: 'bg-blue-500' },
  { id: 'sh-set', type: 'error', category: 'errores', code: 'set -euo pipefail', color: 'bg-orange-500' },
  { id: 'sh-func', type: 'function', category: 'funciones', code: 'nombre() {\n    pass\n}', color: 'bg-green-500' },
  { id: 'sh-if', type: 'condition', category: 'control', code: 'if [[ condicion ]]; then\n    pass\nfi', color: 'bg-yellow-500' },
  { id: 'sh-for', type: 'loop', category: 'control', code: 'for item in lista; do\n    pass\ndone', color: 'bg-purple-500' },
  { id: 'sh-while', type: 'loop', category: 'control', code: 'while read -r line; do\n    pass\ndone', color: 'bg-purple-600' },
  { id: 'sh-echo', type: 'print', category: 'salida', code: 'echo "$NAME"', color: 'bg-red-500' },
  { id: 'sh-pipe', type: 'pipe', category: 'salida', code: 'comando1 | comando2', color: 'bg-teal-500' },
  { id: 'sh-redirect', type: 'pipe', category: 'salida', code: 'comando > archivo.txt', color: 'bg-teal-600' },
  { id: 'sh-trap', type: 'error', category: 'errores', code: 'trap "rm -f $TMP" EXIT', color: 'bg-orange-600' },
]
