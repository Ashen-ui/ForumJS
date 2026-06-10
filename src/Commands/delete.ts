import Database from "better-sqlite3"

const db = new Database("../forum.db")
db.prepare("DELETE FROM users WHERE username = ?").run("kazakisquad")
db.close()