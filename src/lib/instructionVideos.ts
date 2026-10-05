/** Videos de instrucción de la portada, generados por la propia app. */

export interface InstructionScene {
  code: string
  narration: string
}

export interface InstructionVideo {
  id: string
  title: string
  description: string
  scenes: InstructionScene[]
}

interface RawScene {
  code: string
  es: string
  en: string
}

interface RawVideo {
  id: string
  titleEs: string
  titleEn: string
  descEs: string
  descEn: string
  scenes: RawScene[]
}

const VIDEOS: RawVideo[] = [
  {
    id: 'empezar',
    titleEs: 'Empieza aquí: tu primera lección',
    titleEn: 'Start here: your first lesson',
    descEs: 'Del panel al quiz en 4 pasos: cómo avanzar y ganar XP.',
    descEn: 'From dashboard to quiz in 4 steps: how to progress and earn XP.',
    scenes: [
      {
        code: '# 1. Continúa donde quedaste\nleccion = panel.continuar_aprendiendo()',
        es: 'Desde el panel, pulsa Continuar aprendiendo para abrir tu próxima lección. La app recuerda tu progreso sola.',
        en: 'From the dashboard, press Continue learning to open your next lesson. The app remembers your progress automatically.',
      },
      {
        code: '# 2. Lee el código roto\nprint(nombre',
        es: 'Cada lección trae código roto real. Lee el diagnóstico e intenta encontrar el error antes de ver la solución.',
        en: 'Each lesson ships with real broken code. Read the diagnosis and try to spot the bug before peeking at the fix.',
      },
      {
        code: '# 3. Aprueba el quiz (70 %)\nquiz.aprobar(minimo=70)',
        es: 'Aprueba el quiz con 70 % o más para completar la lección y ganar XP.',
        en: 'Pass the quiz with 70 % or more to complete the lesson and earn XP.',
      },
      {
        code: '# 4. Repite y sube de nivel\nracha += 1  # vuelve mañana',
        es: 'Vuelve cada día para mantener tu racha, subir de nivel y desbloquear módulos.',
        en: 'Come back every day to keep your streak, level up and unlock modules.',
      },
    ],
  },
  {
    id: 'codigo-real',
    titleEs: 'Aprende con código real',
    titleEn: 'Learn with real code',
    descEs: 'Roto, diagnóstico, corregido, optimizado… y simulador para practicar.',
    descEn: 'Broken, diagnosis, fixed, optimized… plus the simulator to practice.',
    scenes: [
      {
        code: '# Código roto: ¿qué falla?\nfor i in range(10)\n    print(i)',
        es: 'Todo empieza con código que no funciona. Léelo con calma: el error es la lección.',
        en: 'Everything starts with code that does not work. Read it carefully: the bug is the lesson.',
      },
      {
        code: '# Diagnóstico\n# Falta ":" al final del for',
        es: 'El diagnóstico te explica la causa raíz con modelo mental, no solo el parche.',
        en: 'The diagnosis explains the root cause with a mental model, not just the patch.',
      },
      {
        code: '# Código corregido y optimizado\nfor i in range(10):\n    print(i)',
        es: 'Compara el código corregido con el optimizado: misma salida, mejor forma.',
        en: 'Compare the fixed code with the optimized one: same output, better shape.',
      },
      {
        code: '# Practica en el simulador\nsimulador.ejecutar(tu_solucion)',
        es: 'En el simulador ejecutas Python y Bash de verdad, con retos que se corrigen solos.',
        en: 'In the simulator you run real Python and Bash, with self-graded challenges.',
      },
    ],
  },
  {
    id: 'tutor-ia',
    titleEs: 'Tu tutor IA con tu propia clave',
    titleEn: 'Your AI tutor with your own key',
    descEs: 'Conecta tu clave gratuita de OpenRouter y pregunta lo que sea.',
    descEn: 'Connect your free OpenRouter key and ask anything.',
    scenes: [
      {
        code: '# 1. Consigue tu clave gratis\n# openrouter.ai/keys  →  sk-or-...',
        es: 'La IA usa tu propia clave de OpenRouter. Es gratis y se guarda solo en tu navegador.',
        en: 'The AI uses your own OpenRouter key. It is free and stored only in your browser.',
      },
      {
        code: '# 2. Guárdala en Configuración\najustes.api_key = "sk-or-..."',
        es: 'Abre Configuración con el engranaje del encabezado y pega tu clave una sola vez.',
        en: 'Open Settings with the header gear icon and paste your key just once.',
      },
      {
        code: '# 3. Pregunta al tutor\ntutor.preguntar("¿por qué falla mi loop?")',
        es: 'Cada lección tiene su tutor IA: te explica el código con paciencia y con voz.',
        en: 'Each lesson has its AI tutor: it explains the code patiently, out loud.',
      },
      {
        code: '# 4. Llévate el video\ntutor.descargar(formato="html")',
        es: 'Descarga la explicación como video o página interactiva para repasar sin internet.',
        en: 'Download the explanation as a video or interactive page to review offline.',
      },
    ],
  },
]

export function getInstructionVideos(lang: 'es' | 'en'): InstructionVideo[] {
  return VIDEOS.map(v => ({
    id: v.id,
    title: lang === 'es' ? v.titleEs : v.titleEn,
    description: lang === 'es' ? v.descEs : v.descEn,
    scenes: v.scenes.map(s => ({
      code: s.code,
      narration: lang === 'es' ? s.es : s.en,
    })),
  }))
}
