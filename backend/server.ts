import express from "express";

console.log("BOOT STARTED");

const app = express();
const PORT = Number(process.env.PORT || 10000);

console.log("PORT", PORT);

app.get("/api/health", (_req, res) => {
  res.status(200).send("OK");
});

app.get("/health", (_req, res) => {
  res.status(200).send("OK");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("SERVER LISTENING");
});
