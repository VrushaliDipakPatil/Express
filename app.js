const express = require('express');
const mysql = require('mysql');
const app = express();
const port = 3000;

// Set up static folder to serve static files (Bootstrap CSS and other assets)
app.use(express.static('public'));

// Set up MySQL connection
const connection = mysql.createConnection({
  host: 'localhost', 
  user: 'root', 
  password: 'root', 
  database: 'product', 
});

// Connect to MySQL
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL successfully!');
});

// Middleware to parse request body as JSON
app.use(express.json());

// Fetch all products
app.get('/api/products', async (req, res) => {
  try {
    const sql = 'SELECT * FROM products';
    const products = await executeQuery(sql);
    res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete a product by ID
app.delete('/api/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    const deleteSql = 'DELETE FROM products WHERE id = ?';
    await executeQuery(deleteSql, [productId]);
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Helper function to execute SQL queries with async/await
function executeQuery(sql, params) {
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
