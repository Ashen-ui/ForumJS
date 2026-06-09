"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const db = new better_sqlite3_1.default("forum.db");
const query = `
        CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY,
        username VARCHAR(25) NOT NULL,
        email VARCHAR(100) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role TEXT NOT NULL,
        created_at DATETIME NOT NULL
    )`;
`CREATE TABLE IF NOT EXISTS posts(
        id INTEGER PRIMARY KEY,
        FOREIGN KEY(user_id) REFERENCES users(id),
        title VARCHAR(255),
        content TEXT,
        image_path VARCHAR(255),
        created_at DATETIME NOT NULL,
    )`;
`CREATE TABLE IF NOT EXISTS sessions(
        id VARCHAR(255) PRIMARY KEY,
        FOREIGN KEY(user_id) REFERENCES users(id),
    )`;
`CREATE TABLE IF NOT EXISTS post_categories(
        post_id INTEGER PRIMARY KEY,
        FOREIGN KEY(category_id) REFERENCES posts(id),
    )`;
`CREATE TABLE IF NOT EXISTS (
        id INTEGER PRIMARY KEY,
        
    )`;
db.exec(query);
