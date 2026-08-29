const fs = require('fs');

function cleanUp(file) {
    let content = fs.readFileSync(file, 'utf-8');
    // Replace the specific malformed string with the correct one
    let badString = "${import.meta.env.VITE_API_URL || '${import.meta.env.VITE_API_URL || 'http://localhost:5000'}'}";
    let goodString = "${import.meta.env.VITE_API_URL || 'http://localhost:5000'}";
    
    // Simple string replace in a loop
    while(content.includes(badString)) {
        content = content.replace(badString, goodString);
    }
    
    fs.writeFileSync(file, content, 'utf-8');
    console.log("Fixed", file);
}

cleanUp('./frontend/src/components/PDFUpload.jsx');
cleanUp('./frontend/src/components/ProductList.jsx');
cleanUp('./frontend/src/pages/Catalog.jsx');
cleanUp('./frontend/src/pages/Login.jsx');
cleanUp('./frontend/src/pages/Register.jsx');
