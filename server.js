import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.static(path.join(__dirname, "public")));
app.get("*", (_req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", ()=>console.log(`Kantin Tycoon 3D running on http://localhost:${port}`));
