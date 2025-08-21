const express = require("express");
const puppeteer = require("puppeteer");

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/health", (req, res) => res.json({ ok: true }));

app.post("/render", async (req, res) => {
  const { url, viewport, userAgent } = req.body || {};
  if (!url) return res.status(400).json({ error: "url is required" });

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      executablePath: puppeteer.executablePath()
    });

    const page = await browser.newPage();
    if (viewport) await page.setViewport(viewport);
    if (userAgent) await page.setUserAgent(userAgent);

    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    const html = await page.content();
    await browser.close();

    res.status(200).send({ html });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Renderer up on :${PORT}`));
