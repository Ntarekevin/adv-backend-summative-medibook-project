const LOCALES = {
  en: require('../../locales/en.json'),
  fr: require('../../locales/fr.json'),
};

function loadLocale(lang) {
  const l = Object.prototype.hasOwnProperty.call(LOCALES, lang) ? lang : 'en';
  return { lang: l, data: LOCALES[l] };
}

function render(req, res) {
  const { lang, data } = loadLocale(req.query.lang);
  const today = new Intl.DateTimeFormat(lang, { dateStyle: 'full' }).format(new Date());
  const qs = data.questions.map((q, i) => `
    <div class="q">
      <label>${i + 1}. ${q}</label>
      <textarea name="q${i + 1}" rows="4" required></textarea>
    </div>`).join('');
  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<title>${data.title}</title>
<style>
 body{font-family:sans-serif;max-width:700px;margin:2rem auto;padding:0 1rem}
 .q{margin-bottom:1rem}
 textarea{width:100%;padding:.5rem;font-size:1rem}
 header{margin-bottom:1rem}
</style>
</head>
<body>
 <header>
   <h1>${data.title}</h1>
   <p><strong>${today}</strong></p>
   <p>${data.instructions}</p>
 </header>
 <form method="post" action="/feedback">
   ${qs}
   <button type="submit">${data.submit}</button>
 </form>
</body></html>`;
  res.type('html').send(html);
}

module.exports = { render };