import express from "express"
import path from "path"
import { requestRouter } from "./Routes/routes"
import cookieParser from "cookie-parser"
import { authUser } from "./Middleware/authentification"
const app = express()

app.set("view engine", "ejs")
app.use(express.static(path.join(__dirname, "..", "/static")))
app.use(express.urlencoded({ extended: true}))
app.use(cookieParser())
app.use(authUser)
app.use("/", requestRouter)

app.listen(25034, () => {
    console.log(`Express running`);
})