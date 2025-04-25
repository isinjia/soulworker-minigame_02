const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

// public 폴더에 정적 파일 서빙
app.use(express.static(path.join(__dirname, "public")));

app.listen(3000, '0.0.0.0', () => {
  console.log("Server on!");
});
