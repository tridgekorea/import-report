// 차트함수
function mkChart(id,cfg){if(charts[id])charts[id].destroy();var el=document.getElementById(id);if(!el)return;charts[id]=new Chart(el,cfg);}
var GC='rgba(255,255,255,0.06)',TC='#7A95B8';
var PIE=['#00C9A7','#3B82F6','#F59E0B','#EF4444','#8B5CF6','#EC4899','#10B981','#64748B','#F97316','#06B6D4'];

function chHealthGauge(score,color,elId){
  var el=document.getElementById(elId);
  if(!el)return;
  var pct=Math.min(100,Math.max(0,score));
  var grade=score>=85?'A':score>=70?'B':score>=55?'C':score>=40?'D':'F';
  var label=score>=85?'최우수':score>=70?'양호':score>=55?'개선 필요':score>=40?'위험':'심각';
  var total=20;
  var filled=Math.round(pct/100*total);
  var cells='';
  for(var i=0;i<total;i++){
    var on=i<filled;
    cells+='<div style="flex:1;height:14px;border-radius:2px;background:'+(on?color:'rgba(255,255,255,.08)')+'"></div>';
  }
  el.innerHTML=
    '<div style="width:100%">'
    +'<div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:10px">'
    +'<div style="display:flex;align-items:baseline;gap:8px">'
    +'<span style="font-size:38px;font-weight:900;color:'+color+';letter-spacing:-2px;line-height:1">'+score+'</span>'
    +'<span style="font-size:15px;color:var(--text2)">점</span>'
    +'<span style="font-size:16px;font-weight:700;color:'+color+'">'+grade+'등급</span>'
    +'<span style="font-size:12px;background:'+color+'22;color:'+color+';padding:2px 10px;border-radius:20px;font-weight:600">'+label+'</span>'
    +'</div>'
    +'<span style="font-size:11px;color:var(--text3)">100점 만점</span>'
    +'</div>'
    +'<div style="display:flex;gap:3px;margin-bottom:6px">'+cells+'</div>'
    +'<div style="font-size:11px;color:var(--text3);text-align:right">'+pct+' / 100점</div>'
    +'</div>';
}
function chAnnual(yrData){mkChart('ch-a',{type:'bar',data:{labels:yrData.map(function(d){return d.year;}),datasets:[{type:'bar',data:yrData.map(function(d){return d.volTons;}),backgroundColor:'rgba(0,201,167,.55)',borderColor:'#00C9A7',borderWidth:1,borderRadius:5,yAxisID:'y1'},{type:'line',data:yrData.map(function(d){return d.avgP;}),borderColor:'#F59E0B',backgroundColor:'#F59E0B',pointRadius:5,pointHoverRadius:7,borderWidth:2.5,tension:.35,yAxisID:'y2'}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:function(ctx){return ctx.datasetIndex===0?' '+ctx.parsed.y+'t':' $'+ctx.parsed.y+'/kg';}}}},scales:{x:{grid:{color:GC},ticks:{color:TC}},y1:{position:'left',grid:{color:GC},ticks:{color:TC,callback:function(v){return v+'t';}}},y2:{position:'right',grid:{display:false},ticks:{color:'#F59E0B',callback:function(v){return '$'+v;}},min:0}}}});}

function chQ(qData){mkChart('ch-q',{type:'bar',data:{labels:qData.map(function(d){return d.yq;}),datasets:[{type:'bar',data:qData.map(function(d){return d.volTons;}),backgroundColor:'rgba(59,130,246,.45)',borderColor:'#3B82F6',borderWidth:1,borderRadius:3,yAxisID:'y1'},{type:'line',data:qData.map(function(d){return d.avgP;}),borderColor:'#F59E0B',backgroundColor:'#F59E0B',pointRadius:3,borderWidth:2,tension:.35,yAxisID:'y2'}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{color:GC},ticks:{color:TC,font:{size:9},maxRotation:45,autoSkip:false}},y1:{position:'left',grid:{color:GC},ticks:{color:TC,callback:function(v){return v+'t';}}},y2:{position:'right',grid:{display:false},ticks:{color:'#F59E0B',callback:function(v){return '$'+v;}},min:0}}}});}

