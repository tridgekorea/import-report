// ── 설정, 테마, 히스토리, 저장
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
  if(!S.portfolio||!S.insights){alert('인사이트를 먼저 생성해주세요.');return;}
  if(!S.apiKey){alert('API 키를 먼저 입력해주세요.');return;}

  var el=document.getElementById('meeting-prep-content');
  if(el)el.innerHTML='<div style="color:var(--text2);text-align:center;padding:20px">🤖 생성 중...</div>';

  var totalRoi=getTotalRoi();
  var prompt='트릿지 영업 담당자가 "'+S.companyName+'"과의 미팅을 준비하고 있습니다.\n\n'
    +'분석 결과:\n'
    +'- 총 수입액: $'+S.portfolio.totValMil+'M\n'
    +'- 헬스스코어: '+(S.healthScore?S.healthScore.total+'점 ('+S.healthScore.grade+'등급)':'N/A')+'\n'
    +'- 연간 ROI 기회: $'+totalRoi+'K\n'
    +'- 분석 카테고리: '+S.selectedCategories.join(', ')+'\n\n'
    +'다음을 JSON으로만 반환하세요 (다른 텍스트 없이):\n'
    +'{"keyPoints":["핵심 어필 포인트 1","핵심 어필 포인트 2","핵심 어필 포인트 3"],'
    +'"objections":[{"q":"예상 반론 1","a":"대응 방법 1"},{"q":"예상 반론 2","a":"대응 방법 2"}],'
    +'"opening":"오프닝 멘트 1~2문장",'
    +'"caution":"주의할 점 1문장"}';

  try{
    var res=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{'Content-Type':'application/json','x-api-key':S.apiKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
      body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:2000,messages:[{role:'user',content:prompt}]})
    });
    var data=await res.json();
    var txt=(data.content||[]).map(function(c){return c.type==='text'?c.text:'';}).join('');
    var json=JSON.parse(txt.match(/\{[\s\S]*\}/)[0]);

    var html='<div style="display:flex;flex-direction:column;gap:12px">'
      +'<div style="background:rgba(0,201,167,.06);border:1px solid rgba(0,201,167,.2);border-radius:10px;padding:16px">'
      +'<div style="font-size:11px;font-weight:700;color:var(--teal);margin-bottom:8px;text-transform:uppercase;letter-spacing:.08em">💬 오프닝 멘트</div>'
      +'<div style="font-size:13px;line-height:1.7;color:var(--text1)">'+esc(json.opening)+'</div>'
      +'</div>'
      +'<div style="background:var(--card2);border:1px solid var(--border);border-radius:10px;padding:16px">'
      +'<div style="font-size:11px;font-weight:700;color:var(--teal);margin-bottom:10px;text-transform:uppercase;letter-spacing:.08em">🎯 핵심 어필 포인트</div>'
      +(json.keyPoints||[]).map(function(p,i){return '<div style="display:flex;gap:10px;margin-bottom:8px"><span style="font-size:18px;font-weight:900;color:var(--teal);flex-shrink:0">'+(i+1)+'</span><div style="font-size:13px;line-height:1.6;color:var(--text1)">'+esc(p)+'</div></div>';}).join('')
      +'</div>'
      +'<div style="background:var(--card2);border:1px solid var(--border);border-radius:10px;padding:16px">'
      +'<div style="font-size:11px;font-weight:700;color:var(--amber);margin-bottom:10px;text-transform:uppercase;letter-spacing:.08em">🛡 예상 반론 & 대응</div>'
      +(json.objections||[]).map(function(o){return '<div style="margin-bottom:10px;padding:10px;background:var(--card);border-radius:8px"><div style="font-size:12px;color:var(--amber);margin-bottom:4px">Q. '+esc(o.q)+'</div><div style="font-size:12px;color:var(--text1)">A. '+esc(o.a)+'</div></div>';}).join('')
      +'</div>'
      +(json.caution?'<div style="background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.2);border-radius:10px;padding:12px"><div style="font-size:12px;color:var(--red)">⚠ '+esc(json.caution)+'</div></div>':'')
      +'</div>';

    if(el)el.innerHTML=html;
  }catch(e){
    if(el)el.innerHTML='<div style="color:var(--red);padding:12px">생성 오류: '+esc(e.message)+'</div>';
  }
}

