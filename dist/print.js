// The final print edition is built from the authored study, never the selected UI state.
buildPrint=function(orientation){
 const pages=[];
 const brief=c=>{const d=document.createElement('div');d.innerHTML=c.body;d.querySelectorAll('.examples,.selected-study,#map-info,details,button,.map-key').forEach(e=>e.remove());d.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));return d.innerHTML;};
 const page=(chapter,title,deck,content,kind)=>pages.push({chapter,title,deck,content,kind});
 chapters.slice(0,11).forEach((c,i)=>{
  const allSources=[...new Set([...c.sources,...c.findings.flatMap(f=>f.sources)])];
  const history=i===2?'<div class="print-timeline"><p><b>1790</b> Residence Act.</p><p><b>1791 / 1792</b> L’Enfant plan / published Ellicott revision.</p><p><b>1800</b> Government moves to Washington.</p><p><b>1851 / 1901–02</b> Downing landscape / McMillan composition.</p></div>':'';
  page(i+1,c.title,c.deck,'<div class="print-layout"><div class="print-visual">'+printVisual(c,i)+'</div><div class="print-body">'+brief(c)+history+takeaway(c.take)+shortSources(allSources)+'</div></div>','overview '+(i===1?'framework':i===2?'history':i===8?'landmarks':''));
  page(i+1,'Findings / '+c.short,c.headline,'<div class="print-findings">'+c.findings.map(findingHTML).join('')+'</div><div class="print-conclusion">'+takeaway(c.take)+'</div>','analysis');
  // Two authored examples per sheet keep every detail legible in both A4 orientations.
  for(let j=0;j<c.exampleNames.length;j+=2){const names=c.exampleNames.slice(j,j+2);page(i+1,'Site observations / '+c.short,'Architectural form → documented evidence → interpretation → key finding','<div class="print-site-studies">'+names.map(n=>exampleHTML(n)).join('')+'</div>','site-evidence');}
  if(i===9)for(let j=0;j<study.pairs.length;j+=5){page(10,'Relationships / '+(j===0?'01–05':'06–10'),'Completed conclusions for the interaction of Lynch’s five elements','<div class="print-relationships">'+study.pairs.slice(j,j+5).map(p=>'<div><h4>'+elements.find(e=>e.id===p.a).name+' + '+elements.find(e=>e.id===p.b).name+'</h4><p>'+p.text+'</p></div>').join('')+'</div>','relationships');}
 });
 const credits=chapters[11].body;
 // A dedicated method sheet retains scope, credits and the distance calculation basis.
 page(12,'Method & image credits','Research basis of the completed architectural and urban study','<div class="print-method">'+credits+takeaway(chapters[11].take)+'</div>','method');
 for(let j=0;j<refs.length;j+=9){page(12,'References / '+String(Math.floor(j/9)+1).padStart(2,'0'),'Numbered sources used in the observation sheets. Links remain clickable in the PDF.','<ul class="print-ref-list">'+refs.slice(j,j+9).map(([t,d,u],k)=>'<li><h4>['+(j+k+1)+'] '+t+'</h4><p>'+d+'</p><a href="'+u+'">'+u+'</a></li>').join('')+'</ul>','bibliography');}
 $('#print-edition').innerHTML=pages.map((p,i)=>'<section class="print-sheet final-sheet '+orientation+' '+p.kind+'"><div class="print-head"><small>WASHINGTON, D.C. / READING THE CITY · CHAPTER '+String(p.chapter).padStart(2,'0')+' · FINAL STUDY</small><h2>'+p.title+'</h2><p class="print-deck">'+p.deck+'</p></div><div class="print-content">'+p.content+'</div><div class="print-foot"><span>ARCHITECTURAL & URBAN ANALYSIS · 14 OCTOBER 2026</span><span>'+String(i+1).padStart(2,'0')+' / '+pages.length+'</span></div></section>').join('');
 let style=$('#print-page-style');if(!style){style=document.createElement('style');style.id='print-page-style';document.head.append(style);}style.textContent='@page {size:A4 '+orientation+';margin:0;}';
 document.body.dataset.orientation=orientation;$('#print-label').textContent='A4 '+orientation+' · '+pages.length+' sheets';document.body.classList.add('print-preview');$('#print-toolbar').hidden=false;window.scrollTo(0,0);
};
window.buildPrint=buildPrint;
