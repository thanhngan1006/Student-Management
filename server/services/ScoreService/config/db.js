require("dotenv").config();
const mongoose = require("mongoose");

const mongoURI = process.env.MONGO_URL;
if (!mongoURI) {
  console.error("LỖI: MONGO_URL không được định nghĩa trong file .env!");
  process.exit(1);
}
mongoose
  .connect(mongoURI, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
    // serverSelectionTimeoutMS: 20000
  })
  .then(() => {
    console.log(`Database connected to ${mongoose.connection.db.databaseName}`);
  })
  .catch((err) => {
    console.error("Database connection error:", err);
  });
