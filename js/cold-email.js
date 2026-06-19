// ── 콜드메일 진단 리포트
function roundNice(n){n=Math.abs(n);if(n<50)return Math.round(n/10)*10;if(n<500)return Math.round(n/50)*50;return Math.round(n/100)*100;}

function savingsRange(comparisons){
  var roiK=Object.values(comparisons||{}).reduce(function(s,c){return s+(c?c.roiK:0);},0);
  var altK=Object.values(comparisons||{}).reduce(function(s,c){return s+(c?c.roiAltK:0);},0);
  var tmK=Object.values(comparisons||{}).reduce(function(s,c){return s+((c&&c.timing)?c.timing.timingSaving:0);},0);
  var low=roundNice(roiK*0.7);
  var high=roundNice((roiK+altK+tmK)*1.15);
  if(high<=low)high=roundNice(low*1.5);
  return {low:low,high:high,hasData:roiK>0};
}

function coldFindings(portfolio,comparisons){
  var f=[];
  var allSS=[];Object.values(comparisons||{}).forEach(function(c){if(c&&c.sameSupplier)allSS=allSS.concat(c.sameSupplier);});
  var roiK=Object.values(comparisons||{}).reduce(function(s,c){return s+(c?c.roiK:0);},0);
  if(allSS.length>0&&roiK>0)f.push({icon:'💰',text:'현재 거래 중인 일부 공급사에서, <strong>동일 품목을 더 낮은 단가에 매입하는 시장 참여자들</strong>이 확인되었습니다. 동일 공급사·동일 품목 기준이라 협상 여지가 분명합니다. <span class="muted">(구체적 단가·업체명 비공개)</span>'});
  var bestTiming=null;Object.values(comparisons||{}).forEach(function(cmp){if(cmp&&cmp.timing&&cmp.timing.timingSaving>5){if(!bestTiming||cmp.timing.timingSaving>bestTiming.timingSaving)bestTiming=cmp.timing;}});
  if(bestTiming)f.push({icon:'📅',text:'주력 품목의 <strong>구매 시점이 시장 최저가 시즌과 어긋나 있는 패턴</strong>이 관찰되었습니다. 협상 없이 매수 타이밍 조정만으로도 추가 절감 여지가 있습니다.'});
  if(portfolio.disappeared.length>0){var d=portfolio.disappeared[0];f.push({icon:'🚨',text:'<strong>'+esc(d.product)+'</strong> 품목이 최근 수입 중단된 것으로 보입니다. 단가 변동에 따라 소싱이 이탈하는 패턴으로, 대안 공급사 사전 확보가 권장됩니다.'});}
  if(portfolio.yrData.length>=2&&f.length<3){var last=portfolio.yrData[portfolio.yrData.length-1],prev=portfolio.yrData[portfolio.yrData.length-2];var pc=prev.avgP>0?+(((last.avgP-prev.avgP)/prev.avgP)*100).toFixed(0):0;if(pc>5)f.push({icon:'📈',text:'평균 수입 단가가 전년 대비 <strong>'+pc+'% 상승</strong>한 것으로 나타났습니다. 시장 단가 모니터링을 통한 선매입 타이밍 포착이 필요한 시점입니다.'});}
  var allAlt=[];Object.values(comparisons||{}).forEach(function(c){if(c&&c.altOrigins)allAlt=allAlt.concat(c.altOrigins);});
  if(allAlt.length>0&&f.length<3)f.push({icon:'🌏',text:'현재 사용하지 않는 <strong>대안 원산지</strong>에서 더 낮은 시장 단가가 확인되었습니다. 공급 안정성과 원가를 동시에 개선할 수 있는 소싱 루트입니다.'});
  if(f.length===0)f.push({icon:'📊',text:'귀사의 수입 포트폴리오를 시장 데이터와 대조한 결과, 소싱 최적화 기회가 관찰되었습니다.'});
  return f.slice(0,3);
}

