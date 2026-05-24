require("dotenv").config();

const rateLimit = require("express-rate-limit");

const express = require("express");

const app = express();

let conversation = [];

const session = require("express-session");

app.use(session({
  secret: process.env.SESSION_SECRET || "dev_secret",
  resave: false,
  saveUninitialized: true
}));

const chatLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 20,

  handler: (req, res) => {
    res.status(429).json({
      error: "You’ve reached your daily limit of 20 messages. Try again tomorrow."
    });
  }
});

app.use(express.json());
app.use(express.static("public"));

app.post("/master", (req, res) => {

  const { password } = req.body;

  if (password === process.env.MASTER_PASSWORD) {
    req.session.isMaster = true;
    return res.json({ success: true });
  }

  res.status(401).json({ success: false });
});

app.post("/chat", chatLimiter, async (req, res) => {

  const isMaster = req.session.isMaster === true;
  const limit = isMaster ? 1000 : 20;

  try {

    conversation.push({
      role: "user",
      content: req.body.message
    });


    const response = await fetch(
      "https://www.magisterium.com/api/v1/chat/completions",
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${process.env.MAGISTERIUM_API_KEY}`,

          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          model: "magisterium-1",

          messages: conversation
        })
      }
    );

    const data = await response.json();

    const reply =
      data.choices[0].message.content;

    conversation.push({
      role: "assistant",
      content: reply
    });

    res.json(data);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Server failed"
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Running on port ${PORT}`);
});