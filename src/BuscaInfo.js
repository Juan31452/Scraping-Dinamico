import path from 'path';
import fs from 'fs';
import { obtenerColorYTalla,generarNombreImagen,crearCodigo,buscarCategoria,guardarEnJson,guardarEnExcel,guardarEnJsonModificado } from './utilidades.js';

const excelPath = path.resolve('C:/Users/acer/Desktop/CopiaUsb/productos.xlsx');


class ExtractorProductos {
    constructor(page, excelPath) {
        this.page = page;
        this.excelPath = excelPath;
        this.contador = crearCodigo(9);
        this.nombreImagen = generarNombreImagen(9);
    }

    parsearPrecio(textoPrecio) {
        if (!textoPrecio) return 0;
        let precioLimpio = textoPrecio.replace(/[$€£¥₱₩₹USD]/g, '').replace(/\./g, '').replace(/,/g, '').trim();
        let precioNumerico = parseInt(precioLimpio, 10);
        return isNaN(precioNumerico) ? 0 : precioNumerico;
    }

    procesarYGuardar(productos) {
        productos.forEach(producto => {
            const { color, talla } = obtenerColorYTalla(producto.ColorTalla ?? '');
            Object.assign(producto, {
                Color: color,
                Talla: talla,
                IdProducto: this.contador(),
                Imagen: this.nombreImagen(),
                Categoria: buscarCategoria(producto.Descripcion),
                Estado: "Disponible"
            });
            delete producto.ColorTalla;
        });
        console.log("Ruta :",this.excelPath );
        const ruta = path.resolve('C:/Users/acer/Desktop/CopiaUsb/productos.xlsx'); 
        guardarEnExcel(productos, ruta);
        guardarEnJson(productos, this.excelPath);
        guardarEnJsonModificado(productos, this.excelPath);
    }

    async extraerDesdeDetalles(url) {
        try {
            await this.page.goto(url, { waitUntil: 'domcontentloaded' });

            const productos = await this.page.evaluate(() => {
                return [...document.querySelectorAll('div._1vWYxse2')].map(contenedor => {
                    const descripcion = contenedor.querySelector('span._2CzqyEwl')?.innerText.trim() || 'Sin descripción';
                    const textoPrecio = contenedor.querySelector('div._3QXWbu8N')?.innerText.trim() || '0';
                    const precioEntero = parseInt(textoPrecio.replace(/\D/g, ''), 10) || 0;
                    const textoColorTalla = contenedor.querySelector('span._2mokkSXY')?.innerText.trim() || 'No especificado';
                    const cantidad = parseInt(contenedor.querySelector('span._3kmrz08e')?.innerText.replace(/\D/g, ''), 10) || 1;

                    return {
                        Descripcion: descripcion,
                        ColorTalla: textoColorTalla,
                        Cantidad: cantidad,
                        Precio: precioEntero
                    };
                });
            });

            if (productos.length === 0) return console.log("❌ No se encontraron productos en Detalles.");

            console.log(`✅ Se encontraron ${productos.length} productos en Detalles.`);
            this.procesarYGuardar(productos);

        } catch (error) {
            console.error("❌ Error extrayendo desde detalles:", error);
        }
    }

    async extraerDesdeCompartido(url) {
        try {
            await this.page.goto(url, { waitUntil: 'domcontentloaded' });

            const productos = await this.page.evaluate(() => {
                return [...document.querySelectorAll('div._26spr4RE')].map(el => {
                    const descripcion = el.querySelector('div._1NCW7dDF')?.innerText.trim() || 'Sin descripción';
                    const especificaciones = el.querySelector('div._2_zF0YRu')?.innerText.trim() || 'No especificado';
                    const textoPrecio = el.querySelector('div._36rm6rjg')?.innerText.trim() || '0';
                    const precio = parseInt(textoPrecio.replace(/\D/g, ''), 10) || 0;

                    return {
                        Descripcion: descripcion,
                        ColorTalla: especificaciones,
                        Cantidad: 1,
                        Precio: precio
                    };
                });
            });

            if (productos.length === 0) return console.log("❌ No se encontraron productos compartidos.");

            console.log(`✅ Se encontraron ${productos.length} productos compartidos.`);
            //console.log(productos);
            this.procesarYGuardar(productos);

        } catch (error) {
            console.error("❌ Error extrayendo desde compartido:", error);
        }
    }
}

export default ExtractorProductos;
