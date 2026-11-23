# Tier B — antes / después

Nitidez = varianza del Laplaciano (1200 px). SSIM contra la imagen actual del sitio (umbral ≥ 0.90). `alpha` = proporción de Real-ESRGAN mezclada con un agrandado Lanczos (se usa la más fuerte que pasa la red de seguridad; 1 = ESRGAN puro).

| Foto | Origen px → salida px | Método | alpha | Nitidez antes → después | Ganancia | SSIM | Estado |
|---|---|---|---|---|---|---|---|
| Poseidonia | 1280x720 → 2560x1440 | realesrgan-x4plus→×2 | 0.75 | 1353 → 1620 | +19.8% | 0.924 | B_OK |
| Riviera Bay | 1280x720 → 2560x1440 | realesrgan-x4plus→×2 | 0.75 | 1767 → 4410 | +149.6% | 0.909 | B_OK |
| City Place | 1280x960 → 2560x1920 | realesrgan-x4plus→×2 | 0.75 | 1265 → 3022 | +139.0% | 0.910 | B_OK |
| Monterezzo | 1280x960 → 2560x1920 | realesrgan-x4plus→×2 | 0.6 | 2401 → 4303 | +79.2% | 0.909 | B_OK |
| Elements Volare | 1280x720 → 2560x1440 | realesrgan-x4plus→×2 | 0.6 | 1842 → 3411 | +85.2% | 0.917 | B_OK |
| Olea | 1280x720 → 2560x1440 | realesrgan-x4plus→×2 | 0.6 | 2425 → 6133 | +152.9% | 0.922 | B_OK |
| servicios/etapa-01 (etapa) | 1169x634 → 2338x1268 | realesrgan-x4plus→×2 | 0.3 | 3129 → 4698 | +50.2% | 0.914 | B_OK |
| servicios/etapa-04 (etapa) | 1217x1350 → 2434x2700 | realesrgan-x4plus→×2 | 0.75 | 690 → 1753 | +154.2% | 0.914 | B_OK |
| servicios/etapa-06 (etapa) | 1800x1800 → 3600x3600 | realesrgan-x4plus→×2 | 1 | 605 → 820 | +35.5% | 0.939 | B_OK |
| servicios/etapa-07 (etapa) | 1280x720 → 2560x1440 | realesrgan-x4plus→×2 | 1 | 1027 → 2500 | +143.4% | 0.904 | B_OK |

Real-ESRGAN ncnn-vulkan (v0.2.5.0, build 20220424, `realesrgan-x4plus` ×4 reducido a ×2) se usó en las 10; **no hubo fallback a Lanczos**. SHA-256 del zip descargado: `abc02804e17982a3be33675e4d471e91ea374e65b70167abc09e31acb412802d` (el release no publica hash; se registra el calculado).
