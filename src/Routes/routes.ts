import express from "express"
import bcrypt from "bcrypt"
import { v4 as hexChicken } from "uuid"
import { db, insertUsers, insertSessions } from "../Database/db"
import { deAuth } from "../Middleware/authentification"
export const requestRouter = express.Router()

//Registration
requestRouter.post("/register", (req, res) => {
    const { username, email, password, confirmPassword } = req.body
    if (!username || !email || !password) {
        return res.status(400).render("registration", { error: "All fields are necessary"})
    }
    if (password !== confirmPassword) {
        return res.status(400).render("registration", { error: "Passwords don't match"})
    }
    
    const booleanEmail = db.prepare("SELECT id FROM users WHERE email = ?").get(email)
    if (booleanEmail) {
        return res.status(400).render("registration", { Error: "Email already used"})
    }
    const booleanName = db.prepare("SELECT id FROM users WHERE username=?").get(username)
    if (username) {
        res.status(400).render("registration", { Error: "Username already in use"})
    }

    const hash = bcrypt.hashSync(password, 11)//depends on the number of salt and cores you have how long the check is
    insertUsers.run(username, email, hash, "user")
    res.redirect("/")
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