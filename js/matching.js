// ── AI 매칭: callClaudeMatching, runMatching, buildFallbackMatching
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

async function callClaudeMatching(clientProds,mktProds,catName,apiKey){
  // API 키 없으면 바로 폴백
  if(!apiKey){
    return buildFallbackMatching(clientProds,mktProds);
  }

  var clientList=clientProds.map(function(p,i){
    return (i+1)+'. "'+p.name+'" ('+Math.round((p.vol||0)/1000)+'톤, '+(p.cnt||0)+'건)';
  }).join('\n');
  var mktList=mktProds.map(function(p,i){
    return (i+1)+'. "'+p.name+'" ('+Math.round((p.vol||0)/1000)+'톤, '+(p.cnt||0)+'건)';
  }).join('\n');

  var prompt='당신은 글로벌 식품 무역 전문가입니다. 한국 수입 거래 데이터에서 동일한 상품을 찾아내는 것이 목표입니다.\n\n'
    +'카테고리: '+catName+'\n\n'
    +'[고객사 구매 품목 — 수입신고서 기재명]\n'+clientList+'\n\n'
    +'[시장 전체 품목 — 다양한 수입업체의 수입신고서 기재명]\n'+mktList+'\n\n'
    +'## 매칭 판단 기준 (4가지 모두 충족해야 "include")\n'
    +'1. 원재료가 동일한가? (주꾸미=쭈꾸미 같은 표기 차이는 동일로 봄)\n'
    +'2. 가공 형태가 같은가? (whole/절단/다이스/슬라이스 — 다르면 exclude)\n'
    +'3. 처리 방식이 같은가? (내장제거/자숙/블랜칭 — 다르면 exclude)\n'
    +'4. 등급/규격이 유사한가? (포장횟감/일반 등 — 크게 다르면 exclude)\n\n'
    +'## 규칙\n'
    +'- 표기 차이(주꾸미/쭈꾸미, 띄어쓰기, 한글/영문 병기)는 동일 품목\n'
    +'- 형태/가공도 다른 것은 반드시 exclude\n'
    +'- 고객사 품목 1개가 시장 품목 여러 개에 매칭 가능\n\n'
    +'JSON만 반환 (다른 텍스트 없이). reason은 10자 이내. 반드시 완전한 JSON으로 끝낼 것:\n'
    +'{"matches":[{"clientProd":"고객사품목명","mktProd":"시장품목명","similarity":95,'
    +'"recommendation":"include","reason":"동일품목"}]}';

  try{
    // 30초 타임아웃
    var controller=new AbortController();
    var timeout=setTimeout(function(){controller.abort();},120000); // 2분 타임아웃

    var res=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      signal:controller.signal,
      headers:{
        'Content-Type':'application/json',
        'x-api-key':apiKey,
        'anthropic-version':'2023-06-01',
        'anthropic-dangerous-direct-browser-access':'true'
      },
      body:JSON.stringify({
        model:'claude-sonnet-4-6',
        max_tokens:16000,
        messages:[{role:'user',content:prompt}]
      })
    });
    clearTimeout(timeout);

    var data=await res.json();
    var txt=(data.content||[]).map(function(c){return c.type==='text'?c.text:'';}).join('');
    var jsonMatch=txt.match(/\{[\s\S]*\}/);
    if(!jsonMatch)throw new Error('JSON 파싱 실패');
    var result=JSON.parse(jsonMatch[0]);
    (result.matches||[]).forEach(function(m){m.approved=m.recommendation==='include';});
    return result;
  }catch(e){
    console.warn('Claude 매칭 오류:', e.message);
    var fallback=buildFallbackMatching(clientProds,mktProds);
    var errMsg=e.name==='AbortError'?'timeout':e.message;
    fallback._apiError=errMsg;
    return fallback;
  }
}

// 포트폴리오 rows(normRow 결과)에서 상위 품목 추출
function extractTopProds(rows,limit){
  var map={};
  rows.forEach(function(r){
    var name=r.productName||r.name||'';
    if(!name)return;
    if(!map[name])map[name]={name:name,vol:0,cnt:0};
    map[name].vol+=r.volume||0;
    map[name].cnt+=1;
  });
  return Object.values(map).sort(function(a,b){return b.vol-a.vol;}).slice(0,limit||20);
}

// 시장 raw rows(normRow 결과)에서 상위 품목 추출
function extractTopProdsRaw(rows,limit){
  var map={};
  rows.forEach(function(r){
    var name=r.productName||'';
    if(!name)return;
    if(!map[name])map[name]={name:name,vol:0,cnt:0};
    map[name].vol+=r.volume||0;
    map[name].cnt+=1;
  });
  return Object.values(map).sort(function(a,b){return b.vol-a.vol;}).slice(0,limit||40);
}

