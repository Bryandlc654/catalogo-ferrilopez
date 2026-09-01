import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { extractProductsFromPDF } from './pdfParser.js';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-catalogo-magico-2026';

// Enable CORS
app.use(cors());
app.use(express.json());

// Setup storage directory (soporte para discos persistentes en Render)
const DATA_DIR = process.env.DATA_DIR || __dirname;
const STATIC_DIR = path.join(DATA_DIR, 'static');
const IMAGES_DIR = path.join(STATIC_DIR, 'images');

if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Serve static images
app.use('/static', express.static(STATIC_DIR));

// Configure Multer for PDF uploads (in-memory buffer)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Database Setup
let db;
async function setupDatabase() {
  db = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: process.env.MYSQL_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  await db.query(`
    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(255) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      price DECIMAL(10,2),
      imageUrl VARCHAR(255),
      category VARCHAR(255) DEFAULT 'Sin Categoría'
    );
  `);
  
  // Try to add category column if migrating from old schema
  try {
    await db.query(`ALTER TABLE products ADD COLUMN category VARCHAR(255) DEFAULT 'Sin Categoría'`);
  } catch(e) {
    // Ignore if column already exists
  }
  
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS dispatch_tickets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ticket_code VARCHAR(50) UNIQUE NOT NULL,
      client_name VARCHAR(255),
      client_id VARCHAR(50),
      phone VARCHAR(50),
      city VARCHAR(100),
      address TEXT,
      delivery_reference TEXT,
      reference_phone VARCHAR(50),
      payment_method VARCHAR(50),
      products JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

setupDatabase().then(() => {
  console.log("Database initialized");
}).catch(err => {
  console.error("Database initialization failed", err);
});

// --- MIDDLEWARES ---
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ detail: "Acceso denegado. Token no provisto." });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ detail: "Token inválido o expirado." });
    req.user = user;
    next();
  });
}

// --- AUTH ROUTES ---
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ detail: "Usuario y contraseña requeridos" });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.execute('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
    res.status(201).json({ message: "Usuario registrado exitosamente" });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ detail: "El nombre de usuario ya existe" });
    }
    res.status(500).json({ detail: "Error registrando usuario" });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ detail: "Usuario y contraseña requeridos" });

  try {
    const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
    const user = rows[0];
    if (!user) return res.status(400).json({ detail: "Usuario o contraseña incorrectos" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ detail: "Usuario o contraseña incorrectos" });

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, username: user.username });
  } catch (err) {
    res.status(500).json({ detail: "Error en el inicio de sesión" });
  }
});


// --- CATALOG ROUTES ---
app.get('/', (req, res) => {
  res.send('API de Catálogo E-commerce (Express ESM + MySQL) con Auth funcionando.');
});

app.get('/products', async (req, res) => {
  try {
    const [products] = await db.execute('SELECT * FROM products');
    res.json(products);
  } catch (err) {
    res.status(500).json({ detail: "Error obteniendo productos de la base de datos" });
  }
});

const generateId = () => Math.random().toString(36).substring(2, 10);

app.post('/products', authenticateToken, upload.single('image'), async (req, res) => {
  const { title, description, price, category } = req.body;
  const productId = generateId();
  let imageUrl = null;
  
  if (req.file) {
    const imageFilename = `product_${productId}_${Date.now()}.png`;
    if (s3Client && process.env.R2_BUCKET_NAME) {
      try {
        await s3Client.send(new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: imageFilename,
          Body: req.file.buffer,
          ContentType: req.file.mimetype || 'image/png'
        }));
        imageUrl = `${process.env.R2_PUBLIC_URL}/${imageFilename}`;
      } catch (err) {
        console.error("Error subiendo imagen a R2:", err);
      }
    } else {
      const imagePath = path.join(IMAGES_DIR, imageFilename);
      fs.writeFileSync(imagePath, req.file.buffer);
      imageUrl = `/static/images/${imageFilename}`;
    }
  }

  try {
    await db.execute(
      'INSERT INTO products (id, title, description, price, category, imageUrl) VALUES (?, ?, ?, ?, ?, ?)',
      [productId, title, description || '', price || 0, category || 'Sin Categoría', imageUrl]
    );
    res.status(201).json({ message: "Producto creado", id: productId, imageUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: "Error creando el producto" });
  }
});

app.put('/products/:id', authenticateToken, upload.single('image'), async (req, res) => {
  const { title, description, price, category } = req.body;
  const productId = req.params.id;
  let imageUrl = undefined;
  
  if (req.file) {
    const imageFilename = `product_${productId}_${Date.now()}.png`;
    if (s3Client && process.env.R2_BUCKET_NAME) {
      try {
        await s3Client.send(new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: imageFilename,
          Body: req.file.buffer,
          ContentType: req.file.mimetype || 'image/png'
        }));
        imageUrl = `${process.env.R2_PUBLIC_URL}/${imageFilename}`;
      } catch (err) {
        console.error("Error subiendo nueva imagen a R2:", err);
      }
    } else {
      const imagePath = path.join(IMAGES_DIR, imageFilename);
      fs.writeFileSync(imagePath, req.file.buffer);
      imageUrl = `/static/images/${imageFilename}`;
    }
  }

  try {
    if (imageUrl !== undefined) {
      await db.execute(
        'UPDATE products SET title = ?, description = ?, price = ?, category = ?, imageUrl = ? WHERE id = ?',
        [title, description, price || 0, category || 'Sin Categoría', imageUrl, productId]
      );
    } else {
      await db.execute(
        'UPDATE products SET title = ?, description = ?, price = ?, category = ? WHERE id = ?',
        [title, description, price || 0, category || 'Sin Categoría', productId]
      );
    }
    res.json({ message: "Producto actualizado correctamente", imageUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: "Error actualizando el producto" });
  }
});

