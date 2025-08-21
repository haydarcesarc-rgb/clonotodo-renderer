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
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-blink-features=AutomationControlled"
      ],
      executablePath: puppeteer.executablePath() // o channel: 'chrome'
    });

    const page = await browser.newPage();

    // Viewport & UA realista
    await page.setViewport(viewport || { width: 1366, height: 768 });
    await page.setUserAgent(
      userAgent ||
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36"
    );
    await page.setExtraHTTPHeaders({
      "accept-language": "es-ES,es;q=0.9,en;q=0.8"
    });

    // Navegar y capturar status inicial
    const response = await page.goto(url, {
      waitUntil: ["domcontentloaded", "networkidle2"],
      timeout: 60000
    });
    const status = response ? response.status() : 0;

    // A veces hay renders tardíos
    await page.waitForTimeout(1500);

    const html = await page.content();
    await browser.close();

    // Siempre devolver 200 con el HTML y el status del origen
    return res.status(200).json({ html, originStatus: status });
  } catch (err) {
    return res.status(200).json({
      html: "",
      originStatus: 0,
      error: String(err)
    });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Renderer up on :${PORT}`));
