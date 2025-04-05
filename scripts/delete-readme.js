const fs = require("fs");
const path = require("path");
const cwd = process.cwd();

const readmePath = path.join(cwd, "./README.md");

if (fs.existsSync(readmePath)) {
  fs.unlinkSync(readmePath);
  console.log("🧹 Temporary README.md deleted.");
}
