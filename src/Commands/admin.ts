import Database from "better-sqlite3"
import path from "path"

const dbPath = path.join(__dirname, "..", "..", "forum.db")
const db = new Database(dbPath)

db.prepare("UPDATE users SET role = 'admin' WHERE username = ?").run("Marxi")