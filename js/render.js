// ── UI 렌더링 함수
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
function render(){renderStepBar();var c=document.getElementById('main');if(S.loading){
    var stepsHtml='';
    if(S.loadingSteps&&S.loadingSteps.length){
      stepsHtml='<div style="margin-top:24px;text-align:left;display:inline-block;min-width:280px">';
      S.loadingSteps.forEach(function(step,i){
        var isDone=i<S.loadingCurrentStep;
        var isCurrent=i===S.loadingCurrentStep;
        var isPending=i>S.loadingCurrentStep;
        var icon=isDone?'<span style="color:var(--teal)">✅</span>':isCurrent?'<span style="color:var(--amber)">🔄</span>':'<span style="color:var(--text3)">⏳</span>';
        var color=isDone?'var(--teal)':isCurrent?'var(--amber)':'var(--text3)';
        stepsHtml+='<div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--border)">'
          +icon
          +'<span style="font-size:12px;color:'+color+';font-weight:'+(isCurrent?'700':'400')+'">'
          +esc(step)
          +(isCurrent?'<span class="pulse" style="color:var(--amber)"> ...</span>':'')
          +'</span></div>';
      });
      stepsHtml+='</div>';
    }
    c.innerHTML='<div class="loading"><div class="spin-ring"><div></div><div></div><div></div><div></div></div><div class="load-msg">'+esc(S.loadingMsg)+'</div>'+stepsHtml+'</div>';
    return;
  }if(S.step===1)c.innerHTML=rUpload();else if(S.step===2){c.innerHTML=rPortfolio();setTimeout(sched2,80);}else if(S.step===3)c.innerHTML=rCategorySelect();else if(S.step===3.5)c.innerHTML=rMatchingReview();else if(S.step===4){c.innerHTML=rCompare();setTimeout(sched3,80);}else if(S.step===5){c.innerHTML=rROI();setTimeout(schedROI,80);}else if(S.step===6)c.innerHTML=rInsightsV6();}

// ── STEP 1: UPLOAD ──
function rUpload(){
  var cGot=S.companyFile?' got':'';var mGot=S.marketFiles.length?' got':'';
  var mList='';
    var neg=S.tridgeNeg;
  var feats=['🎯 소싱 헬스 스코어|포트폴리오 건강 상태를 0~100점으로 즉시 진단','🔍 AI 품목 매칭|표기 차이·가공도 등 의미 기반으로 동일 상품 자동 판별','📊 경쟁사 단가 비교|동일 공급사 기준 실거래가 격차 자동 분석','📋 분석 히스토리|최근 20개 분석 저장·복원·두 회사 나란히 비교','🎯 미팅 준비 체크리스트|핵심 포인트·예상 반론·오프닝 멘트 AI 자동 생성','🏹 영업 타겟 역추적|같은 공급사에서 더 싸게 구매하는 다음 영업 타겟 자동 추출'];
  return '<div class="fade-in">'
    +'<div class="upload-hero"><div class="hero-badge">TRIDGE DATA SOLUTIONS · v8.0</div><h1 class="hero-title">소싱 경쟁력<br><span class="hero-accent">완전 진단</span></h1><p class="hero-sub">포트폴리오 · 경쟁사 단가 · 구매 타이밍 · 헬스스코어 · ROI · AI 인사이트</p></div>'
    +'<div class="settings-block" style="border-color:rgba(0,201,167,.3);background:rgba(0,201,167,.04)">'+'<div class="sb-title" style="color:var(--teal)">🔑 Anthropic API 키 <span style="color:var(--red);font-weight:700">필수</span></div>'+'<div class="ig" style="display:flex;gap:8px;align-items:center"><input type="password" id="api-key-input" placeholder="sk-ant-api..." value="'+esc(S.apiKey)+'" oninput="S.apiKey=this.value;var _k=\'tridge_api_key\';if(localStorage.getItem(_k))localStorage.setItem(_k,this.value)" style="font-family:monospace;font-size:12px;flex:1"></div>'+'<div style="display:flex;align-items:center;gap:6px;margin-top:8px"><input type="checkbox" id="save-api-key" '+(localStorage.getItem('tridge_api_key')?'checked':'')+' onchange="toggleSaveApiKey(this.checked)" style="width:14px;height:14px;cursor:pointer"><label for="save-api-key" style="font-size:12px;color:var(--text2);cursor:pointer">이 기기에 API 키 저장 (다음 접속 시 자동 입력)</label></div>'+'<div class="sb-hint" style="margin-top:6px">기업 자동 조사 · AI 품목 매칭 · AI 인사이트 생성에 사용됩니다</div>'+'</div>'
    +'<div class="upload-grid" style="grid-template-columns:1fr">'
    +'<label class="ubox'+cGot+'" ondragover="event.preventDefault();this.classList.add(\'drag\')" ondragleave="this.classList.remove(\'drag\')" ondrop="doDrop(event,\'c\')"><input type="file" accept=".xlsx,.xls,.csv" onchange="doFile(event,\'c\')"><div class="ubox-icon">📊</div><div class="ubox-title">기준 기업 거래 데이터 <span class="req">필수</span></div><div class="ubox-sub">Tridge 트랜잭션 엑셀 · 고객사 전체 수입 데이터</div>'+(S.companyFile?'<div class="ubox-file">✓ '+esc(S.companyFile.name)+'</div>':'<div class="ubox-hint">클릭하거나 드래그</div>')+'</label>'
    +'<div style="background:rgba(0,201,167,.06);border:1px solid rgba(0,201,167,.2);border-radius:10px;padding:14px 18px;font-size:12px;color:var(--text2);display:flex;align-items:center;gap:10px">'
    +'<span style="font-size:18px">📂</span><span><strong style="color:var(--teal)">시장 비교 데이터</strong>는 다음 단계(카테고리 선택)에서 카테고리별로 업로드합니다<br><span style="color:var(--text3);font-size:11px">카테고리 1개당 시장 데이터 파일 1개 · 최대 3개</span></span></div>'
    +'</div>'
    +'<div class="input-grid"><div class="ig"><label>회사명 <span style="color:var(--red)">*</span></label><input id="inp-company" type="text" placeholder="예: 오션스글로벌" value="'+esc(S.companyName)+'" oninput="S.companyName=this.value"></div><div class="ig"><label>수입자 키워드 <span style="opacity:.5;font-weight:400">(시장 데이터 제외용)</span></label><input type="text" placeholder="자동 감지됩니다" value="'+esc(S.importerKw)+'" oninput="S.importerKw=this.value"></div></div>'
    +rResearchBox()
    +'<div class="settings-block"><div class="sb-title">💰 Tridge 구독 비용 <span class="sb-opt">(ROI·페이백 계산)</span></div><div class="cost-row"><input type="number" class="cost-input" placeholder="연간 비용 (USD)" value="'+(S.tridgeCost||'')+'" oninput="S.tridgeCost=this.value?Number(this.value):null;S.tridgeNeg=false" '+(neg?'disabled':'')+' style="flex:1"><button class="toggle-btn'+(neg?' active':'')+'" onclick="S.tridgeNeg=!S.tridgeNeg;if(S.tridgeNeg)S.tridgeCost=null;render()">⇄ 협상 중</button></div>'+(neg?'<div class="sb-hint" style="color:var(--amber)">비용 미확정 — ROI 배율로 표시</div>':'<div class="sb-hint">입력 시 페이백 곡선 + ROI 배율 자동 계산</div>')+'</div>'
    +'<div class="settings-block"><div class="sb-title">📅 미팅 담당자 정보 <span class="sb-opt">(콜드메일 리포트의 미팅 버튼 연동)</span></div>'
    +'<div class="input-grid" style="margin-bottom:8px"><div class="ig"><label>담당자 이름</label><input type="text" placeholder="예: 김영업" value="'+esc(S.repName)+'" oninput="S.repName=this.value"></div><div class="ig"><label>담당자 이메일 <span style="opacity:.5;font-weight:400">(메일 회신용)</span></label><input type="email" placeholder="sales@tridge.com" value="'+esc(S.repEmail)+'" oninput="S.repEmail=this.value"></div></div>'
    +'<div class="sb-hint">담당자 이메일을 입력하면 콜드메일 리포트의 \'Gmail로 미팅 요청\' 버튼이 활성화돼요. 고객이 누르면 제목·본문이 자동으로 채워진 메일 작성창이 열립니다.</div></div>'
    +'<div class="upload-cta"><button class="btn-primary" onclick="runPortfolio()" '+(S.companyFile?'':'disabled')+'>⚡ 포트폴리오 분석 시작</button></div>'
    +'<div class="feat-grid">'+feats.map(function(t){var p=t.split('|');return '<div class="feat-item"><div class="feat-icon">'+p[0].split(' ')[0]+'</div><div><div class="feat-name">'+p[0].slice(p[0].indexOf(' ')+1)+'</div><div class="feat-desc">'+p[1]+'</div></div></div>';}).join('')+'</div>'
    +'</div>';
}
function doFile(e,t){var f=Array.from(e.target.files);if(!f.length)return;if(t==='c')S.companyFile=f[0];else f.forEach(function(fi){S.marketFiles.push({file:fi,label:'',raw:null,productKw:''});});e.target.value='';render();}
function doDrop(e,t){e.preventDefault();e.currentTarget.classList.remove('drag');var f=Array.from(e.dataTransfer.files);if(!f.length)return;if(t==='c')S.companyFile=f[0];else f.forEach(function(fi){S.marketFiles.push({file:fi,label:'',raw:null,productKw:''});});render();}
function rmMkt(i){S.marketFiles.splice(i,1);render();}

