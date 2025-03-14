import fs from 'fs';
import path from 'path';
import axios from 'axios';

export function obtenerColorYTalla(texto) {
    let color = "Sin color";
    let talla = "Sin talla";

    if (texto) {
        const partes = texto.split("/").map(t => t.trim());

        if (partes.length >= 2) {
            color = partes[0];  // "Rosa roja"
            talla = partes[1].replace("Tamaño de etiqueta:", "").trim();  // Elimina "Tamaño de etiqueta:" y recorta espacios
        } else {
            color = texto.trim(); // Si no hay "/", todo el contenido es el color
        }
    }

    return { color, talla };
}

export async function getImageUrls(page, selector) {
    return await page.evaluate((selector) => {
        const container = document.querySelector(selector); 
        if (!container) return []; 

        return Array.from(container.querySelectorAll('img'))
            .map(img => img.src?.trim())
            .filter(src => src)
            .map(src => src.startsWith('http') ? src : `${window.location.origin}${src}`);
    }, selector);
}

// Función para descargar imágenes
export async function downloadImages(imageUrls, folderPath) {
    let errorCount = 0;

    // Crear la carpeta si no existe
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }

    for (let i = 0; i < imageUrls.length; i++) {
        const imageUrl = imageUrls[i];
        const imagePath = path.join(folderPath, `Img${i + 1}.jpg`);

        try {
            const response = await axios({
                url: imageUrl,
                responseType: 'stream',
            });

            await new Promise((resolve, reject) => {
                const writer = fs.createWriteStream(imagePath);
                response.data.pipe(writer);
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            console.log(`Imagen guardada: ${imagePath}`);
        } catch (error) {
            errorCount++;
            console.log(`Error al descargar la imagen ${imageUrl}:`, error.message);
        }
    }

    if (errorCount > 0) {
        console.log(`✅ Descarga completada con ${errorCount} errores.`);
    } else {
        console.log("✅ Todas las imágenes se descargaron correctamente.");
    }
}

let contadorImagenes = 1; // Variable global para llevar el conteo

export function generarNombreImagen() {
    return `img${contadorImagenes++}`;
}
