import puppeteer from 'puppeteer';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';

export default async function handler(req, res) {
  const { markdownText } = req.body;

  const markdownIt = new MarkdownIt({
    highlight: function (str, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(lang, str).value;
        } catch (__) {}
      }

      return ''; // use external default escaping
    },
  });

  const htmlContent = markdownIt.render(markdownText);

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(htmlContent);
  const pdfBuffer = await page.pdf({ format: 'A4' });
  await browser.close();

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=markdown.pdf');
  res.send(pdfBuffer);
}
