import { getDocument, OPS } from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'fs';
import path from 'path';
import { createCanvas } from 'canvas';
import dotenv from 'dotenv';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

dotenv.config();

let s3Client = null;
if (process.env.R2_ACCOUNT_ID) {
  s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
}

const generateId = () => Math.random().toString(36).substring(2, 10);

async function extractWithAI(text) {
    if (!process.env.PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY === 'tu_api_key_aqui') {
        console.warn("No PERPLEXITY_API_KEY found, o es inválida.");
        return [];
    }
    
    try {
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'sonar-pro',
                messages: [
                    {
                        role: 'system',
                        content: 'Eres un experto en extracción de datos de catálogos industriales. Extraerás la información estructurada de los textos y devolverás ÚNICAMENTE un array JSON válido sin bloques markdown ni explicaciones.'
                    },
                    {
                        role: 'user',
                        content: `Extrae los productos del siguiente texto (ordenado espacialmente de izquierda a derecha, arriba hacia abajo) de una página de catálogo.
Estructura requerida para un producto normal:
{
  "codigo": "...",
  "nombre": "...",
  "marca": "...",
  "categoria": "...",
  "subcategoria": "...",
  "modelo": "...",
  "descripcion": "...",
  "especificaciones": { "clave": "valor" }
}
Estructura para un producto con variantes (donde hay una tabla de códigos y atributos para un mismo producto base):
{
  "nombre": "...",
  "categoria": "...",
  "descripcion": "...",
  "especificaciones_generales": { "clave": "valor" },
  "variantes": [ { "codigo": "...", "atributo1": "...", "atributo2": "..." } ]
}

Asegúrate de deducir correctamente las variantes si ves una tabla de códigos asociada a un mismo producto.
Devuelve SOLO el array JSON.

Texto de la página:
${text}`
                    }
                ],
                temperature: 0.1
            })
        });

        const data = await response.json();
        
        if (response.status === 429) {
            console.error("RATE LIMIT EXCEEDED! Waiting 30 seconds before retrying...");
            await new Promise(r => setTimeout(r, 30000));
            // Intentar una vez más
            return extractWithAI(text);
        }
        
        if (data.error) {
            console.error("AI API Error:", data.error.message);
            return [];
        }

        if (data.choices && data.choices.length > 0) {
            let content = data.choices[0].message.content.trim();
            if (content.startsWith('```json')) {
                content = content.replace(/^```json/, '').replace(/```$/, '').trim();
            } else if (content.startsWith('```')) {
                content = content.replace(/^```/, '').replace(/```$/, '').trim();
            }
            try {
                return JSON.parse(content);
            } catch (parseError) {
                console.error("AI JSON Parse Error:", parseError.message);
                console.error("Raw AI Output:", content);
                return [];
            }
        }
    } catch (error) {
        console.error("AI Network API Error:", error);
    }
    return [];
}

