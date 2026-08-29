const fs = require('fs');
function fixFile(file) {
    let content = fs.readFileSync(file, 'utf-8');
    
    // Fix escaped template literals \${ -> ${
    content = content.replace(/\\\$\{import/g, '${import');
    
    // Fix double-wrapped template literals
    let badString = "${import.meta.env.VITE_API_URL || '${import.meta.env.VITE_API_URL || 'http://localhost:5000'}'}";
    let goodString = "${import.meta.env.VITE_API_URL || 'http://localhost:5000'}";
    while(content.includes(badString)) {
        content = content.replace(badString, goodString);
    }
    
    // Sometimes it might have been replaced into a string literal instead of template literal
    let badString2 = "${import.meta.env.VITE_API_URL || 'http://localhost:5000'}";
    
    fs.writeFileSync(file, content, 'utf-8');
    console.log('Fixed', file);
}

fixFile('./frontend/src/components/PDFUpload.jsx');
fixFile('./frontend/src/components/ProductList.jsx');
fixFile('./frontend/src/pages/Catalog.jsx');
fixFile('./frontend/src/pages/Login.jsx');
fixFile('./frontend/src/pages/Register.jsx');
