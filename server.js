import express from "express";
import puppeteer from "puppeteer";

const app = express();
app.use(express.json());

// --- Health check ---
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// --- Render endpoint ---
app.post("/render", async (req, res) => {
  const { url, viewport, userAgent } = req.body;

  if (!url) {
    return res.status(400).json({ error: "Missing url" });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: true,
      executablePath: await puppeteer.executablePath(),
    });

    const page = await browser.newPage();

    // Configuración del viewport
    if (viewport?.width && viewport?.height) {
      await page.setViewport({
        width: viewport.width,
        height: viewport.height,
      });
    }

    // Configuración del userAgent
    if (userAgent) {
      await page.setUserAgent(userAgent);
    }

    // Cabeceras comunes para evitar bloqueos
    await page.setExtraHTTPHeaders({
      "accept-language": "es-ES,es;q=0.9,en;q=0.8",
    });

    // Intentar navegar
    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    const html = await page.content();
    const status = response?.status() ?? 0;

    res.status(200).json({
      originStatus: status,
      html,
    });
  } catch (err) {
    console.error("Render error:", err);
    res.status(200).json({
      originStatus: 500,
      html: "",
      error: err.message,
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

// --- Start server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Renderer service running on port ${PORT}`);
});