async function startAnal(){
  S.loading=true;S.loadingMsg='📂 엑셀 파일 읽는 중...';render();
  try{
    S.companyRaw=await readExcel(S.companyFile);
    S.loadingMsg='📊 포트폴리오 분석 중...';render();
    S.portfolio=analyzePortfolio(S.companyRaw);
    if(!S.portfolio||!S.portfolio.cnt)throw new Error('데이터 인식 실패. Tridge 트랜잭션 파일인지 확인해주세요.');
    if(!S.companyName&&S.portfolio.topImporter)S.companyName=S.portfolio.topImporter;
    if(!S.importerKw&&S.portfolio.topImporter)S.importerKw=S.portfolio.topImporter;
    S.comparisons={};
    for(var i=0;i<S.marketFiles.length;i++){var mf=S.marketFiles[i];S.loadingMsg='🌏 시장 비교 + 타이밍 분석: '+(mf.label||mf.file.name)+'...';render();if(!mf.raw)mf.raw=await readExcel(mf.file);var lbl=mf.label||(mf.file.name.replace(/\.xlsx?|\.csv/gi,'').replace(/_/g,' ').trim())||('카테고리 '+(i+1));S.comparisons[lbl]=compareMarket(S.portfolio,mf.raw,S.importerKw,mf.productKw||'');}
    S.loadingMsg='🎯 헬스 스코어 · ROI 계산 중...';render();
    S.healthScore=computeHealthScore(S.portfolio,S.comparisons);
    S.waterfall=computeWaterfall(S.comparisons);
    S.negMatrix=computeNegMatrix(S.comparisons);
    S.actionCards=computeActionCards(S.portfolio,S.comparisons);
    S.loadingMsg='🔍 AI 핵심 발견 분석 중...';render();
    S.findings=await computeFindings(S.portfolio,S.comparisons,S.healthScore);
    S.loadingMsg='🤖 AI 인사이트 생성 중... (10~20초)';render();
    S.insights=await callClaude(S.portfolio,S.comparisons,S.companyName,S.apiKey,S.companyMemo,S.healthScore);
    S.loading=false;S.step=2;render();
  }catch(err){S.loading=false;alert('오류: '+err.message);render();}
}

