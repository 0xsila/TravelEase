// File: db.js
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Path for the local database JSON file
const DB_FILE = path.join(__dirname, 'local_database.json');

// Initial database structure
const initialDB = {
  users: [
    {
      _id: "67f779ac2df33d815fa5746c",
      email: "moha07467@gmail.con",
      password: "$2b$10$Zzxsde0eyw5reC61uKaZkuKNCwFiLqkwdAtab2euLLxXrwrhxTR/q",
      role: "user",
      createdAt: new Date(1744271788849),
      __v: 0
    }
  ]
};

// Initialize database file if it doesn't exist
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify(initialDB, null, 2));
}

// Helper to read database
const readDB = () => {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database file:', error);
    return initialDB;
  }
};

// Helper to write to database
const writeDB = (data) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing to database file:', error);
    return false;
  }
};

// Generate a unique ID (similar to MongoDB ObjectId)
const generateId = () => {
  return crypto.randomBytes(12).toString('hex');
};

// User model simulation
const User = {
  // Find a user by email
  findOne: async (query) => {
    const db = readDB();
    const user = db.users.find(user => {
      // Match all conditions in the query
      return Object.keys(query).every(key => user[key] === query[key]);
    });
    return user ? { ...user, comparePassword } : null;
  },

  // Find a user by ID
  findById: async (id) => {
    const db = readDB();
    const user = db.users.find(user => user._id === id);
    return user ? { ...user, comparePassword } : null;
  },

  // Create a new user
  create: async (userData) => {
    const db = readDB();
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    
    const newUser = {
      _id: generateId(),
      ...userData,
      password: hashedPassword,
      createdAt: new Date(),
      __v: 0
    };
    
    db.users.push(newUser);
    writeDB(db);
    
    return { ...newUser, comparePassword };
  },

  // Save user changes
  save: async function(options = {}) {
    const db = readDB();
    const index = db.users.findIndex(u => u._id === this._id);
    
    if (index !== -1) {
      // If the password is modified and validateBeforeSave is not false, hash it
      if (this.password && this.password !== db.users[index].password && options.validateBeforeSave !== false) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
      }
      
      db.users[index] = { ...this };
      writeDB(db);
      return this;
    }
    return null;
  }
};

// Method to compare passwords
async function comparePassword(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
}

module.exports = {
  User,
  mongoose: {
    connect: () => Promise.resolve('Connected to local database')
  }
};