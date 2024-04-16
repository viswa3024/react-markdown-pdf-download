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
  //await page.setContent(htmlContent);
  await page.setContent(`
    <div class="header-content" style="font-size: 24px; padding: 5px;color: #333;display: flex;justify-content: center;">Response PDF</div>
    ${htmlContent}
  `);
  await page.addStyleTag({ path: 'styles/github.css' }); // Path to the downloaded CSS file
  await page.addStyleTag({ content: `
  table {
      width: 100%;
      border-collapse: collapse;
  }

  th, td {
      border: 1px solid #dddddd;
      padding: 8px;
      text-align: left;
  }

  th {
      background-color: #f2f2f2;
  }
` });
  const filename = `Response-${Math.floor(new Date().valueOf() * Math.random())}.pdf`;
  const pdfBuffer = await page.pdf({ format: 'A4', margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' } });
  await browser.close();

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  res.send(pdfBuffer);
}