// ── STEP 2: PORTFOLIO ──
function rPortfolio(){
  var p=S.portfolio;var hs=S.healthScore;var fnd=S.findings;
  var yr2=null,yr1=null;p.yrData.forEach(function(d){if(d.year==='2024')yr2=d;if(d.year==='2023')yr1=d;});
  var yoy=yr2&&yr1?+(((yr2.volTons-yr1.volTons)/yr1.volTons)*100).toFixed(0):null;
  var pyoy=yr2&&yr1?+(((yr2.avgP-yr1.avgP)/yr1.avgP)*100).toFixed(0):null;
  var alerts='';
  if(p.anomalies.length)alerts+=alrt('alert-amber','<strong>⚠ 단가 이상 탐지</strong> — '+esc(p.anomalies[0].product)+' 일부 거래 $'+p.anomalies[0].maxP+'/kg (평균 $'+p.anomalies[0].avgP+' 대비 '+p.anomalies[0].ratio+'배). 단위 오기입 또는 특수 거래 가능성.');
  if(p.disappeared.length)alerts+=alrt('alert-red','<strong>🚨 포트폴리오 이탈 감지</strong> — '+esc(p.disappeared[0].product)+' ('+p.disappeared[0].lastYear+'년 이후 수입 없음, 최대 '+p.disappeared[0].peakTons+'t). 단가 상승 후 즉각 중단 패턴.');
  if(p.concRisk>60)alerts+=alrt('alert-amber','<strong>⚠ 공급사 집중 위험</strong> — '+esc(p.topSupName)+' 한 곳이 전체 물량의 '+p.concRisk+'%. 리스크 분산 필요.');
  var supRows='';var totV=p.rows.reduce(function(s,r){return s+r.volume;},0);
  p.supData.slice(0,6).forEach(function(d){var pct=+(d.vol/totV*100).toFixed(0);supRows+='<tr><td style="font-size:11px;max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(d.key||'—')+'</td><td>'+d.volTons+'t</td><td class="pok">$'+d.avgP+'</td><td style="color:var(--text2)">'+d.cnt+'건</td><td><div class="mini-bar"><div class="mini-fill" style="width:'+Math.min(100,pct)+'%;background:var(--teal)"></div></div></td></tr>';});
  var nav='<div style="display:flex;gap:8px">'+(Object.keys(S.comparisons).length?'<button class="btn-ghost btnsm" onclick="S.step=3;render()">📊 시장비교</button>':'')+'<button class="btn-ghost btnsm" onclick="S.step=5;render()">🤖 인사이트</button></div>';
  var hsBreakdown='';if(hs){Object.values(hs.breakdown).forEach(function(b){var pct=+(b.score/b.max*100).toFixed(0);var c=pct>=80?'var(--teal)':pct>=50?'var(--amber)':'var(--red)';hsBreakdown+='<div class="hs-row"><div class="hs-row-label">'+b.icon+' '+b.label+'</div><div class="hs-bar-wrap"><div class="hs-bar-fill" style="width:'+pct+'%;background:'+c+'"></div></div><div class="hs-score" style="color:'+c+'">'+b.score+'/'+b.max+'</div></div>';});}
  // 핵심 발견 요약
  var findingsHtml='';
  if(fnd&&fnd.length){var cmap={red:'var(--red)',amber:'var(--amber)',teal:'var(--teal)',blue:'var(--blue)'};findingsHtml='<div class="findings-card"><div class="findings-title">🔍 핵심 발견 — 이 분석에서 가장 중요한 '+fnd.length+'가지</div>';fnd.forEach(function(f,i){findingsHtml+='<div class="finding-row"><div class="finding-num" style="background:'+(cmap[f.color]||'var(--teal)')+'22;color:'+(cmap[f.color]||'var(--teal)')+'">'+(i+1)+'</div><div class="finding-text">'+f.text+'</div></div>';});findingsHtml+='</div>';}
  // 캡션
  var annCap='';if(yoy!==null||pyoy!==null){annCap=cap('막대=물량, 선=평균단가 · '+(yoy!==null?'2024년 물량 전년 대비 '+(yoy>0?'+':'')+yoy+'% ':'')+(pyoy!==null?'· 단가 '+(pyoy>0?'+':'')+pyoy+'%':'')+(pyoy>5?' → 물량과 단가가 동시 상승, 원가 부담 가중':''));}
  var topHs=p.hsData[0];var hsCapTxt=topHs?cap('주력 품목군은 '+topHs.key+' ('+topHs.pct+'%) · 한 코드에 집중될수록 단가 협상 레버리지가 커져요'):'';
  var topOrig=p.origData[0];var orCapTxt=topOrig?cap('최대 수입 원산지는 '+topOrig.key+' ('+topOrig.volTons+'t) · 원산지 다변화 여부가 가격 리스크를 좌우해요'):'';
  // 계절성 캡션
  var peakMonth=p.monthData.slice().sort(function(a,b){return b.volTons-a.volTons;})[0];
  var seasonCap=peakMonth&&peakMonth.volTons>0?cap('가장 많이 매수하는 달은 '+peakMonth.name+' ('+peakMonth.volTons+'t) · 이 시기의 시장 단가가 비싸다면 구매 타이밍 재검토가 필요해요'):'';
  return '<div class="fade-in">'
    +'<div class="sec-header"><div><div class="sec-eyebrow">'+esc(S.companyName)+'</div><h2 class="sec-title">포트폴리오 분석</h2><p class="sec-sub">총 '+p.cnt+'건 거래 / '+p.yrData.length+'개 연도</p></div>'+nav+'</div>'
    +findingsHtml
    +(hs?'<div class="hs-card" style="flex-direction:column;gap:16px"><div style="width:100%"><div style="font-size:11px;color:var(--text3);letter-spacing:.08em;text-transform:uppercase;margin-bottom:10px">소싱 헬스 스코어</div><div id="ch-gauge"></div></div><div class="hs-right" style="width:100%;border-top:1px solid var(--border);padding-top:14px"><div class="hs-right-title">항목별 점수</div>'+hsBreakdown+'</div></div>':'')
    +'<div class="krow">'
    +'<div class="kpi-card" style="--ac:var(--teal)"><div class="kpi-val">'+p.totVolTons.toLocaleString()+'<span style="font-size:14px;font-weight:500;color:var(--text2);margin-left:3px">톤</span></div><div class="kpi-label">누적 수입 물량</div>'+(yoy!==null?'<div class="kpi-badge '+(yoy>0?'up':'dn')+'">YoY '+(yoy>0?'▲':'▼')+Math.abs(yoy)+'%</div>':'')+'</div>'
    +'<div class="kpi-card" style="--ac:#3B82F6"><div class="kpi-val">$'+p.totValMil+'<span style="font-size:14px;font-weight:500;color:var(--text2);margin-left:3px">M</span></div><div class="kpi-label">누적 수입 금액</div></div>'
    +'<div class="kpi-card" style="--ac:var(--amber)"><div class="kpi-val">$'+p.avgP+'<span style="font-size:14px;font-weight:500;color:var(--text2);margin-left:1px">/kg</span></div><div class="kpi-label">전체 평균 단가</div>'+(pyoy!==null?'<div class="kpi-badge '+(pyoy>0?'up':'dn')+'">'+(pyoy>0?'▲':'▼')+Math.abs(pyoy)+'% YoY</div>':'')+'</div>'
    +'<div class="kpi-card"><div class="kpi-val">'+p.cnt+'<span style="font-size:14px;font-weight:500;color:var(--text2);margin-left:3px">건</span></div><div class="kpi-label">거래 건수</div><div class="kpi-badge neutral">'+p.supData.length+'개 공급사</div></div>'
    +'</div>'
    +(alerts?'<div class="alerts-wrap">'+alerts+'</div>':'')
    +'<div class="g2"><div class="card"><div class="ctitle">연도별 물량 & 단가</div><div style="position:relative;height:200px"><canvas id="ch-a"></canvas></div>'+annCap+'</div><div class="card"><div class="ctitle">분기별 추이</div><div style="position:relative;height:200px"><canvas id="ch-q"></canvas></div>'+cap('최근 12개 분기 흐름 · 분기별 변동성이 클수록 선매입 전략의 효과가 커요')+'</div></div>'
    +'<div class="card"><div class="ctitle">📅 월별 수입 패턴 (계절성)</div><div style="position:relative;height:200px"><canvas id="ch-season"></canvas></div>'+seasonCap+'</div>'
    +'<div class="g2"><div class="card"><div class="ctitle">HS코드별 비중</div><div style="position:relative;height:220px"><canvas id="ch-hs"></canvas></div>'+hsCapTxt+'</div><div class="card"><div class="ctitle">원산지별 물량</div><div style="position:relative;height:220px"><canvas id="ch-or"></canvas></div>'+orCapTxt+'</div></div>'
    +'<div class="g2"><div class="card"><div class="ctitle">품목별 물량 TOP 10</div><div style="position:relative;height:260px"><canvas id="ch-pr"></canvas></div></div><div class="card"><div class="ctitle">공급사 현황</div><table class="dtbl"><thead><tr><th>공급사</th><th>물량</th><th>단가</th><th>건수</th><th>비중</th></tr></thead><tbody>'+supRows+'</tbody></table>'+(p.disappeared.length?'<div class="ctitle" style="margin-top:16px;color:var(--red)">🚨 이탈 품목</div><table class="dtbl"><thead><tr><th>품목</th><th>마지막수입</th><th>최대물량</th></tr></thead><tbody>'+p.disappeared.slice(0,3).map(function(d){return '<tr><td style="color:var(--red);font-size:11px">'+esc(d.product)+'</td><td>'+d.lastYear+'년</td><td>'+d.peakTons+'t</td></tr>';}).join('')+'</tbody></table>':'')+'</div></div>'
    +'<div style="text-align:center;padding:8px 0"><button class="btn-primary" onclick="S.step=3;render()">📂 카테고리 선택 →</button></div></div>';
}
function sched2(){var p=S.portfolio;if(S.healthScore)chHealthGauge(S.healthScore.total,S.healthScore.color,'ch-gauge');chAnnual(p.yrData);chQ(p.qData);chSeasonality(p.monthData);chHS(p.hsData);chOrig(p.origData);chProd(p.prodData);}

// ── STEP 3: COMPARE ──
function rCompare(){
  var catKeys=Object.keys(S.comparisons);
  if(!catKeys.length)return '<div class="empty-state"><div class="empty-icon">📂</div><p>시장 비교 파일이 없어요.<br>Step 1로 돌아가서 파일을 추가해주세요.</p><div style="display:flex;gap:10px;justify-content:center"><button class="btn-ghost" onclick="S.step=1;render()">← 파일 추가</button><button class="btn-primary" onclick="S.step=5;render()">🤖 AI 인사이트</button></div></div>';
  var ci=Math.min(S.activeCategory,catKeys.length-1);var curCat=catKeys[ci];var cmp=S.comparisons[curCat]||{};
  var ss=cmp.sameSupplier||[];var si=Math.min(S.activeSup,ss.length-1);var cur=ss[si]||null;
  var roiK=cmp.roiK||0;var roiKrw=Math.round(roiK*1.35/10)*10;var tm=cmp.timing;
  var roiWarn='';if(roiK>500)roiWarn=alrt('alert-amber','<strong>⚠ 주의</strong> — 절감액이 비정상적으로 커요. 시장 파일에 단위 오기입($0.3 vs $3.0 등)이 포함됐을 수 있어요. 표에서 $1 미만 단가를 확인해주세요.');
  var catTabs='<div class="tabs">';catKeys.forEach(function(k,i){var cmpK=S.comparisons[k]||{};var roiKt=cmpK.roiK||0;var prods=[];(cmpK.sameSupplier||[]).forEach(function(s){if(s.mainProduct&&prods.indexOf(s.mainProduct)<0)prods.push(s.mainProduct.slice(0,16));});catTabs+='<div class="tab'+(i===ci?' active':'')+'" onclick="S.activeCategory='+i+';S.activeSup=0;render();window.scrollTo(0,0)"><span>'+esc(k)+'</span>'+(roiKt>0?'<span class="tab-badge">$'+roiKt+'K</span>':'')+(cmpK.productFilter?'<span class="tab-hint" style="color:var(--amber)">🎯 '+esc(cmpK.productFilter)+'</span>':prods.length?'<span class="tab-hint">'+prods.slice(0,1).join(', ')+'</span>':'')+'</div>';});catTabs+='</div>';
  var filterBadge='';if(cmp.productFilter)filterBadge='<div style="background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.2);border-radius:9px;padding:9px 14px;margin-bottom:12px;font-size:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap"><span style="color:var(--amber);font-weight:700">🎯 기준 상품</span><span>"'+esc(cmp.productFilter)+'" 포함 데이터만 비교 중</span><span style="color:var(--text3);font-size:11px">— 동일 상품군끼리만 단가 비교</span></div>';
  var blindBtn='<div class="blind-toggle"><span class="bt-label">경쟁사 블라인드</span><div class="toggle-pill'+(S.blindMode?' on':'')+'" onclick="S.blindMode=!S.blindMode;render()"><div class="toggle-thumb"></div></div><span class="bt-state">'+(S.blindMode?'ON':'OFF')+'</span></div>';
  var supTabs='';if(ss.length){supTabs='<div class="tabs stabs">';ss.forEach(function(s,i){supTabs+='<div class="tab'+(i===si?' active':'')+'" onclick="S.activeSup='+i+';render();window.scrollTo(0,0)"><span>'+esc(s.supplier.slice(0,13))+'</span><span class="tab-badge red">−$'+s.overpayPerKg+'/kg</span>'+(s.mainProduct?'<span class="tab-hint">'+esc(s.mainProduct.slice(0,16))+'</span>':'')+'</div>';});supTabs+='</div>';}
  var compRows='';if(cur){cur.comps.forEach(function(x,i){var name=S.blindMode?('경쟁사 '+'ABCDEFGHI'[i]):esc(x.imp.slice(0,16));var diff=+(cur.compP-x.avgP).toFixed(3);compRows+='<tr class="'+(x.avgP<cur.compP?'best':'')+'"><td style="font-size:11px">'+name+'</td><td>'+x.volTons+'t</td><td class="'+(x.avgP<cur.compP?'plo':'')+'">$'+x.avgP+'</td><td>'+tag(diff>0?'tagt':'taga',(diff>0?'-$':'+$')+Math.abs(diff).toFixed(3))+'</td><td style="color:var(--text2)">'+x.cnt+'건</td></tr>';});compRows+='<tr class="hl"><td style="font-weight:600">★ '+esc((S.companyName||'이 회사').slice(0,14))+'</td><td>'+cur.compVolTons+'t</td><td class="phi">$'+cur.compP+'</td><td>'+tag('tagr','기준')+'</td><td style="color:var(--text2)">최고가</td></tr>';}
  // 갭 추이 캡션
  var gapCapTxt='';if(cur&&cur.gapByYear){var g=cur.gapByYear.filter(function(d){return d.gap!=null;});if(g.length>=2){var first=g[0].gap,last=g[g.length-1].gap;var widening=last>first;gapCapTxt=cap('이 회사 vs 시장(경쟁사) 단가 추이 · 갭이 '+(widening?'<span style="color:var(--red);font-weight:600">벌어지는 중</span> → 협상이 점점 더 시급':'<span style="color:var(--teal);font-weight:600">좁혀지는 중</span>'));}}
  var origRows='';(cmp.origComp||[]).filter(function(o){return o.mAvg;}).forEach(function(o){var g=o.gap||0;origRows+='<tr class="'+(g>0?'hl':'best')+'"><td style="font-weight:500">'+esc(o.orig)+'</td><td class="'+(g>0?'phi':'plo')+'">$'+o.cAvg+'</td><td>$'+o.mAvg+'</td><td>'+tag(g>0?'tagr':'tagt',(g>0?'+':'')+g.toFixed(3))+'</td><td style="color:var(--text2)">'+o.cVolTons+'t</td></tr>';});
  var altRows='';(cmp.altOrigins||[]).slice(0,4).forEach(function(a){altRows+='<tr class="best"><td style="font-weight:500">'+esc(a.orig)+'</td><td class="pok">$'+a.mAvg+'/kg</td><td>$'+a.mMin+'</td><td>'+tag('tagg','-$'+a.saving.toFixed(3))+'</td><td style="color:var(--text2)">'+a.cnt+'건</td></tr>';});
  // ── 타이밍 섹션 ──
  var timingSection='';
  if(tm){
    var lowNames=tm.lowMonths.map(function(mn){return MONTHS[mn-1];}).join(', ');
    var idxPct=Math.round((tm.timingIndex-1)*100);
    var timingNarr='';
    if(tm.timingSaving>5){timingNarr=alrt('alert-amber','<strong>📅 구매 타이밍 분석</strong><br>시장 최저가 시즌은 <strong style="color:var(--teal)">'+lowNames+'</strong> (평균 $'+tm.lowMonthsAvg+'/kg). '+(tm.compPeakName?'경쟁사는 '+tm.compPeakName+'에 집중 매수하는 반면, ':'')+'이 회사는 '+tm.cPeakName+'에 주로 매수해 시장 평균보다 <strong style="color:var(--red)">'+idxPct+'% 비싼 시점</strong>에 구매 중이에요.<br><strong>협상 없이 타이밍만 옮겨도 연 $'+tm.timingSaving+'K 절감 가능</strong>합니다.');}
    else{timingNarr=alrt('alert-teal','<strong>📅 구매 타이밍 분석</strong> — 시장 최저가 시즌은 '+lowNames+'. 이 회사의 구매 타이밍은 시장 평균과 큰 차이가 없어 타이밍 효율은 양호한 편이에요.');}
    timingSection='<div class="card"><div class="ctitle">📅 경쟁사 소싱 타이밍 분석 <span class="cbadge">언제 사야 싼가</span></div>'
      +'<div class="timing-kpis">'
      +'<div class="tk"><div class="tk-val" style="color:var(--teal)">'+(tm.cheapMonthName||'—')+'</div><div class="tk-lbl">시장 최저가 시즌<br>($'+(tm.cheapMonthPrice||'—')+'/kg)</div></div>'
      +'<div class="tk"><div class="tk-val" style="color:'+(idxPct>5?'var(--red)':'var(--teal)')+'">'+(idxPct>0?'+':'')+idxPct+'%</div><div class="tk-lbl">자사 구매 타이밍<br>시장평균 대비</div></div>'
      +'<div class="tk"><div class="tk-val" style="color:var(--amber)">$'+tm.timingSaving+'K</div><div class="tk-lbl">타이밍 개선<br>절감 가능액</div></div>'
      +'</div>'
      +'<div class="g2" style="margin-top:14px"><div><div class="ctitle" style="margin-bottom:8px">월별 시장 단가 캘린더</div><div style="position:relative;height:200px"><canvas id="ch-tcal"></canvas></div>'+cap('<span style="color:var(--green)">초록 막대</span>=최저가 시즌, 선=시장 단가 · 이 시기에 매수하면 가장 저렴해요')+'</div>'
      +'<div><div class="ctitle" style="margin-bottom:8px">경쟁사 vs 자사 구매 타이밍</div><div style="position:relative;height:200px"><canvas id="ch-tcmp"></canvas></div>'+cap('<span style="color:var(--red)">빨강</span>=자사, <span style="color:var(--blue)">파랑</span>=경쟁사 매수량, 선=시장 단가 · 누가 저점에 사는지 한눈에')+'</div></div>'
      +timingNarr
      +'</div>';
  }
  return '<div class="fade-in">'
    +'<div class="sec-header"><div><div class="sec-eyebrow" style="color:var(--red)">경쟁사 단가 + 타이밍</div><h2 class="sec-title">시장 비교 분석</h2></div><button class="btn-ghost btnsm" onclick="S.step=5;render()">📊 ROI →</button></div>'
    +catTabs
    +(roiK>0?roiWarn+'<div class="roi-banner"><div><div class="rb-label">['+esc(curCat)+'] 연간 초과 지불 추정</div><div class="rb-amount">$'+roiK.toLocaleString()+'K</div><div class="rb-sub">≈ '+roiKrw+'백만원</div></div><div style="flex:1;min-width:200px">'+alrt('alert-red','<strong>같은 공급사, 다른 가격</strong> — '+ss.length+'개 공급사에서 경쟁사보다 비싸게 구매 중')+(cmp.altOrigins&&cmp.altOrigins.length?alrt('alert-teal','<strong>대안 원산지 '+cmp.altOrigins.length+'개</strong> — 더 저렴한 소싱 루트 발견'):'')+'</div></div>':'')+'<div style="display:flex;justify-content:flex-end;margin-bottom:8px"><button class="btn-view-data" onclick="openDataViewer(this.dataset.cat)" data-cat="'+esc(curCat)+'">📋 비교 데이터 보기 ('+(cmp._mktRows||[]).length+'건)</button></div>'
    +filterBadge+blindBtn
    +(ss.length?'<div class="card"><div class="ctitle">동일 공급사 바이어별 단가 <span class="cbadge">'+ss.length+'개</span></div>'+supTabs+(cur?'<div class="g2" style="gap:14px"><div><div style="position:relative;height:250px"><canvas id="ch-cm"></canvas></div>'+cap('<span style="color:var(--teal)">초록</span>=이 회사보다 저렴한 경쟁사 · <span style="color:var(--red)">빨강</span>=이 회사 (동일 공급사 최고가)')+'</div><div>'+alrt('alert-red','<strong>'+esc(cur.supplier)+'</strong>'+(cur.mainProduct?' <span style="color:var(--text3);font-size:11px">| '+esc(cur.mainProduct)+'</span>':'')+'<br>이 회사 <strong>$'+cur.compP+'/kg</strong> vs 최저 <strong style="color:var(--teal)">$'+cur.bestPrice+'/kg</strong><br>kg당 $'+cur.overpayPerKg+' 초과 · '+cur.compVolTons+'t 기준 연 <strong>$'+(cur.overpayPerKg*cur.compVolTons).toFixed(0)+'K</strong>')+'<table class="dtbl" style="margin-top:10px"><thead><tr><th>바이어</th><th>물량</th><th>단가</th><th>대비</th><th>건수</th></tr></thead><tbody>'+compRows+'</tbody></table></div></div>':'')+(cur&&cur.gapByYear&&cur.gapByYear.filter(function(d){return d.marketP!=null;}).length>=2?'<div class="ctitle" style="margin-top:16px">📈 단가 갭 추이 (연도별)</div><div style="position:relative;height:200px"><canvas id="ch-gap"></canvas></div>'+gapCapTxt:'')+'</div>':'')
    +timingSection
    +(origRows?'<div class="card"><div class="ctitle">원산지별 단가 — 이 회사 vs 시장 평균</div><div class="g2"><div style="position:relative;height:200px"><canvas id="ch-oc"></canvas></div><table class="dtbl"><thead><tr><th>원산지</th><th>이 회사</th><th>시장평균</th><th>갭</th><th>물량</th></tr></thead><tbody>'+origRows+'</tbody></table></div></div>':'')
    +(altRows?'<div class="card"><div class="ctitle">대안 소싱 원산지 <span class="cbadge">현재 미사용</span></div><table class="dtbl"><thead><tr><th>원산지</th><th>시장평균</th><th>최저단가</th><th>현재 대비</th><th>거래건수</th></tr></thead><tbody>'+altRows+'</tbody></table>'+alrt('alert-teal','<strong>대안 원산지 활용 시</strong> 현재 최저 단가보다 저렴하게 구매 가능. 품질·스펙 검증 후 파일럿 소싱을 추천해요.')+'</div>':'')
    +'<div style="text-align:center;padding:8px 0"><button class="btn-primary" onclick="S.step=5;render()">📊 ROI·기대효과 →</button></div></div>';
}
function sched3(){if(!S.comparisons)return;var catKeys=Object.keys(S.comparisons);var ci=Math.min(S.activeCategory,catKeys.length-1);var cmp=S.comparisons[catKeys[ci]]||{};var ss=cmp.sameSupplier||[];var si=Math.min(S.activeSup,ss.length-1);if(ss.length){chComp(ss,si,S.blindMode);chGapTrend(ss,si);}if(cmp.timing){chTimingCalendar(cmp.timing);chTimingCompare(cmp.timing);}if((cmp.origComp||[]).filter(function(o){return o.mAvg;}).length)chOrigComp(cmp.origComp);}

// ── STEP 4: ROI ──
function rROI(){
  var allCmps=Object.values(S.comparisons||{});
  var rawK=allCmps.reduce(function(s,c){return s+(c?c.roiK:0);},0);
  var displayK=+(rawK*S.roiFactor).toFixed(0);
  var displayKrw=Math.round(displayK*1.35/10)*10;
  var nm=S.negMatrix;var wf=S.waterfall;var ac=S.actionCards;
  var tridgeSection='';var pb=null;
  if(S.tridgeCost&&displayK>0){
    var mult=+(displayK/(S.tridgeCost/1000)).toFixed(1);
    var net=+(displayK-S.tridgeCost/1000).toFixed(0);
    pb=computePayback(displayK,S.tridgeCost/1000);
    tridgeSection='<div class="tridge-roi-card"><div class="tr-title">💰 Tridge ROI 분석</div><div class="tr-grid">'
      +'<div class="tr-item"><div class="tr-val" style="color:var(--teal)">'+mult+'x</div><div class="tr-lbl">투자 대비 회수 배율</div></div>'
      +'<div class="tr-item"><div class="tr-val" style="color:var(--green)">$'+net+'K</div><div class="tr-lbl">구독료 제외 순 절감</div></div>'
      +'<div class="tr-item"><div class="tr-val" style="color:'+(pb.breakeven?'var(--blue)':'var(--amber)')+'">'+( pb.breakeven?pb.breakeven+'개월':'—')+'</div><div class="tr-lbl">구독료 회수 시점</div></div>'
      +'</div></div>';
  }else if(S.tridgeNeg){
    tridgeSection='<div class="settings-block"><div style="font-size:12px;color:var(--amber);font-weight:600;margin-bottom:6px">⇄ 구독 비용 협상 중</div>'
      +'<div style="font-size:13px;color:var(--text2)">절감액 $'+displayK+'K 기준 협상 목표가 권장: <strong style="color:var(--amber)">$'+(displayK*0.10|0)+'K~$'+(displayK*0.15|0)+'K/년</strong></div></div>';
  }
  var actionHtml='';if(ac&&ac.length){
    var colorMap={green:'var(--green)',blue:'var(--blue)',amber:'var(--amber)',purple:'var(--purple)',red:'var(--red)'};
    actionHtml='<div class="action-grid">';
    ac.forEach(function(a){var c=colorMap[a.color]||'var(--teal)';
      actionHtml+='<div class="action-card" style="--ac:'+c+'"><div class="ac-tag" style="background:'+c+'22;color:'+c+'">'+esc(a.tag)+'</div><div class="ac-icon">'+a.icon+'</div><div class="ac-title">'+esc(a.title)+'</div><div class="ac-desc">'+esc(a.desc)+'</div><div class="ac-meta">'+(a.savingK?'<div class="ac-saving">$'+a.savingK+'K 절감 가능</div>':'')+'<div class="ac-attrs"><span class="ac-attr" style="color:var(--text2)">⏱ '+esc(a.timeline)+'</span><span class="ac-attr" style="color:'+(a.diffColor==='green'?'var(--green)':a.diffColor==='amber'?'var(--amber)':'var(--red)')+'">● '+esc(a.difficulty)+'</span></div></div></div>';
    });
    actionHtml+='</div>';
  }
  var matrixLegend='';if(nm&&nm.points.length)matrixLegend='<div class="mat-legend"><div class="ml-item"><span class="ml-dot" style="background:rgba(239,68,68,.8)"></span>전략 (고볼륨·고갭)</div><div class="ml-item"><span class="ml-dot" style="background:rgba(245,158,11,.75)"></span>퀵윈 (저볼륨·고갭)</div><div class="ml-item"><span class="ml-dot" style="background:rgba(59,130,246,.7)"></span>모니터 (고볼륨·저갭)</div><div class="ml-item"><span class="ml-dot" style="background:rgba(100,116,139,.5)"></span>저우선순위</div></div>';
  var baItems=[];var allSS2=[];allCmps.forEach(function(c){if(c&&c.sameSupplier)allSS2=allSS2.concat(c.sameSupplier);});allSS2.sort(function(a,b){return (b.overpayPerKg*b.compVolTons)-(a.overpayPerKg*a.compVolTons);});allSS2.slice(0,5).forEach(function(s){baItems.push({label:s.supplier.slice(0,12),before:s.compP,after:s.top10AvgP||s.bestPrice});});
  var benefitCards=[
    {icon:'💰',title:'소싱 단가 정상화',q:'$'+displayK+'K/년',d:'동일 공급사 상위 바이어 평균 수준으로 단가 협상',color:'teal'},
    {icon:'📅',title:'구매 타이밍 최적화',q:'시즌 포착',d:'시장 저점 시즌을 데이터로 짚어 선매입 타이밍 확보',color:'blue'},
    {icon:'🌏',title:'대안 소싱 발굴',q:'리스크 분산',d:'미활용 원산지·공급사를 사전 발굴해 공급 안정성 확보',color:'purple'},
    {icon:'🛡',title:'이탈 리스크 방지',q:'사전 대응',d:'단가 급등으로 인한 품목 이탈을 시장 모니터링으로 예방',color:'amber'}
  ];
  var benefitHtml='<div class="benefit-grid">'+benefitCards.map(function(b){var cm={teal:'var(--teal)',blue:'var(--blue)',purple:'var(--purple)',amber:'var(--amber)'};var c=cm[b.color];return '<div class="benefit-card" style="--bc:'+c+'"><div class="bc-icon">'+b.icon+'</div><div class="bc-q" style="color:'+c+'">'+b.q+'</div><div class="bc-title">'+b.title+'</div><div class="bc-desc">'+b.d+'</div></div>';}).join('')+'</div>';
  // 이상치 제거 현황
  var outlierInfo='';var totalRemoved=0;allSS2.forEach(function(s){totalRemoved+=(s.removedOutliers||0);});
  if(totalRemoved>0)outlierInfo='<div style="font-size:11px;color:var(--text3);margin-top:6px;text-align:center">🧹 이상치 '+totalRemoved+'개 제거 후 산출 (IQR 방식)</div>';
  // 카테고리별 상세
  var catRows='';Object.entries(S.comparisons||{}).forEach(function(en){
    var cat=en[0],cmp=en[1];if(!cmp)return;
    var rawRoi=cmp.roiK;var dispRoi=+(rawRoi*S.roiFactor).toFixed(0);
    catRows+='<tr><td style="font-weight:500">'+esc(cat)+'</td><td class="phi">$'+rawRoi+'K</td><td style="color:var(--teal)">'+Math.round(S.roiFactor*100)+'%</td><td class="pok">$'+dispRoi+'K</td></tr>';
  });

  return '<div class="fade-in">'
    +'<div class="sec-header"><div><div class="sec-eyebrow" style="color:var(--green)">ROI · 기대효과</div><h2 class="sec-title">절감 기회 & Tridge 효과</h2></div><button class="btn-ghost btnsm" onclick="S.step=6;render()">🤖 인사이트 →</button></div>'
    // 단일 시나리오 카드
    +'<div style="display:flex;gap:16px;align-items:stretch;margin-bottom:16px">'
    +'<div class="scenario-card" style="--sc:var(--teal);flex:1">'
    +'<div class="sc-tag">연간 절감 추정 (협상 기반)</div>'
    +'<div class="sc-amount">$'+displayK.toLocaleString()+'K</div>'
    +'<div class="sc-sub">≈ '+displayKrw+'백만원 / 연간</div>'
    +'<div class="sc-desc">동일 공급사 상위 바이어 평균단가 기준 · 최근 1년 물량 적용</div>'
    +outlierInfo
    +'</div>'
    // roiFactor 슬라이더
    +'<div class="card" style="min-width:200px;display:flex;flex-direction:column;justify-content:center;padding:20px">'
    +'<div style="font-size:12px;font-weight:600;color:var(--text2);margin-bottom:10px">현실화 계수 조정</div>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap">'
    +[30,40,50,60].map(function(pct){
      return '<button onclick="S.roiFactor='+pct/100+';render()" style="flex:1;padding:8px 4px;border-radius:8px;border:1.5px solid '+(Math.round(S.roiFactor*100)===pct?'var(--teal)':'var(--border)')+';background:'+(Math.round(S.roiFactor*100)===pct?'rgba(0,201,167,.12)':'none')+';color:'+(Math.round(S.roiFactor*100)===pct?'var(--teal)':'var(--text2)')+';cursor:pointer;font-size:12px;font-weight:'+(Math.round(S.roiFactor*100)===pct?'700':'400')+'">'+pct+'%</button>';
    }).join('')
    +'</div>'
    +'<div style="font-size:11px;color:var(--text3);margin-top:8px;line-height:1.4">협상 성공률 가정.<br>보수적=30%, 표준=50%</div>'
    +'</div></div>'
    +'<div class="card"><div class="ctitle">절감 기회 시각화</div><div style="position:relative;height:200px"><canvas id="ch-roi"></canvas></div>'+cap('상위 바이어 평균 대비 초과지불 · 현실화 계수 '+Math.round(S.roiFactor*100)+'% 적용')+'</div>'
    +tridgeSection
    +(pb?'<div class="card"><div class="ctitle">💹 누적 절감 페이백 곡선 <span class="cbadge">'+(pb.breakeven?pb.breakeven+'개월 회수':'')+'</span></div><div style="position:relative;height:200px"><canvas id="ch-pay"></canvas></div>'+cap('<span style="color:var(--green)">초록</span>=누적 절감액, <span style="color:var(--amber)">점선</span>=구독료 · 교차점이 본전 회수 시점')+'</div>':'')
    +(wf&&wf.items.length?'<div class="card"><div class="ctitle">💧 절감 폭포 차트 <span class="cbadge">Waterfall</span></div><div style="position:relative;height:'+(Math.max(200,wf.items.length*42))+'px"><canvas id="ch-wf"></canvas></div>'+cap('절감 기여가 큰 공급사 순 · 협상 우선순위 기준')+'</div>':'')
    +(baItems.length?'<div class="card"><div class="ctitle">🔄 Before / After — 협상 목표 단가</div><div style="position:relative;height:200px"><canvas id="ch-ba"></canvas></div>'+cap('<span style="color:var(--red)">빨강</span>=현재 단가, <span style="color:var(--teal)">초록</span>=상위 바이어 평균 (협상 목표)')+'</div>':'')
    +(nm&&nm.points.length?'<div class="card"><div class="ctitle">🎯 공급사 협상력 매트릭스 <span class="cbadge">2×2</span></div>'+matrixLegend+'<div class="g2" style="gap:16px;align-items:start"><div style="position:relative;height:280px"><canvas id="ch-mat"></canvas></div><div><table class="dtbl"><thead><tr><th>공급사</th><th>볼륨</th><th>단가갭</th><th>절감</th><th>우선순위</th></tr></thead><tbody>'+nm.points.sort(function(a,b){return b.savingK-a.savingK;}).map(function(p){var qLabel={'strategic':'🔴 전략','quickwin':'🟡 퀵윈','monitor':'🔵 모니터','low':'⚪ 저우선'}[p.quadrant]||'';return '<tr><td style="font-size:11px">'+esc(p.supplier.slice(0,14))+'</td><td>'+p.volume+'t</td><td class="'+(p.gapPct>=8?'phi':p.gapPct>=4?'pok':'')+'">'+ p.gapPct+'%</td><td style="color:var(--red);font-weight:600">$'+p.savingK+'K</td><td>'+qLabel+'</td></tr>';}).join('')+'</tbody></table></div></div></div>':'')
    +(actionHtml?'<div class="card"><div class="ctitle">⚡ 즉시 실행 액션 TOP 3</div>'+actionHtml+'</div>':'')
    +'<div class="card"><div class="ctitle">🎁 Tridge 데이터 솔루션 기대효과</div>'+benefitHtml+'</div>'
    +(catRows?'<div class="card"><div class="ctitle">카테고리별 절감 상세</div><table class="dtbl"><thead><tr><th>카테고리</th><th>원값</th><th>계수</th><th>표시값</th></tr></thead><tbody>'+catRows+'</tbody></table></div>':'')
    +'<div style="text-align:center;padding:8px 0"><button class="btn-primary" onclick="S.step=6;render()">🤖 AI 인사이트 & 출력 →</button></div></div>';
}

function schedROI(){var allCmps=Object.values(S.comparisons||{});var s1K=allCmps.reduce(function(s,c){return s+(c?c.roiK:0);},0);var timingK=allCmps.reduce(function(s,c){return s+((c&&c.timing)?c.timing.timingSaving:0);},0);var s2K=s1K+allCmps.reduce(function(s,c){return s+(c?c.roiAltK:0);},0)+timingK;chROI(s1K,s2K,S.tridgeCost,S.tridgeNeg);if(S.tridgeCost&&s1K>0)chPayback(computePayback(s1K,S.tridgeCost/1000));if(S.waterfall&&S.waterfall.items.length)chWaterfall(S.waterfall);var baItems=[];var allSS2=[];allCmps.forEach(function(c){if(c&&c.sameSupplier)allSS2=allSS2.concat(c.sameSupplier);});allSS2.sort(function(a,b){return (b.overpayPerKg*b.compVolTons)-(a.overpayPerKg*a.compVolTons);});allSS2.slice(0,5).forEach(function(s){baItems.push({label:s.supplier.slice(0,12),before:s.compP,after:s.bestPrice});});if(baItems.length)chBeforeAfter(baItems);if(S.negMatrix&&S.negMatrix.points.length)chNegMatrix(S.negMatrix);}

// ── STEP 5: INSIGHTS ──
function rInsights(){
  var ins=S.insights;var hs=S.healthScore;var fnd=S.findings;
  var totalRoi=getTotalRoi();
  var localBanner='';if(ins&&ins._local)localBanner='<div class="local-banner">⚠ 데이터 기반 자동 생성 — API 키 미입력 상태. <button class="btn-link" onclick="copyPrompt()">📋 프롬프트 복사</button>해서 Claude.ai에 붙여넣으면 더 정교한 인사이트를 받을 수 있어요.</div>';
  var insHtml='';if(ins&&ins.insights)ins.insights.forEach(function(i){insHtml+='<div class="ins-item"><div class="ins-dot"></div><div>'+esc(i)+'</div></div>';});
  var qHtml='';if(ins&&ins.questions)ins.questions.forEach(function(q,i){qHtml+='<div class="q-item"><div class="q-num">'+(i+1)+'</div><div>'+esc(q)+'</div></div>';});
  var catSummary='';Object.entries(S.comparisons||{}).forEach(function(en){var cat=en[0],cmp=en[1];if(!cmp)return;catSummary+='<div class="summary-chip">'+esc(cat)+' <strong style="color:var(--red)">$'+cmp.roiK+'K</strong></div>';});
  var findingsHtml='';if(fnd&&fnd.length){var cmap={red:'var(--red)',amber:'var(--amber)',teal:'var(--teal)',blue:'var(--blue)'};findingsHtml='<div class="ins-card" style="--bc:rgba(245,158,11,.2)"><div class="ic-title">🔍 핵심 발견 요약</div>';fnd.forEach(function(f,i){findingsHtml+='<div class="finding-row"><div class="finding-num" style="background:'+(cmap[f.color]||'var(--teal)')+'22;color:'+(cmap[f.color]||'var(--teal)')+'">'+(i+1)+'</div><div class="finding-text">'+f.text+'</div></div>';});findingsHtml+='</div>';}
  return '<div class="fade-in">'
    +'<div class="sec-header"><div><div class="sec-eyebrow" style="color:var(--purple)">AI POWERED</div><h2 class="sec-title">미팅 인사이트</h2></div><div style="display:flex;gap:8px"><button class="btn-ghost btnsm" onclick="regen()">↻ 재생성</button><button class="btn-ghost btnsm" onclick="genColdEmail()">📧 콜드메일</button><button class="btn-ghost btnsm" onclick="showMeetingPrep()">🎯 미팅준비</button><button class="btn-ghost btnsm" onclick="showNextTargets()">🏹 영업타겟</button><button class="btn-ghost btnsm" onclick="exportClientReport()" id="btn-client-report">📋 미팅 보고서</button><button class="btn-primary btnsm" onclick="doExport()">📥 요약 보고서</button></div></div>'
    +localBanner+findingsHtml
    +(ins?'<div class="ins-card" style="--bc:rgba(0,201,167,.2)"><div class="ic-title">💡 핵심 인사이트</div>'+insHtml+'</div><div class="ins-card" style="--bc:rgba(59,130,246,.2)"><div class="ic-title">🎯 미팅 오프닝 멘트</div><div class="opening-box">'+esc(ins.opening||'')+'</div><div class="opening-hint">이 멘트로 시작하면 방어적 반응 없이 대화를 열 수 있어요.</div></div>'+(qHtml?'<div class="ins-card" style="--bc:rgba(245,158,11,.2)"><div class="ic-title">❓ 추천 질문</div>'+qHtml+'</div>':'')+(ins.caution?'<div class="ins-card" style="--bc:rgba(239,68,68,.2)"><div class="ic-title">⚠ 미팅 주의사항</div><div class="caution-box">'+esc(ins.caution)+'</div></div>':''):'')
    +'<div class="card"><div class="ctitle">분석 요약</div><div class="summary-grid"><div class="sg-item"><div class="sg-label">포트폴리오</div><div class="sg-val">'+S.portfolio.totVolTons+'톤 · $'+S.portfolio.totValMil+'M<br>평균 $'+S.portfolio.avgP+'/kg</div></div>'+(hs?'<div class="sg-item"><div class="sg-label">헬스스코어</div><div class="sg-val" style="color:'+hs.color+'">'+hs.total+'점 ('+hs.grade+'등급)<br>'+hs.label+'</div></div>':'')+(totalRoi>0?'<div class="sg-item"><div class="sg-label">절감 기회</div><div class="sg-val" style="color:var(--red)">$'+totalRoi+'K<br>≈ '+Math.round(totalRoi*1.35/10)*10+'백만원</div></div>':'')+'</div>'+(catSummary?'<div class="cat-chips">'+catSummary+'</div>':'')+'</div>'
    +'<div style="text-align:center;padding:16px 0"><button class="btn-ghost" onclick="doReset()">↩ 새 분석 시작</button></div></div>';
}
async function regen(){S.insights=null;render();S.insights=await callClaude(S.portfolio,S.comparisons,S.companyName,S.apiKey,S.companyMemo,S.healthScore);render();}
function copyPrompt(){if(S.insights&&S.insights._prompt){if(navigator.clipboard){navigator.clipboard.writeText(S.insights._prompt).then(function(){alert('복사 완료! Claude.ai에 붙여넣으세요.');});}else{var ta=document.createElement('textarea');ta.value=S.insights._prompt;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);alert('복사 완료!');}}}

// ── v6: 기업 자동 조사 (웹서치 + Claude) ──
async function doResearch(){
  // 입력란에서 직접 읽기 (S.companyName 동기화 보장)
  var inp=document.getElementById('inp-company');
  if(inp&&inp.value)S.companyName=inp.value;
  var name=S.companyName||'';
  if(!name){alert('회사명을 입력해주세요.');return;}
  if(!S.apiKey){alert('API 키를 먼저 입력해주세요.');return;}
  S.researchLoading=true;render();

  var prompt='한국 기업 "'+name+'"을 웹 검색으로 조사해주세요.\n\n'
    +'아래 형식의 JSON 객체만 반환하세요. 다른 텍스트나 설명은 절대 포함하지 마세요.\n\n'
    +'{"basicInfo":"설립연도/대표명/매출규모/직원수/주요거래처","businessStructure":"주력품목/브랜드명/유통채널/수출입이력","recentNews":"최근3~6개월 뉴스·계약·인증·이슈","sourcingInsight":"원가압박시그널/공급사다변화필요성/소싱확장가능성 등 트릿지 영업 관련 인사이트"}\n\n'
    +'각 항목은 2~4문장으로 작성. 정보 없으면 "확인된 정보 없음" 기재. JSON 외 어떤 텍스트도 출력 금지.';

  try{
    var res=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'x-api-key':S.apiKey,
        'anthropic-version':'2023-06-01',
        'anthropic-dangerous-direct-browser-access':'true'
      },
      body:JSON.stringify({
        model:'claude-sonnet-4-6',
        max_tokens:2000,
        tools:[{type:'web_search_20250305',name:'web_search'}],
        messages:[{role:'user',content:prompt}]
      })
    });
    var data=await res.json();
    var txt=(data.content||[]).map(function(c){return c.type==='text'?c.text:'';}).join('');
    // JSON 블록 추출 시도
    var cleaned=txt.replace(/```json|```/g,'').trim();
    // { } 사이 JSON만 추출
    var jsonMatch=cleaned.match(/\{[\s\S]*\}/);
    if(!jsonMatch)throw new Error('JSON 형식 응답을 찾을 수 없습니다. 다시 시도해주세요.');
    var result=JSON.parse(jsonMatch[0]);
    S.companyResearch=result;
    // 메모에도 자동 채우기
    S.companyMemo=[
      '[기업 기본 정보]\n'+result.basicInfo,
      '[사업 구조]\n'+result.businessStructure,
      '[최근 뉴스]\n'+result.recentNews,
      '[소싱 인사이트]\n'+result.sourcingInsight
    ].join('\n\n');
  }catch(e){
    S.companyResearch={_error:e.message};
  }
  S.researchLoading=false;
  render();
}

