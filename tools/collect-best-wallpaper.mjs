import fs from 'node:fs/promises';
const root = 'https://www.lxzin.com/samplebook/bestie_texture/';
let pending = [new URL('page/contents.html', root).href];
const seen = new Set();
const products = new Map();
const themes = {deeptexture:'딥 텍스처',calmingtexture:'카밍 텍스처',essentialtexture:'에센셜 텍스처',softtexture:'소프트 텍스처',ceiling:'천장지'};
const clean = s => s.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
while (pending.length) {
  const batch = pending.splice(0, 5).filter(url => !seen.has(url));
  await Promise.all(batch.map(async url => {
    seen.add(url);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${response.status} ${url}`);
    const html = (await response.text()).replace(/<!--[\s\S]*?-->/g,'');
    for (const match of html.matchAll(/(?:href\s*=\s*|location(?:\.href)?\s*=\s*)['"]([^'"]+\.html)(?:\?[^'"]*)?['"]/g)) {
      const target = new URL(match[1], url).href;
      if (target.startsWith(root) && !seen.has(target) && !pending.includes(target)) pending.push(target);
    }
    const theme = Object.entries(themes).find(([key])=>url.includes(`/page/${key}/`))?.[1];
    if (!theme) return;
    for (const match of html.matchAll(/class="section_images_code">([\s\S]*?)<\/div>\s*<div class="section_images_title">([\s\S]*?)<\/div>(?:\s*<div class="section_images_title2">([\s\S]*?)<\/div>)?/g)) {
      const productNo = clean(match[1]);
      if (!/^[A-Za-z]*\d+-\d+$/.test(productNo)) continue;
      const row = {productNo,design:clean(match[2]),color:clean(match[3]??''),theme,sourceUrl:url};
      const old = products.get(productNo);
      if (old && (old.design!==row.design || old.color!==row.color)) throw new Error(`Conflicting product ${productNo}`);
      products.set(productNo,row);
    }
  }));
  if (seen.size>180) throw new Error('Unexpected crawl size');
}
const rows = [...products.values()].sort((a,b)=>a.productNo.localeCompare(b.productNo));
await fs.mkdir('docs/sources',{recursive:true});
await fs.writeFile('docs/sources/lx-best-wallpaper-20261004.json',JSON.stringify({source:root,pages:[...seen],products:rows},null,2)+'\n');
console.log(JSON.stringify({pages:seen.size,products:rows.length,themes:[...new Set(rows.map(r=>r.theme))],examples:rows.slice(0,5)},null,2));
