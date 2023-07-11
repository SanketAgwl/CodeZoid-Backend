const mongoose = require("mongoose");
const Promise = require("bluebird");

function DBConnect() {
  mongoose.connect(process.env.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const database = mongoose.connection;

  database.on(
    "error",
    console.error.bind(console, "❌ mongodb connection error")
  );
  database.once("open", () => console.log("✅ mongodb connected successfully"));
}

module.exports = DBConnect;