function buildFallbackMatching(clientProds,mktProds){
  var fallback=[];
  clientProds.forEach(function(cp){
    var cpNorm=normalizeName(cp.name);
    mktProds.forEach(function(mp){
      var mpNorm=normalizeName(mp.name);
      if(cpNorm&&mpNorm&&(mpNorm.includes(cpNorm)||cpNorm.includes(mpNorm)||
        levenshteinSim(cpNorm,mpNorm)>0.7)){
        fallback.push({
          clientProd:cp.name,mktProd:mp.name,
          similarity:80,recommendation:'include',
          reason:'키워드 매칭 (검토 필요)',approved:true
        });
      }
    });
  });
  return {matches:fallback,_fallback:true};
}

function normalizeName(s){
  return (s||'').toLowerCase()
    .replace(/\[.*?\]\s*/g,'').replace(/__.*$/,'')
    .replace(/쭈꾸미/g,'주꾸미').replace(/쭈구미/g,'주꾸미')
    .replace(/냉동|냉장|frozen|iqf|\s+/g,'').trim();
}

function levenshteinSim(a,b){
  if(!a||!b)return 0;
  var m=a.length,n=b.length;
  var dp=[];
  for(var i=0;i<=m;i++){dp[i]=[i];for(var j=1;j<=n;j++)dp[i][j]=0;}
  for(var j=0;j<=n;j++)dp[0][j]=j;
  for(var i=1;i<=m;i++)for(var j=1;j<=n;j++){
    dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]:1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);
  }
  return 1-dp[m][n]/Math.max(m,n);
}

async function runMatching(){
  if(!S.selectedCategories.length){alert('카테고리를 선택해주세요.');return;}
  S.loading=true;
  try{ await _runMatchingCore(); }catch(e){
    console.error('runMatching 치명 오류:',e);
    S.loading=false;
    showError({type:'api',title:'매칭 오류',message:'예상치 못한 오류가 발생했습니다: '+e.message,
      onRetry:'runMatching',onCancel:'function(){S.step=3;render();}'});
  }
}
async function _runMatchingCore(){
  S.loadingSteps=S.selectedCategories.reduce(function(arr,cat){
    return arr.concat(['📂 '+cat+' 데이터 로드','🤖 '+cat+' AI 품목 매칭']);
  },[]);
  S.loadingCurrentStep=0;
  S.categoryMatchings={};

  for(var i=0;i<S.selectedCategories.length;i++){
    var cat=S.selectedCategories[i];
    var mf=S.marketFiles[i];

    // 시장 데이터 없으면 빈 매칭
    if(!mf||!mf.file){
      S.categoryMatchings[cat]={matches:[],_noData:true};
      continue;
    }

    // 파일 로드
    S.loadingMsg='📂 '+cat+' 데이터 로드 중... ('+(i+1)+'/'+S.selectedCategories.length+')';render();
    try{
      if(!mf.raw)mf.raw=await readExcel(mf.file);
    }catch(e){
      S.loading=false;
      showError({
        type:'file',
        title:'파일 로드 실패',
        message:cat+' 데이터를 읽을 수 없습니다. 파일이 손상됐거나 형식이 다를 수 있습니다. 오류: '+e.message,
        onRetry:'runMatching',
        onCancel:'function(){S.step=3;render();}'
      });
      return;
    }

    // 품목 추출
    var catRows=S.portfolio.rows.filter(function(r){return r.category===cat;});
    var clientProds=extractTopProds(catRows.length?catRows:S.portfolio.rows,10);
    var mktAllRows=mf.raw.map(normRow).filter(function(r){return r.volume>0&&r.unitPrice>0;});
    var mktCatRows=mktAllRows.filter(function(r){return r.category===cat;});
    var mktProds=extractTopProdsRaw(mktCatRows.length?mktCatRows:mktAllRows,20);

    // AI 매칭
    if(S.apiKey){
      S.loadingMsg='🤖 '+cat+' AI 품목 매칭 중... (최대 1분 소요)';render();
      var result=await callClaudeMatching(clientProds,mktProds,cat,S.apiKey);

      // API 오류 체크
      if(result._apiError){
        S.loading=false;
        var errType=result._apiError==='timeout'?'timeout':'api';
        var errMsg=result._apiError==='timeout'
          ?'AI 매칭이 1분을 초과했습니다. 자동 매칭으로 진행하거나 재시도할 수 있습니다.'
          :'API 연결 실패. API 키를 확인하거나 자동 매칭으로 진행하세요. 오류: '+result._apiError;
        S.categoryMatchings[cat]=result;
        showError({
          type:errType,
          title:errType==='timeout'?'AI 매칭 시간 초과':'API 연결 실패',
          message:errMsg,
          onRetry:'runMatching',
          onFallback:'function(){S.loading=false;S.step=3.5;render();}',
          onCancel:'function(){S.step=3;render();}'
        });
        return;
      }
      S.categoryMatchings[cat]=result;
    }else{
      S.loadingMsg='🔍 '+cat+' 자동 매칭 중...';render();
      S.categoryMatchings[cat]=buildFallbackMatching(clientProds,mktProds);
    }
  }

  S.loading=false;
  S.step=3.5;
  render();
} // end _runMatchingCore

