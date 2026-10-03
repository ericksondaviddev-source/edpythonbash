# Contributing

## Cómo contribuir

1. Haz un fork del repositorio
2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Haz commit de tus cambios (`git commit -m 'Add amazing feature'`)
4. Haz push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## Estándares de código

- **Componentes**: PascalCase, funcionales con hooks
- **Archivos**: kebab-case para utilidades, PascalCase para componentes
- **Estilos**: Tailwind primero, CSS solo para variables y animaciones
- **TypeScript**: Strict mode, no `any` sin justificación
- **Comentarios**: Solo cuando la lógica no es obvia
- **Idioma del código**: Inglés (variables, funciones)
- **Idioma de UI**: Español primario, inglés secundario

## Tests

```bash
npm run test          # Unit tests
npm run test:e2e      # E2E tests
```

## Estructura de lecciones

Cada lección debe tener:

```json
{
  "id": "MODULO-001",
  "modulo": "Nombre del módulo",
  "competencia": "Competencia que se aprende",
  "nivel": "principiante|intermedio|avanzado",
  "fase": 1,
  "microproyecto": "Proyecto del módulo",
  "modelo_mental": "Explicación conceptual",
  "codigo_roto": "Código con errores",
  "diagnostico": "Explicación de los errores",
  "codigo_corregido": "Código corregido",
  "codigo_optimizado": "Código optimizado",
  "disenso_experto": "Debate o perspectivas",
  "pregunta_transferencia": "Pregunta de reflexión",
  "quiz": { "pregunta": "...", "opciones": [...], "correcta": "A", "explicacion": "..." },
  "simulador": { "tipo": "fix_bug", "engine": "pyodide", ... },
  "audio_script": "Guion para TTS",
  "video_prompt": "Guion para video",
  "trazabilidad": { "libros_fuente": [...], "conceptos_clave": [...] },
  "tags_rag": ["python", "regex", ...]
}
```
