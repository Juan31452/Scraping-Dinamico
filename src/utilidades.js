import fs from 'fs';
import path from 'path';
import axios from 'axios';
import xlsx from 'xlsx';

let contadorImagenes = 1; // Variable global para llevar el conteo 

export function generarNombreImagen(numeroAdicional) {
    let contador = 0;
    
    return function () {
        contador++;
        return `/assets/Pedido${numeroAdicional}/img${contador}.jpg`;
    };
}

export function crearCodigo(numeroAdicional) {
    let contador = 0;

    return function () {
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
            color = partes[0];
            talla = partes[1].replace("Tamaño de etiqueta:", "").trim();
        } else {
            color = texto.trim();
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

export function buscarCategoria(descripcion) {
    if (!descripcion) return "Sin categoría";

    const descLower = descripcion.toLowerCase();

    if (descLower.includes("hombre")) return "Hombre";
    if (descLower.includes("mujer")) return "Mujer";
    if (descLower.includes("niño") || descLower.includes("niña")) return "Niño";

    return "Sin categoría";
}

    // Función para guardar en JSON
    export function guardarEnJson(productos, excelPath) {
        const jsonPath = path.join(path.dirname(excelPath), 'products.json');
        let productosPrevios = fs.existsSync(jsonPath) ? JSON.parse(fs.readFileSync(jsonPath, 'utf-8')) : [];

        const productosUnicos = productos.filter(producto => 
            !productosPrevios.some(p => p.descripcion === producto.descripcion && p.precio === producto.precio)
        );

        fs.writeFileSync(jsonPath, JSON.stringify([...productosPrevios, ...productosUnicos], null, 2), 'utf-8');
          console.log(`✅ Archivo JSON guardado en: ${jsonPath}`);
    }
    
    export function guardarEnExcel(productos, excelPath) {
        let workbook, worksheet;
        const sheetName = "Productos";
    
        // Verificar si el archivo Excel ya existe
        if (fs.existsSync(excelPath)) {
            // Leer el archivo existente
            workbook = xlsx.readFile(excelPath);
            worksheet = workbook.Sheets[sheetName] || xlsx.utils.json_to_sheet([]);
        } else {
            // Crear un nuevo libro de trabajo si no existe
            workbook = xlsx.utils.book_new();
            worksheet = xlsx.utils.json_to_sheet([["IdProducto", "Estado", "Descripcion", "Talla", "Color", "Cantidad", "Precio", "Categoria", "Imagen"]]);
            xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);
        }
    
        // Convertir los datos de la hoja existente a un array de objetos
        let data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    
        // Filtrar los productos nuevos para evitar duplicados
        productos.forEach(producto => {
            const existeProducto = data.some(row => row[1] === producto.Descripcion && row[4] === producto.Precio);
            if (!existeProducto) {
                // Agregar los productos nuevos a la hoja
                data.push([
                    producto.IdProducto, producto.Descripcion, producto.Talla, producto.Color,
                    producto.Cantidad, producto.Precio, producto.Categoria, producto.Imagen,producto.Estado
                ]);
            }
        });
    
        // Convertir el array actualizado de nuevo a una hoja
        workbook.Sheets[sheetName] = xlsx.utils.aoa_to_sheet(data);
    
        // Escribir el archivo Excel actualizado
        xlsx.writeFile(workbook, excelPath);
        console.log(`✅ Datos guardados en Excel en: ${excelPath}`);
    }
    
    // Función para guardar en JSON con precios a 0
export function guardarEnJsonModificado(productos, excelPath) {
    const jsonPath = path.join(path.dirname(excelPath), 'products_modified.json');
    let productosPrevios = fs.existsSync(jsonPath) ? JSON.parse(fs.readFileSync(jsonPath, 'utf-8')) : [];

    // Modificar los productos estableciendo precio a 0
    const productosModificados = productos.map(producto => ({
        ...producto,
        Precio: 0  // Establecemos el precio a 0
    }));

    // Filtrar productos únicos (comparando descripción y otros campos excepto precio)
    const productosUnicos = productosModificados.filter(producto => 
        !productosPrevios.some(p => 
            p.Descripcion === producto.Descripcion && 
            p.Color === producto.Color && 
            p.Talla === producto.Talla
        )
    );

    fs.writeFileSync(jsonPath, JSON.stringify([...productosPrevios, ...productosUnicos], null, 2), 'utf-8');
    console.log(`✅ Archivo JSON modificado (precios a 0) guardado en: ${jsonPath}`);
}