function chHS(hsData){mkChart('ch-hs',{type:'doughnut',data:{labels:hsData.map(function(d){return d.key+'('+d.pct+'%)';}),datasets:[{data:hsData.map(function(d){return d.volTons;}),backgroundColor:PIE,borderWidth:2,borderColor:'#080F1E',hoverOffset:8}]},options:{responsive:true,maintainAspectRatio:false,cutout:'60%',plugins:{legend:{display:true,position:'right',labels:{color:TC,font:{size:10},boxWidth:10,padding:8}}}}});}

function chOrig(origData){mkChart('ch-or',{type:'bar',data:{labels:origData.map(function(d){return d.key;}),datasets:[{data:origData.map(function(d){return d.volTons;}),backgroundColor:origData.map(function(_,i){return PIE[i%PIE.length];}),borderRadius:5}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:function(ctx){return ' '+ctx.parsed.x+'t';}}}},scales:{x:{grid:{color:GC},ticks:{color:TC,callback:function(v){return v+'t';}}},y:{grid:{display:false},ticks:{color:TC,font:{size:11}}}}}});}

function chProd(prodData){mkChart('ch-pr',{type:'bar',data:{labels:prodData.map(function(d){return d.key;}),datasets:[{data:prodData.map(function(d){return d.volTons;}),backgroundColor:'rgba(139,92,246,.65)',borderColor:'#8B5CF6',borderWidth:1,borderRadius:4}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{color:GC},ticks:{color:TC,callback:function(v){return v+'t';}}},y:{grid:{display:false},ticks:{color:TC,font:{size:9}}}}}});}

function chSeasonality(monthData){
  mkChart('ch-season',{type:'bar',data:{labels:monthData.map(function(d){return d.name;}),datasets:[{type:'bar',data:monthData.map(function(d){return d.volTons;}),backgroundColor:'rgba(0,201,167,.5)',borderColor:'#00C9A7',borderWidth:1,borderRadius:4,yAxisID:'y1'},{type:'line',data:monthData.map(function(d){return d.avgP||null;}),borderColor:'#F59E0B',backgroundColor:'#F59E0B',pointRadius:3,borderWidth:2,tension:.35,yAxisID:'y2',spanGaps:true}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:function(ctx){return ctx.datasetIndex===0?' '+ctx.parsed.y+'t':' $'+ctx.parsed.y+'/kg';}}}},scales:{x:{grid:{display:false},ticks:{color:TC,font:{size:10}}},y1:{position:'left',grid:{color:GC},ticks:{color:TC,callback:function(v){return v+'t';}}},y2:{position:'right',grid:{display:false},ticks:{color:'#F59E0B',callback:function(v){return '$'+v;}}}}}});
}

function chComp(ss,idx,blind){var s=ss[idx];if(!s)return;var labels=s.comps.map(function(c,i){return blind?'경쟁사 '+'ABCDEFGHI'[i]:c.imp.slice(0,15);});labels.push('★ 이 회사');var data=s.comps.map(function(c){return c.avgP;});data.push(s.compP);var colors=s.comps.map(function(c){return c.avgP<s.compP?'rgba(0,201,167,.75)':'rgba(100,116,139,.4)';});colors.push('rgba(239,68,68,.85)');var minV=Math.max(0,Math.min.apply(null,data)-0.2);mkChart('ch-cm',{type:'bar',data:{labels:labels,datasets:[{data:data,backgroundColor:colors,borderRadius:4}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:function(ctx){return ' $'+ctx.parsed.x.toFixed(3)+'/kg';}}}},scales:{x:{grid:{color:GC},ticks:{color:TC,callback:function(v){return '$'+v.toFixed(2);}},min:minV},y:{grid:{display:false},ticks:{color:TC,font:{size:10}}}}}});}

