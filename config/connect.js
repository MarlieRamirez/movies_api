// Get the client
import mysql from 'mysql2/promise';

// Create the connection to database
export const connection = await mysql.createConnection({
  host: process.env.MYSQLHOST || 'localhost',
  user: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQLPASSWORD || 'mysqlMarlie',
  database: process.env.MYSQLDATABASE || 'movie_theather'
});