function rResearchBox(){
  var hasName=!!(S.companyName||(document.querySelector&&document.querySelector('input[placeholder*="이안스"]')||{}).value);
  var r=S.companyResearch;

  var btnLabel=S.researchLoading
    ?'<span class="spinner" style="width:12px;height:12px;border-width:2px"></span> 조사 중...'
    :'🔍 기업 자동 조사';

  var header='<div class="research-header">'
    +'<div class="research-title">📋 기업 조사 <span style="font-size:10px;font-weight:400;color:var(--text3)">(AI 웹서치 자동 작성 · 수동 수정 가능)</span></div>'
    +'<button class="research-btn" onclick="doResearch()" '+(S.researchLoading?'disabled':'')+'>'+btnLabel+'</button>'
    +'</div>';

  var body='';
  if(S.researchLoading){
    body='<div class="research-loading">🔍 '+esc(S.companyName||'기업')+'을 웹서치로 조사하고 있어요...</div>';
  } else if(r&&r._error){
    body='<div class="research-empty">⚠ 조사 중 오류 발생: '+esc(r._error)+'<br>아래 메모란에 직접 입력해주세요.</div>';
  } else if(r){
    body='<div class="research-sections">'
      +'<div class="research-section"><div class="research-section-title">🏢 기업 기본 정보</div><div class="research-section-body">'+esc(r.basicInfo||'')+'</div></div>'
      +'<div class="research-section"><div class="research-section-title">📦 사업 구조</div><div class="research-section-body">'+esc(r.businessStructure||'')+'</div></div>'
      +'<div class="research-section"><div class="research-section-title">📰 최근 뉴스</div><div class="research-section-body">'+esc(r.recentNews||'')+'</div></div>'
      +'<div class="research-section"><div class="research-section-title">🎯 소싱 인사이트</div><div class="research-section-body">'+esc(r.sourcingInsight||'')+'</div></div>'
      +'</div>';
  } else {
    body='<div class="research-empty">회사명 입력 후 [기업 자동 조사] 버튼을 누르면<br>AI가 웹서치로 자동으로 조사해드려요</div>';
  }

  // 수동 수정 메모란
  var memo='<div style="margin-top:10px">'
    +'<div style="font-size:11px;color:var(--text3);margin-bottom:4px">✏ 추가 메모 (직접 입력 또는 자동 조사 결과 수정)</div>'
    +'<textarea class="memo-input" style="height:80px" placeholder="예: 대표 조삼열, 설립 2018년, FSSC 22000 인증..." oninput="S.companyMemo=this.value">'+esc(S.companyMemo)+'</textarea>'
    +'</div>';

  return '<div class="research-box">'+header+body+memo+'</div>';
}

