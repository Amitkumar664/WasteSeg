const vision = require("@google-cloud/vision");
const visionClient = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const multer = require("multer");
const nodemailer = require("nodemailer");
const expressLayouts = require('express-ejs-layouts');
const upload = multer({ storage: multer.memoryStorage() });

const axios = require("axios");
const FormData = require("form-data");
const app = express();
const PORT = process.env.PORT || 5000;
const GRADIO_API = process.env.GRADIO_API;
// Middleware
app.use(cors());
app.use(express.json());

const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'Boilerplate/boilerplate');

// Default route
app.get('/', (req, res) => {
  res.render("Main/index.ejs");
});
app.get('/learn',(req,res)=>{
  res.render("Learn/learn.ejs");
});

app.get('/ai',(req,res)=>{
  res.render("Main/ai.ejs");
});
app.get('/contact',(req,res)=>{
  res.render("Main/contact.ejs");
});



app.post("/identify-waste", upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No image uploaded" });

  try {
    // Send image buffer to Google Vision
    const [result] = await visionClient.labelDetection(req.file.buffer);
    const labels = result.labelAnnotations;

    // Extract label descriptions
    const labelNames = labels.map(l => l.description.toLowerCase());
    console.log("Vision Labels:", labelNames);

    // Waste category mapping
    const categories = {
      plastic: ["plastic", "bottle", "container", "polyethylene"],
      metal: ["metal", "tin", "aluminum", "can"],
      glass: ["glass", "jar", "bottle"],
      paper: ["paper", "cardboard", "carton"],
      organic: ["food", "banana", "vegetable", "fruit", "organic"],
      ewaste: ["electronic", "circuit", "phone", "battery", "device"]
    };

    let detectedCategory = "unknown";

    // Match labels to waste categories
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(k => labelNames.includes(k))) {
        detectedCategory = category;
        break;
      }
    }

    // Prepare final output
    const response = {
      category: detectedCategory,
      confidence: labels[0]?.score ? (labels[0].score * 100).toFixed(1) + "%" : "N/A",
      description: `Detected based on labels: ${labelNames.slice(0, 5).join(", ")}`
    };

    res.json({ result: response });
  } catch (error) {
    console.error("Cloud Vision Error:", error);
    res.status(500).json({ error: "Cloud Vision API failed" });
  }
});





app.post("/send-feedback", async (req, res) => {
  const { name, email, message } = req.body;

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: email,
      to: process.env.EMAIL_USER,
      subject: `New Feedback from ${name}`,
      text: message,
    });

    res.json({ success: true, message: "✅ Feedback sent successfully!" });
  } catch (error) {
    console.error("Nodemailer error:", error);
    res.json({ success: false, error: "❌ Failed to send feedback." });
  }
});
// Start server
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
