# Proceso de conversión: playlist YouTube Music → tabla Markdown

## Flujo implementado (desde 2026-05)

```
URL de la playlist (README.md)
       ↓
scrape-playlist.js  — Playwright (headless Chromium)
       ↓  scroll hasta cargar todos los tracks
Extracción de pares (artista, álbum) desde .secondary-flex-columns
       ↓
Deduplicación por clave artista+álbum  →  ordenación alfabética
       ↓
Consulta MusicBrainz API  (1 req/s, releasegroup + artist)
       ↓
Tabla Markdown  →  2026/YYYY-MM.md
```

## Herramientas

| Herramienta | Rol |
| --- | --- |
| `playwright` (Node.js) | Renderizado dinámico de YouTube Music + scroll automático |
| MusicBrainz WS2 `/release-group` | Año de lanzamiento por artista + álbum |
| `scrape-playlist.js` | Script principal: scraping + deduplicación + year lookup + output MD |

## Ejecutar para un mes nuevo

```bash
# 1. Añadir la nueva URL al array PLAYLISTS en scrape-playlist.js
# 2. Desde el directorio del proyecto (donde está node_modules/):
node scrape-playlist.js
# 3. Copiar la tabla resultante al archivo 2026/YYYY-MM.md
```

## Limitaciones y correcciones manuales aplicadas

- **Año de lanzamiento**: MusicBrainz devuelve `s/a` cuando el query no encuentra coincidencia exacta. Los casos más comunes son compilaciones (p.ej. la serie *Artificial Intelligence* de Warp, 1992) y artistas con nombres poco comunes.
- **Compilaciones multi-artista**: cada artista aparece como fila separada con el mismo álbum. Se corrige manualmente agrupando si es necesario.
- **Entradas sin álbum**: nombres de canales de YouTube sin metadatos de álbum; se eliminan de la tabla final.
- **Typos del scraper**: YouTube Music a veces devuelve nombres con errores (p.ej. `Bibiotheca` → `Bibliotheca`); se corrigen en la revisión final.
- **Aniversarios**: el año se normaliza al lanzamiento original, no a la reedición (p.ej. *Mic City Sons 30th Anniversary* → 1994).

