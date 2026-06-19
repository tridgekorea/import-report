// ── 데이터 처리: readExcel, normRow, aggBy, analyzePortfolio, compareMarket
function readExcel(file){return new Promise(function(res,rej){var r=new FileReader();r.onload=function(e){try{var wb=XLSX.read(new Uint8Array(e.target.result),{type:'array',cellDates:true});res(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:''}));}catch(err){rej(err);}};r.onerror=function(){rej(new Error('파일 읽기 실패'));};r.readAsArrayBuffer(file);});}

function normRow(row){
  function g(){for(var i=0;i<arguments.length;i++){var v=row[arguments[i]];if(v!=null&&v!=='')return v;}return null;}
  var dr=g('Date','date');
  var date=null,year=null,quarter=null,month=null;
  if(dr instanceof Date)date=dr;
  else if(typeof dr==='string'&&dr)date=new Date(dr);
  else if(typeof dr==='number')date=new Date((dr-25569)*86400000);
  if(date&&!isNaN(date)){year=date.getFullYear();month=date.getMonth()+1;quarter=Math.ceil(month/3);}
  var catVal=(function(){
    var c=String(g('Category','category')||'').trim();
    if(c&&c!=='null'&&c!=='undefined')return c;
    var pn=String(g('Reported Product Name','Product Name')||'').trim();
    var m=pn.match(/^\[([^\]]+)\]/);
    return m?m[1]:'';
  })();
  return {
    date:date,year:year,quarter:quarter,month:month,
    hsCode:String(g('HS-CODE','HS_CODE','HS Code')||''),
    productName:String(g('Reported Product Name','Product Name')||'').replace(/\[.*?\]\s*/g,'').trim(),
    category:catVal,
    origin:String(g('Origin Country','Origin_Country')||''),
    exporter:String(g('Exporter','exporter')||''),
    importer:String(g('Importer','importer','Raw Importer Name')||''),
    volume:parseFloat(g('Volume','volume')||0)||0,
    value:parseFloat(g('Value','value')||0)||0,
    unitPrice:parseFloat(g('Unit Price','Unit_Price')||0)||0
  };
}

function aggBy(rows,keyFn){var m={};rows.forEach(function(r){var k=keyFn(r);if(!k)return;if(!m[k])m[k]={key:k,cnt:0,vol:0,val:0,pv:0};m[k].cnt++;m[k].vol+=r.volume;m[k].val+=r.value;m[k].pv+=r.unitPrice*r.volume;});return Object.values(m).map(function(d){return Object.assign({},d,{avgP:d.vol?+(d.pv/d.vol).toFixed(3):0});});}
function p99filter(rows){if(rows.length<3)return rows;var prices=rows.map(function(r){return r.unitPrice;}).filter(function(p){return p>0;}).sort(function(a,b){return a-b;});if(!prices.length)return rows;var median=prices[Math.floor(prices.length/2)];var p99val=prices[Math.floor(prices.length*0.99)];var minOk=Math.max(0.10,median*0.10);return rows.filter(function(r){return r.unitPrice>=minOk&&r.unitPrice<=p99val;});}

function prodKwds(name){var n=(name||'').toLowerCase();var result=[];var groups=[['다이스','dice','diced'],['슬라이스','slice','sliced'],['하프','half'],['퓨레','puree'],['청크','chunk'],['미트','meat'],['칩','chip'],['스틱','stick'],['홀','whole'],['크링클','crinkle'],['웨지','wedge'],['양념','season'],['모짜렐라','mozzarella'],['파마산','parmesan'],['크림치즈','cream cheese'],['체다','cheddar'],['고다','gouda'],['에담','edam'],['스트링','string'],['버거슬라이스','burger slice'],['블루베리','blueberry'],['망고','mango'],['딸기','strawberr'],['라즈베리','raspberr'],['복숭아','peach'],['수박','watermelon']];groups.forEach(function(g){for(var i=0;i<g.length;i++){if(n.includes(g[i])){result.push(g[0]);break;}}});return result;}
function prodMatch(cName,mName){var ck=prodKwds(cName);if(!ck.length)return true;var mk=prodKwds(mName);if(!mk.length)return false;for(var i=0;i<ck.length;i++)if(mk.indexOf(ck[i])>=0)return true;return false;}
function getCompanyProducts(cRows,sup){var bp={};cRows.filter(function(r){return r.exporter===sup;}).forEach(function(r){var p=r.productName.split('__')[0].trim().slice(0,30);if(!bp[p])bp[p]={name:p,vol:0};bp[p].vol+=r.volume;});return Object.values(bp).sort(function(a,b){return b.vol-a.vol;}).slice(0,3);}

