import { Request, Response, NextFunction } from "express";
import { db } from "../Database/db"

export function authUser(req: Request, res: Response, next: NextFunction) {
    const loadingUser = req.cookies?.session
    if (loadingUser) {
        const session = db.prepare(
            "SELECT * FROM sessions WHERE id = ?"
        ).get(loadingUser) as any

        if (session && new Date(session.expires_at) > new Date()) {
            res.locals.user = db.prepare(
                "SELECT id, username, email, role FROM users WHERE id = ?"
            ).get(session.user_id)
        } else if (session) {
            db.prepare("DELETE FROM sessions WHERE id = ?").run(loadingUser)
            res.clearCookie("session")
        }
    }
    next()
}

export function deAuth(req: Request, res: Response, next: NextFunction) {
    if (!res.locals.user) {
        return res.redirect("/")
        next()
    }
}
