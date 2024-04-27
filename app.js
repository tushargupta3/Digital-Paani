// app.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = 3000;

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/book_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Book model
const Book = mongoose.model('Book', {
  title: String,
  author: String,
  publicationYear: Number,
});

// User model
const User = mongoose.model('User',{
  username: String,
  password: String,
});

// Middleware
app.use(bodyParser.json());

// Routes
app.post('/api/auth/signup', [
  body('username').notEmpty(),
  body('password').isLength({ min: 6 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = new User({ username, password: hashedPassword });
  await user.save();

  res.status(201).json({ message: 'User created successfully' });
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (!user) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  const token = jwt.sign({ username }, 'secret', { expiresIn: '1h' });
  res.json({ token });
});

app.get('/api/books', async (req, res) => {
  const { author, publicationYear } = req.query;
  let query = {};

  if (author) {
    query.author = author;
  }
  if (publicationYear) {
    query.publicationYear = publicationYear;
  }

  const books = await Book.find(query);
  res.json(books);
});

app.post('/api/books', async (req, res) => {
  const { title, author, publicationYear } = req.body;
  const book = new Book({ title, author, publicationYear });
  await book.save();

  res.status(201).json({ message: 'Book created successfully' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
