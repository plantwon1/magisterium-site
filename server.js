require("dotenv").config();

const express = require("express");

const app = express();

app.use(express.json());
app.use(express.static("public"));

app.post("/chat", async (req, res) => {

  try {

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

          messages: [
            {
              role: "user",
              content: req.body.message
            }
          ]
        })
      }
    );

    const data = await response.json();

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