// ── v7: 데이터 뷰어 ──
function openDataViewer(cat){
  S.dataViewer={open:true,cat:cat,excludedIdx:S.dataViewer&&S.dataViewer.cat===cat?S.dataViewer.excludedIdx:{}};
  render();
  renderDataViewer();
}

function closeDataViewer(){closeDvOverlay();render();}

function toggleRowExclude(idx){
  if(S.dataViewer.excludedIdx[idx])delete S.dataViewer.excludedIdx[idx];
  else S.dataViewer.excludedIdx[idx]=true;
  // 재계산
  recalcComparison(S.dataViewer.cat);
  renderDataViewer();
}

function recalcComparison(cat){
  var cmp=S.comparisons[cat];
  if(!cmp||!cmp._mktRows)return;

  // 제외된 행 빼고 재계산
  var excluded=S.dataViewer.excludedIdx||{};
  var filteredMkt=cmp._mktRows.filter(function(r,i){return !excluded[i];});

  // 새 비교 결과 계산 (간소화: sameSupplier VWAP만 재계산)
  var cRows=cmp._clientRows||[];
  var cSupSet={};cRows.forEach(function(r){if(r.exporter)cSupSet[r.exporter]=true;});

  var newSS=[];
  Object.keys(cSupSet).forEach(function(sup){
    var supOthers=filteredMkt.filter(function(r){return r.exporter===sup;});
    if(supOthers.length<2)return;
    var cForSup=cRows.filter(function(r){return r.exporter===sup;});
    if(!cForSup.length)return;
    var cVol=cForSup.reduce(function(s,r){return s+r.volume;},0);
    var cPrice=cForSup.reduce(function(s,r){return s+r.unitPrice*r.volume;},0)/cVol;
    var byImp={};supOthers.forEach(function(r){if(!byImp[r.importer])byImp[r.importer]={imp:r.importer,vol:0,pv:0,cnt:0};byImp[r.importer].vol+=r.volume;byImp[r.importer].pv+=r.unitPrice*r.volume;byImp[r.importer].cnt++;});
    var comps=Object.values(byImp).map(function(d){return {imp:d.imp,avgP:+(d.pv/d.vol).toFixed(3),volTons:+(d.vol/1000).toFixed(1),cnt:d.cnt};}).sort(function(a,b){return a.avgP-b.avgP;}).slice(0,8);
    var cheaperCount=comps.filter(function(c){return c.avgP<cPrice;}).length;
    if(!cheaperCount)return;
    var bestPrice=+Math.min.apply(null,comps.map(function(c){return c.avgP;})).toFixed(3);
    var mainProd=getCompanyProducts(cRows,sup).length?getCompanyProducts(cRows,sup)[0].name:'';
    newSS.push({supplier:sup,compP:+cPrice.toFixed(3),compVolTons:+(cVol/1000).toFixed(1),comps:comps,cheaperCount:cheaperCount,bestPrice:bestPrice,overpayPerKg:+(cPrice-bestPrice).toFixed(3),mainProduct:mainProd,gapByYear:[],compProducts:[]});
  });

  cmp.sameSupplier=newSS.sort(function(a,b){return (b.overpayPerKg*b.compVolTons)-(a.overpayPerKg*a.compVolTons);});
  var roiSup=0;newSS.forEach(function(s){roiSup+=(s.compP-s.bestPrice)*s.compVolTons;});
  cmp.roiSupK=+roiSup.toFixed(0);
  cmp.roiK=+(roiSup+(cmp.roiOrigK||0)).toFixed(0);
}

