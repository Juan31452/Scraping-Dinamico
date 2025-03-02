import path from 'path';
import fs from 'fs';
import xlsx from 'xlsx';
import { obtenerColorYTalla } from './utilidades.js';

const excelPath = path.resolve('C:/Users/acer/Desktop/CopiaUsb/productos.xlsx');

async function extraerInfoYGuardar(page, url) {
    try {
        await page.goto(url, { waitUntil: 'domcontentloaded' });

        const productos = await page.evaluate(() => {
            function parsearPrecio(textoPrecio) {
                if (!textoPrecio) return 0;
                let precioLimpio = textoPrecio.replace(/[$€£¥₱₩₹USD]/g, '').replace(/\./g, '').replace(/,/g, '').trim();
                let precioNumerico = parseInt(precioLimpio, 10);
                return isNaN(precioNumerico) ? 0 : precioNumerico;
            }

            return [...document.querySelectorAll('div._1vWYxse2')].map(contenedor => {
                const descripcion = contenedor.querySelector('span._2CzqyEwl')?.innerText.trim() || 'Sin descripción';
                let textoPrecio = contenedor.querySelector('div._3QXWbu8N')?.innerText.trim() || '0';
                const precioEntero = parsearPrecio(textoPrecio);
                const textoColorTalla = contenedor.querySelector('span._2mokkSXY')?.innerText.trim() || 'No especificado';
                let cantidad = parseInt(contenedor.querySelector('span._3kmrz08e')?.innerText.replace(/\D/g, ''), 10) || 1;

                return { Descripcion: descripcion, Precio: precioEntero, ColorTalla: textoColorTalla, Cantidad: cantidad };
            });
        });

        if (productos.length === 0) {
            console.log("❌ No se encontraron productos.");
            return;
        }
        console.log(`✅ Se encontraron ${productos.length} productos.`);

        productos.forEach(producto => {
            const { color, talla } = obtenerColorYTalla(producto.ColorTalla);
            Object.assign(producto, { Color: color, Talla: talla });
            delete producto.ColorTalla;
        });

        let workbook, worksheet;
        const sheetName = "Productos";

        if (fs.existsSync(excelPath)) {
            workbook = xlsx.readFile(excelPath);
            worksheet = workbook.Sheets[sheetName] || xlsx.utils.json_to_sheet([]);
        } else {
            workbook = xlsx.utils.book_new();
            worksheet = xlsx.utils.json_to_sheet([["Descripcion", "Precio", "Color", "Talla", "Cantidad"]]);
            xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);
        }

        let data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

        productos.forEach(producto => {
            const existeProducto = data.some(row => row[0] === producto.Descripcion && row[1] === producto.Precio);
            if (!existeProducto) {
                data.push([producto.Descripcion, producto.Precio, producto.Color, producto.Talla, producto.Cantidad]);
            }
        });

        workbook.Sheets[sheetName] = xlsx.utils.aoa_to_sheet(data);
        xlsx.writeFile(workbook, excelPath);
        console.log(`✅ Datos guardados en: ${excelPath}`);

        const jsonPath = path.join(path.dirname(excelPath), 'products.json');
        let productosPrevios = fs.existsSync(jsonPath) ? JSON.parse(fs.readFileSync(jsonPath, 'utf-8')) : [];
        fs.writeFileSync(jsonPath, JSON.stringify([...productosPrevios, ...productos], null, 2), 'utf-8');
        console.log(`✅ Archivo JSON guardado en: ${jsonPath}`);

    } catch (error) {
        console.error("❌ Error en el proceso:", error);
    }
}

export default extraerInfoYGuardar;