function chGapTrend(ss,idx){
  var s=ss[idx];if(!s||!s.gapByYear||!s.gapByYear.length)return;
  var g=s.gapByYear.filter(function(d){return d.marketP!=null;});if(g.length<2)return;
  mkChart('ch-gap',{type:'line',data:{labels:g.map(function(d){return d.year;}),datasets:[{label:'이 회사',data:g.map(function(d){return d.companyP;}),borderColor:'#EF4444',backgroundColor:'rgba(239,68,68,.1)',pointRadius:4,borderWidth:2.5,tension:.3,fill:false},{label:'시장(경쟁사)',data:g.map(function(d){return d.marketP;}),borderColor:'#00C9A7',backgroundColor:'rgba(0,201,167,.1)',pointRadius:4,borderWidth:2.5,tension:.3,fill:false}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:true,labels:{color:TC,font:{size:11},boxWidth:10}},tooltip:{callbacks:{label:function(ctx){return ' '+ctx.dataset.label+': $'+ctx.parsed.y+'/kg';}}}},scales:{x:{grid:{color:GC},ticks:{color:TC}},y:{grid:{color:GC},ticks:{color:TC,callback:function(v){return '$'+v;}}}}}});
}

function chOrigComp(origComp){var f=origComp.filter(function(o){return o.mAvg;});if(!f.length)return;mkChart('ch-oc',{type:'bar',data:{labels:f.map(function(o){return o.orig;}),datasets:[{label:'이 회사',data:f.map(function(o){return o.cAvg;}),backgroundColor:'rgba(239,68,68,.75)',borderRadius:4},{label:'시장평균',data:f.map(function(o){return o.mAvg;}),backgroundColor:'rgba(0,201,167,.65)',borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:true,labels:{color:TC,font:{size:11},boxWidth:10}}},scales:{x:{grid:{display:false},ticks:{color:TC}},y:{grid:{color:GC},ticks:{color:TC,callback:function(v){return '$'+v;}},min:0}}}});}

// ─── 타이밍 캘린더: 월별 시장 단가 + 물량 ───
function chTimingCalendar(timing){
  if(!timing)return;var m=timing.marketByMonth;
  var lowSet={};timing.lowMonths.forEach(function(x){lowSet[x]=true;});
  var barColors=m.map(function(d){return lowSet[d.month]?'rgba(16,185,129,.7)':'rgba(100,116,139,.35)';});
  mkChart('ch-tcal',{type:'bar',data:{labels:m.map(function(d){return d.name;}),datasets:[{type:'bar',data:m.map(function(d){return d.volTons;}),backgroundColor:barColors,borderRadius:4,yAxisID:'y1',order:2},{type:'line',data:m.map(function(d){return d.avgP||null;}),borderColor:'#F59E0B',backgroundColor:'#F59E0B',pointRadius:4,borderWidth:2.5,tension:.35,yAxisID:'y2',order:1,spanGaps:true}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:function(ctx){return ctx.datasetIndex===0?' 시장 물량 '+ctx.parsed.y+'t':' 시장 단가 $'+ctx.parsed.y+'/kg';}}}},scales:{x:{grid:{display:false},ticks:{color:TC,font:{size:10}}},y1:{position:'left',grid:{color:GC},ticks:{color:TC,callback:function(v){return v+'t';}}},y2:{position:'right',grid:{display:false},ticks:{color:'#F59E0B',callback:function(v){return '$'+v;}}}}}});
}