// 로우데이터 샘플: 자사 실데이터 + 경쟁사 익명화, 최근 1개월
function buildRawSample(){
  var cRows=S.portfolio.rows.filter(function(r){return r.date&&r.unitPrice>0;});
  if(!cRows.length)return null;
  var latest=null;cRows.forEach(function(r){if(!latest||r.date>latest)latest=r.date;});
  var ly=latest.getFullYear(),lm=latest.getMonth();
  function inMonth(r){return r.date&&r.date.getFullYear()===ly&&r.date.getMonth()===lm;}
  var cSample=cRows.filter(inMonth);
  if(cSample.length<3)cSample=cRows.slice(-10);
  // 귀사 데이터만 — 경쟁사 행 일절 포함하지 않음 (수산물 계약거래 특성상 단가 1건도 민감정보)
  var rows=cSample.slice(0,12).map(function(r){return {date:r.date,prod:r.productName.split('__')[0].trim().slice(0,26),origin:r.origin,vol:r.volume,price:r.unitPrice};});
  rows.sort(function(a,b){return b.date-a.date;});
  return rows.slice(0,12);
}

// ─── 최근 6개월: 귀사 평균 vs "더 싸게 사는 바이어 전부" 평균 ───
function sixMonthBenchmark(){
  var results=[];
  if(!S.marketFiles.length)return results;
  // 회사 데이터의 최신 시점 기준 6개월 창
  var cAllRows=S.portfolio.rows.filter(function(r){return r.date&&r.unitPrice>0;});
  if(!cAllRows.length)return results;
  var latest=null;cAllRows.forEach(function(r){if(!latest||r.date>latest)latest=r.date;});
  var cutoff=new Date(latest);cutoff.setMonth(cutoff.getMonth()-6);
  var kwClean=(S.importerKw||S.portfolio.topImporter||'').toLowerCase().replace(/[()주식회사 ]/g,'').slice(0,5);
  Object.keys(S.comparisons).forEach(function(cat){
    var mf=null;for(var k=0;k<S.marketFiles.length;k++){var lbl=S.marketFiles[k].label||(S.marketFiles[k].file.name.replace(/\.xlsx?|\.csv/gi,'').replace(/_/g,' ').trim());if(lbl===cat){mf=S.marketFiles[k];break;}}
    if(!mf||!mf.raw)return;
    var cmpObj=S.comparisons[cat]||{};var pkw=(cmpObj.productFilter||'').toLowerCase().trim();
    // 회사 6개월 평균 (기준 상품 필터 반영)
    var cRows=cAllRows.filter(function(r){return r.date>=cutoff&&(!pkw||r.productName.toLowerCase().includes(pkw));});
    if(cRows.length<2)return;
    var cVol=cRows.reduce(function(s,r){return s+r.volume;},0);
    var cAvg=cRows.reduce(function(s,r){return s+r.unitPrice*r.volume;},0)/cVol;
    // 시장(경쟁사) 6개월
    var mRows=mf.raw.map(normRow).filter(function(r){return r.volume>0&&r.unitPrice>0&&r.date&&r.date>=cutoff&&(!pkw||r.productName.toLowerCase().includes(pkw));});
    var others=p99filter(mRows.filter(function(r){return !r.importer.toLowerCase().replace(/[()주식회사 ]/g,'').includes(kwClean);}));
    if(others.length<3)return;
    // 바이어별 평균 → 귀사보다 싼 바이어 전부
    var byImp={};others.forEach(function(r){if(!byImp[r.importer])byImp[r.importer]={vol:0,pv:0};byImp[r.importer].vol+=r.volume;byImp[r.importer].pv+=r.unitPrice*r.volume;});
    var cheaper=Object.values(byImp).map(function(d){return {avg:d.pv/d.vol,vol:d.vol,pv:d.pv};}).filter(function(d){return d.avg<cAvg;});
    if(!cheaper.length)return; // 더 싸게 사는 그룹 없으면 스킵 (단가는 강점)
    var grpVol=cheaper.reduce(function(s,d){return s+d.vol;},0);
    var grpAvg=cheaper.reduce(function(s,d){return s+d.pv;},0)/grpVol;
    var diffPct=+(((cAvg-grpAvg)/cAvg)*100).toFixed(0);
    var diffKgLow=+((cAvg-grpAvg)*0.85).toFixed(2);
    var diffKgHigh=+((cAvg-grpAvg)*1.15).toFixed(2);
    results.push({cat:cat,cAvg:+cAvg.toFixed(3),diffPct:diffPct,diffKgLow:diffKgLow,diffKgHigh:diffKgHigh,buyerCount:cheaper.length,productFilter:pkw});
  });
  return results;
}

