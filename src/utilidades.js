function obtenerColorYTalla(texto) {
    // Si el texto contiene "/", separarlo en color y talla
    if (texto.includes('/')) {
        const [color, talla] = texto.split('/').map(t => t.trim());
        return { color, talla };
    }
    // Si no hay "/", devolverlo como color y dejar talla vacía
    return { color: texto.trim(), talla: "" };
}

module.exports = { obtenerColorYTalla };
