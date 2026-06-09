import express from "express"
import path from "path"
import { requestRouter } from "./Routes/routes"
const app = express()

app.set("view engine", "ejs")
app.use(express.static(path.join(__dirname, "..", "/static")))
app.use("/", requestRouter)

app.listen(3000, () => {
    console.log(`Express running`);
})
