"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestRouter = void 0;
const express_1 = __importDefault(require("express"));
exports.requestRouter = express_1.default.Router();
exports.requestRouter.get("/", (req, res) => {
    res.render("index");
});
exports.requestRouter.get("/index", (req, res) => {
    res.render("index");
});
exports.requestRouter.get("/register", (req, res) => {
    res.render("registration");
});
exports.requestRouter.get("/static", (req, res) => {
    res.send("./views/static");
});
