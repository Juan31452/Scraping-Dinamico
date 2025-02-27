import path from 'path';
import fs from 'fs';
import xlsx from 'xlsx';
import { obtenerColorYTalla } from './utilidades.js';

// Ruta del archivo Excel
const excelPath = path.resolve('C:/Users/acer/Desktop/CopiaUsb/productos.xlsx');

async function extraerInfoYGuardar(page,filePath) {
    let browser;
    try {
        await page.goto(filePath, { waitUntil: 'domcontentloaded' });

        // Extraer datos sin procesar
        const productos = await page.evaluate(() => {
            function parsearPrecio(textoPrecio) {
                if (!textoPrecio) return 0;
                let precioLimpio = textoPrecio.replace(/[$€£¥₱₩₹USD]/g, '') // Quita símbolos de moneda
                                              .replace(/\./g, '') // Quita puntos de miles
                                              .replace(/,/g, '') // Quita comas
                                              .trim();
        
                let precioNumerico = parseInt(precioLimpio, 10);
                return isNaN(precioNumerico) ? 0 : precioNumerico;
            }
        
            const productosArray = [];
            const contenedores = document.querySelectorAll('div._1vWYxse2'); // Seleccionar todos los productos
        
            contenedores.forEach(contenedor => {
                const descripcion = contenedor.querySelector('span._2CzqyEwl')?.innerText.trim() || 'Sin descripción';
                let textoPrecio = contenedor.querySelector('div._3QXWbu8N')?.innerText.trim() || '0';
                const precioEntero = parsearPrecio(textoPrecio);
        
                const textoColorTalla = contenedor.querySelector('span._2mokkSXY')?.innerText.trim() || 'No especificado';
                let cantidad = contenedor.querySelector('span._3kmrz08e')?.innerText.trim() || '1';
                let cantidadNumerica = parseInt(cantidad.replace(/\D/g, ''), 10);
                if (isNaN(cantidadNumerica) || cantidadNumerica <= 0) cantidadNumerica = 1;
        
                productosArray.push({
                    Descripcion: descripcion,
                    Precio: precioEntero,
                    ColorTalla: textoColorTalla,
                    Cantidad: cantidadNumerica
                });
            });
        
            return productosArray;
        });
        
        if (productos.length === 0) {
            console.log("❌ No se encontraron productos.");
            return;
        }

        console.log(`✅ Se encontraron ${productos.length} productos.`);

        // Aplicar obtenerColorYTalla() fuera de evaluate()
        productos.forEach(producto => {
            const { color, talla } = obtenerColorYTalla(producto.ColorTalla);
            producto.Color = color;
            producto.Talla = talla;
            delete producto.ColorTalla; // Eliminar campo innecesario
        });

        // Verificar si el archivo Excel ya existe
        let workbook;
        let worksheet;
        const sheetName = "Productos";

        if (fs.existsSync(excelPath)) {
            workbook = xlsx.readFile(excelPath);
            worksheet = workbook.Sheets[sheetName];

            if (!worksheet) {
                worksheet = xlsx.utils.json_to_sheet([]);
                workbook.Sheets[sheetName] = worksheet;
            }
        } else {
            workbook = xlsx.utils.book_new();
            worksheet = xlsx.utils.json_to_sheet([["Descripcion", "Precio", "Color", "Talla", "Cantidad"]]);
            xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);
        }

        // Convertir la hoja actual a JSON y agregar los nuevos productos
        let data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

        // Agregar los nuevos productos (evita duplicar encabezados)
        productos.forEach(producto => {
            data.push([producto.Descripcion, producto.Precio, producto.Color, producto.Talla, producto.Cantidad]);
        });

        // Crear una nueva hoja con los datos actualizados
        const newWorksheet = xlsx.utils.aoa_to_sheet(data);
        workbook.Sheets[sheetName] = newWorksheet;

        // Guardar el archivo Excel
        xlsx.writeFile(workbook, excelPath);

        console.log(`✅ Datos guardados en: ${excelPath}`);
    } catch (error) {
        console.error("❌ Error en el proceso:", error);
    } finally {
        // Cerrar el navegador al finalizar
        if (browser) {
            await browser.close();
        }
    }
}

// Exportar la función para usarla en app.js
export default extraerInfoYGuardar;