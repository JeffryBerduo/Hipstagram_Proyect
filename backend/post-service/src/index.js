require("dotenv").config();
const express = require("express");
const cors    = require("cors");

const postRoutes = require("./routes/post.routes");
require("./config/db");

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use("/api/posts", postRoutes);

const PORT = process.env.PORT || 3003;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