// ─── 타이밍 비교: 경쟁사 vs 자사 구매 월 + 시장 단가 ───
function chTimingCompare(timing){
  if(!timing)return;var m=timing.marketByMonth,c=timing.companyByMonth,comp=timing.compByMonth;
  mkChart('ch-tcmp',{data:{labels:m.map(function(d){return d.name;}),datasets:[{type:'bar',label:'자사 매수',data:c.map(function(d){return d.volTons;}),backgroundColor:'rgba(239,68,68,.7)',borderRadius:3,yAxisID:'y1',order:3},{type:'bar',label:'경쟁사 매수',data:comp.map(function(d){return d.volTons;}),backgroundColor:'rgba(59,130,246,.55)',borderRadius:3,yAxisID:'y1',order:2},{type:'line',label:'시장 단가',data:m.map(function(d){return d.avgP||null;}),borderColor:'#F59E0B',backgroundColor:'#F59E0B',pointRadius:3,borderWidth:2.5,tension:.35,yAxisID:'y2',order:1,spanGaps:true}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:true,labels:{color:TC,font:{size:10},boxWidth:10}},tooltip:{callbacks:{label:function(ctx){return ctx.dataset.type==='line'?' 시장 단가 $'+ctx.parsed.y+'/kg':' '+ctx.dataset.label+' '+ctx.parsed.y+'t';}}}},scales:{x:{grid:{display:false},ticks:{color:TC,font:{size:10}}},y1:{position:'left',grid:{color:GC},ticks:{color:TC,callback:function(v){return v+'t';}}},y2:{position:'right',grid:{display:false},ticks:{color:'#F59E0B',callback:function(v){return '$'+v;}}}}}});
}

function chWaterfall(wfData){if(!wfData||!wfData.items.length)return;var items=wfData.items;var labels=items.map(function(d){return d.supplier.slice(0,12);});var values=items.map(function(d){return d.saving;});var colors=items.map(function(d,i){return i===0?'rgba(239,68,68,.85)':i===1?'rgba(245,158,11,.75)':'rgba(59,130,246,.65)';});mkChart('ch-wf',{type:'bar',data:{labels:labels,datasets:[{data:values,backgroundColor:colors,borderRadius:5,borderSkipped:false}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{title:function(items){return wfData.items[items[0].dataIndex]?wfData.items[items[0].dataIndex].supplier:'';},label:function(ctx){return ' $'+ctx.parsed.x.toFixed(0)+'K 절감 가능';},afterLabel:function(ctx){var d=wfData.items[ctx.dataIndex];return d?' 단가 갭 $'+d.overpay.toFixed(3)+'/kg × '+d.vol+'t':'';}}}},scales:{x:{grid:{color:GC},ticks:{color:TC,callback:function(v){return '$'+v+'K';}},title:{display:true,text:'연간 절감 가능액 (USD K)',color:TC,font:{size:10}}},y:{grid:{display:false},ticks:{color:TC,font:{size:11}}}}}});}

function chNegMatrix(nm){if(!nm||!nm.points.length)return;var colorMap={'strategic':'rgba(239,68,68,.8)','quickwin':'rgba(245,158,11,.75)','monitor':'rgba(59,130,246,.7)','low':'rgba(100,116,139,.5)'};var datasets=nm.points.map(function(p){return {label:p.supplier,data:[{x:p.volume,y:p.gapPct,r:Math.max(8,Math.min(30,p.savingK/5))}],backgroundColor:colorMap[p.quadrant]||'rgba(100,116,139,.5)',borderColor:'rgba(255,255,255,.2)',borderWidth:1};});mkChart('ch-mat',{type:'bubble',data:{datasets:datasets},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:function(ctx){var p=nm.points[ctx.datasetIndex];return p?' '+p.supplier+' | 볼륨:'+p.volume+'t | 갭:'+p.gapPct+'% | 절감:$'+p.savingK+'K':'';}}}},scales:{x:{grid:{color:GC},ticks:{color:TC,callback:function(v){return v+'t';}},title:{display:true,text:'수입 볼륨 (톤)',color:TC,font:{size:10}}},y:{grid:{color:GC},ticks:{color:TC,callback:function(v){return v+'%';}},title:{display:true,text:'단가 갭 (%)',color:TC,font:{size:10}},min:0}}}});}

function chROI(s1K,s2K,tridgeCost,tridgeNeg){var labels=['시나리오1\n경쟁사단가','시나리오2\n+대안소싱'];var data=[s1K,s2K];var colors=['rgba(239,68,68,.8)','rgba(16,185,129,.8)'];if(tridgeCost){labels.push('Tridge\n구독료');data.push(-(tridgeCost/1000));colors.push('rgba(245,158,11,.7)');}else if(tridgeNeg){labels.push('Tridge\n(협상중)');data.push(-10);colors.push('rgba(245,158,11,.35)');}mkChart('ch-roi',{type:'bar',data:{labels:labels,datasets:[{data:data,backgroundColor:colors,borderRadius:5}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:function(ctx){return ' $'+Math.abs(ctx.parsed.y).toFixed(0)+'K'+(ctx.parsed.y<0?' (비용)':' (절감)');}}}},scales:{x:{grid:{display:false},ticks:{color:TC,font:{size:10}}},y:{grid:{color:GC},ticks:{color:TC,callback:function(v){return '$'+Math.abs(v)+'K';}}}}}});}

