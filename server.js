import express from "express";
import puppeteer from "puppeteer";

const app = express();
app.use(express.json({ limit: "2mb" }));

app.get("/health", (req, res) => res.json({ ok: true }));

app.post("/render", async (req, res) => {
  const { url, viewport, userAgent } = req.body || {};
  if (!url) return res.status(400).json({ error: "Missing url" });

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

    if (viewport?.width && viewport?.height) {
      await page.setViewport({ width: viewport.width, height: viewport.height });
    } else {
      await page.setViewport({ width: 1366, height: 768 });
    }

    await page.setUserAgent(
      userAgent ||
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36"
    );
    await page.setExtraHTTPHeaders({ "accept-language": "es-ES,es;q=0.9,en;q=0.8" });

    const resp = await page.goto(url, { waitUntil: ["domcontentloaded", "networkidle2"], timeout: 60000 });
    const originStatus = resp ? resp.status() : 0;

    await page.waitForTimeout(1200);
    const html = await page.content();

    await browser.close();
    browser = null;

    return res.status(200).json({ html, originStatus });
  } catch (err) {
    try { if (browser) await browser.close(); } catch {}
    return res.status(200).json({ html: "", originStatus: 500, error: String(err) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Renderer service running on port ${PORT}`));
