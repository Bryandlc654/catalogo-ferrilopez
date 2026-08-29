import fs from 'fs';

const API_VAR = "\\${import.meta.env.VITE_API_URL || 'http://localhost:5000'}";

function fixFile(file) {
    let content = fs.readFileSync(file, 'utf-8');
    
    // For axios calls which are strings: 'http://localhost:5000/products' -> \`\${API_VAR}/products\`
    content = content.replace(/'http:\/\/localhost:5000(.*?)'/g, "\`" + API_VAR + "$1\`");
    
    // For template literals: \`http://localhost:5000\${foo}\` -> \`\${API_VAR}\${foo}\`
    content = content.replace(/http:\/\/localhost:5000/g, API_VAR);
    
    fs.writeFileSync(file, content, 'utf-8');
    console.log("Fixed", file);
}

fixFile('./frontend/src/components/PDFUpload.jsx');
fixFile('./frontend/src/components/ProductList.jsx');
fixFile('./frontend/src/pages/Catalog.jsx');
fixFile('./frontend/src/pages/Login.jsx');
fixFile('./frontend/src/pages/Register.jsx');
