const fs = require('fs');
const path = require('path');

// Busca los archivos compilados de Angular
const distPath = path.join(__dirname, '../dist/tienda/browser');

// Lee todos los archivos .js del build
const files = fs.readdirSync(distPath).filter(f => f.endsWith('.js'));

console.log(`Encontrados ${files.length} archivos JS`);

files.forEach(file => {
    const filePath = path.join(distPath, file);
    let content = fs.readFileSync(filePath, 'utf8');

    content = content.replace(/__API_URL__/g, process.env.API_URL || '');
    content = content.replace(/__API_KEY__/g, process.env.API_KEY || '');
    content = content.replace(/__DEMO__/g, process.env.DEMO || '');
    content = content.replace(/__PAYPAL_KEY__/g, process.env.PAYPAL_KEY || '');

    fs.writeFileSync(filePath, content);
    console.log(`Procesado: ${file}`);
});

console.log('Variables inyectadas correctamente');