import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import extraerInfoYGuardar from './BuscaInfo.js';

// Ruta del archivo HTML
const filePath = `file://${path.resolve('C:/Users/acer/Desktop/CopiaUsb/Temu _ Detalles del pedido.html')}`;

// Ruta de la carpeta donde se guardarán las imágenes
const folderPath = path.resolve('C:/Users/acer/Desktop/CopiaUsb/imagenes');

// Crear la carpeta "imagenes" si no existe
if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
}

(async () => {
    let browser;
    try {
        // Iniciar Puppeteer
        browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        // Cargar la página localmente
        await page.goto(filePath, { waitUntil: 'domcontentloaded' });

        // Extraer las URLs de imágenes dentro del div con clase "tzNi1YuM"
        const imageUrls = await page.evaluate(() => {
            const container = document.querySelector('div.tzNi1YuM'); // Buscar el div
            if (!container) return []; // Si no existe, retornar un array vacío
            const images = container.querySelectorAll('img'); // Buscar todas las imágenes dentro del div
            return Array.from(images).map(img => img.src); // Extraer las URLs de las imágenes
        });

        if (imageUrls.length === 0) {
            console.log('No se encontraron imágenes en el div tzNi1YuM.');
        } else {
            console.log(`Se encontraron ${imageUrls.length} imágenes. Descargando...`);

            // Función para descargar imágenes
            const downloadImages = async () => {
                let errorCount = 0;
                for (let i = 0; i < imageUrls.length; i++) {
                    const imageUrl = imageUrls[i];
                    const imagePath = path.join(folderPath, `imagen_${i + 1}.jpg`);

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
            };

            // Descargar imágenes
            await downloadImages();

            // Ejecutar el scraping de BuscaInfo.js después de descargar las imágenes
            console.log("🔍 Ejecutando scraping...");
            await extraerInfoYGuardar(page); // Pasar la instancia de `page` si es necesario
            console.log("✅ Proceso completado.");
        }
    } catch (error) {
        console.error("❌ Error en el proceso:", error);
    } finally {
        // Cerrar el navegador al finalizar
        if (browser) {
            await browser.close();
        }
    }
})();