"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const routes_1 = require("./Routes/routes");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const authentification_1 = require("./Middleware/authentification");
const app = (0, express_1.default)();
app.set("view engine", "ejs");
app.use(express_1.default.static(path_1.default.join(__dirname, "..", "/static")));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.use(authentification_1.authUser);
app.use("/", routes_1.requestRouter);
app.listen(25034, () => {
    console.log(`Express running`);
});
