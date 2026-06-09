import express from "express"
export const requestRouter = express.Router()

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