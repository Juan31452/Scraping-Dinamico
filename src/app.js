import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import ExtractorProductos from './BuscaInfo.js';
import { getImageUrls, downloadImages } from './utilidades.js';

class Scraper {
    constructor(filePath, folderPath) {
        this.filePath = `file://${path.resolve(filePath)}`;
        this.folderPath = path.resolve(folderPath);
        this.browser = null;
        this.page = null;
        this.imageUrls = [];
    }

    async init() {
        try {
            this.browser = await puppeteer.launch({ 
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            this.page = await this.browser.newPage();
            await this.page.setViewport({ width: 1280, height: 800 });
            console.log("🌐 Navegador iniciado correctamente");
            return true;
        } catch (error) {
            console.error("❌ Error al iniciar Puppeteer:", error);
            return false;
        }
    }

    async loadPage() {
        try {
            console.log("📄 Cargando la página...");
            
            // Añadir manejo de eventos de desconexión
            this.page.on('close', () => {
                throw new Error('La página se cerró inesperadamente');
            });
            
            // Configurar tiempo de espera más largo y reintentos
            const maxRetries = 3;
            let lastError;
            
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    await this.page.goto(this.filePath, { 
                        waitUntil: 'domcontentloaded',
                        timeout: 60000 // 60 segundos
                    });
                    
                    // Verificar que la página sigue conectada
                    if (!this.page.isClosed()) {
                        console.log("✅ Página cargada correctamente");
                        return true;
                    }
                } catch (error) {
                    lastError = error;
                    console.warn(`⚠️ Intento ${attempt} fallido. Reintentando...`);
                    
                    // Recrear la página si es necesario
                    if (error.message.includes('detached') || this.page.isClosed()) {
                        this.page = await this.browser.newPage();
                    }
                    
                    // Pequeña pausa entre reintentos
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
            
            throw lastError || new Error('No se pudo cargar la página después de varios intentos');
            
        } catch (error) {
            console.error("❌ Error al cargar la página:", error);
            throw error; // Propagar el error para manejo externo
        }
    }

    async scrapeImages(selector) {
        try {
            console.log(`🔍 Buscando imágenes con selector: ${selector}`);
            this.imageUrls = await getImageUrls(this.page, selector);

            if (!this.imageUrls || this.imageUrls.length === 0) {
                console.log("⚠️ No se encontraron imágenes con el selector proporcionado");
                return false;
            }

            console.log(`🖼️ Encontradas ${this.imageUrls.length} imágenes`);
            
            // Crear directorio si no existe
            if (!fs.existsSync(this.folderPath)) {
                fs.mkdirSync(this.folderPath, { recursive: true });
            }

            await downloadImages(this.imageUrls, this.folderPath);
            console.log("✅ Imágenes descargadas correctamente");
            return true;
        } catch (error) {
            console.error("❌ Error al extraer imágenes:", error);
            return false;
        }
    }

    async scrapeData() {
        try {
            console.log("📊 Iniciando extracción de datos...");
            
            const extractor = new ExtractorProductos(
                this.page, 
                this.folderPath,
                this.imageUrls.length // Pasamos el contador de imágenes
            );
            
            // Detectar automáticamente el tipo de página
            if (this.filePath.includes('Detalles del pedido')) {
                await extractor.extraerDesdeDetalles(this.filePath);
            } else {
                await extractor.extraerDesdeCompartido(this.filePath);
            }
            
            console.log("✅ Datos extraídos y guardados correctamente");
            return true;
        } catch (error) {
            console.error("❌ Error en la extracción de datos:", error);
            return false;
        }
    }

    async close() {
        try {
            if (this.browser) {
                await this.browser.close();
                console.log("🛑 Navegador cerrado correctamente");
            }
            return true;
        } catch (error) {
            console.error("❌ Error al cerrar el navegador:", error);
            return false;
        }
    }

    async run(selector) {
        try {
            if (!await this.init()) return;
            if (!await this.loadPage()) return;
            if (!await this.scrapeImages(selector)) return;
            if (!await this.scrapeData()) return;
        } finally {
            await this.close();
        }
    }
}
// ----------------------
// 🔹 **Uso de la Clase**
// ----------------------
//const filePath = 'C:/Users/acer/Desktop/CopiaUsb/Temu _ Detalles del pedido.html';
const filePath = 'C:/Users/acer/Desktop/CopiaUsb/Comparte tu pedido.html'; 
const folderPath = 'C:/Users/acer/Desktop/CopiaUsb/imagenesL'; // Cambia la ruta a la carpeta donde quieras guardar las imágenes
const selector = 'div.tzNi1YuM'; // Selector para imágenes en "Detalles del pedido"
const selector1 = 'div._2Gi6VXJg'; // Selector para imágenes en "Comparte tu pedido"

const scraper = new Scraper(filePath, folderPath);
scraper.run(selector1)
    .catch(error => console.error("🔥 Error en el proceso principal:", error));

scraper.run(selector1);