// ─── 페이백 곡선: 누적 절감 vs 구독료 ───
function chPayback(pb){
  if(!pb||!pb.points)return;
  mkChart('ch-pay',{data:{labels:pb.points.map(function(d){return d.month+'개월';}),datasets:[{type:'line',label:'누적 절감액',data:pb.points.map(function(d){return d.cumSaving;}),borderColor:'#10B981',backgroundColor:'rgba(16,185,129,.12)',pointRadius:3,borderWidth:2.5,tension:.2,fill:true,order:2},{type:'line',label:'Tridge 구독료',data:pb.points.map(function(d){return d.cost;}),borderColor:'#F59E0B',borderDash:[6,4],pointRadius:0,borderWidth:2,fill:false,order:1}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:true,labels:{color:TC,font:{size:11},boxWidth:10}},tooltip:{callbacks:{label:function(ctx){return ' '+ctx.dataset.label+': $'+ctx.parsed.y+'K';}}}},scales:{x:{grid:{display:false},ticks:{color:TC,font:{size:9}}},y:{grid:{color:GC},ticks:{color:TC,callback:function(v){return '$'+v+'K';}}}}}});
}

// ─── Before/After 비교 ───
function chBeforeAfter(items){
  if(!items||!items.length)return;
  mkChart('ch-ba',{type:'bar',data:{labels:items.map(function(d){return d.label;}),datasets:[{label:'현재 (Before)',data:items.map(function(d){return d.before;}),backgroundColor:'rgba(239,68,68,.75)',borderRadius:4},{label:'목표 (After)',data:items.map(function(d){return d.after;}),backgroundColor:'rgba(16,185,129,.75)',borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:true,labels:{color:TC,font:{size:11},boxWidth:10}},tooltip:{callbacks:{label:function(ctx){return ' '+ctx.dataset.label+': $'+ctx.parsed.y+'/kg';}}}},scales:{x:{grid:{display:false},ticks:{color:TC,font:{size:10}}},y:{grid:{color:GC},ticks:{color:TC,callback:function(v){return '$'+v;}},min:0}}}});
}


var STEPS=[{n:'01',l:'업로드',sn:1},{n:'02',l:'포트폴리오',sn:2},{n:'03',l:'카테고리·매칭',sn:3},{n:'↳',l:'품목확인',sn:3.5,sub:true},{n:'04',l:'시장비교',sn:4},{n:'05',l:'ROI·기대효과',sn:5},{n:'06',l:'인사이트·출력',sn:6}];
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function tag(cls,text){return '<span class="tag '+cls+'">'+esc(text)+'</span>';}
function alrt(cls,html){return '<div class="alert '+cls+'">'+html+'</div>';}
function cap(html){return '<div class="chart-cap">'+html+'</div>';}

function renderStepBar(){
  var h='';
  STEPS.forEach(function(s){
    var sn=s.sn;
    var isA=S.step===sn;
    var isD=(S.step>sn)||(S.step===3.5&&sn===3)||(S.step>=4&&sn===3.5);
    var cls='si'+(isA?' active':isD?' done':'')+(s.sub?' sub':'');
    h+='<div class="'+cls+'" onclick="gs('+sn+')"><div class="sn">'+s.n+'</div><span class="sl">'+s.l+'</span>'+(isD?'<div class="sc">✓</div>':'')+'</div>';
  });
  document.getElementById('stepbar').innerHTML=h;
}
function gs(n){if(n>1&&!S.portfolio)return;if(n===3.5&&!Object.keys(S.categoryMatchings).length)return;S.step=n;render();}