function renderDataViewer(){
  // 기존 오버레이 제거
  var existing=document.getElementById('dv-overlay');
  if(existing)existing.remove();

  var dv=S.dataViewer;
  if(!dv||!dv.open)return;
  var cat=dv.cat;
  var cmp=S.comparisons[cat];
  if(!cmp){console.warn('cmp 없음', cat, Object.keys(S.comparisons)); return;}

  var rows=cmp._mktRows||[];
  if(!rows.length){console.warn('_mktRows 없음 또는 빈 배열');}
  var excluded=dv.excludedIdx||{};
  var activeCount=rows.filter(function(r,i){return !excluded[i];}).length;

  var tableRows=rows.length===0
    ? '<tr><td colspan="9" style="text-align:center;padding:20px;color:var(--text3)">데이터가 없습니다.</td></tr>'
    : rows.map(function(r,i){
        var isEx=!!excluded[i];
        var prodName=(r.productName||'').replace(/\[.*?\]\s*/g,'').split('__')[0].slice(0,28);
        return '<tr class="'+(isEx?'excluded':'')+'">'
          +'<td><span style="font-size:11px;font-weight:600;color:'+(isEx?'var(--text3)':'var(--teal)')+'">'+(isEx?'제외':'포함')+'</span></td>'
          +'<td title="'+esc(r.productName||'')+'">'+esc(prodName)+'</td>'
          +'<td style="font-size:11px">'+esc((r.importer||'').slice(0,20))+'</td>'
          +'<td style="font-size:11px">'+esc((r.exporter||'').slice(0,20))+'</td>'
          +'<td style="color:var(--teal);font-weight:600">$'+(r.unitPrice||0).toFixed(3)+'</td>'
          +'<td>'+((r.volume||0)/1000).toFixed(1)+'t</td>'
          +'<td style="font-size:11px">'+esc(r.origin||'')+'</td>'
          +'<td>'+(r.year||'')+'</td>'
          +'<td><button class="btn-row-del'+(isEx?' restore':'')+'" onclick="toggleRowExclude('+i+')">'+(isEx?'복원':'제외')+'</button></td>'
          +'</tr>';
      }).join('');

  var el=document.createElement('div');
  el.id='dv-overlay';
  el.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:900;display:flex;align-items:center;justify-content:center;padding:20px';
  el.innerHTML='<div style="background:var(--card);border:1px solid var(--border2);border-radius:16px;width:100%;max-width:940px;max-height:85vh;display:flex;flex-direction:column;overflow:hidden">'
    +'<div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0">'
    +'<div style="font-size:14px;font-weight:700;color:var(--text1)">📋 '+esc(cat)+' — 시장 비교 데이터 ('+rows.length+'건)</div>'
    +'<button onclick="closeDvOverlay()" style="background:none;border:none;color:var(--text2);cursor:pointer;font-size:20px;line-height:1;padding:4px 8px">✕</button>'
    +'</div>'
    +'<div style="overflow-y:auto;flex:1">'
    +'<table style="width:100%;border-collapse:collapse;font-size:12px">'
    +'<thead><tr style="background:var(--card2)">'
    +'<th style="padding:8px 12px;text-align:left;font-weight:600;color:var(--text2);white-space:nowrap;position:sticky;top:0;background:var(--card2)">상태</th>'
    +'<th style="padding:8px 12px;text-align:left;font-weight:600;color:var(--text2);position:sticky;top:0;background:var(--card2)">품목명</th>'
    +'<th style="padding:8px 12px;text-align:left;font-weight:600;color:var(--text2);position:sticky;top:0;background:var(--card2)">수입사</th>'
    +'<th style="padding:8px 12px;text-align:left;font-weight:600;color:var(--text2);position:sticky;top:0;background:var(--card2)">공급사</th>'
    +'<th style="padding:8px 12px;text-align:left;font-weight:600;color:var(--text2);position:sticky;top:0;background:var(--card2)">단가($/kg)</th>'
    +'<th style="padding:8px 12px;text-align:left;font-weight:600;color:var(--text2);position:sticky;top:0;background:var(--card2)">물량</th>'
    +'<th style="padding:8px 12px;text-align:left;font-weight:600;color:var(--text2);position:sticky;top:0;background:var(--card2)">원산지</th>'
    +'<th style="padding:8px 12px;text-align:left;font-weight:600;color:var(--text2);position:sticky;top:0;background:var(--card2)">연도</th>'
    +'<th style="padding:8px 12px;text-align:left;font-weight:600;color:var(--text2);position:sticky;top:0;background:var(--card2)">관리</th>'
    +'</tr></thead>'
    +'<tbody>'+tableRows+'</tbody>'
    +'</table>'
    +'</div>'
    +'<div style="padding:12px 20px;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;font-size:12px">'
    +'<span style="color:var(--text2)">총 <strong>'+rows.length+'</strong>건 중 <strong style="color:var(--teal)">'+activeCount+'건</strong> 포함 / <strong style="color:var(--red)">'+(rows.length-activeCount)+'건</strong> 제외</span>'
    +'<div style="display:flex;gap:8px">'
    +'<button onclick="restoreAll(\''+esc(cat)+'\')" style="padding:7px 16px;background:var(--card2);border:1px solid var(--border2);border-radius:8px;color:var(--text2);cursor:pointer;font-family:inherit;font-size:12px">↺ 전체 복원</button>'
    +'<button onclick="closeDvOverlay();render();" style="padding:7px 16px;background:var(--teal);border:none;border-radius:8px;color:#000;cursor:pointer;font-family:inherit;font-size:12px;font-weight:700">✅ 적용 완료</button>'
    +'</div>'
    +'</div>'
    +'</div>';

  // ESC로 닫기
  el.addEventListener('click',function(e){if(e.target===el)closeDvOverlay();});
  document.body.appendChild(el);
}

