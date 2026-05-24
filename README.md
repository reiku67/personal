# w/o fluff

Blog estático en modo oscuro. Sin frameworks, sin dependencias, sin build step.

Dos apartados: **artículos** (lo que escribís) y **biblioteca** (las fuentes que citás).

## Ejecutar localmente

```bash
python3 -m http.server 8000
```

Abrí http://localhost:8000/

## Estructura

```
.
├── index.html / index.css / index.js          # Portada: lista de artículos
├── biblioteca.html / .css / .js               # Lista de fuentes
├── articulo.html / .css / .js                 # Ver un artículo
├── archivo.html / .css / .js                  # Ver una fuente
├── tts.js                                     # Narración Web Speech API
├── articulos/                                 # Tus artículos (.txt con header)
└── archivos/                                  # Fuentes de la biblioteca (.txt con header)
```

## Agregar un artículo

Creá `articulos/mi-articulo.txt`:

```
@title: Mi título
@date: 2026-05-23
@topic: opinion
@image:
@archivo: archivos/libro.txt

Acá empieza el cuerpo. Párrafos separados por línea en blanco.

Otro párrafo.
```

Recargá. Aparece solo.

**Campos del header:**
- `@title` — título visible (default: slug del archivo)
- `@date` — `YYYY-MM-DD`, ordena
- `@topic` — categoría para filtros (`libro`, `opinion`, `idea`, etc.)
- `@image` — URL opcional
- `@archivo` — ruta a una fuente de la biblioteca; aparece como link al final

El título, autor y tipo de la fuente se leen del archivo de la biblioteca — no hay que repetirlos.

## Agregar una fuente a la biblioteca

Creá `archivos/algun-libro.txt` con header:

```
@title: Fenomenología del Espíritu (extractos)
@autor: G.W.F. Hegel
@tipo: libro
@year: 1807

[texto del libro acá]
```

**Campos del header:**
- `@title` — título visible
- `@autor` — autor (aparece en cursiva)
- `@tipo` — `libro`, `paper`, `articulo`, etc. (filtra y etiqueta)
- `@year` — año (ordena por más reciente / antiguo)

## Narración

Botón 🔊 en cada artículo, fuente, y al hover en los listados.

- En Chrome/Edge funciona sin setup.
- En Firefox/Linux: `sudo pacman -S speech-dispatcher espeak-ng`.

## Deploy

Push a `main` dispara el workflow de GitHub Actions, que regenera
`articulos/index.json` y `archivos/index.json` y deploya a Pages.
Tenés que tener Pages configurado con **Source: GitHub Actions** en
Settings → Pages.
