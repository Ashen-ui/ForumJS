import express from "express"
import bcrypt from "bcrypt"
import { v4 as hexChicken } from "uuid"
import { db, insertUsers, insertSessions } from "../Database/db"
import { deAuth } from "../Middleware/authentification"
import { user, session } from "../Interfaces/types"
export const requestRouter = express.Router()

//Registration
requestRouter.post("/register", (req, res) => {
    const username = req.body.username?.trim()
    const email = req.body.email?.trim()
    const password = req.body.password
    const confirmPassword = req.body.confirmPassword
    if (!username || !email || !password) {
        return res.status(400).render("registration", { error: "All fields are necessary"})
    }
    if (password !== confirmPassword) {
        return res.status(400).render("registration", { error: "Passwords don't match"})
    }
    
    const booleanEmail = db.prepare("SELECT id FROM users WHERE email = ?").get(email) as user | undefined
    if (booleanEmail) {
        return res.status(409).render("registration", { Error: "Email already used"})
    }
    const booleanName = db.prepare("SELECT id FROM users WHERE username=?").get(username) as user | undefined
    if (booleanName) {
        return res.status(409).render("registration", { Error: "Username already in use"})
    }

    const hash = bcrypt.hashSync(password, 11)//depends on the number of salt and cores you have how long the check is
    insertUsers.run(username, email, hash, "user")
    res.redirect("/")
})

//Login
requestRouter.post('/login', (req, res) => {
    const { username, password } = req.body
    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username) as user | undefined
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
        return res.status(400).render("index", { Error: "Invalid username or password"})
    }

    db.prepare("DELETE FROM sessions WHERE user_id = ?").run(user.id)

    const sessionId = hexChicken()
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 12)
    insertSessions.run(sessionId, user.id, expires.toISOString())

    res.cookie("session", sessionId, { httpOnly: true, expires })
    res.redirect("/")
})

//Logout
requestRouter.post("/logout", (req, res) => {
    const sessionId = req.cookies?.session
    if (sessionId) {
        db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId)
    }
    res.clearCookie("session")
    res.redirect("/")
})

requestRouter.get("/login", (req, res) => {
  res.render("login")
})

requestRouter.get("/", (req, res) => {
    res.render("index")
})

requestRouter.get("/index", (req, res) => {
    res.render("index")
})

requestRouter.get("/register", (req, res) => {
    res.render("registration")
})

requestRouter.get("/static", (req, res) => {
    res.send("./views/static")
})