/* ── v6 NEW FUNCTIONS ── */
function rCategorySelect(){
  var p=S.portfolio;
  if(!p)return '<div class="empty-state"><p>포트폴리오 분석을 먼저 실행해주세요.</p></div>';
  var cats=p.hsData||[];
  var selSet={};S.selectedCategories.forEach(function(k){selSet[k]=true;});

  var catCards='';
  cats.forEach(function(c){
    if(!c.key||c.key==='undefined')return;
    var sel=selSet[c.key];
    var displayName=c.categoryName||c.key;
    var subLine=(c.topProductName&&c.topProductName!==displayName)?c.topProductName:'';
    var hsTag=c.hsCode&&c.hsCode!==c.key?'HS '+c.hsCode:'';
    catCards+='<div class="cat-select-card'+(sel?' selected':'')+'" onclick="toggleCat(\''+c.key.replace(/'/g,'\\\'')+'\')">'
      +'<div class="cat-check">'+(sel?'✓':'')+'</div>'
      +'<div class="cat-info">'
      +'<div class="cat-name">'+esc(displayName)+'</div>'
      +(subLine?'<div style="font-size:11px;color:var(--teal);margin-bottom:2px">'+esc(subLine)+'</div>':'')
      +'<div class="cat-meta">'+(hsTag?'<span style="font-size:10px;font-family:monospace;color:var(--text3)">'+hsTag+'</span> · ':'')+Math.round((c.volTons||0))+'t · $'+(c.avgP||0)+'/kg · '+(c.pct||0)+'% · '+(c.cnt||0)+'건</div>'
      +'</div></div>';
  });

  var typeHtml='<div class="report-type-row">'
    +'<div class="rt-card'+(S.reportType==='strategy'?' active':'')+'" onclick="S.reportType=\'strategy\';render()">'
    +'<div class="rt-icon">📊</div><div class="rt-name">초기미팅 전략보고서</div><div class="rt-desc">신규 고객 · 갭 분석 · ROI 제안</div></div>'
    +'<div class="rt-card'+(S.reportType==='renewal'?' active':'')+'" onclick="S.reportType=\'renewal\';render()">'
    +'<div class="rt-icon">🔄</div><div class="rt-name">재계약 제안서</div><div class="rt-desc">기존 고객 · Before/After · 성과 증명</div></div>'
    +'</div>';

  var mfUploads='';
  if(S.selectedCategories.length>0){
    while(S.marketFiles.length<S.selectedCategories.length)S.marketFiles.push({file:null,label:'',raw:null,productKw:''});
    mfUploads='<div class="card"><div class="ctitle">📁 카테고리별 시장 데이터 업로드</div>'
      +'<p style="font-size:12px;color:var(--text2);margin-bottom:16px">선택한 카테고리별 Tridge Explorer 시장 데이터를 업로드해주세요.</p>';
    S.selectedCategories.forEach(function(cat,i){
      var mf=S.marketFiles[i];
      var got=(mf&&mf.file)?'got':'';
      mfUploads+='<div style="margin-bottom:12px">'
        +'<div style="font-size:12px;font-weight:700;color:var(--teal);margin-bottom:6px">📂 '+esc(cat)+'</div>'
        +'<label class="ubox-sm '+got+'" onclick="document.getElementById(\'mf-'+i+'\').click()">'
        +(mf&&mf.file
          ?'<div style="font-size:12px;font-weight:600;color:var(--teal)">✓ '+esc(mf.file.name)+'</div>'
          :'<div style="font-size:13px;color:var(--text2)">📊 '+esc(cat)+' 시장 데이터 업로드</div>')
        +'</label>'
        +'<input type="file" id="mf-'+i+'" accept=".xlsx,.xls,.csv" onchange="loadCatFile(event,'+i+',S.selectedCategories['+i+'])" style="display:none">'
        +'</div>';
    });
    mfUploads+='</div>';
  }

  var hasMarket=S.marketFiles.filter(function(m){return m&&m.file;}).length>0;

  return '<div class="fade-in">'
    +'<div class="sec-header"><div><div class="sec-eyebrow" style="color:var(--teal)">Step 3</div>'
    +'<h2 class="sec-title">카테고리 선택 & 매칭 설정</h2>'
    +'<p class="sec-sub">분석할 카테고리를 선택하고 시장 데이터를 업로드하세요 (최대 3개)</p></div>'
    +'<button class="btn-ghost btnsm" onclick="S.step=2;render()">← 포트폴리오</button></div>'
    +'<div class="card"><div class="ctitle">📄 보고서 유형</div>'+typeHtml+'</div>'
    +'<div class="card">'
    +'<div class="ctitle">📦 분석 카테고리 <span class="cbadge">'+S.selectedCategories.length+'/3 선택</span>'
    +'<span style="font-size:11px;color:var(--text3);font-weight:400;margin-left:8px">총 '+cats.length+'개 카테고리</span></div>'
    +(catCards
      ?'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">'+catCards+'</div>'
      :'<div style="color:var(--text3);font-size:13px;padding:12px 0">포트폴리오에서 카테고리 데이터를 찾지 못했습니다. HS코드 컬럼을 확인해주세요.</div>')
    +'</div>'
    +mfUploads
    +'<div style="text-align:center;padding:8px 0">'
    +(S.selectedCategories.length>0&&hasMarket
      ?'<button class="btn-primary" onclick="runMatching()">🤖 AI 품목 매칭 분석 →</button> '
      :'')
    +(S.selectedCategories.length>0
      ?'<button class="btn-ghost" onclick="runComparisonDirect()">시장 데이터 없이 분석 →</button>'
      :'')
    +'</div></div>';
}

