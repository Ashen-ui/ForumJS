import express from "express"
import bcrypt from "bcrypt"
import { v4 as hexChicken } from "uuid"
import { db, insertUsers, insertSessions } from "../Database/db"
import { deAuth } from "../Middleware/authentification"
import { user, session, post, reaction } from "../Interfaces/types"
export const requestRouter = express.Router()

requestRouter.get("/", (req, res) => {
    res.redirect("/posts")
})

//Register + login + logout GET and POST requests
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
        return res.status(400).render("login", { Error: "Invalid username or password"})
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

requestRouter.get("/register", (req, res) => {
    res.render("registration")
})


//Posts GET and POST requests
//Save new post
requestRouter.post("/posts", deAuth, (req, res) => {
    const title = req.body.title?.trim()
    const content = req.body.content?.trim()
    let categories = req.body.categories

    if (!title || !content) {
        const categoryId = db.prepare("SELECT * FROM categories ORDER BY name").all()
        return res.status(400).render("create_post", {
            categories: categoryId,
            error: "Title and content are required"
        })
    }

    if (!categories) {
        categories = []
    }
    if (!Array.isArray(categories)) {
        categories = [categories]
    }

    const create = db.transaction(() => {
        const result = db.prepare(
            "INSERT INTO posts (user_id, title, content) VALUES (?, ?, ?)").run(res.locals.user.id, title, content
        )
        const postId = result.lastInsertRowid
        const link = db.prepare(
            "INSERT INTO post_categories (post_id, category_id) VALUES (?, ?)"
        )
        for (const categoryId of categories) {
            link.run(postId, categoryId)
        }
        return postId
    })

    const postId = create()
    res.redirect(`/posts/${postId}`)
})

//List Posts
requestRouter.get("/posts", (req, res) => {
    const categories = db.prepare("SELECT * FROM categories").all();
    let query = `
        SELECT posts.*, users.username, GROUP_CONCAT(DISTINCT categories.name) AS category_names,
            (SELECT COUNT(*) FROM reactions WHERE post_id = posts.id AND type = 'like') AS likes,
            (SELECT COUNT(*) FROM reactions WHERE post_id = posts.id AND type = 'dislike') AS dislikes,
            (SELECT COUNT(*) FROM comments WHERE post_id = posts.id) AS comment_count
        FROM posts
        JOIN users ON posts.user_id = users.id
        LEFT JOIN post_categories ON post_categories.post_id = posts.id
        LEFT JOIN categories ON categories.id = post_categories.category_id
    `   
    const params: any[] = []
    if (req.query.category) {
        query += `WHERE post_categories.category_id = ?`
        params.push(req.query.category)
    }
    query += ` GROUP BY posts.id ORDER BY posts.created_at DESC`
    const posts = db.prepare(query).all(...params)

    res.render("posts", {
        posts: posts,
        categories: categories,
        activeCategory: req.query.category || null
    });
});

//Get request for creating posts
requestRouter.get("/posts/create", deAuth, (req, res) => {
    const categories = db.prepare("SELECT * FROM categories ORDER BY name").all()
    res.render("create_post", { categories })
})

//Get Single Post
requestRouter.get("/posts/:id", (req, res) => {
    const post = db.prepare(`
        SELECT posts.*, users.username,
            (SELECT COUNT(*) FROM reactions WHERE post_id = posts.id AND type = 'like') AS likes,
            (SELECT COUNT(*) FROM reactions WHERE post_id = posts.id AND type = 'dislike') AS dislikes
        FROM posts
        JOIN users ON posts.user_id = users.id
        WHERE posts.id = ?
    `).get(req.params.id) as any

    if (!post) {
        return res.status(404).render("404")
    }
    const categories = db.prepare(`
        SELECT categories.name FROM categories
        JOIN post_categories ON post_categories.category_id = categories.id
        WHERE post_categories.post_id = ?
    `).all(req.params.id)

    const comments = db.prepare(`
        SELECT comments.*, users.username
        FROM comments
        JOIN users ON comments.user_id = users.id
        WHERE comments.post_id = ?
        ORDER BY comments.created_at ASC
    `).all(req.params.id)

    res.render("post", { post, categories, comments })
})

//Edit form
requestRouter.get("/posts/:id/edit", deAuth, (req, res) => {
    const post = db.prepare("SELECT * FROM posts WHERE id = ?").get(req.params.id) as post || null
    if (!post) {
        return res.status(404).render("404")
    }
    if (post.user_id !== res.locals.user.id) {
        return res.status(403).render("403")
    }

    const categories = db.prepare("SELECT * FROM categories ORDER BY name").all()
    const selected = db.prepare(
        "SELECT category_id FROM post_categories WHERE post_id = ?").all(req.params.id).map((r: any) => r.category_id
    )

    res.render("edit_post", { post, categories, selected })
})

