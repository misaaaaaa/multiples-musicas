# Proceso de conversión: playlist CSV → tabla Markdown

## Fuente

Archivo CSV exportado desde YouTube Music: `2026/2026-01.csv`.
El archivo contiene 305 pistas. Solo está poblada la columna **Track name**; las demás columnas (`Playlist`, `Artist`, `Album`, etc.) están vacías.

## Formato del CSV

Cada fila tiene la forma:

```
"Artista Principal · Artista Secundario · Compositor - Título de la pista"
```

El separador entre artistas es el punto medio `·` (U+00B7, distinto del punto ordinario `.`).

### Regla de artista principal

Se toma **únicamente el primer nombre antes del primer `·`** como artista principal. Todo lo que aparece después del `·` se descarta: puede ser un artista invitado (*feat.*), otro intérprete, o el compositor de la obra (práctica habitual de YouTube Music para música clásica).

**Ejemplos:**

| Track name en el CSV | Artista principal | Descartado |
|---|---|---|
| `Four Tet - Parks` | Four Tet | — |
| `Tim Hecker · Colin Stetson - Monotony II` | Tim Hecker | Colin Stetson (feat.) |
| `Marc-André Hamelin · Morton Feldman - Feldman: For Bunita Marcus: Page 6` | Marc-André Hamelin | Morton Feldman (compositor) |
| `Katia Labèque · Marielle Labèque · Philip Glass - Glass: Orphée: Act 1 II La route` | Katia Labèque | Marielle Labèque (dúo), Philip Glass (compositor) |
| `Tallinn Chamber Orchestra · Tõnu Kaljuste · Arvo Pärt - Pärt: Greater Antiphons: I. O Wisdom` | Tallinn Chamber Orchestra | Tõnu Kaljuste (director), Arvo Pärt (compositor) |

## Extracción de artistas únicos

Se lee el CSV completo, se aplica la regla anterior a las 305 pistas y se obtiene la lista de artistas únicos. Un mismo artista puede aparecer con más de un álbum (por ejemplo, Four Tet con cuatro álbumes distintos, o Valentina Lisitsa con dos).

## Investigación de álbumes

Para cada artista se buscó el álbum de origen de las pistas presentes en la playlist, consultando principalmente:

- **Last.fm** — discografías y fechas de lanzamiento
- **MusicBrainz** — identificación de ediciones y números de catálogo
- **Discogs** — verificación de años y etiquetas

### Criterios de atribución

- Se prefirió el **álbum de estudio original** sobre compilaciones o reediciones, salvo que todas las pistas provengan claramente de una reedición (p. ej. los remasters de 2024 de Cocteau Twins).
- Para música clásica, el álbum se determina por el intérprete principal (no el compositor), cruzando las pistas presentes en la playlist con los tracklists publicados en Last.fm/MusicBrainz.
- Cuando el año de lanzamiento no aparece en ninguna fuente consultada, se usa `s/a` (*sin año*).
- Cuando el álbum no pudo identificarse con certeza, se usa `desconocido`.

### Casos especiales

| Situación | Decisión tomada |
|---|---|
| Pistas de un mismo artista en distintos álbumes | Se generan tantas filas como álbumes distintos |
| Mismo intérprete, piezas de compositores diferentes | Se generan filas separadas si los álbumes son distintos |
| Artista de dúo en el que el CSV lista a uno de los dos primero | Se usa el primer artista como artista principal (regla general) |
| Compositor clásico listado como "feat." en YouTube Music | Se descarta; el artista es el intérprete |
| Compilación de guerra civil española con dos artistas principales distintos (Oscar Chávez / Carmina Cannavino) | Dos filas, mismo álbum, mismo año |

## Formato de salida

La tabla resultante se escribe en `2026/2026-01.md` con el siguiente esquema:

```markdown
| Artista | Álbum | Año |
|---|---|---|
| Alice Sara Ott | Nightfall | 2019 |
...
```

- Ordenada alfabéticamente por artista.
- Sin filas duplicadas de artista-álbum.
- Sin cabecera adicional por género ni agrupación.

## Notas sobre entradas con información incompleta

Las siguientes filas quedaron con datos parciales tras la investigación:

| Artista | Motivo |
|---|---|
| Arve Henriksen | Álbum *Haihara* confirmado en Last.fm; año de lanzamiento no documentado |
| Christopher Larkin | Grabación del *Brass Sextet* de Glass compartida con London Gabrieli Brass Ensemble; álbum comercial no identificado |
| Daniel Hope | Grabación de *Echorus* de Glass con Chie Peters y Deutsches Kammerorchester Berlin; álbum no identificado |
| Graham Fitkin | Piezas para piano de 1992 (*Very Early 92*, *Late 92*, *Very Late 92*); álbum no identificado |
| Jean-Yves Thibaudet | Grabación de *The Heart Asks Pleasure First* (Nyman); álbum no identificado |
| Jess Gillam | *Truman Sleeps* de Glass en arreglo de Parkin; año y álbum inferidos como *Arise* (2021, Decca) pero no confirmados con certeza |
| Katia Labèque | Piezas de Satie y Duckworth atribuidas como pista solista; álbum no identificado |
| London Gabrieli Brass Ensemble | Ídem Christopher Larkin |
| Mivos Quartet | Grabación del *Triple Quartet* de Reich; álbum no identificado |
| Orpheus Chamber Orchestra | Grabación de la *Gymnopédie No. 3* de Satie (orq. Debussy); álbum no identificado |
| The Temple Church Choir | Grabación de *The Lamb* de Tavener con Stephen Layton; álbum no identificado |
| Valentina Lisitsa | Los álbumes *Chasing Pianos* y *Plays Philip Glass* existen en Last.fm pero sin fecha de lanzamiento |
| Vox Clamantis | Las 7 *Magnificat-Antiphons* de Pärt se atribuyen a *annum per annum* (2002) por descarte de otros álbumes, sin confirmación de tracklist |
| Yuja Wang | Grabación de los *Études* de Glass; álbum no identificado |

---

## Retrospectiva: qué hubiera sido más rápido

Al comparar el proceso seguido con la URL original de la playlist (`PLYuJsrss8DN8Jauq9DOP6PRsozP1cHBWi`), se comprueba que **la página de YouTube Music ya expone el par `Artista • Álbum` para cada pista**, con enlace directo al álbum. Toda la fase de investigación externa (Last.fm, MusicBrainz, Discogs) fue una consecuencia de haber partido del CSV exportado, que es un formato degradado: solo conserva el nombre de la pista y descarta el resto de los metadatos.

### Problema de origen: el CSV como fuente

YouTube Music exporta un CSV con columnas `Playlist`, `Track name`, `Artist`, `Album`, `Duration`, etc., pero en la práctica **solo rellena `Track name`**. Al usarlo como única fuente se perdió información que la plataforma sí tiene internamente. El CSV es útil para archivar los títulos, no para recuperar metadatos completos.

### Proceso alternativo más rápido

```
URL de la playlist
       ↓
Scraping de la página (Python + requests/Playwright)
       ↓
Extracción de pares (artista, álbum) desde el HTML
       ↓
Deduplicación y ordenación
       ↓
Tabla Markdown
```

La página HTML de YouTube Music contiene bloques con la forma:

```
[Nombre de la pista]  [Artista]  •  [Álbum]  [Duración]
```

Un script sencillo (BeautifulSoup o Playwright para manejar el renderizado dinámico) habría extraído esos pares directamente, sin consultar ninguna fuente externa. El año todavía requeriría una búsqueda adicional (YouTube Music no lo muestra en el listado), pero habría eliminado los ~40 casos en que el álbum quedó como `desconocido`.

### Casos que igualmente habrían requerido investigación manual

- **Año de lanzamiento**: YouTube Music no lo muestra en la vista de playlist; habría que entrar álbum por álbum o consultar una API (MusicBrainz/Last.fm) de forma automatizada.
- **Artistas con múltiples álbumes en la misma playlist** (Four Tet, Katia Labèque, Valentina Lisitsa, Gidon Kremer): el scraping los habría separado automáticamente, sin necesidad de lógica manual.
- **Artistas cuyo álbum no está catalogado en YouTube Music**: seguirían requiriendo búsqueda externa.

### Resumen de mejoras concretas

| Paso del proceso original | Mejora propuesta |
|---|---|
| Leer el CSV fila a fila para extraer artistas | Hacer scraping directo de la URL de la playlist |
| Investigar cada álbum en Last.fm / MusicBrainz / Discogs | Leer el campo `Álbum` ya presente en la página de YouTube Music |
| Identificar manualmente artistas con múltiples álbumes | El scraping lo resuelve automáticamente al leer cada fila |
| Marcar como `desconocido` cuando no se encontraba el álbum | Habría sido la excepción, no la regla |
| Proceso completamente manual (varios días) | Script de ~50 líneas + revisión manual de los casos sin álbum (~10-15 min) |