function toggleCat(key){
  var idx=S.selectedCategories.indexOf(key);
  if(idx>=0){S.selectedCategories.splice(idx,1);}
  else if(S.selectedCategories.length<3){S.selectedCategories.push(key);}
  render();
}

function loadCatFile(e,idx,catName){
  var f=e.target.files[0];if(!f)return;
  while(S.marketFiles.length<=idx)S.marketFiles.push({file:null,label:'',raw:null,productKw:''});
  S.marketFiles[idx].file=f;S.marketFiles[idx].label=catName;S.marketFiles[idx].raw=null;
  e.target.value='';render();
}


// ══════════════════════════════════════
// 데이터 흐름 v2 — 단일 경로, 명확한 상태
// ══════════════════════════════════════

// 상태 초기화
function resetFlow(){
  S.portfolio=null;
  S.comparisons={};
  S.categoryMatchings={};
  S.selectedCategories=[];
  S.marketFiles=[];
  S.insights=null;
  S.healthScore=null;
  S.waterfall=null;
  S.negMatrix=null;
  S.actionCards=null;
  S.findings=null;
  S.dataViewer={open:false,cat:'',excludedIdx:{}};
}

// ── STEP A: 포트폴리오 분석 ──
async function runPortfolio(){
  if(!S.companyFile){alert('기준 기업 데이터를 먼저 업로드해주세요.');return;}
  S.loading=true;
  S.loadingSteps=['기준 기업 데이터 읽기','포트폴리오 분석','연도별·카테고리·공급사 집계'];
  S.loadingCurrentStep=0;
  S.loadingMsg='📂 데이터 읽는 중...';render();
  try{
    var raw=await readExcel(S.companyFile);
    S.companyRaw=raw;
    S.loadingCurrentStep=1;S.loadingMsg='📊 포트폴리오 분석 중...';render();
    S.portfolio=analyzePortfolio(raw);
    if(!S.portfolio||!S.portfolio.rows.length){throw new Error('유효한 거래 데이터가 없습니다.');}
    // 고객사명 자동 감지
    if(!S.companyName&&S.portfolio.topImporter)S.companyName=S.portfolio.topImporter;
    if(!S.importerKw&&S.portfolio.topImporter)S.importerKw=S.portfolio.topImporter;
    S.loading=false;
    S.step=2;
    render();
  }catch(e){
    S.loading=false;
    alert('분석 오류: '+e.message);
    render();
  }
}

// ── STEP B: AI 품목 매칭 실행 ──
