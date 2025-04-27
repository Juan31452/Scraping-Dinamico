import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
//import extraerInfoYGuardar from './BuscaInfo.js';
import ExtractorProductos from './BuscaInfo.js'
import { getImageUrls, downloadImages } from './utilidades.js';

class Scraper {
    constructor(filePath, folderPath) {
        this.filePath = `file://${path.resolve(filePath)}`;
        this.folderPath = path.resolve(folderPath);
        this.browser = null;
        this.page = null;
    }

    async init() {
        try {
            this.browser = await puppeteer.launch({ headless: true });
            this.page = await this.browser.newPage();
            console.log("🌐 Navegador iniciado.");
        } catch (error) {
            console.error("❌ Error al iniciar Puppeteer:", error);
        }
    }

    async loadPage() {
        try {
            console.log("📄 Cargando la página...");
            await this.page.goto(this.filePath, { waitUntil: 'domcontentloaded' });
        } catch (error) {
            console.error("❌ Error al cargar la página:", error);
        }
    }

    async scrapeImages(selector) {
        try {
            console.log("🔍 Buscando imágenes...");
            const imageUrls = await getImageUrls(this.page, selector);

            if (imageUrls.length === 0) {
                console.log("⚠️ No se encontraron imágenes.");
                return [];
            }

            console.log(`🖼️ Se encontraron ${imageUrls.length} imágenes. Descargando...`);
            await downloadImages(imageUrls, this.folderPath);
            console.log("✅ Imágenes descargadas correctamente.");
            return imageUrls;
        } catch (error) {
            console.aerror("❌ Error al extraer imágenes:", error);
            return [];
        }
    }

    async scrapeData() {
        try {
            console.log("📊 Extrayendo información del HTML...");
            
            const extractor = new ExtractorProductos(this.page, this.folderPath);
            await extractor.extraerDesdeDetalles(`file://${path.resolve(filePath)}`);
            //await extractor.extraerDesdeCompartido(`file://${path.resolve(filePath)}`);
        
            console.log("✅ Información extraída correctamente.");
        } catch (error) {
            console.error("❌ Error al extraer información:", error);
        }
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            console.log("🛑 Navegador cerrado.");
        }
    }

    async run(selector) {
        await this.init();
        await this.loadPage();
        await this.scrapeImages(selector);
        await this.scrapeData();
        await this.close();
    }
}

// ----------------------
// 🔹 **Uso de la Clase**
// ----------------------
const filePath = 'C:/Users/acer/Desktop/CopiaUsb/Temu _ Detalles del pedido.html';
//const filePath = 'C:/Users/acer/Desktop/CopiaUsb/Comparte tu pedido.html'; 
const folderPath = 'C:/Users/acer/Desktop/CopiaUsb/imagenes';
const scraper = new Scraper(filePath, folderPath);

scraper.run('div.UAf3hJs7');
//scraper.run('div._2Gi6VXJg');
