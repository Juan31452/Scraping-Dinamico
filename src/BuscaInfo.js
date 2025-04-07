import path from 'path';
import fs from 'fs';
import { obtenerColorYTalla,generarNombreImagen,crearCodigo,buscarCategoria,guardarEnJson,guardarEnExcel,guardarEnJsonModificado } from './utilidades.js';

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

                return { 
                         Descripcion: descripcion,
                         ColorTalla: textoColorTalla, 
                         Cantidad: cantidad,
                         Precio: precioEntero 
                         
                        };
            });
        });

        if (productos.length === 0) {
            console.log("❌ No se encontraron productos.");
            return;
        }
        console.log(`✅ Se encontraron ${productos.length} productos.`);
        
        const contador = crearCodigo(11); // Creamos un nuevo contador independiente
        const numero = generarNombreImagen(11);

        productos.forEach(producto => {
            const { color, talla } = obtenerColorYTalla(producto.ColorTalla);
            Object.assign(producto, { Color: color, Talla: talla });
            delete producto.ColorTalla;
            // asignar Id al producto
            producto.IdProducto = contador();
            // Asignar nombre secuencial a la imagen
            producto.Imagen = numero();
            producto.Categoria = buscarCategoria(producto.Descripcion) // Asignar categoría según la descripción
            producto.Estado = "Disponible"
        });

        guardarEnExcel(productos, excelPath);
        guardarEnJson(productos, excelPath);
        guardarEnJsonModificado(productos,excelPath)   
    

    } catch (error) {
        console.error("❌ Error en el proceso:", error);
    }
}

export default extraerInfoYGuardar;
