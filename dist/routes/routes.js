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
const authentification_1 = require("../Middleware/authentification");
exports.requestRouter = express_1.default.Router();
//Post Requests
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
        return res.status(400).render("login", { Error: "Invalid username or password" });
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
//save post
exports.requestRouter.post("/posts", authentification_1.deAuth, (req, res) => {
    const title = req.body.title?.trim();
    const content = req.body.content?.trim();
    let categories = req.body.categories;
    if (!title || !content) {
        const categoryId = db_1.db.prepare("SELECT * FROM categories ORDER BY name").all();
        return res.status(400).render("create_post", {
            categories: categoryId,
            error: "Title and content are required"
        });
    }
    if (!categories) {
        categories = [];
    }
    if (!Array.isArray(categories)) {
        categories = [categories];
    }
    const create = db_1.db.transaction(() => {
        const result = db_1.db.prepare("INSERT INTO posts (user_id, title, content) VALUES (?, ?, ?)").run(res.locals.user.id, title, content);
        const postId = result.lastInsertRowid;
        const link = db_1.db.prepare("INSERT INTO post_categories (post_id, category_id) VALUES (?, ?)");
        for (const categoryId of categories) {
            link.run(postId, categoryId);
        }
        return postId;
    });
    const postId = create();
    res.redirect(`/posts/${postId}`);
});
//Get Requests
exports.requestRouter.get("/", (req, res) => {
    res.redirect("/posts");
});
exports.requestRouter.get("/login", (req, res) => {
    res.render("login");
});
exports.requestRouter.get("/register", (req, res) => {
    res.render("registration");
});
//Get request for the main page
exports.requestRouter.get("/posts", (req, res) => {
    const categories = db_1.db.prepare("SELECT * FROM categories").all();
    let query = `
        SELECT posts.*, users.username, GROUP_CONCAT(DISTINCT categories.name) AS category_names,
            (SELECT COUNT(*) FROM reactions WHERE post_id = posts.id AND type = 'like') AS likes,
            (SELECT COUNT(*) FROM reactions WHERE post_id = posts.id AND type = 'dislike') AS dislikes,
            (SELECT COUNT(*) FROM comments WHERE post_id = posts.id) AS comment_count
        FROM posts
        JOIN users ON posts.user_id = users.id
        LEFT JOIN post_categories ON post_categories.post_id = posts.id
        LEFT JOIN categories ON categories.id = post_categories.category_id
    `;
    const params = [];
    if (req.query.category) {
        query += `WHERE post_categories.category_id = ?`;
        params.push(req.query.category);
    }
    query += ` GROUP BY posts.id ORDER BY posts.created_at DESC`;
    const posts = db_1.db.prepare(query).all(...params);
    res.render("posts", {
        posts: posts,
        categories: categories,
        activeCategory: req.query.category || null
    });
});
//Get request for creating posts
exports.requestRouter.get("/posts/create", authentification_1.deAuth, (req, res) => {
    const categories = db_1.db.prepare("SELECT * FROM categories ORDER BY name").all();
    res.render("create_post", { categories });
});
exports.requestRouter.get("/posts/:id", (req, res) => {
    const post = db_1.db.prepare(`
        SELECT posts.*, users.username,
            (SELECT COUNT(*) FROM reactions WHERE post_id = posts.id AND type = 'like') AS likes,
            (SELECT COUNT(*) FROM reactions WHERE post_id = posts.id AND type = 'dislike') AS dislikes
        FROM posts
        JOIN users ON posts.user_id = users.id
        WHERE posts.id = ?
    `).get(req.params.id);
    if (!post) {
        return res.status(404).render("404");
    }
    const categories = db_1.db.prepare(`
        SELECT categories.name FROM categories
        JOIN post_categories ON post_categories.category_id = categories.id
        WHERE post_categories.post_id = ?
    `).all(req.params.id);
    const comments = db_1.db.prepare(`
        SELECT comments.*, users.username
        FROM comments
        JOIN users ON comments.user_id = users.id
        WHERE comments.post_id = ?
        ORDER BY comments.created_at ASC
    `).all(req.params.id);
    res.render("post", { post, categories, comments });
});
//edit
exports.requestRouter.get("/posts/:id/edit", authentification_1.deAuth, (req, res) => {
    const post = db_1.db.prepare("SELECT * FROM posts WHERE id = ?").get(req.params.id) || null;
    if (!post) {
        return res.status(404).render("404");
    }
    if (post.user_id !== res.locals.user.id) {
        return res.status(403).render("403");
    }
    const categories = db_1.db.prepare("SELECT * FROM categories ORDER BY name").all();
    const selected = db_1.db.prepare("SELECT category_id FROM post_categories WHERE post_id = ?").all(req.params.id).map((r) => r.category_id);
    res.render("edit_post", { post, categories, selected });
});
//save the edit
exports.requestRouter.post("/posts/:id/edit", authentification_1.deAuth, (req, res) => {
    const post = db_1.db.prepare("SELECT user_id FROM posts WHERE id = ?").get(req.params.id) || null;
    if (!post) {
        return res.status(404).render("404");
    }
    if (post.user_id !== res.locals.user.id) {
        return res.status(403).render("403");
    }
    const title = req.body.title?.trim();
    const content = req.body.content?.trim();
    let categories = req.body.categories;
    if (!categories) {
        categories = [];
    }
    if (!Array.isArray(categories)) {
        categories = [categories];
    }
    db_1.db.transaction(() => {
        db_1.db.prepare("UPDATE posts SET title = ?, content = ? WHERE id = ?").run(title, content, req.params.id);
        db_1.db.prepare("DELETE FROM post_categories WHERE post_id = ?").run(req.params.id);
        const link = db_1.db.prepare("INSERT INTO post_categories (post_id, category_id) VALUES (?, ?)");
        for (const categoryId of categories) {
            link.run(req.params.id, categoryId);
        }
    })();
    res.redirect(`/posts/${req.params.id}`);
});
//Delete
exports.requestRouter.post("/posts/:id/delete", authentification_1.deAuth, (req, res) => {
    const post = db_1.db.prepare("SELECT user_id FROM posts WHERE id = ?").get(req.params.id) || null;
    if (!post) {
        return res.status(404).render("404");
    }
    if (post.user_id !== res.locals.user.id) {
        return res.status(403).render("403");
    }
    db_1.db.prepare("DELETE FROM posts WHERE id = ?").run(req.params.id);
    res.redirect("/posts");
});
exports.requestRouter.post("/posts/:id/like", authentification_1.deAuth, (req, res) => {
    const postId = req.params.id;
    const userId = res.locals.user.id;
    const existing = db_1.db.prepare("SELECT * FROM reactions WHERE user_id = ? AND post_id = ?").get(userId, postId);
    if (existing && existing.type === "like") {
        db_1.db.prepare("DELETE FROM reactions WHERE id = ?").run(existing.id);
    }
    else if (existing) {
        db_1.db.prepare("UPDATE reactions SET type = 'like' WHERE id = ?").run(existing.id);
    }
    else {
        db_1.db.prepare("INSERT INTO reactions (user_id, post_id, type) VALUES (?, ?, 'like')").run(userId, postId);
    }
    res.redirect(req.headers.referer || `/posts/${req.params.id}`);
});
exports.requestRouter.post("/posts/:id/dislike", authentification_1.deAuth, (req, res) => {
    const postId = req.params.id;
    const userId = res.locals.user.id;
    const existing = db_1.db.prepare("SELECT * FROM reactions WHERE user_id = ? AND post_id = ?").get(userId, postId);
    if (existing && existing.type === "dislike") {
        db_1.db.prepare("DELETE FROM reactions WHERE id = ?").run(existing.id);
    }
    else if (existing) {
        db_1.db.prepare("UPDATE reactions SET type = 'dislike' WHERE id = ?").run(existing.id);
    }
    else {
        db_1.db.prepare("INSERT INTO reactions (user_id, post_id, type) VALUES (?, ?, 'dislike')").run(userId, postId);
    }
    res.redirect(req.headers.referer || `/posts/${req.params.id}`);
});
exports.requestRouter.post("/posts/:id/comment", authentification_1.deAuth, (req, res) => {
    const content = req.body.content?.trim();
    if (!content) {
        return res.redirect(`/posts/${req.params.id}`);
    }
    db_1.db.prepare("INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)").run(req.params.id, res.locals.user.id, content);
    res.redirect(`/posts/${req.params.id}`);
});