export async function extractProductsFromPDF(buffer, imagesDir, onProductParsed) {
  const products = [];
  const loadingTask = getDocument({ data: new Uint8Array(buffer) });
  const pdfDocument = await loadingTask.promise;

  const startPage = pdfDocument.numPages > 1 ? 2 : 1;

  for (let pageNum = startPage; pageNum <= pdfDocument.numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    
    // 1. Extraer Texto y ordenar espacialmente
    const textContent = await page.getTextContent();
    const textItems = textContent.items
      .map(item => ({
        text: item.str.trim(),
        x: item.transform[4],
        y: item.transform[5]
      }))
      .filter(t => t.text.length > 0);

    if (textItems.length === 0) continue;

    textItems.sort((a, b) => {
      if (Math.abs(b.y - a.y) > 8) return b.y - a.y; 
      return a.x - b.x;
    });
    
    const pageText = textItems.map(t => t.text).join(' | ');

    // 2. Extraer datos estructurados con Perplexity AI
    const aiProducts = await extractWithAI(pageText);
    
    // Pacing to avoid rate limits
    await new Promise(r => setTimeout(r, 2500));
    
    if (!aiProducts || !Array.isArray(aiProducts) || aiProducts.length === 0) {
        continue;
    }

    // 3. Extraer Imágenes de la página
    const opList = await page.getOperatorList();
    const validImages = [];
    
    for (let i = 0; i < opList.fnArray.length; i++) {
      if (opList.fnArray[i] === OPS.paintImageXObject) {
        const objId = opList.argsArray[i][0];
        try {
          const image = await new Promise((resolve, reject) => {
              try {
                  page.objs.get(objId, (img) => resolve(img));
              } catch (e) {
                  reject(e);
              }
          });
          if (image) {
            const imgWidth = image.width;
            const imgHeight = image.height;
            
            if (imgWidth < 60 || imgHeight < 60) continue; 
            
            const aspectRatio = imgWidth / imgHeight;
            if (aspectRatio > 4 || aspectRatio < 0.25) continue; // Ignorar bordes y barras alargadas
            const canvas = createCanvas(imgWidth, imgHeight);
            const ctx = canvas.getContext('2d');
            
            let imgData;
            try {
               imgData = ctx.createImageData(imgWidth, imgHeight);
               const expectedLength = imgWidth * imgHeight;
               
               if (image.data && image.data.length === expectedLength * 4) {
                 imgData.data.set(image.data);
               } else if (image.data && image.data.length === expectedLength * 3) {
                 const rgbaData = new Uint8ClampedArray(expectedLength * 4);
                 let k = 0;
                 for (let j = 0; j < image.data.length; j += 3) {
                   rgbaData[k++] = image.data[j];     
                   rgbaData[k++] = image.data[j+1];   
                   rgbaData[k++] = image.data[j+2];   
                   rgbaData[k++] = 255;               
                 }
                 imgData.data.set(rgbaData);
               } else if (image.data && image.data.length === expectedLength) {
                 const rgbaData = new Uint8ClampedArray(expectedLength * 4);
                 let k = 0;
                 for (let j = 0; j < image.data.length; j++) {
                   const val = image.data[j];
                   rgbaData[k++] = val;     
                   rgbaData[k++] = val;   
                   rgbaData[k++] = val;   
                   rgbaData[k++] = 255;               
                 }
                 imgData.data.set(rgbaData);
               } else if (image.data) {
                  const len = Math.min(image.data.length, imgData.data.length);
                  for(let j=0; j<len; j++) imgData.data[j] = image.data[j];
               }
               
               let isSolidDark = true;
               let transparentPixels = 0;
               let totalSampled = 0;
               for (let p = 0; p < imgData.data.length; p += 400) {
                  totalSampled++;
                  if (imgData.data[p+3] === 0) transparentPixels++;
                  if (imgData.data[p] > 30 || imgData.data[p+1] > 30 || imgData.data[p+2] > 30 || imgData.data[p+3] === 0) {
                     isSolidDark = false;
                  }
               }
               
               if (isSolidDark || (transparentPixels / totalSampled > 0.95)) continue;

               ctx.putImageData(imgData, 0, 0);
            } catch(err) {
               continue;
            }

            validImages.push({
               buffer: canvas.toBuffer('image/png'),
               area: imgWidth * imgHeight,
               originalOrder: validImages.length
            });
          }
        } catch (error) {
        }
      }
    }

    // 4. Emparejar AI Products con Imágenes
    validImages.sort((a, b) => b.area - a.area);
    const finalImages = validImages.slice(0, Math.max(aiProducts.length, 1));
    finalImages.sort((a, b) => a.originalOrder - b.originalOrder);
    
    for (let i = 0; i < aiProducts.length; i++) {
         const prodData = aiProducts[i];
         let imageUrl = null;
         
         if (i < finalImages.length && finalImages[i]) {
             const imageFilename = `product_${generateId()}.png`;
             
             if (s3Client && process.env.R2_BUCKET_NAME) {
                 try {
                     const uploadParams = {
                         Bucket: process.env.R2_BUCKET_NAME,
                         Key: imageFilename,
                         Body: finalImages[i].buffer,
                         ContentType: 'image/png'
                     };
                     await s3Client.send(new PutObjectCommand(uploadParams));
                     imageUrl = `${process.env.R2_PUBLIC_URL}/${imageFilename}`;
                 } catch (r2Err) {
                     console.error("Error subiendo a R2:", r2Err);
                 }
             } else {
                 // Fallback a almacenamiento local si R2 no est configurado
                 const imagePath = path.join(imagesDir, imageFilename);
                 fs.writeFileSync(imagePath, finalImages[i].buffer);
                 imageUrl = `/static/images/${imageFilename}`;
             }
         }
         
         const newProduct = {
           id: generateId(),
           title: prodData.nombre ? prodData.nombre.substring(0, 150) : 'Producto sin título',
           description: JSON.stringify(prodData),
           price: 0.0,
           imageUrl: imageUrl,
           category: prodData.categoria || 'Catálogo'
         };
         
         products.push(newProduct);
         if (onProductParsed) {
            await onProductParsed(newProduct);
         }
    }
  }

  return products;
}
