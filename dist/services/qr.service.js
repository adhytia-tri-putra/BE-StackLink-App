"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateQRCode = generateQRCode;
exports.buildProfileUrl = buildProfileUrl;
const qrcode_1 = __importDefault(require("qrcode"));
async function generateQRCode(url, options = {}) {
    const { width = 300, margin = 2, darkColor = "#000000", lightColor = "#ffffff", format = "base64", } = options;
    if (format === "svg") {
        const svg = await qrcode_1.default.toString(url, {
            type: "svg",
            margin,
            color: { dark: darkColor, light: lightColor },
        });
        return { format: "svg", data: svg, url };
    }
    const dataUrl = await qrcode_1.default.toDataURL(url, {
        width,
        margin,
        color: { dark: darkColor, light: lightColor },
    });
    return { format: "png/base64", data: dataUrl, url };
}
function buildProfileUrl(baseUrl, username) {
    return `${baseUrl.replace(/\/$/, "")}/${username}`;
}
