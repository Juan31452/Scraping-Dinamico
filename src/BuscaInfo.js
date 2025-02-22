import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import xlsx from 'xlsx';

// Ruta del archivo HTML
const filePath = `file://${path.resolve('C:/Users/acer/Desktop/CopiaUsb/Temu _ Detalles del pedido.html')}`;

// Ruta del archivo Excel
const excelPath = path.resolve('C:/Users/acer/Desktop/CopiaUsb/productos.xlsx');

async function extraerInfoYGuardar() {
    let browser;
    try {
        // Iniciar Puppeteer
        browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto(filePath, { waitUntil: 'domcontentloaded' });

        // Extraer datos sin procesar
        const productos = await page.evaluate(() => {
            const productosArray = [];
            const contenedores = document.querySelectorAll('div._1vWYxse2'); // Seleccionar todos los productos

            contenedores.forEach(contenedor => {
                // 🏷️ Extraer descripción
                const descripcion = contenedor.querySelector('span._2CzqyEwl')?.innerText.trim() || 'Sin descripción';

                // 💰 Extraer el precio
                let precio = contenedor.querySelector('div._3QXWbu8N')?.innerText.trim() || '0';

                // 🔹 **Eliminar símbolos de moneda y comas**
                precio = precio.replace(/[^\d.]/g, ''); // Quita TODO excepto números y puntos

                // 🧮 Convertir el precio a número
                let precioNumerico = parseFloat(precio);
                if (isNaN(precioNumerico)) precioNumerico = 0; // Si no es válido, poner 0

                // 🎨 Extraer color y talla
                const textoColorTalla = contenedor.querySelector('span._2mokkSXY')?.innerText.trim() || 'No especificado';

                // 🔢 Extraer cantidad
                let cantidad = contenedor.querySelector('span._3kmrz08e')?.innerText.trim() || '1';

                // 📏 Convertir cantidad a número
                let cantidadNumerica = parseInt(cantidad.replace(/\D/g, ''), 10); // Quita todo excepto números
                if (isNaN(cantidadNumerica) || cantidadNumerica <= 0) cantidadNumerica = 1; // Si no es válida, poner 1

                // 📌 Agregar el producto al array
                productosArray.push({
                    Descripcion: descripcion,
                    Precio: precioNumerico,
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

function obtenerColorYTalla(texto) {
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

// Exportar la función para usarla en app.js
export default extraerInfoYGuardar;