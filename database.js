import express from "express";
import cors from "cors";
import pg from "pg";
import * as dotenv from 'dotenv';
dotenv.config();

var app = express();
app.use(cors());
app.use(express.json());

const { Client } = pg;

const connection = new Client({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: {
    rejectUnauthorized: false
  }
});

connection.connect()
  .then(() => console.log('Connected to PostgreSQL database'))
  .catch(err => console.error('Connection error', err.stack));

export default connection;