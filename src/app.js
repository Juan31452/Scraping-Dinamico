import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
//import axios from 'axios';
import extraerInfoYGuardar from './BuscaInfo.js';
import { getImageUrls, downloadImages } from './utilidades.js';

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

        const selector = 'div.tzNi1YuM'; // Puedes cambiar el selector según la necesidad
        const imageUrls = await getImageUrls(page,selector);
        
        if (imageUrls.length === 0) {
            console.log('No se encontraron imágenes en el div tzNi1YuM.');
        } else {
            console.log(`Se encontraron ${imageUrls.length} imágenes. Descargando...`);
            // Descargar imágenes
            await downloadImages(imageUrls,folderPath);
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