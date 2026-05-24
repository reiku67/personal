# w/o fluff

Blog estático en modo oscuro. Sin frameworks, sin dependencias, sin build step.

## Ejecutar localmente

```bash
python3 -m http.server 8000
```

Abrí http://localhost:8000/

## Estructura

```
.
├── index.html / index.css / index.js   # Portada (lista de publicaciones)
├── post.html / post.css / post.js      # Una publicación individual
├── archivo.html / archivo.css / archivo.js  # Visor de fuentes (libros, papers)
├── tts.js                              # Narración con Web Speech API
├── posts/                              # Publicaciones (.txt con metadata)
└── archivos/                           # Fuentes adjuntas (.txt)
```

## Agregar una publicación

1. Creá `posts/mi-post.txt`:
   ```
   @title: Mi título
   @date: 2026-05-23
   @topic: opinion
   @image:
   @archivo: archivos/libro.txt
   @archivo_titulo: Nombre del libro
   @archivo_tipo: libro

   Acá empieza el cuerpo del post. Párrafos separados por línea en blanco.

   Otro párrafo.
   ```

2. Recargá la página. Aparece automáticamente.

Campos del header (todos opcionales menos `@title` y `@date`):
- `@title` — título visible
- `@date` — fecha (`YYYY-MM-DD`), usada para ordenar
- `@topic` — categoría para los filtros (`libro`, `opinion`, `idea`, etc.)
- `@image` — URL opcional de una imagen
- `@archivo` — ruta a un `.txt` fuente (libro, paper) que se renderiza en su propia página
- `@archivo_titulo` — título visible del archivo
- `@archivo_tipo` — etiqueta del banner (default `libro`)

## Narración

Cada página tiene un botón 🔊 para escuchar el contenido con Web Speech API del navegador.

- En Chrome/Edge funciona sin setup.
- En Firefox/Linux necesitás `speech-dispatcher` y `espeak-ng` instalados.