function closeDvOverlay(){
  var el=document.getElementById('dv-overlay');
  if(el)el.remove();
  S.dataViewer.open=false;
}

function restoreAll(cat){
  S.dataViewer.excludedIdx={};
  recalcComparison(cat);
  renderDataViewer();
  render();
}

// ── v8: 테마 시스템 ──
var THEMES=[
  {id:'dark',    name:'다크',       bg:'linear-gradient(135deg,#080F1E,#0D1629)', accent:'#00C9A7', dark:true},
  {id:'midnight',name:'미드나잇',   bg:'linear-gradient(135deg,#0A0A1A,#0F0F2A)',accent:'#818CF8', dark:true},
  {id:'forest',  name:'포레스트',   bg:'linear-gradient(135deg,#071410,#0C1E18)',accent:'#34D399', dark:true},
  {id:'slate',   name:'슬레이트',   bg:'linear-gradient(135deg,#0F172A,#1E293B)',accent:'#38BDF8', dark:true},
  {id:'ocean',   name:'오션',       bg:'linear-gradient(135deg,#001829,#002238)', accent:'#00D4FF', dark:true},
  {id:'light',   name:'라이트',     bg:'linear-gradient(135deg,#F4F7FB,#FFFFFF)', accent:'#0369A1', dark:false},
  {id:'warm',    name:'웜 베이지',  bg:'linear-gradient(135deg,#FDF8F3,#FFFBF7)',accent:'#C2410C', dark:false},
  {id:'cloud',   name:'클라우드',   bg:'linear-gradient(135deg,#EEF2FF,#FFFFFF)', accent:'#4F46E5', dark:false},
];
var APP_SETTINGS={theme:'dark',fontSize:'md',compactMode:false};

function loadSettings(){
  try{var s=localStorage.getItem('tridge_v8_settings');if(s)APP_SETTINGS=Object.assign(APP_SETTINGS,JSON.parse(s));}catch(e){}
  applySettings();
}

function saveSettings(){
  try{localStorage.setItem('tridge_v8_settings',JSON.stringify(APP_SETTINGS));}catch(e){}
}

function applySettings(){
  document.documentElement.setAttribute('data-theme',APP_SETTINGS.theme);
  var fontMap={sm:'13px',md:'14px',lg:'16px'};
  document.documentElement.style.fontSize=fontMap[APP_SETTINGS.fontSize]||'14px';
  if(APP_SETTINGS.compactMode){
    document.documentElement.style.setProperty('--card-padding','16px');
  } else {
    document.documentElement.style.removeProperty('--card-padding');
  }
}

