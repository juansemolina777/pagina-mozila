# ImportX · Tienda de perfumes

- **`tienda/`** — la página pública de ImportX. Es lo único que se publica (Netlify, GitHub Pages, etc.).
  Muestra los perfumes con el precio de Mercado Libre y toma pedidos por WhatsApp.
  Configurá tu número en `tienda/index.html` (constante `WHATSAPP`).
- **`admin/`** — uso interno, **no publicar**. Compara el costo en Star Company con el precio en Mercado Libre.
  Los precios que anotes se exportan con el botón "Exportar precios ML" (reemplazá `admin/data/ml-prices.js` con el archivo descargado).
- **Ocultar perfumes o marcas:** en `admin/index.html` usá "Ocultar" en cada perfume o elegí una marca y tocá "Ocultar marca".
  Después tocá "Exportar ocultos.js" y reemplazá `tienda/ocultos.js` con el archivo descargado. No hace falta regenerar nada.
- **`tools/build_tienda.py`** — regenera `tienda/catalogo.js` a partir de `admin/data/`. El catálogo público no incluye costos ni enlaces al proveedor.

## Actualizar precios

1. Abrí `admin/index.html`, anotá los precios de ML y tocá "Exportar precios ML".
2. Reemplazá `admin/data/ml-prices.js` con el archivo descargado.
3. Ejecutá `python tools/build_tienda.py`.
