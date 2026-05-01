# Astra Terra

Astra Terra is a cinematic browser-based Earth app built with Three.js, modern CSS, and a dependency-light static structure. It is designed to feel like a polished mix of Google Earth, a science command center, and an educational visualization.

## Run Locally

This machine does not currently have Node/npm on `PATH`, so the fastest local path is Python:

```bash
python -m http.server 5173
```

Then open:

```text
http://127.0.0.1:5173
```

If Node is installed later, this repo also includes a Vite script:

```bash
npm install
npm run dev
```

## Features

- Interactive Three.js globe with drag, zoom, damping, double-click fly-to, idle autorotation, and a cinematic city tour.
- Fast first render with the main surface map prioritized, then city lights, clouds, specular water response, and normal-map terrain detail streamed in afterward.
- Live or manual day/night lighting with city lights visible on the dark side.
- Satellite, labeled, night, terrain, and clean visual modes.
- Layer toggles for clouds, atmosphere, terrain emphasis, labels, borders, 3D city extrusions, weather streams, aurora, and optional ambient sound.
- Destination shortcuts for New York, Los Angeles, London, Paris, Tokyo, Sydney, Dubai, and Rio de Janeiro.
- Close city focus switches into a navigable local satellite scene using real Esri World Imagery tiles, with drag panning and wheel zoom.
- Responsive command-center UI with search, location card, screenshot capture, and mobile-friendly controls.

## Data And Texture Notes

The app loads compact planetary textures at runtime from the public Three.js examples texture host:

- `land_ocean_ice_cloud_2048.jpg`
- `earth_lights_2048.png`
- `earth_clouds_1024.png`
- `earth_specular_2048.jpg`
- `earth_normal_2048.jpg`

Those texture sets are commonly derived from NASA Visible Earth / Blue Marble imagery and related public Earth-observation data:

- https://visibleearth.nasa.gov/collection/1484/blue-marble
- https://visibleearth.nasa.gov/images/57747/blue-marble-clouds/57750l

If the external texture requests fail, the app falls back to lightweight procedural canvas textures so the scene still renders.

Close city views request public satellite imagery tiles from Esri World Imagery. The passive image-reference card is no longer the primary close-up experience:

- https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer
- https://www.esri.com/en-us/legal/terms/full-master-agreement

## Project Structure

```text
.
|-- index.html
|-- package.json
|-- README.md
`-- src
    |-- main.js
    `-- styles.css
```

## Notes

The borders layer is a stylized educational overlay rather than authoritative political boundary data. The 3D city layer is procedural and appears around selected destination cities as a performant close-range visual cue, while the local close-up uses real satellite imagery as the main navigable view.
