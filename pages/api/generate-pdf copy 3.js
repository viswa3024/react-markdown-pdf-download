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
  const pdfBuffer = await page.pdf({ format: 'A4', margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' },
  displayHeaderFooter: true,
  headerTemplateFirst: `
               <div style="font-size: 12px; text-align: center;">
                   <span>Test</span>
               </div>`,
  headerTemplate: `
  <div style="font-size: 12px; padding-left: 50px;color: #333;display: flex;justify-content: center;">Test</div>
`,

// headerTemplate: `
// <div style="font-size: 12px; padding: 5px; text-align: center;">
//   ${await page.evaluate(() => {
//     console.log("----------------------------")
//     console.log('Current page number:', document.querySelector('.pageNumber').textContent);
//     return `<span style="color: #333;">${document.querySelector('.pageNumber').textContent === '1' ? 'Header Title' : ''}</span>`;
//   })}
// </div>
// `,
  footerTemplate: `<div style="font-size: 12px; padding-left: 50px;right:0; margin-right:0; text-align: end;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>`, });
  await browser.close();

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  res.send(pdfBuffer);
}
