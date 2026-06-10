import { Request, Response, NextFunction } from "express";
import { db } from "../Database/db"
import { user, session } from "../Interfaces/types"

export function authUser(req: Request, res: Response, next: NextFunction) {
    const sessionId = req.cookies?.session
    if (sessionId) {
        const session = db.prepare(
            "SELECT * FROM sessions WHERE id = ?"
        ).get(sessionId) as session | undefined

        if (session && new Date(session.expires_at) > new Date()) {
            res.locals.user = db.prepare(
                "SELECT id, username, email, role FROM users WHERE id = ?"
            ).get(session.user_id)
        } else if (session) {
            db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId)
            res.clearCookie("session")
        }
    }
    next()
}

export function deAuth(req: Request, res: Response, next: NextFunction) {
    if (!res.locals.user) {
        return res.redirect("/login")
        next()
    }
}