var MONTHS=['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

function analyzePortfolio(rawRows){
  var rows=rawRows.map(normRow).filter(function(r){return r.volume>0&&r.year>=2018&&r.year<=2030;});
  if(!rows.length)return null;
  var totVol=rows.reduce(function(s,r){return s+r.volume;},0);
  var totVal=rows.reduce(function(s,r){return s+r.value;},0);
  var totPV=rows.reduce(function(s,r){return s+r.unitPrice*r.volume;},0);
  var impCount={};rows.forEach(function(r){if(r.importer)impCount[r.importer]=(impCount[r.importer]||0)+1;});
  var topImporter=(Object.entries(impCount).sort(function(a,b){return b[1]-a[1];})[0]||[''])[0];
  // HS코드별 집계 + 대표 카테고리명, 대표 상품명 함께 수집
// Category 컬럼 기준 집계 (HS코드 같아도 카테고리 다르면 분리)
var catMeta={};
rows.forEach(function(r){
  var k=r.category||r.hsCode||'(미분류)';
  if(!catMeta[k])catMeta[k]={prods:{},hsCode:r.hsCode||''};
  var p=r.productName.split('__')[0].trim().slice(0,30);
  if(p)catMeta[k].prods[p]=(catMeta[k].prods[p]||0)+r.volume;
});
var hsData=aggBy(rows,function(r){return r.category||r.hsCode||'(미분류)';}).sort(function(a,b){return b.vol-a.vol;}).map(function(d){
  var meta=catMeta[d.key]||{prods:{},hsCode:''};
  var topProd=Object.entries(meta.prods).sort(function(a,b){return b[1]-a[1];})[0]||['',0];
  return Object.assign({},d,{
    volTons:+(d.vol/1000).toFixed(1),
    pct:+((d.vol/totVol)*100).toFixed(1),
    categoryName:d.key,
    topProductName:topProd[0]||'',
    hsCode:meta.hsCode||''
  });
});
  var origData=aggBy(rows,function(r){return r.origin;}).sort(function(a,b){return b.vol-a.vol;}).slice(0,8).map(function(d){return Object.assign({},d,{volTons:+(d.vol/1000).toFixed(1)});});
  var prodData=aggBy(rows,function(r){var n=r.productName.split('__')[0].trim();return n.length>26?n.slice(0,26)+'...':n;}).sort(function(a,b){return b.vol-a.vol;}).slice(0,10).map(function(d){return Object.assign({},d,{volTons:+(d.vol/1000).toFixed(1)});});
  var supData=aggBy(rows,function(r){return r.exporter||null;}).sort(function(a,b){return b.vol-a.vol;}).slice(0,10).map(function(d){return Object.assign({},d,{volTons:+(d.vol/1000).toFixed(1)});});
  var yrData=aggBy(rows,function(r){return r.year?String(r.year):null;}).sort(function(a,b){return Number(a.key)-Number(b.key);}).map(function(d){return Object.assign({},d,{year:d.key,volTons:+(d.vol/1000).toFixed(1),valMil:+(d.val/1e6).toFixed(2)});});
  var qData=aggBy(rows,function(r){return(r.year&&r.quarter)?r.year+'Q'+r.quarter:null;}).sort(function(a,b){return a.key.localeCompare(b.key);}).slice(-12).map(function(d){return Object.assign({},d,{yq:d.key,volTons:+(d.vol/1000).toFixed(1)});});
  // 월별 계절성
  var monthAgg=[];for(var mi=0;mi<12;mi++)monthAgg.push({month:mi+1,name:MONTHS[mi],vol:0,pv:0});
  rows.forEach(function(r){if(r.month){monthAgg[r.month-1].vol+=r.volume;monthAgg[r.month-1].pv+=r.unitPrice*r.volume;}});
  var monthData=monthAgg.map(function(d){return {month:d.month,name:d.name,volTons:+(d.vol/1000).toFixed(1),avgP:d.vol>0?+(d.pv/d.vol).toFixed(2):0};});
  var topSupVol=supData.length?supData[0].vol:0;var concRisk=+(topSupVol/totVol*100).toFixed(0);
  var latestYear=0;rows.forEach(function(r){if(r.year&&r.year>latestYear)latestYear=r.year;});
  var prodByYear={};rows.forEach(function(r){var p=r.productName.split('__')[0].trim().slice(0,25);if(!prodByYear[p])prodByYear[p]={};if(!prodByYear[p][r.year])prodByYear[p][r.year]=0;prodByYear[p][r.year]+=r.volume;});
  var disappeared=[];Object.entries(prodByYear).forEach(function(en){var prod=en[0],yd=en[1];var years=Object.keys(yd).map(Number).sort();var maxY=Math.max.apply(null,years);var peakVol=Math.max.apply(null,Object.values(yd));if(maxY<latestYear&&maxY>=latestYear-2&&peakVol>5000)disappeared.push({product:prod,lastYear:maxY,peakTons:+(peakVol/1000).toFixed(1)});});disappeared.sort(function(a,b){return b.peakTons-a.peakTons;});
  var prodPrices={};rows.forEach(function(r){var p=r.productName.split('__')[0].trim().slice(0,25);if(!prodPrices[p])prodPrices[p]=[];if(r.unitPrice>0)prodPrices[p].push(r.unitPrice);});
  var anomalies=[];Object.entries(prodPrices).forEach(function(en){var prod=en[0],prices=en[1];if(prices.length<3)return;var avg=prices.reduce(function(s,v){return s+v;},0)/prices.length;var maxP=Math.max.apply(null,prices);if(maxP>avg*4&&maxP>3)anomalies.push({product:prod,maxP:+maxP.toFixed(2),avgP:+avg.toFixed(2),ratio:+(maxP/avg).toFixed(1)});});anomalies.sort(function(a,b){return b.ratio-a.ratio;});
  return {rows:rows,totVolTons:+(totVol/1000).toFixed(0),totValMil:+(totVal/1e6).toFixed(2),avgP:+(totPV/totVol).toFixed(2),cnt:rows.length,topImporter:topImporter,hsData:hsData,origData:origData,prodData:prodData,supData:supData,yrData:yrData,qData:qData,monthData:monthData,concRisk:concRisk,topSupName:supData.length?supData[0].key:'',disappeared:disappeared.slice(0,4),anomalies:anomalies.slice(0,3),latestYear:latestYear};
}

// ─── 경쟁사 소싱 타이밍 분석 ───
function computeTiming(cRows,marketRows){
  var monthsCov={};marketRows.forEach(function(r){if(r.month)monthsCov[r.month]=true;});
  if(Object.keys(monthsCov).length<4)return null;
  var mByMonth=[];for(var mi=0;mi<12;mi++)mByMonth.push({month:mi+1,name:MONTHS[mi],vol:0,pv:0,cnt:0});
  marketRows.forEach(function(r){if(!r.month)return;var x=mByMonth[r.month-1];x.vol+=r.volume;x.pv+=r.unitPrice*r.volume;x.cnt++;});
  mByMonth.forEach(function(d){d.avgP=d.vol>0?+(d.pv/d.vol).toFixed(3):0;d.volTons=+(d.vol/1000).toFixed(1);});
  var cByMonth=[];for(var mi2=0;mi2<12;mi2++)cByMonth.push({month:mi2+1,name:MONTHS[mi2],vol:0,pv:0});
  cRows.forEach(function(r){if(!r.month)return;var x=cByMonth[r.month-1];x.vol+=r.volume;x.pv+=r.unitPrice*r.volume;});
  cByMonth.forEach(function(d){d.avgP=d.vol>0?+(d.pv/d.vol).toFixed(3):0;d.volTons=+(d.vol/1000).toFixed(1);});
  var totMVol=mByMonth.reduce(function(s,d){return s+d.vol;},0);
  var totMPV=mByMonth.reduce(function(s,d){return s+d.pv;},0);
  var marketAvg=totMVol>0?totMPV/totMVol:0;
  var validM=mByMonth.filter(function(d){return d.vol>0;});
  if(validM.length<4)return null;
  var sortedP=validM.slice().sort(function(a,b){return a.avgP-b.avgP;});
  var lowCount=Math.max(1,Math.ceil(sortedP.length/3));
  var lowMonths=sortedP.slice(0,lowCount);
  var lowMonthNums=lowMonths.map(function(d){return d.month;});
  var lowVol=lowMonths.reduce(function(s,d){return s+d.vol;},0);
  var lowMonthsAvg=lowVol>0?lowMonths.reduce(function(s,d){return s+d.pv;},0)/lowVol:marketAvg;
  // 자사 구매 타이밍의 시장 단가 가중평균
  var cTotVol=0,cTimingPV=0;
  cByMonth.forEach(function(d){if(d.vol>0){var mp=mByMonth[d.month-1].avgP;cTimingPV+=mp*d.vol;cTotVol+=d.vol;}});
  var cTimingPrice=cTotVol>0?cTimingPV/cTotVol:marketAvg;
  var timingIndex=marketAvg>0?+(cTimingPrice/marketAvg).toFixed(2):1;
  var timingSaving=cTotVol>0?+((cTimingPrice-lowMonthsAvg)*cTotVol/1000).toFixed(0):0;
  if(timingSaving<0)timingSaving=0;
  // 경쟁사 매수 집중 월 (시장 물량 - 자사 물량)
  var compByMonth=mByMonth.map(function(d,i){return {month:d.month,name:d.name,volTons:+((d.vol-cByMonth[i].vol)/1000).toFixed(1)};});
  var cPeak=cByMonth.slice().filter(function(d){return d.vol>0;}).sort(function(a,b){return b.vol-a.vol;})[0];
  var compPeak=compByMonth.slice().sort(function(a,b){return b.volTons-a.volTons;})[0];
  // 최저가 월
  var cheapMonth=sortedP[0];
  return {marketByMonth:mByMonth,companyByMonth:cByMonth,compByMonth:compByMonth,marketAvg:+marketAvg.toFixed(3),lowMonths:lowMonthNums,lowMonthsAvg:+lowMonthsAvg.toFixed(3),timingIndex:timingIndex,timingSaving:timingSaving,cPeakMonth:cPeak?cPeak.month:null,cPeakName:cPeak?cPeak.name:null,compPeakMonth:compPeak?compPeak.month:null,compPeakName:compPeak?compPeak.name:null,cheapMonthName:cheapMonth?cheapMonth.name:null,cheapMonthPrice:cheapMonth?cheapMonth.avgP:null};
}

function removeOutliers(prices){
  if(prices.length<4)return prices;
  var sorted=prices.slice().sort(function(a,b){return a-b;});
  var q1=sorted[Math.floor(sorted.length*0.25)];
  var q3=sorted[Math.floor(sorted.length*0.75)];
  var iqr=q3-q1;
  var lo=q1-1.5*iqr, hi=q3+1.5*iqr;
  return prices.filter(function(p){return p>=lo&&p<=hi;});
}

function getRecentRows(rows, months){
  // 최근 N개월 기준 rows 필터
  var dates=rows.map(function(r){return r.date||r.year||null;}).filter(Boolean);
  if(!dates.length)return rows;
  // year 기반으로 최근 1년
  var years=rows.map(function(r){return Number(r.year||0);}).filter(Boolean);
  if(!years.length)return rows;
  var maxYear=Math.max.apply(null,years);
  return rows.filter(function(r){return Number(r.year||0)>=maxYear-1;});
}

function compareMarket(portfolio,marketRaw,kw,productKw){
  var mAll=marketRaw.map(normRow).filter(function(r){return r.volume>0&&r.unitPrice>0;});
  var pkw=(productKw||'').toLowerCase().trim();
  var pkwList=pkw?pkw.split(',').map(function(s){return s.trim();}).filter(Boolean):[];
  if(pkwList.length)mAll=mAll.filter(function(r){return matchProductKw(r.productName,pkwList);});
  var kwClean=(kw||portfolio.topImporter||'').toLowerCase().replace(/[()주식회사 ]/g,'').slice(0,5);
  var others=p99filter(mAll.filter(function(r){return !r.importer.toLowerCase().replace(/[()주식회사 ]/g,'').includes(kwClean);}));
  var cRows=pkwList.length?portfolio.rows.filter(function(r){return matchProductKw(r.productName,pkwList);}):portfolio.rows;
  if(!cRows.length)cRows=portfolio.rows;

  // ① 자사 물량 = 최근 1년 기준
  var cRowsRecent=getRecentRows(cRows,12);
  if(!cRowsRecent.length)cRowsRecent=cRows;

  var cSupSet={};cRowsRecent.forEach(function(r){if(r.exporter)cSupSet[r.exporter]=true;});
  var sameSupplier=[];

  Object.keys(cSupSet).forEach(function(sup){
    var supOthers=others.filter(function(r){return r.exporter===sup;});
    if(supOthers.length<2)return;
    var cForSup=cRowsRecent.filter(function(r){return r.exporter===sup;});
    if(!cForSup.length)return;
    var cVol=cForSup.reduce(function(s,r){return s+r.volume;},0);
    var cPrice=cForSup.reduce(function(s,r){return s+r.unitPrice*r.volume;},0)/cVol;
    var compProds=getCompanyProducts(cRows,sup);var mainProd=compProds.length?compProds[0].name:'';
    var filtered=mainProd?supOthers.filter(function(r){return prodMatch(mainProd,r.productName);}):supOthers;
    if(filtered.length<3)filtered=supOthers;

    // ② 바이어별 집계
    var byImp={};filtered.forEach(function(r){
      if(!byImp[r.importer])byImp[r.importer]={imp:r.importer,vol:0,pv:0,cnt:0};
      byImp[r.importer].vol+=r.volume;byImp[r.importer].pv+=r.unitPrice*r.volume;byImp[r.importer].cnt++;
    });
    var allComps=Object.values(byImp).map(function(d){return {imp:d.imp,avgP:+(d.pv/d.vol).toFixed(3),volTons:+(d.vol/1000).toFixed(1),cnt:d.cnt};});

    // ③ 이상치 제거 (IQR)
    var allPrices=allComps.map(function(c){return c.avgP;});
    var cleanPrices=removeOutliers(allPrices);
    var removedCount=allPrices.length-cleanPrices.length;
    var cleanSet=new Set(cleanPrices.map(function(p){return p.toFixed(3);}));
    var compsClean=allComps.filter(function(c){return cleanSet.has(c.avgP.toFixed(3));});
    if(!compsClean.length)compsClean=allComps;

    // ④ 자사보다 싸게 사는 바이어만 필터
    var cheaperComps=compsClean.filter(function(c){return c.avgP<cPrice;});
    if(!cheaperComps.length)return;

    // ⑤ 상위 10개 평균단가 (평량가중평균)
    var top10=cheaperComps.sort(function(a,b){return a.avgP-b.avgP;}).slice(0,10);
    var top10TotalVol=top10.reduce(function(s,c){return s+c.volTons;},0);
    var top10AvgP=top10TotalVol>0
      ? top10.reduce(function(s,c){return s+c.avgP*c.volTons;},0)/top10TotalVol
      : top10.reduce(function(s,c){return s+c.avgP;},0)/top10.length;
    top10AvgP=+top10AvgP.toFixed(3);

    // 표시용 comps (이상치 제거 후 전체, 단가순)
    var comps=compsClean.sort(function(a,b){return a.avgP-b.avgP;}).slice(0,8);
    var bestPrice=comps.length?comps[0].avgP:top10AvgP;

    // 연도별 갭
    var cByY={},mByY={};
    cForSup.forEach(function(r){if(!r.year)return;if(!cByY[r.year])cByY[r.year]={vol:0,pv:0};cByY[r.year].vol+=r.volume;cByY[r.year].pv+=r.unitPrice*r.volume;});
    filtered.forEach(function(r){if(!r.year)return;if(!mByY[r.year])mByY[r.year]={vol:0,pv:0};mByY[r.year].vol+=r.volume;mByY[r.year].pv+=r.unitPrice*r.volume;});
    var gapByYear=Object.keys(cByY).sort().map(function(y){var c=cByY[y];var m=mByY[y];var cA=+(c.pv/c.vol).toFixed(3);var mA=m&&m.vol>0?+(m.pv/m.vol).toFixed(3):null;return {year:y,companyP:cA,marketP:mA,gap:mA!=null?+(cA-mA).toFixed(3):null};});

    // ⑥ roiSup = (자사단가 - 상위10 평균) × 최근1년 물량
    var overpay=+(cPrice-top10AvgP).toFixed(3);

    sameSupplier.push({
      supplier:sup,
      compP:+cPrice.toFixed(3),
      compVolTons:+(cVol/1000).toFixed(1),
      comps:comps,
      cheaperCount:cheaperComps.length,
      bestPrice:bestPrice,
      top10AvgP:top10AvgP,
      top10Count:top10.length,
      removedOutliers:removedCount,
      overpayPerKg:overpay>0?overpay:0,
      gapByYear:gapByYear,
      compProducts:compProds,
      mainProduct:mainProd
    });
  });

  sameSupplier.sort(function(a,b){return (b.overpayPerKg*b.compVolTons)-(a.overpayPerKg*a.compVolTons);});

  // 원산지 비교 (표시용, ROI에서는 제외)
  var cByOrig={};cRowsRecent.forEach(function(r){if(!cByOrig[r.origin])cByOrig[r.origin]={orig:r.origin,vol:0,pv:0};cByOrig[r.origin].vol+=r.volume;cByOrig[r.origin].pv+=r.unitPrice*r.volume;});
  var mByOrig={};others.forEach(function(r){if(!mByOrig[r.origin])mByOrig[r.origin]={orig:r.origin,vol:0,pv:0,prices:[]};mByOrig[r.origin].vol+=r.volume;mByOrig[r.origin].pv+=r.unitPrice*r.volume;mByOrig[r.origin].prices.push(r.unitPrice);});
  var origComp=Object.values(cByOrig).map(function(c){var m=mByOrig[c.orig];var cAvg=+(c.pv/c.vol).toFixed(3);var mAvg=m?+(m.pv/m.vol).toFixed(3):null;return {orig:c.orig,cAvg:cAvg,mAvg:mAvg,gap:mAvg?+(cAvg-mAvg).toFixed(3):null,cVolTons:+(c.vol/1000).toFixed(1),mMin:m?+(Math.min.apply(null,m.prices)).toFixed(3):null};}).sort(function(a,b){return (b.gap||0)-(a.gap||0);});
  var cOrigins={};Object.keys(cByOrig).forEach(function(k){cOrigins[k]=true;});
  var cMinAvg=Object.values(cByOrig).length?Math.min.apply(null,Object.values(cByOrig).map(function(c){return c.pv/c.vol;})):999;
  var altOrigins=[];Object.entries(mByOrig).forEach(function(en){var orig=en[0],m=en[1];if(cOrigins[orig])return;var mAvg=m.pv/m.vol;if(mAvg<cMinAvg*1.05&&m.prices.length>=3)altOrigins.push({orig:orig,mAvg:+mAvg.toFixed(3),mMin:+(Math.min.apply(null,m.prices)).toFixed(3),cnt:m.prices.length,saving:+(cMinAvg-mAvg).toFixed(3)});});altOrigins.sort(function(a,b){return a.mAvg-b.mAvg;});

  // ⑦ roiK = roiSup만 사용 (원산지/대안/타이밍 제거)
  var roiSup=0;
  sameSupplier.forEach(function(s){roiSup+=s.overpayPerKg*s.compVolTons;});

  var timing=computeTiming(cRowsRecent,others);
  return {
    sameSupplier:sameSupplier,
    origComp:origComp,
    altOrigins:altOrigins,
    roiSupK:+roiSup.toFixed(0),
    roiOrigK:0,
    roiAltK:0,
    roiK:+roiSup.toFixed(0),
    productFilter:pkw||'',
    timing:timing,
    _mktRows:mAll,
    _clientRows:cRowsRecent
  };
}