//Post Requests
//Save edits
requestRouter.post("/posts/:id/edit", deAuth, (req, res) => {
    const post = db.prepare("SELECT user_id FROM posts WHERE id = ?").get(req.params.id) as post || null
    if (!post) {
        return res.status(404).render("404")
    }
    if (post.user_id !== res.locals.user.id) {
        return res.status(403).render("403")
    }

    const title = req.body.title?.trim()
    const content = req.body.content?.trim()
    let categories = req.body.categories
    if (!categories) {
        categories = []
    }
    if (!Array.isArray(categories)) {
        categories = [categories]
    }

    db.transaction(() => {
        db.prepare("UPDATE posts SET title = ?, content = ? WHERE id = ?").run(title, content, req.params.id)
        db.prepare("DELETE FROM post_categories WHERE post_id = ?").run(req.params.id)
        const link = db.prepare("INSERT INTO post_categories (post_id, category_id) VALUES (?, ?)")
        for (const categoryId of categories) {
            link.run(req.params.id, categoryId)
        }
    })()

    res.redirect(`/posts/${req.params.id}`)
})

//Delete
requestRouter.post("/posts/:id/delete", deAuth, (req, res) => {
    const post = db.prepare("SELECT user_id FROM posts WHERE id = ?").get(req.params.id) as post || null
    if (!post) {
        return res.status(404).render("404")
    }
    if (post.user_id !== res.locals.user.id) {
        return res.status(403).render("403")
    }
    db.prepare("DELETE FROM posts WHERE id = ?").run(req.params.id)
    
    res.redirect("/posts")
})

requestRouter.post("/posts/:id/like", deAuth, (req, res) => {
    const postId = req.params.id
    const userId = res.locals.user.id
    const existing = db.prepare("SELECT * FROM reactions WHERE user_id = ? AND post_id = ?").get(userId, postId) as reaction || null

    if (existing && existing.type === "like") {
        db.prepare("DELETE FROM reactions WHERE id = ?").run(existing.id)
    } else if (existing) {
        db.prepare("UPDATE reactions SET type = 'like' WHERE id = ?").run(existing.id)
    } else {
        db.prepare("INSERT INTO reactions (user_id, post_id, type) VALUES (?, ?, 'like')").run(userId, postId)
    }

    res.redirect(req.headers.referer || `/posts/${req.params.id}`)
})

requestRouter.post("/posts/:id/dislike", deAuth, (req, res) => {
    const postId = req.params.id
    const userId = res.locals.user.id
    const existing = db.prepare("SELECT * FROM reactions WHERE user_id = ? AND post_id = ?").get(userId, postId) as any

    if (existing && existing.type === "dislike") {
        db.prepare("DELETE FROM reactions WHERE id = ?").run(existing.id)
    } else if (existing) {
        db.prepare("UPDATE reactions SET type = 'dislike' WHERE id = ?").run(existing.id)
    } else {
        db.prepare("INSERT INTO reactions (user_id, post_id, type) VALUES (?, ?, 'dislike')").run(userId, postId)
    }

    res.redirect(req.headers.referer || `/posts/${req.params.id}`)
})

requestRouter.post("/posts/:id/comment", deAuth, (req, res) => {
    const content = req.body.content?.trim()
    if (!content) {
        return res.redirect(`/posts/${req.params.id}`)
    }
    db.prepare("INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)").run(req.params.id, res.locals.user.id, content)

    res.redirect(`/posts/${req.params.id}`)
})

requestRouter.get("/profile/:id", (req, res) => {
    const profile = db.prepare("SELECT id, username, email, role, created_at FROM users WHERE id=?").get(req.params.id) as user || null
    if (!profile) {
        return res.status(404).render("404")
    }
    const posts = db.prepare(`
            SELECT posts.*,    
                (SELECT COUNT(*) FROM reactions WHERE post_id = posts.id AND type = 'like') AS likes,
                (SELECT COUNT(*) FROM reactions WHERE post_id = posts.id AND type = 'dislike') AS dislikes,
                (SELECT COUNT(*) FROM comments WHERE post_id = posts.id) AS comment_count
            FROM posts
            WHERE posts.user_id = ?
            ORDER BY posts.created_at DESC
        `).all(req.params.id)
    const comments = db.prepare(`
            SELECT comments.*, posts.title AS post_title
            FROM comments
            JOIN posts ON posts.id = comments.post_id
            WHERE comments.user_id = ?
            ORDER BY comments.created_at DESC
        `).all(req.params.id)
    const statistics = {
        postNum: posts.length,
        commentNum: comments.length,
        likesGotten: posts.reduce((sum: number, i: any) => sum + (i.likes || 0), 0)
    }
    res.render("profile", { profile, posts, comments, statistics })
})