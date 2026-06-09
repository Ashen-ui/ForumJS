import express from "express"
import path from "path"
import { requestRouter } from "./Routes/routes"
import { authUser } from "./Middleware/authentification"
import cookieParser from "cookie-parser"
const app = express()

app.set("view engine", "ejs")
app.use(express.static(path.join(__dirname, "..", "/static")))
app.use("/", requestRouter)
app.use(express.urlencoded({ extended: true}))
app.use(authUser)

app.listen(3000, () => {
    console.log(`Express running`);
})