// ══════════════════════════════════════
// 기능 5: 경쟁사 역추적 → 다음 영업 타겟
// ══════════════════════════════════════
function getNextTargets(){
  var targets={};
  Object.values(S.comparisons||{}).forEach(function(cmp){
    if(!cmp)return;
    (cmp.sameSupplier||[]).forEach(function(s){
      (s.comps||[]).forEach(function(c){
        if(c.avgP<s.compP){
          var imp=c.imp;
          if(!targets[imp])targets[imp]={name:imp,categories:[],minPrice:c.avgP,gap:0,vol:0};
          targets[imp].gap=Math.max(targets[imp].gap,+(s.compP-c.avgP).toFixed(3));
          targets[imp].minPrice=Math.min(targets[imp].minPrice,c.avgP);
          targets[imp].vol+=c.volTons||0;
        }
      });
    });
  });
  return Object.values(targets).sort(function(a,b){return b.gap-a.gap;}).slice(0,8);
}

function rNextTargets(){
  var targets=getNextTargets();
  if(!targets.length){
    return '<div style="color:var(--text3);font-size:13px;text-align:center;padding:20px">시장 비교 데이터가 필요합니다.</div>';
  }
  return '<div style="display:flex;flex-direction:column;gap:8px">'
    +targets.map(function(t,i){
      return '<div style="padding:12px 14px;background:var(--card2);border:1px solid var(--border);border-radius:10px;display:flex;align-items:center;justify-content:space-between">'
        +'<div style="display:flex;align-items:center;gap:12px">'
        +'<div style="font-size:20px;font-weight:900;color:var(--teal);width:24px">'+(i+1)+'</div>'
        +'<div>'
        +'<div style="font-size:13px;font-weight:700;color:var(--text1)">'+esc(t.name.slice(0,25))+'</div>'
        +'<div style="font-size:11px;color:var(--text2);margin-top:2px">$'+t.minPrice.toFixed(3)+'/kg 구매 · '+t.vol.toFixed(0)+'t</div>'
        +'</div></div>'
        +'<div style="text-align:right">'
        +'<div style="font-size:12px;font-weight:700;color:var(--red)">$'+t.gap.toFixed(3)+'/kg 갭</div>'
        +'<div style="font-size:10px;color:var(--text3);margin-top:2px">절감 기회</div>'
        +'</div></div>';
    }).join('')
    +'</div>';
}

// ══════════════════════════════════════
// 기능 6: 비교 스냅샷 (두 분석 나란히)
// ══════════════════════════════════════
function rCompareSnapshot(){
  var history=loadHistory();
  if(history.length<2){
    return '<div style="color:var(--text3);font-size:13px;text-align:center;padding:20px">비교하려면 분석 2개 이상이 필요합니다.</div>';
  }
  var a=history[0],b=history[1];
  return '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">'
    +[a,b].map(function(h){
      return '<div style="padding:16px;background:var(--card2);border:1px solid var(--border);border-radius:12px">'
        +'<div style="font-size:14px;font-weight:700;color:var(--text1);margin-bottom:8px">'+esc(h.company)+'</div>'
        +'<div style="font-size:11px;color:var(--text3);margin-bottom:12px">'+h.date+'</div>'
        +'<div style="display:flex;flex-direction:column;gap:6px">'
        +'<div style="display:flex;justify-content:space-between"><span style="font-size:12px;color:var(--text2)">수입액</span><span style="font-size:12px;font-weight:600;color:var(--text1)">$'+h.valMil+'M</span></div>'
        +'<div style="display:flex;justify-content:space-between"><span style="font-size:12px;color:var(--text2)">물량</span><span style="font-size:12px;font-weight:600;color:var(--text1)">'+h.volTons+'t</span></div>'
        +(h.score?'<div style="display:flex;justify-content:space-between"><span style="font-size:12px;color:var(--text2)">헬스스코어</span><span style="font-size:12px;font-weight:600;color:var(--teal)">'+h.score+'점</span></div>':'')
        +(h.roi>0?'<div style="display:flex;justify-content:space-between"><span style="font-size:12px;color:var(--text2)">ROI 기회</span><span style="font-size:12px;font-weight:600;color:var(--red)">$'+h.roi+'K</span></div>':'')
        +(h.categories&&h.categories.length?'<div style="margin-top:4px"><span style="font-size:10px;background:rgba(0,201,167,.1);color:var(--teal);padding:2px 8px;border-radius:10px">'+h.categories.join(', ')+'</span></div>':'')
        +'</div></div>';
    }).join('')
    +'</div>';
}

