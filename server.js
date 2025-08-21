import express from 'express';
import puppeteer from 'puppeteer';

const app = express();
app.use(express.json({limit:'2mb'}));

app.get('/health', (req,res)=>res.json({ok:true}));

app.post('/render', async (req,res)=>{
  const { url, viewport = { width:1920, height:1080 }, userAgent = 'ClonotodoRenderer/1.2' } = req.body || {};
  if(!url) return res.status(400).json({error:'missing url'});
  let browser;
  try{
    browser = await puppeteer.launch({args:['--no-sandbox','--disable-setuid-sandbox']});
    const page = await browser.newPage();
    await page.setViewport(viewport);
    await page.setUserAgent(userAgent);
    const resp = await page.goto(url, { waitUntil: ['networkidle2'], timeout: 45000 });
    // Espera extra por frameworks lentos
    await page.waitForTimeout(1500);
    const html = await page.content();
    res.json({ html });
  }catch(err){
    res.status(500).json({error: String(err)});
  }finally{
    if(browser) await browser.close();
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, ()=>console.log('Renderer up on :'+PORT));