// ── STEP C: 매칭 확인 후 시장 비교 실행 ──
async function runComparison(){
  S.loading=true;
  S.loadingSteps=['시장 비교 분석','헬스스코어 · ROI 계산','AI 인사이트 생성'];
  S.loadingCurrentStep=0;
  S.comparisons={};

  for(var i=0;i<S.selectedCategories.length;i++){
    var cat=S.selectedCategories[i];
    var mf=S.marketFiles[i];
    if(!mf||!mf.file)continue;
    if(!mf.raw)mf.raw=await readExcel(mf.file);

    // 승인된 품목들 → OR 필터 키워드로 변환
    var matching=S.categoryMatchings[cat];
    var approvedMktProds=[];
    if(matching&&matching.matches){
      approvedMktProds=matching.matches
        .filter(function(m){return m.approved;})
        .map(function(m){return m.mktProd;});
    }

    // 승인된 품목 없으면 카테고리명으로 fallback
    var productKw='';
    if(approvedMktProds.length){
      productKw=approvedMktProds.join(',');
    } else {
      // 카테고리명에서 핵심 키워드 추출 (예: "주꾸미(냉동)" → "주꾸미")
      productKw=cat.replace(/[（）\(\)냉동냉장생물 ]/g,'').trim()||cat;
    }

    S.loadingMsg='🌏 '+cat+' 시장 비교 중...';render();
    var lbl=cat;
    S.comparisons[lbl]=compareMarket(S.portfolio,mf.raw,S.importerKw,productKw);
    S.comparisons[lbl]._category=cat;
    S.comparisons[lbl]._approvedProds=approvedMktProds;
  }

  S.loadingCurrentStep=1;S.loadingMsg='🎯 헬스스코어·ROI 계산 중...';render();
  S.healthScore=computeHealthScore(S.portfolio,S.comparisons);
  S.waterfall=computeWaterfall(S.comparisons);
  S.negMatrix=computeNegMatrix(S.comparisons);
  S.actionCards=computeActionCards(S.portfolio,S.comparisons);

  S.loadingMsg='🔍 AI 핵심 발견 분석 중...';render();
  S.findings=await computeFindings(S.portfolio,S.comparisons,S.healthScore);

  S.loadingCurrentStep=2;S.loadingMsg='🤖 AI 미팅 인사이트 생성 중...';render();
  S.insights=await callClaude(S.portfolio,S.comparisons,S.companyName,S.apiKey,S.companyMemo,S.healthScore);

  S.loading=false;
  S.step=4;
  saveAnalysis(); // 자동 저장
  render();
}

// ── 카테고리 없이 바로 분석 (시장데이터 없는 경우) ──
async function runComparisonDirect(){
  S.loading=true;S.loadingMsg='🎯 분석 중...';render();
  S.comparisons={};
  S.healthScore=computeHealthScore(S.portfolio,{});
  S.waterfall=computeWaterfall({});
  S.negMatrix=computeNegMatrix({});
  S.actionCards=computeActionCards(S.portfolio,{});
  S.findings=await computeFindings(S.portfolio,{},S.healthScore);
  S.loadingMsg='🤖 AI 인사이트 생성 중...';render();
  S.insights=await callClaude(S.portfolio,{},S.companyName,S.apiKey,S.companyMemo,S.healthScore);
  S.loading=false;S.step=4;render();
}

// compareMarket 필터 — 콤마 구분 OR 조건
function matchProductKw(productName, pkwList){
  if(!pkwList||!pkwList.length)return true;
  var n=productName.toLowerCase().replace(/\[.*?\]\s*/g,'').replace(/__.*$/,'');
  // 쭈꾸미/주꾸미 정규화
  n=n.replace(/쭈꾸미/g,'주꾸미').replace(/쭈구미/g,'주꾸미');
  return pkwList.some(function(kw){
    var k=kw.toLowerCase().replace(/쭈꾸미/g,'주꾸미').trim();
    if(!k)return false;
    // 양방향 포함 체크 (짧은 키워드가 긴 이름에 포함되거나 반대)
    return n.includes(k)||k.includes(n.slice(0,Math.min(n.length,6)));
  });
}


function rInsightsV6(){
  var base=rInsights();
  var modeBar='<div class="mode-bar">'
    +'<span class="mode-title">출력 모드</span>'
    +'<div class="mode-btns">'
    +'<button class="mode-btn'+(S.liveMode?'':' active')+'" onclick="S.liveMode=false;render()">📋 사전준비 모드</button>'
    +'<button class="mode-btn'+(S.liveMode?' active':'')+'" onclick="enterLiveMode()">🎤 라이브 시연 모드</button>'
    +'</div>'
    +'<span class="mode-desc">'+(S.liveMode?'미팅 현장 풀스크린 뷰':'보고서 출력 / 콜드메일용')+'</span>'
    +'</div>';
  return base.replace('<div class="fade-in">','<div class="fade-in">'+modeBar);
}

function enterLiveMode(){