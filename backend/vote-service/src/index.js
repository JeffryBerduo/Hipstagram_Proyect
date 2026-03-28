require("dotenv").config();
const express = require("express");
const cors    = require("cors");

const voteRoutes = require("./routes/vote.routes");
require("./config/db");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/votes", voteRoutes);

const PORT = process.env.PORT || 3003;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