app.delete('/products/:id', authenticateToken, async (req, res) => {
  const productId = req.params.id;
  try {
    const [rows] = await db.execute('SELECT imageUrl FROM products WHERE id = ?', [productId]);
    if (rows.length > 0) {
      const imgUrl = rows[0].imageUrl;
      if (imgUrl) {
        if (imgUrl.includes(process.env.R2_PUBLIC_URL) && s3Client) {
          const key = imgUrl.split('/').pop();
          try {
            await s3Client.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key }));
          } catch(e) { console.error("Error borrando imagen de R2", e); }
        } else if (imgUrl.startsWith('/static/images/')) {
          const filename = imgUrl.split('/').pop();
          try {
            fs.unlinkSync(path.join(IMAGES_DIR, filename));
          } catch(e) {}
        }
      }
    }
    await db.execute('DELETE FROM products WHERE id = ?', [productId]);
    res.json({ message: "Producto eliminado" });
  } catch(err) {
    console.error(err);
    res.status(500).json({ detail: "Error eliminando producto" });
  }
});

  // TICKET ROUTES
  app.post('/tickets', authenticateToken, async (req, res) => {
    const { formData, productos } = req.body;
    try {
      // Generate unique ticket code (e.g. TK-0001 based on auto increment id or random)
      const code = `TK-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`;
      
      await db.execute(
        `INSERT INTO dispatch_tickets 
        (ticket_code, client_name, client_id, phone, city, address, delivery_reference, reference_phone, payment_method, products) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          code, 
          formData.nombres || '', 
          formData.cedula || '', 
          formData.telefono || '', 
          formData.ciudad || '', 
          formData.direccion || '', 
          formData.referenciaEntrega || '', 
          formData.telefonoReferencia || '', 
          formData.formaPago || '', 
          JSON.stringify(productos || [])
        ]
      );
      res.status(201).json({ message: "Ticket guardado", ticket_code: code });
    } catch (err) {
      console.error(err);
      res.status(500).json({ detail: "Error guardando el ticket" });
    }
  });

  app.get('/tickets', authenticateToken, async (req, res) => {
    try {
      const [tickets] = await db.execute('SELECT * FROM dispatch_tickets ORDER BY created_at DESC');
      res.json(tickets);
    } catch (err) {
      console.error(err);
      res.status(500).json({ detail: "Error obteniendo tickets" });
    }
  });

// Protected routes
app.post('/upload-pdf', authenticateToken, upload.single('file'), async (req, res) => {
  if (!req.file || req.file.mimetype !== 'application/pdf') {
    return res.status(400).json({ detail: 'El archivo debe ser un PDF válido' });
  }

  // Responder inmediatamente al frontend
  res.json({
    message: 'Procesamiento con IA iniciado en segundo plano. Los productos irán apareciendo en el catálogo a medida que se procesen.',
    backgroundProcess: true
  });

  // Procesar asíncronamente (no bloquea la respuesta http)
  try {
    const buffer = req.file.buffer;
    
    await extractProductsFromPDF(buffer, IMAGES_DIR, async (product) => {
      try {
        await db.execute('INSERT INTO products (id, title, description, price, imageUrl, category) VALUES (?, ?, ?, ?, ?, ?)', 
          [product.id, product.title, product.description, product.price, product.imageUrl, product.category || product.subcategoria || product.categoria || 'Sin Categoría']);
        console.log(`Producto guardado: ${product.title}`);
      } catch (err) {
        console.error('Error insertando producto en DB:', err);
      }
    });
    
    console.log('Procesamiento de PDF completado.');
  } catch (error) {
    console.error('Error procesando PDF en background:', error);
  }
});

app.delete('/products', authenticateToken, async (req, res) => {
  try {
    await db.execute('DELETE FROM products');
    
    // Safely delete images
    if (s3Client && process.env.R2_BUCKET_NAME) {
      try {
        let isTruncated = true;
        let continuationToken;
        while (isTruncated) {
          const listParams = { Bucket: process.env.R2_BUCKET_NAME, ContinuationToken: continuationToken };
          const listedObjects = await s3Client.send(new ListObjectsV2Command(listParams));
          if (!listedObjects.Contents || listedObjects.Contents.length === 0) break;
          const deleteParams = {
            Bucket: process.env.R2_BUCKET_NAME,
            Delete: { Objects: listedObjects.Contents.map(c => ({ Key: c.Key })) }
          };
          await s3Client.send(new DeleteObjectsCommand(deleteParams));
          isTruncated = listedObjects.IsTruncated;
          continuationToken = listedObjects.NextContinuationToken;
        }
      } catch (r2Err) {
        console.error('Error limpiando bucket de R2:', r2Err);
      }
    } else {
      try {
        if (fs.existsSync(IMAGES_DIR)) {
          const files = fs.readdirSync(IMAGES_DIR);
          for (const file of files) {
            try {
              fs.unlinkSync(path.join(IMAGES_DIR, file));
            } catch (e) {
              console.error('No se pudo borrar imagen local:', file);
            }
          }
        }
      } catch (fsErr) {
        console.error('Error al leer el directorio de imagenes:', fsErr);
      }
    }
    
    res.json({ message: "Catálogo limpiado correctamente" });
  } catch(err) {
    console.error("Error limpiando BD:", err);
    res.status(500).json({ detail: "Error limpiando catálogo" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor Express corriendo en http://localhost:${PORT}`);
});
