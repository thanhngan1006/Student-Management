const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const app = express();

app.use((req, res, next) => {
    next();
});

app.use("/class", createProxyMiddleware({ 
    target: "http://localhost:4000", 
    changeOrigin: true , 
    logLevel: "debug", 
}));
app.use("/education", createProxyMiddleware({ 
    target: "http://localhost:4001", 
    changeOrigin: true , 
    logLevel: "debug",
}));
app.use("/score", createProxyMiddleware({ 
    target: "http://localhost:4002", 
    changeOrigin: true , 
    logLevel: "debug"
}));
app.use("/user", createProxyMiddleware({ 
    target: "http://localhost:4003", 
    changeOrigin: true , 
    logLevel: "debug"
}));
app.use("/forum", createProxyMiddleware({ 
    target: "http://localhost:4004", 
    changeOrigin: true , 
    logLevel: "debug"
}));

const PORT = 1234;
app.listen(PORT, () => {
    console.log(`API Gateway running on http://localhost:${PORT}`);
});