function setTheme(id){
  APP_SETTINGS.theme=id;
  saveSettings();
  applySettings();
  renderSettingsPanel();
}

function setFontSize(sz){
  APP_SETTINGS.fontSize=sz;
  saveSettings();
  applySettings();
  renderSettingsPanel();
}

function toggleCompact(){
  APP_SETTINGS.compactMode=!APP_SETTINGS.compactMode;
  saveSettings();
  applySettings();
  renderSettingsPanel();
}

var settingsOpen=false;
function toggleSettings(){
  settingsOpen=!settingsOpen;
  if(settingsOpen)renderSettingsPanel();
  else{var el=document.getElementById('settings-overlay');if(el)el.remove();}
}

function renderSettingsPanel(){
  var existing=document.getElementById('settings-overlay');
  if(existing)existing.remove();
  if(!settingsOpen)return;

  var themeCards=THEMES.map(function(t){
    var active=APP_SETTINGS.theme===t.id;
    var previewBorder=t.dark?'1px solid rgba(255,255,255,.1)':'1px solid rgba(0,0,0,.1)';
    var nameCol=t.dark?'color:var(--text2)':'color:#333';
    var card='<div class="theme-card'+(active?' active':'')+'" onclick="setTheme(this.dataset.id)" data-id="'+t.id+'">'
      +'<div class="theme-preview" style="background:'+t.bg+';border:'+previewBorder+'">'
      +'<div style="width:40%;height:8px;background:'+t.accent+';border-radius:4px;margin:6px auto"></div>'
      +'</div>'
      +'<div class="theme-name" style="'+nameCol+'">'+(active?'✓ ':'')+t.name+'</div>'
      +'</div>';
    return card;
  }).join('');

  var fontBtns=['sm','md','lg'].map(function(sz){
    var labels={sm:'작게',md:'보통',lg:'크게'};
    var active=APP_SETTINGS.fontSize===sz;
    return '<button class="font-size-btn'+(active?' active':'')+'" onclick="setFontSize(\''+sz+'\')">'+labels[sz]+'</button>';
  }).join('');

  var panel='<div class="settings-overlay" id="settings-overlay" onclick="if(event.target===this){settingsOpen=false;this.remove()}">'
    +'<div class="settings-panel">'
    +'<div class="settings-panel-title">⚙ 설정<button onclick="settingsOpen=false;document.getElementById(\'settings-overlay\').remove()" style="background:none;border:none;color:var(--text2);cursor:pointer;font-size:18px">✕</button></div>'

    // 테마
    +'<div><div class="settings-section-label">🎨 테마</div>'
    +'<div class="theme-grid">'+themeCards+'</div></div>'

    // 글자 크기
    +'<div><div class="settings-section-label">🔤 글자 크기</div>'
    +'<div class="font-size-row">'+fontBtns+'</div></div>'

    // 기타 옵션
    +'<div><div class="settings-section-label">⚙ 기타</div>'
    +'<div class="settings-toggle-row"><span class="settings-toggle-label">컴팩트 모드</span>'
    +'<div class="mini-toggle'+(APP_SETTINGS.compactMode?' on':'')+'" onclick="toggleCompact()"><div class="mini-toggle-thumb"></div></div></div>'
    +'<div class="settings-toggle-row"><span class="settings-toggle-label">블라인드 기본값</span>'
    +'<div class="mini-toggle'+(S.blindMode?' on':'')+'" onclick="S.blindMode=!S.blindMode;renderSettingsPanel()"><div class="mini-toggle-thumb"></div></div></div>'
    +'</div>'

    // 버전 정보
    +'<div style="margin-top:auto;padding-top:16px;border-top:1px solid var(--border);font-size:11px;color:var(--text3);text-align:center">'
    +'Tridge 데이터 솔루션 분석기 v8.0<br>© Tridge</div>'
    +'</div></div>';

  var el=document.createElement('div');
  el.id='settings-overlay';
  el.innerHTML=panel;
  // 이미 존재하면 교체
  document.body.appendChild(el);
}

// 페이지 로드 시 설정 적용
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',loadSettings);
}else{
  loadSettings();
}

// ══════════════════════════════════════
// 기능 1,3: 분석 결과 저장 + 히스토리
// ══════════════════════════════════════
var HISTORY_KEY='tridge_v8_history';
var LAST_KEY='tridge_v8_last';

function saveAnalysis(){
  if(!S.portfolio)return;
  try{
    // 마지막 분석 저장 (전체 상태)
    var saveData={
      companyName:S.companyName,
      companyMemo:S.companyMemo,
      portfolio:{
        totVolTons:S.portfolio.totVolTons,
        totValMil:S.portfolio.totValMil,
        avgP:S.portfolio.avgP,
        cnt:S.portfolio.cnt,
        yrData:S.portfolio.yrData,
        hsData:S.portfolio.hsData,
        supData:S.portfolio.supData,
        origData:S.portfolio.origData,
        prodData:S.portfolio.prodData,
        concRisk:S.portfolio.concRisk,
        topImporter:S.portfolio.topImporter,
        disappeared:S.portfolio.disappeared,
        anomalies:S.portfolio.anomalies,
        latestYear:S.portfolio.latestYear,
        qData:S.portfolio.qData,
        monthData:S.portfolio.monthData
      },
      comparisons:S.comparisons,
      healthScore:S.healthScore,
      waterfall:S.waterfall,
      negMatrix:S.negMatrix,
      findings:S.findings,
      insights:S.insights,
      selectedCategories:S.selectedCategories,
      categoryMatchings:S.categoryMatchings,
      step:S.step,
      savedAt:new Date().toISOString()
    };
    localStorage.setItem(LAST_KEY,JSON.stringify(saveData));

    // 히스토리에 추가
    var history=loadHistory();
    var entry={
      id:Date.now(),
      date:new Date().toLocaleDateString('ko-KR'),
      time:new Date().toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'}),
      company:S.companyName||'(미입력)',
      categories:S.selectedCategories,
      roi:Object.values(S.comparisons||{}).reduce(function(s,c){return s+(c?c.roiK:0);},0),
      score:S.healthScore?S.healthScore.total:null,
      volTons:S.portfolio.totVolTons,
      valMil:S.portfolio.totValMil
    };
    history.unshift(entry);
    if(history.length>20)history=history.slice(0,20);
    localStorage.setItem(HISTORY_KEY,JSON.stringify(history));
    console.log('분석 저장 완료');
  }catch(e){console.warn('저장 실패:',e);}
}

function loadHistory(){
  try{return JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]');}catch(e){return [];}
}

function loadLastAnalysis(){
  try{
    var data=JSON.parse(localStorage.getItem(LAST_KEY)||'null');
    if(!data)return false;
    S.companyName=data.companyName||'';
    S.companyMemo=data.companyMemo||'';
    S.portfolio=data.portfolio;
    S.comparisons=data.comparisons||{};
    S.healthScore=data.healthScore;
    S.waterfall=data.waterfall;
    S.negMatrix=data.negMatrix;
    S.findings=data.findings;
    S.insights=data.insights;
    S.selectedCategories=data.selectedCategories||[];
    S.categoryMatchings=data.categoryMatchings||{};
    S.step=data.step||2;
    return true;
  }catch(e){return false;}
}

// saveAnalysis는 runComparison 내부에서 직접 호출됨

// ── 히스토리 패널 렌더링 ──
function rHistory(){
  var history=loadHistory();
  if(!history.length){
    return '<div style="color:var(--text3);font-size:13px;text-align:center;padding:20px">아직 저장된 분석이 없습니다.</div>';
  }
  return history.map(function(h){
    return '<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px">'      +'<input type="checkbox" class="hist-chk" data-id="'+h.id+'" onclick="event.stopPropagation()" style="margin-top:14px;width:15px;height:15px;cursor:pointer;flex-shrink:0">'      +'<div class="hist-card" onclick="restoreHistory('+h.id+')">'      +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">'      +'<div style="font-size:13px;font-weight:700;color:var(--text1)">'+esc(h.company)+'</div>'      +'<div style="font-size:11px;color:var(--text3)">'+h.date+' '+h.time+'</div>'      +'</div>'      +'<div style="display:flex;gap:8px;flex-wrap:wrap">'      +(h.categories&&h.categories.length?'<span style="font-size:11px;background:rgba(0,201,167,.1);color:var(--teal);padding:2px 8px;border-radius:10px">'+h.categories.join(', ')+'</span>':'')      +(h.roi>0?'<span style="font-size:11px;background:rgba(239,68,68,.1);color:var(--red);padding:2px 8px;border-radius:10px">$'+h.roi+'K ROI</span>':'')      +(h.score?'<span style="font-size:11px;background:rgba(59,130,246,.1);color:var(--blue);padding:2px 8px;border-radius:10px">'+h.score+'점</span>':'')      +'</div>'      +'</div>'      +'</div>';
  }).join('');
}
function deleteSelectedHistory(){
  var checked=document.querySelectorAll('.hist-chk:checked');
  if(!checked.length){alert('삭제할 항목을 선택해주세요.');return;}
  if(!confirm(checked.length+'개 항목을 삭제할까요?'))return;
  var ids=Array.from(checked).map(function(el){return Number(el.dataset.id);});
  var history=loadHistory().filter(function(h){return ids.indexOf(h.id)<0;});
  try{localStorage.setItem(HISTORY_KEY,JSON.stringify(history));}catch(e){}
  renderHistoryPanel();
}


function restoreHistory(id){
  var history=loadHistory();
  var entry=history.find(function(h){return h.id===id;});
  if(!entry)return;
  // 마지막 저장본 불러오기 (company명 매칭)
  if(loadLastAnalysis()&&S.companyName===entry.company){
    render();
    var overlay=document.getElementById('history-overlay');
    if(overlay)overlay.remove();
    historyOpen=false;
  }else{
    alert('해당 분석의 상세 데이터를 찾을 수 없습니다. 가장 최근 분석만 복원 가능합니다.');
  }
}

// ══════════════════════════════════════
// 기능 4: 미팅 준비 체크리스트
// ══════════════════════════════════════
async function genMeetingPrep(){