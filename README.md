# Washington, D.C. — Reading the City

A research-led interactive urban atlas through Kevin Lynch’s five elements. Twelve chapters with 33 explicit findings, 15 architectural site studies and all 10 paired-element conclusions. Official D.C. GIS base geometry, analytical SVG overlays, keyboard-accessible examples, five-layer comparison, fullscreen presentation, and separately composed A4 portrait and landscape print editions.

## Run

Serve `dist/` with any static HTTP server. For example: `python3 -m http.server 8000 --directory dist`. No build step or dependencies are required. Open http://localhost:8000.

## Publishing

GitHub Pages deploys `dist/` through `.github/workflows/pages.yml`. Sites uses `.openai/hosting.json` and the same static directory.

## Geographic method

Base geometry is downloaded from D.C. GIS: Roadway Block (Transportation_WebMercator/163) and Planimetrics 2023 building footprints (1) and waterbodies (14). The study extent is −77.079 to −76.995 longitude and 38.876 to 38.923 latitude. Coordinates are projected to a local equirectangular view with longitude scaled for approximately 38.9° N. Geometry was generalised for display; this is not a survey map.

Named avenue overlays use actual roadway segment names. The Mall axis and Rock Creek corridor are schematic. District polygons are approximate interpretive study areas, not official historic-district boundaries. Node and landmark locations are point symbols with approximate coordinates; no measured viewsheds or surveyed footprints are claimed. The historical map is a user-supplied 1792 plan reproduction and is not georectified. The contemporary map covers a selected part of the core, not the full modern city.

## Sources and credits

Full institutional references and image credits appear in chapter 12 and both print editions. Kevin Lynch, *The Image of the City* (MIT Press, 1960), is the analytical framework. The atlas does not assert that L’Enfant designed using Lynch’s later framework. GIS: D.C. Office of the Chief Technology Officer. Photos: National Park Service. Typeface: Montserrat, SIL Open Font License. User reference images establish graphic direction; the first two are not used as geographic evidence.

The final study is a desk-based architectural and urban morphology analysis. Documented observations, analytical interpretations and evidential scope are distinguished; no resident-perception, traffic, building-height or accessibility survey is fabricated. The 37-sheet A4 editions retain every chapter finding, all 15 examples, the 10 relationship conclusions and 25 numbered sources, regardless of selected map state.

Print: use A4 / Export, select an orientation, then Print / Save as PDF. Enable background graphics; disable browser headers and footers. PDF editions are also supplied in `print/`.
