import express from "express";
import puppeteer from "puppeteer";

const app = express();
app.use(express.json({ limit: "2mb" }));

// Health
app.get("/health", (_req, res) => res.json({ ok: true }));

// Helper: delay sin depender de Puppeteer
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

app.post("/render", async (req, res) => {
  const { url, viewport, userAgent } = req.body || {};
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Missing url (string)" });
  }

  // Defaults
  const vp = viewport && typeof viewport === "object"
    ? { width: +viewport.width || 1366, height: +viewport.height || 768 }
    : { width: 1366, height: 768 };

  const ua =
    userAgent ||
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36";

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-blink-features=AutomationControlled"
      ],
      executablePath: await puppeteer.executablePath()
    });

    const page = await browser.newPage();
    await page.setViewport(vp);
    await page.setUserAgent(ua);
    await page.setExtraHTTPHeaders({ "accept-language": "es-ES,es;q=0.9,en;q=0.8" });

    const resp = await page.goto(url, {
      waitUntil: ["domcontentloaded", "networkidle2"],
      timeout: 60000
    });
    const originStatus = resp ? resp.status() : 0;

    // Espera breve sin usar page.waitForTimeout (compat universal)
    await delay(1200);

    const html = await page.content();

    await browser.close();
    browser = null;

    return res.status(200).json({ html, originStatus });
  } catch (err) {
    try { if (browser) await browser.close(); } catch {}
    return res.status(200).json({
      html: "",
      originStatus: 500,
      error: String(err)
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Renderer service running on port ${PORT}`);
});
