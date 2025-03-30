import fs from 'fs';
import path from 'path';
import axios from 'axios';

let contadorImagenes = 1; // Variable global para llevar el conteo 

export function generarNombreImagen(numeroAdicional) {
    let contador = 0;
    
    return function() {
        contador++;
      
      return `/assets/Pedido${numeroAdicional}/img${contadorImagenes++}.jpg`;
    };
}

export function crearCodigo(numeroAdicional) {
    let contador = 0;
  
    return function() {
      contador++;
      return `${numeroAdicional}.${contador}`;
    };
}

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
    try {
        return await page.evaluate((selector) => {
            const container = document.querySelector(selector);
            if (!container) return [];

            const urls = Array.from(container.querySelectorAll('img'))
                .map(img => img.src?.trim())
                .filter(src => src) // Filtra nulos o vacíos
                .map(src => src.startsWith('http') ? src : `${window.location.origin}${src}`);

            return Array.from(new Set(urls)); // Elimina duplicados
        }, selector);
    } catch (error) {
        console.error(`❌ Error al extraer imágenes:`, error);
        return []; // Devuelve un array vacío en caso de error
    }
}

// Función para descargar imágenes
let imageCounter = 1; // Contador global para imágenes

export async function downloadImages(imageUrls, folderPath) {
    let errorCount = 0;

    // Crear la carpeta si no existe
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }

    const downloadPromises = imageUrls.map(async (imageUrl) => {
        try {
            // Obtener extensión de la imagen (por defecto .jpg si no tiene)
            const ext = path.extname(new URL(imageUrl).pathname) || '.jpg';
            const imagePath = path.join(folderPath, `img${imageCounter++}${ext}`);

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

            console.log(`✅ Imagen guardada: ${imagePath}`);
        } catch (error) {
            errorCount++;
            console.log(`❌ Error al descargar ${imageUrl}:`, error.message);
        }
    });

    // Esperar que todas las descargas terminen
    await Promise.all(downloadPromises);

    console.log(`✅ Descarga completada con ${errorCount} errores.`);
}