// ══════════════════════════════════════
// 히스토리 + 비교 스냅샷 패널
// ══════════════════════════════════════
var historyOpen=false;
function toggleHistory(){
  historyOpen=!historyOpen;
  if(historyOpen)renderHistoryPanel();
  else{var el=document.getElementById('history-overlay');if(el)el.remove();}
}

function renderHistoryPanel(){
  var existing=document.getElementById('history-overlay');
  if(existing)existing.remove();
  if(!historyOpen)return;

  var el=document.createElement('div');
  el.id='history-overlay';
  el.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:800;display:flex;justify-content:flex-end';
  el.onclick=function(e){if(e.target===el){historyOpen=false;el.remove();}};

  el.innerHTML='<div style="background:var(--card);border-left:1px solid var(--border2);width:360px;height:100%;overflow-y:auto;padding:24px;display:flex;flex-direction:column;gap:20px">'
    +'<div style="display:flex;align-items:center;justify-content:space-between">'
    +'<div style="font-size:16px;font-weight:800;color:var(--text1)">📋 분석 히스토리</div>'
    +'<button onclick="historyOpen=false;document.getElementById(\'history-overlay\').remove()" style="background:none;border:none;color:var(--text2);cursor:pointer;font-size:18px">✕</button>'
    +'</div>'

    // 최근 분석 복원
    +(loadHistory().length?'<div><div style="font-size:11px;font-weight:700;color:var(--text2);letter-spacing:.08em;text-transform:uppercase;margin-bottom:10px">최근 분석</div>'
    +rHistory()
    +'</div>':'')

    // 비교 스냅샷
    +(loadHistory().length>=2?'<div><div style="font-size:11px;font-weight:700;color:var(--text2);letter-spacing:.08em;text-transform:uppercase;margin-bottom:10px">📊 비교 스냅샷 (최근 2개)</div>'
    +rCompareSnapshot()
    +'</div>':'')

    // 히스토리 삭제
    +'<div style="margin-top:auto">'
    +'<div style="display:flex;gap:8px">'    +'<button onclick="deleteSelectedHistory()" style="flex:1;padding:8px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);border-radius:8px;color:var(--red);cursor:pointer;font-family:inherit;font-size:12px">🗑 선택 삭제</button>'    +'<button onclick="clearHistory()" style="flex:1;padding:8px;background:rgba(100,116,139,.08);border:1px solid rgba(100,116,139,.2);border-radius:8px;color:var(--text2);cursor:pointer;font-family:inherit;font-size:12px">🗑 전체 삭제</button>'    +'</div>'
    +'</div>'
    +'</div>';

  document.body.appendChild(el);
}

function clearHistory(){
  if(!confirm('모든 히스토리를 삭제할까요?'))return;
  localStorage.removeItem(HISTORY_KEY);
  localStorage.removeItem(LAST_KEY);
  var el=document.getElementById('history-overlay');
  if(el)el.remove();
  historyOpen=false;
}

// 자동 복원 비활성화 — 앱 시작 시 항상 업로드 화면

// API 키 저장/불러오기
function toggleSaveApiKey(checked){
  if(checked){
    if(S.apiKey)localStorage.setItem('tridge_api_key',S.apiKey);
    // 이후 입력 시에도 실시간 저장
    var input=document.getElementById('api-key-input');
    if(input)input.addEventListener('input',function(){
      if(document.getElementById('save-api-key')&&document.getElementById('save-api-key').checked)
        localStorage.setItem('tridge_api_key',this.value);
    });
  }else{
    localStorage.removeItem('tridge_api_key');
  }
}

// 앱 시작 시 저장된 API 키 자동 불러오기
(function(){
  try{
    var saved=localStorage.getItem('tridge_api_key');
    if(saved)S.apiKey=saved;
  }catch(e){}
})();



// ── PDF 출력 ──