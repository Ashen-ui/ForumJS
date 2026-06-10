"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertUsers = exports.insertSessions = exports.insertPosts = exports.insertPostCategories = exports.insertReactions = exports.insertComments = exports.insertCategories = exports.db = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const db = new better_sqlite3_1.default("forum.db");
exports.db = db;
//Speeeedddd
db.pragma('journal_mode = WAL');
//foregin key declaration 
db.pragma("foreign_keys = ON");
//Queries
db.exec(`
    CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY,
        username VARCHAR(25) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role TEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions(
        id VARCHAR(255) PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS posts(
        id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL,
        title VARCHAR(255),
        content TEXT,
        image_path VARCHAR(255),
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS categories(
        id INTEGER PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS post_categories(
        post_id INTEGER NOT NULL,
        category_id INTEGER NOT NULL,
        PRIMARY KEY(post_id, category_id),
        FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS comments(
        id INTEGER PRIMARY KEY,
        post_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        content TEXT,
        FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS reactions(
        id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL,
        post_id INTEGER,
        comment_id INTEGER,
        type VARCHAR(255),
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY(comment_id) REFERENCES comments(id) ON DELETE CASCADE
    );

`);
//Request all users
// const query = 'SELECT * FROM users';
// const users = db.prepare(query).all();
// console.log(users);
//Request Single user
// const user = db.prepare('SELECT * FROM users where id = ?').get(1);
// console.log(user);
//Inserts
const insertUsers = db.prepare("INSERT INTO users(username, email, password_hash, role) VALUES (?, ?, ?, ?)");
exports.insertUsers = insertUsers;
const insertSessions = db.prepare("INSERT INTO sessions(id, user_id,expires_at) VALUES (?, ?, ?)");
exports.insertSessions = insertSessions;
const insertPosts = db.prepare("INSERT INTO posts(user_id,title,content,image_path) VALUES (?, ?, ?, ?)");
exports.insertPosts = insertPosts;
const insertCategories = db.prepare("INSERT INTO categories(name) VALUES (?)");
exports.insertCategories = insertCategories;
const insertPostCategories = db.prepare("INSERT INTO post_categories(post_id,category_id) VALUES (?, ?)");
exports.insertPostCategories = insertPostCategories;
const insertReactions = db.prepare("INSERT INTO reactions(user_id,post_id,comment_id,type) VALUES (?, ?, ?, ?)");
exports.insertReactions = insertReactions;
const insertComments = db.prepare("INSERT INTO comments(post_id,user_id,content) VALUES (?, ?, ?)");
exports.insertComments = insertComments;
db.exec(`
    INSERT OR IGNORE INTO categories(name) VALUES('General');
    INSERT OR IGNORE INTO categories(name) VALUES('Campus Life');
    INSERT OR IGNORE INTO categories(name) VALUES('News');
    INSERT OR IGNORE INTO categories(name) VALUES('Competitive');
    `);
