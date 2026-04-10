fetch('https://bina.az/items/6019761', {
  headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' }
})
.then(r => r.text())
.then(html => {
  const match = html.match(/id="__NEXT_DATA__" type="application\/json">([^<]+)<\/script>/);
  if (match) {
    const data = JSON.parse(match[1]);
    const apollo = data.props.pageProps.initialApolloState;
    if (apollo) {
      const itemKey = Object.keys(apollo).find(k => k.startsWith('Item:'));
      if (itemKey) console.log(JSON.stringify(apollo[itemKey], null, 2));
    }
  } else {
    console.log("No NEXT_DATA found");
    if(html.includes('Cloudflare') || html.includes('captcha')) console.log("Blocked by Cloudflare/Captcha");
  }
});
