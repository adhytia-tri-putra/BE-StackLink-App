"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = notFoundHandler;
exports.errorHandler = errorHandler;
function notFoundHandler(req, res) {
    return res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} tidak ditemukan.`,
    });
}
function errorHandler(err, _req, res, _next) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Terjadi kesalahan pada server.";
    return res.status(500).json({
        success: false,
        message,
    });
}
