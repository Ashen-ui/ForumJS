"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authUser = authUser;
exports.deAuth = deAuth;
const db_1 = require("../Database/db");
function authUser(req, res, next) {
    const sessionId = req.cookies?.session;
    if (sessionId) {
        const session = db_1.db.prepare("SELECT * FROM sessions WHERE id = ?").get(sessionId);
        if (session && new Date(session.expires_at) > new Date()) {
            res.locals.user = db_1.db.prepare("SELECT id, username, email, role FROM users WHERE id = ?").get(session.user_id);
        }
        else if (session) {
            db_1.db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
            res.clearCookie("session");
        }
    }
    next();
}
function deAuth(req, res, next) {
    if (!res.locals.user) {
        return res.redirect("/login");
        next();
    }
}
