const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const PORT = process.env.PORT || 4004;
const forumRoutes = require("./routes/forumRoutes");

app.use(cors());
require("./config/db");
app.use(express.json());

app.use("/api", forumRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
