const express = require('express');
const mysql = require('mysql');
const app = express();
const port = 3000;

// Set up static folder to serve static files (Bootstrap CSS and other assets)
app.use(express.static('public'));

// Middleware to parse request body as JSON
app.use(express.json());

// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'expenses'
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL database');
});

app.get('/edit', (req, res) => {
  res.sendFile(__dirname + '/public/edit.html');
});

app.get('/daily', (req, res) => {
  res.sendFile(__dirname + '/public/daily.html');
});

app.get('/monthly', (req, res) => {
  res.sendFile(__dirname + '/public/monthly.html');
});

app.get('/yearly', (req, res) => {
  res.sendFile(__dirname + '/public/yearly.html');
});

app.post('/save-expense', async (req, res) => {
  try {
    const {  year,month, day, date, todo } = req.body;

    const query = 'INSERT INTO expenses.todo (year,month, day, date, todo) VALUES (?, ?, ?, ?, ?)';
    await db.query(query, [year,month, day, date, todo]);

    res.send('Expense saved successfully');
  } catch (err) {
    console.error('Error saving expense:', err);
    res.status(500).send('Error saving expense');
  }
});

// Define a query function to execute SQL queries
async function executeQuery(sql, params = []) {
  try {
    return new Promise((resolve, reject) => {
      db.query(sql, params, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  } catch (error) {
    throw error;
  }
}

app.get('/edit-data', async (req, res) => {
  try {
    const sql = 'SELECT * FROM expenses.todo'; // Change this query to match your table
    const results = await executeQuery(sql);
    const data = {
      todos: results
    };
    res.json(data);
  } catch (err) {
    console.error('Error fetching data:', err);
    res.status(500).json({ error: 'Error fetching data' });
  }
});



app.post('/save-transaction', async (req, res) => {
  try {
    const { type, year, month, date, source, amount, description } = req.body;

    // Insert data into the Transaction table
    const transactionInsertQuery = `
      INSERT INTO Transaction (Date, Month, Year, TotalIncome, TotalExpense, Balance)
      VALUES (?, ?, ?, ?, ?, ?)`;
    
    const existingTransactionQuery = `
      SELECT * FROM Transaction WHERE Date = ? AND Month = ? AND Year = ?`;
    const existingTransaction = await executeQuery(existingTransactionQuery, [date, month, year]);

    if (existingTransaction.length > 0) {
      const transaction = existingTransaction[0];
      const totalIncome = transaction.TotalIncome;
      const totalExpense = transaction.TotalExpense;
      const updatedTotalIncome = type === 'income' ? totalIncome + amount : totalIncome;
      const updatedTotalExpense = type === 'expense' ? totalExpense + amount : totalExpense;
      const updatedBalance = type === 'income' ? transaction.Balance + amount : transaction.Balance - amount;

      const updateTransactionQuery = `
        UPDATE Transaction
        SET TotalIncome = ?, TotalExpense = ?, Balance = ?
        WHERE Date = ? AND Month = ? AND Year = ?`;
      await executeQuery(updateTransactionQuery, [updatedTotalIncome, updatedTotalExpense, updatedBalance, date, month, year]);
    } else {
      const initialTotalIncome = type === 'income' ? amount : 0;
      const initialTotalExpense = type === 'expense' ? amount : 0;
      const initialBalance = type === 'income' ? amount : -amount;
      
      await executeQuery(transactionInsertQuery, [date, month, year, initialTotalIncome, initialTotalExpense, initialBalance]);
    }

    // Insert data into the appropriate income/expense table
    if (type === 'income') {
      const incomeInsertQuery = `
        INSERT INTO Income (Date, Month, Year, Source, Amount, Description)
        VALUES (?, ?, ?, ?, ?, ?)`;
      await executeQuery(incomeInsertQuery, [date, month, year, source, amount, description]);
    } else if (type === 'expense') {
      const expenseInsertQuery = `
        INSERT INTO Expense (Date, Month, Year, Source, Amount, Description)
        VALUES (?, ?, ?, ?, ?, ?)`;
      await executeQuery(expenseInsertQuery, [date, month, year, source, amount, description]);
    }

    res.sendStatus(200); // Send a success response
  } catch (error) {
    console.error('Error saving transaction:', error);
    res.status(500).json({ error: 'Error saving transaction' });
  }
});

app.get('/fetch-data', async (req, res) => {
  try {
    const { day, month, year } = req.query;

    const transactionQuery = `
      SELECT TotalIncome, TotalExpense, Balance
      FROM Transaction
      WHERE Date = ? AND Month = ? AND Year = ?`;

    const incomeQuery = `
      SELECT Source, Amount, Description
      FROM Income
      WHERE Date = ? AND Month = ? AND Year = ?`;

    const expenseQuery = `
      SELECT Source, Amount, Description
      FROM Expense
      WHERE Date = ? AND Month = ? AND Year = ?`;

    const transactionResults = await executeQuery(transactionQuery, [day, month, year]);
    const incomeResults = await executeQuery(incomeQuery, [day, month, year]);
    const expenseResults = await executeQuery(expenseQuery, [day, month, year]);

    const data = {
      transaction: transactionResults[0],
      income: incomeResults,
      expense: expenseResults,
    };

    res.json(data);
  } catch (err) {
    console.error('Error fetching data:', err);
    res.status(500).json({ error: 'Error fetching data' });
  }
});




// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
