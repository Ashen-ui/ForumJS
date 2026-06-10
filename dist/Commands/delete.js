"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const dbPath = path_1.default.join(__dirname, "..", "..", "forum.db");
const db = new better_sqlite3_1.default();
db.prepare("DELETE FROM users WHERE username = ?").run("kazakisquad ");
db.close();
