import Database from "better-sqlite3"
import path from "path"

const dbPath = path.join(__dirname, "..", "..", "forum.db")
const db = new Database(dbPath)


db.prepare("DELETE FROM users WHERE username = ?").run("kazakisquad ")
db.close()