// ─── 헬스스코어 약점 자동 추출 (단가가 강할 때 백업 메시지) ───
function weakestPoint(){
  if(!S.healthScore)return null;
  var bd=S.healthScore.breakdown;var arr=[];
  Object.keys(bd).forEach(function(k){arr.push({key:k,ratio:bd[k].score/bd[k].max,label:bd[k].label});});
  arr.sort(function(a,b){return a.ratio-b.ratio;});
  return arr[0];
}
function genColdEmail(){
  var p=S.portfolio;var hs=S.healthScore;var comparisons=S.comparisons;
  var today=new Date().toLocaleDateString('ko-KR');
  var sr=savingsRange(comparisons);
  var findings=coldFindings(p,comparisons);
  // 단가 비교 결과가 약하면 헬스스코어 약점을 메인 메시지로 보강
  var benchPre=sixMonthBenchmark();
  if((!benchPre||!benchPre.length)){
    var wp=weakestPoint();
    if(wp){
      var wpMsg={'concentration':'특정 공급사에 대한 의존도가 높아, 단가는 양호하더라도 공급 중단·가격 인상 리스크에 노출되어 있습니다.','priceGap':'','stability':'단가 변동에 따라 일부 품목의 수입이 중단되는 패턴이 관찰됩니다. 단가 경쟁력은 양호하나 소싱 연속성 관리가 필요합니다.','trend':'평균 수입 단가가 상승 추세에 있어, 선제적 시장 모니터링을 통한 매입 타이밍 관리가 권장됩니다.'};
      var msg=wpMsg[wp.key];
      if(msg)findings.unshift({icon:'🛡',text:'<strong>단가 경쟁력은 양호한 편</strong>입니다. 다만 '+msg});
      findings=findings.slice(0,3);
    }
  }
  var sample=buildRawSample();
  var name=S.companyName||'귀사';

  function fmtDate(d){return (d.getMonth()+1)+'/'+d.getDate();}

  var css=[
    '*{box-sizing:border-box;margin:0;padding:0}',
    'body{font-family:-apple-system,BlinkMacSystemFont,"Malgun Gothic","Segoe UI",sans-serif;background:#EEF2F7;color:#1E293B;font-size:14px;line-height:1.6}',
    '.pg{max-width:760px;margin:0 auto;background:#fff}',
    '.cover{background:linear-gradient(135deg,#0A1628 0%,#16335E 60%,#1E5BA8 100%);color:#fff;padding:44px 44px 38px}',
    '.eyebrow{font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#7FB0E8;margin-bottom:14px;font-weight:600}',
    '.ttl{font-size:32px;font-weight:800;line-height:1.15;margin-bottom:6px}',
    '.ttl .ac{color:#00D6B2}',
    '.sub{font-size:13px;color:#A8C8F0;margin-bottom:22px}',
    '.cover-meta{display:flex;gap:8px;flex-wrap:wrap}',
    '.chip{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.15);border-radius:20px;padding:5px 14px;font-size:11px;color:#CFE0F5}',
    '.body{padding:32px 44px 40px}',
    '.sec{margin-bottom:30px}',
    '.sec-h{font-size:11px;font-weight:700;color:#1E5BA8;letter-spacing:.1em;text-transform:uppercase;margin-bottom:14px;padding-bottom:7px;border-bottom:2px solid #E2E8F0}',
    '.hs-wrap{display:flex;align-items:center;gap:24px}',
    '.gauge{width:108px;height:108px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;position:relative}',
    '.gauge-inner{width:80px;height:80px;background:#fff;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center}',
    '.gauge-num{font-size:30px;font-weight:800;line-height:1}',
    '.gauge-grade{font-size:12px;font-weight:700}',
    '.hs-txt{flex:1}',
    '.hs-label{font-size:18px;font-weight:700;margin-bottom:4px}',
    '.hs-desc{font-size:13px;color:#64748B}',
    '.find{display:flex;gap:13px;padding:14px 16px;background:#F8FAFC;border-radius:11px;margin-bottom:10px;border-left:3px solid #1E5BA8}',
    '.find-ic{font-size:20px;flex-shrink:0}',
    '.find-tx{font-size:13px;line-height:1.65}',
    '.find-tx strong{color:#0F2B5B;font-weight:700}',
    '.muted{color:#94A3B8;font-size:11px}',
    '.save-box{background:linear-gradient(135deg,#FEF2F2,#FFF7F7);border:1px solid #FECACA;border-radius:14px;padding:26px;text-align:center}',
    '.save-label{font-size:12px;color:#B91C1C;font-weight:600;margin-bottom:8px}',
    '.save-amt{font-size:38px;font-weight:900;color:#DC2626;line-height:1.1;letter-spacing:-.01em}',
    '.save-sub{font-size:12px;color:#94A3B8;margin-top:8px}',
    '.blur{filter:blur(5px);user-select:none;color:#94A3B8;font-weight:600}',
    'table{width:100%;border-collapse:collapse;font-size:11.5px;margin-top:6px}',
    'th{background:#0F2B5B;color:#fff;padding:7px 9px;text-align:left;font-size:10px;font-weight:600;letter-spacing:.03em}',
    'td{padding:7px 9px;border-bottom:1px solid #EEF2F7}',
    'tr.own td{background:#EFF6FF}',
    'tr.own td:first-child{border-left:3px solid #1E5BA8}',
    '.own-tag{display:inline-block;background:#1E5BA8;color:#fff;padding:1px 7px;border-radius:5px;font-size:10px;font-weight:600}',
    '.comp-tag{display:inline-block;background:#F1F5F9;color:#64748B;padding:1px 7px;border-radius:5px;font-size:10px;font-weight:600}',
    '.note{font-size:11px;color:#94A3B8;margin-top:10px;line-height:1.6;font-style:italic}',
    '.cta{background:linear-gradient(135deg,#0A1628,#1E5BA8);color:#fff;border-radius:14px;padding:28px 30px;text-align:center;margin-top:8px}',
    '.cta-h{font-size:19px;font-weight:800;margin-bottom:10px}',
    '.cta-p{font-size:13px;color:#BBD5F2;line-height:1.7;margin-bottom:18px}',
    '.cta-btn{display:inline-block;background:#00D6B2;color:#003;padding:12px 30px;border-radius:9px;font-weight:700;font-size:14px;text-decoration:none}',
    '.whatif{background:#FFFBEB;border:1px solid #FDE68A;border-radius:11px;padding:16px 18px;font-size:12.5px;line-height:1.7;color:#78350F}',
    '.whatif strong{color:#92400E}',
    'footer{padding:22px 44px;background:#0A1628;color:#64748B;font-size:10.5px;text-align:center;line-height:1.7}',
    'footer .fl{color:#7FB0E8;font-weight:700;letter-spacing:.1em}',
    '.bench-headline{font-size:14px;line-height:1.7;background:#FEF2F2;border:1px solid #FECACA;border-radius:11px;padding:16px 18px;margin-bottom:16px}',
    '.bench-list{display:flex;flex-direction:column;gap:10px}',
    '.bench-row{display:flex;align-items:center;gap:12px}',
    '.bench-cat{width:120px;font-size:12px;font-weight:600;color:#1E293B;flex-shrink:0;text-align:right}',
    '.bench-bar-wrap{flex:1;height:22px;background:#F1F5F9;border-radius:6px;overflow:hidden}',
    '.bench-bar{height:100%;background:linear-gradient(90deg,#F59E0B,#DC2626);border-radius:6px;min-width:8px}',
    '.bench-pct{width:54px;font-size:15px;font-weight:800;color:#DC2626;flex-shrink:0}'
  ].join('');

  var toolbarCss=[
    '.dl-toolbar{position:sticky;top:0;z-index:100;background:#0A1628;color:#fff;display:flex;align-items:center;justify-content:space-between;padding:12px 20px;box-shadow:0 2px 12px rgba(0,0,0,.2)}',
    '.dl-title{font-size:13px;font-weight:600;color:#A8C8F0}',
    '.dl-btns{display:flex;gap:8px}',
    '.dl-btn{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:#fff;padding:8px 16px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s}',
    '.dl-btn:hover{background:rgba(255,255,255,.2)}',
    '.dl-btn.primary{background:#00D6B2;color:#003;border-color:#00D6B2}',
    '.dl-btn.primary:hover{background:#00C9A7}',
    '@media print{.dl-toolbar{display:none}}'
  ].join('');
  // 헬스 게이지 (conic-gradient)
  var gaugeHtml='';
  if(hs){var pct=hs.total;gaugeHtml='<div class="gauge" style="background:conic-gradient('+hs.color+' 0% '+pct+'%,#E2E8F0 '+pct+'% 100%)"><div class="gauge-inner"><div class="gauge-num" style="color:'+hs.color+'">'+hs.total+'</div><div class="gauge-grade" style="color:'+hs.color+'">'+hs.grade+'등급</div></div></div>';}

  var findingsHtml='';findings.forEach(function(f){findingsHtml+='<div class="find"><div class="find-ic">'+f.icon+'</div><div class="find-tx">'+f.text+'</div></div>';});

  // 데이터 샘플 테이블 — 귀사 데이터만 (경쟁사 일절 미포함)
  var sampleHtml='';
  if(sample&&sample.length){
    var rows='';
    sample.forEach(function(r){
      rows+='<tr class="own"><td>'+fmtDate(r.date)+'</td><td>'+esc(r.prod)+'</td><td>'+esc(r.origin)+'</td><td>'+(r.vol>=1000?(r.vol/1000).toFixed(1)+'t':Math.round(r.vol)+'kg')+'</td><td style="font-weight:600">$'+r.price.toFixed(3)+'</td></tr>';
    });
    sampleHtml='<div class="sec"><div class="sec-h">📎 귀사 실거래 데이터 샘플 (최근 1개월)</div>'
      +'<table><thead><tr><th>일자</th><th>품목</th><th>원산지</th><th>물량</th><th>단가</th></tr></thead><tbody>'+rows+'</tbody></table>'
      +'<div class="note">※ Tridge가 보유한 <strong>귀사 실거래 데이터</strong>의 일부입니다. 전체 기간·전 품목 데이터와 시장 비교 분석은 미팅에서 제공됩니다.</div>'
      +'</div>';
  }
  // 6개월 평균 비교 섹션
  var bench=sixMonthBenchmark();
  var benchHtml='';
  if(bench&&bench.length){
    var rowsB='';
    bench.forEach(function(b){
      var prodLabel=b.productFilter?esc(b.productFilter):esc(b.cat);
      rowsB+='<div class="bench-row"><div class="bench-cat">'+prodLabel+'</div>'
        +'<div class="bench-bar-wrap"><div class="bench-bar" style="width:'+Math.min(100,b.diffPct*5)+'%"></div></div>'
        +'<div class="bench-pct">+'+b.diffPct+'%</div></div>';
    });
    var avgPct=Math.round(bench.reduce(function(s,b){return s+b.diffPct;},0)/bench.length);
    benchHtml='<div class="sec"><div class="sec-h">📊 최근 6개월 — 귀사 vs 더 낮은 단가 바이어 그룹</div>'
      +'<div class="bench-headline">귀사는 최근 6개월간, 같은 품목을 <strong>더 낮은 단가에 매입하는 바이어 그룹</strong>보다 평균 <strong style="color:#DC2626">약 '+avgPct+'% 높은 수준</strong>으로 소싱 중입니다.</div>'
      +'<div class="bench-list">'+rowsB+'</div>'
      +'<div class="note">※ "더 낮은 단가 바이어 그룹" = 동일 품목을 귀사보다 저렴하게 매입한 시장 참여자 전체의 평균입니다. 개별 거래·업체는 비공개이며, 정확한 단가 차이는 정밀 분석 시 산출됩니다.</div>'
      +'</div>';
  }

  var saveHtml=sr.hasData?'<div class="save-box"><div class="save-label">연간 절감 기회 (추정 범위)</div><div class="save-amt">$'+sr.low.toLocaleString()+'K ~ $'+sr.high.toLocaleString()+'K</div><div class="save-sub">≈ '+Math.round(sr.low*1.35)+'백만원 ~ '+Math.round(sr.high*1.35)+'백만원 / 연간 · <strong>정확한 산출은 귀사 거래 데이터 기반 정밀 분석에서 가능합니다</strong></div></div>':'<div class="save-box"><div class="save-label">절감 기회 분석</div><div class="save-amt" style="font-size:22px">시장 비교 데이터 추가 시 산출</div></div>';

  // 미팅 버튼 — 담당자 이메일(mailto) + 예약 링크
  var ctaButtons='';
  var subj=encodeURIComponent('[Tridge] '+name+' 소싱 분석 미팅 요청');
  var mailBody=encodeURIComponent('안녕하세요,\n\nTridge 소싱 경쟁력 예비 진단 리포트 잘 받았습니다.\n정밀 분석 미팅 일정을 잡고 싶습니다.\n\n가능한 일정 회신 부탁드립니다.\n감사합니다.');
  if(S.repEmail){var gmail='https://mail.google.com/mail/?view=cm&fs=1&to='+encodeURIComponent(S.repEmail)+'&su='+subj+'&body='+mailBody;ctaButtons+='<a href="'+gmail+'" target="_blank" rel="noopener" class="cta-btn">✉ Gmail로 미팅 요청 →</a>';}
  if(!ctaButtons)ctaButtons='<span class="cta-btn" style="opacity:.6;cursor:default">미팅 일정 잡기 →</span>'+(S.repName?'':'<div style="font-size:11px;color:#7FB0E8;margin-top:10px">※ 첫 화면에서 담당자 이메일을 입력하면 이 버튼이 활성화됩니다</div>');
  var html='<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(name)+' 소싱 경쟁력 예비 진단</title>'
    +'<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"><'+'/script>'
    +'<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"><'+'/script>'
    +'<style>'+css+toolbarCss+'</style></head><body>'
    +'<div class="dl-toolbar" id="dlbar"><span class="dl-title">📄 '+esc(name)+' 진단 리포트</span><div class="dl-btns"><button class="dl-btn" onclick="dlImage()">🖼 이미지(PNG)</button><button class="dl-btn primary" onclick="dlPdf()">📄 PDF 저장</button></div></div>'
    +'<div class="pg" id="report">'
    +'<div class="cover"><div class="eyebrow">TRIDGE · 소싱 경쟁력 예비 진단</div>'
    +'<div class="ttl">'+esc(name)+'<br><span class="ac">소싱 경쟁력 진단</span></div>'
    +'<div class="sub">Tridge 시장 데이터 기반 예비 분석 리포트</div>'
    +'<div class="cover-meta"><span class="chip">📅 '+today+'</span><span class="chip">🔒 경쟁사 단가 비공개</span><span class="chip">📊 실거래 데이터 기반</span></div></div>'
    +'<div class="body">'
    // 헬스스코어
    +(hs?'<div class="sec"><div class="sec-h">🎯 소싱 헬스 스코어</div><div class="hs-wrap">'+gaugeHtml+'<div class="hs-txt"><div class="hs-label" style="color:'+hs.color+'">'+hs.label+' ('+hs.grade+'등급)</div><div class="hs-desc">공급사 분산도·단가 경쟁력·포트폴리오 안정성·단가 추세를 종합한 점수입니다. 100점 만점 기준 '+hs.total+'점으로 진단되었습니다.</div></div></div></div>':'')
    // 핵심 발견
    +'<div class="sec"><div class="sec-h">🔍 시장 데이터에서 관찰된 패턴</div>'+findingsHtml+'</div>'
    // 절감 기회
    +'<div class="sec"><div class="sec-h">💰 절감 기회 추정</div>'+saveHtml+'</div>'
    // 6개월 평균 비교
    +benchHtml
    // 데이터 샘플
    +sampleHtml
    // 무엇을 못 봤는가
    +'<div class="sec"><div class="whatif">💡 <strong>이 진단은 공개 시장 데이터의 일부만으로 작성</strong>되었습니다. 귀사의 실제 거래 데이터를 더하면, 공급사별·품목별 정확한 절감액과 구체적인 협상 전략까지 산출할 수 있습니다.</div></div>'
    // CTA (담당자 정보 연동)
    +'<div class="cta"><div class="cta-h">정확한 분석은 30분 미팅에서</div><div class="cta-p">위 추정 범위를 정확한 숫자로, 블라인드 처리된 경쟁사 데이터를 실제 인사이트로 — 귀사 맞춤 소싱 전략을 함께 검토하시죠.</div>'
    +ctaButtons+'</div>'
    +'</div>'
    +'<footer><div class="fl">TRIDGE</div>'+(S.repName?'담당 '+esc(S.repName)+(S.repEmail?' · '+esc(S.repEmail):'')+'<br>':'')+'소싱 인텔리전스 · '+esc(name)+' 예비 진단 · '+today+'<br>본 리포트는 영업 목적의 예비 분석이며, 정확한 수치는 정밀 분석 시 제공됩니다.</footer>'
    +'</div>'
    +'<script>'
    +'var FN='+JSON.stringify(esc(name||'Tridge')+'_소싱진단_'+today.replace(/\./g,''))+';'
    +'function el(){return document.getElementById("report");}'
    +'function busy(b,msg){var bar=document.getElementById("dlbar");if(b){bar.dataset.old=bar.innerHTML;bar.querySelector(".dl-title").textContent=msg||"생성 중...";var btns=bar.querySelectorAll(".dl-btn");for(var i=0;i<btns.length;i++)btns[i].disabled=true;}else{bar.querySelector(".dl-title").textContent=FN;var b2=bar.querySelectorAll(".dl-btn");for(var j=0;j<b2.length;j++)b2[j].disabled=false;}}'
    +'function dlImage(){busy(true,"🖼 이미지 생성 중...");html2canvas(el(),{scale:2,backgroundColor:"#ffffff",useCORS:true}).then(function(canvas){var a=document.createElement("a");a.href=canvas.toDataURL("image/png");a.download=FN+".png";a.click();busy(false);}).catch(function(e){alert("이미지 생성 실패: "+e.message);busy(false);});}'
    +'function dlPdf(){busy(true,"📄 PDF 생성 중...");html2canvas(el(),{scale:2,backgroundColor:"#ffffff",useCORS:true}).then(function(canvas){var jsPDF=window.jspdf.jsPDF;var img=canvas.toDataURL("image/png");var pw=210;var ph=canvas.height*pw/canvas.width;var pdf=new jsPDF("p","mm","a4");var pageH=297;var left=ph;var pos=0;pdf.addImage(img,"PNG",0,pos,pw,ph);left-=pageH;while(left>0){pos=left-ph;pdf.addPage();pdf.addImage(img,"PNG",0,pos,pw,ph);left-=pageH;}pdf.save(FN+".pdf");busy(false);}).catch(function(e){alert("PDF 생성 실패: "+e.message);busy(false);});}'
    +'<'+'/script>'
    +'</body></html>';

  var blob=new Blob([html],{type:'text/html;charset=utf-8'});
  var a=document.createElement('a');a.href=URL.createObjectURL(blob);
  a.download=esc(name||'Tridge')+'_소싱진단_콜드메일용_'+today.replace(/\./g,'')+'.html';
  a.click();
}

