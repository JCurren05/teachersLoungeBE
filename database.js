// server/index.js
import express from "express";
import cors from "cors";
import mysql from "mysql";
import * as dotenv from 'dotenv';
dotenv.config();
var app = express();
app.use(cors());
app.use(express.json());

//This defines the database connection, functions in other files access this
var connection = mysql.createConnection({
  host      : process.env.AWS_HOST,
  port      : process.env.AWS_PORT,
  user      : process.env.AWS_USER,
  password  : process.env.AWS_PASSWORD,
  database  : process.env.AWS_DATABASE
});

 export default connection;
