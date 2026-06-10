"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestRouter = void 0;
const express_1 = __importDefault(require("express"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const uuid_1 = require("uuid");
const db_1 = require("../Database/db");
exports.requestRouter = express_1.default.Router();
//Registration
exports.requestRouter.post("/register", (req, res) => {
    const username = req.body.username?.trim();
    const email = req.body.email?.trim();
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    if (!username || !email || !password) {
        return res.status(400).render("registration", { error: "All fields are necessary" });
    }
    if (password !== confirmPassword) {
        return res.status(400).render("registration", { error: "Passwords don't match" });
    }
    const booleanEmail = db_1.db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (booleanEmail) {
        return res.status(409).render("registration", { Error: "Email already used" });
    }
    const booleanName = db_1.db.prepare("SELECT id FROM users WHERE username=?").get(username);
    if (booleanName) {
        return res.status(409).render("registration", { Error: "Username already in use" });
    }
    const hash = bcrypt_1.default.hashSync(password, 11); //depends on the number of salt and cores you have how long the check is
    db_1.insertUsers.run(username, email, hash, "user");
    res.redirect("/");
});
//Login
exports.requestRouter.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = db_1.db.prepare("SELECT * FROM users WHERE username = ?").get(username);
    if (!user || !bcrypt_1.default.compareSync(password, user.password_hash)) {
        return res.status(400).render("index", { Error: "Invalid username or password" });
    }
    db_1.db.prepare("DELETE FROM sessions WHERE user_id = ?").run(user.id);
    const sessionId = (0, uuid_1.v4)();
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 12);
    db_1.insertSessions.run(sessionId, user.id, expires.toISOString());
    res.cookie("session", sessionId, { httpOnly: true, expires });
    res.redirect("/");
});
//Logout
exports.requestRouter.post("/logout", (req, res) => {
    const sessionId = req.cookies?.session;
    if (sessionId) {
        db_1.db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
    }
    res.clearCookie("session");
    res.redirect("/");
});
exports.requestRouter.get("/login", (req, res) => {
    res.render("login");
});
exports.requestRouter.get("/", (req, res) => {
    res.render("index");
});
exports.requestRouter.get("/index", (req, res) => {
    res.render("index");
});
exports.requestRouter.get("/register", (req, res) => {
    res.render("registration");
});
exports.requestRouter.get("/static", (req, res) => {
    res.send("./views/static");
});
