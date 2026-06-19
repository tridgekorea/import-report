// 내보내기
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
function exportPDF(){
  // 인쇄용 CSS 적용 후 프린트
  var style=document.createElement('style');
  style.id='print-style';
  style.textContent='@media print{.topbar,.stepbar,.btn-primary,.btn-ghost,.btn-link,#settings-overlay,#history-overlay,.mode-bar{display:none!important}body{background:#fff!important;color:#000!important}.card{border:1px solid #ddd!important;background:#fff!important}canvas{max-width:100%}}';
  document.head.appendChild(style);
  window.print();
  setTimeout(function(){
    var s=document.getElementById('print-style');
    if(s)s.remove();
  },1000);
}

// ── DOCX 출력 (docx.js) — 고퀄리티 내부 보고서 ──
function exportDOCX(){
  var exist=document.getElementById('docx-modal-overlay');
  if(exist)exist.remove();

  var overlay=document.createElement('div');
  overlay.id='docx-modal-overlay';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
  overlay.innerHTML='<div style="background:var(--card);border-radius:18px;padding:32px;max-width:480px;width:100%;box-shadow:0 24px 60px rgba(0,0,0,.3)">'
    +'<div style="font-size:11px;font-weight:700;color:var(--teal);letter-spacing:.1em;margin-bottom:6px">DOCX 보고서 생성</div>'
    +'<h2 style="font-size:20px;font-weight:700;color:var(--text1);margin-bottom:6px">📝 Word 보고서 설정</h2>'
    +'<p style="font-size:13px;color:var(--text2);margin-bottom:20px">AI가 데이터를 분석해 보고서를 작성합니다.<br>추가 지시사항을 입력하면 반영돼요.</p>'
    +'<div style="margin-bottom:14px">'
    +'<label style="font-size:12px;font-weight:600;color:var(--text2);display:block;margin-bottom:6px">보고서 제목</label>'
    +'<input id="docx-title-input" type="text" value="'+(S.companyName||'고객사')+' 소싱 경쟁력 진단 보고서" style="width:100%;border:1px solid var(--border);border-radius:9px;padding:10px 13px;font-size:13px;color:var(--text1);background:var(--card2);font-family:inherit">'
    +'</div>'
    +'<div style="margin-bottom:20px">'
    +'<label style="font-size:12px;font-weight:600;color:var(--text2);display:block;margin-bottom:6px">AI 추가 지시사항 <span style="font-weight:400;color:var(--text3)">(선택)</span></label>'
    +'<textarea id="docx-extra-input" rows="4" placeholder="예시:&#10;• ROI 섹션을 더 강조해줘&#10;• 임원 보고용으로 격식체로 작성해줘&#10;• 협상 전략을 구체적으로 써줘" style="width:100%;border:1px solid var(--border);border-radius:9px;padding:10px 13px;font-size:13px;color:var(--text1);background:var(--card2);font-family:inherit;resize:vertical;line-height:1.5"></textarea>'
    +'</div>'
    +'<div style="display:flex;gap:10px;justify-content:flex-end">'
    +'<button onclick="var _ov=document.getElementById(\'docx-modal-overlay\');if(_ov)_ov.remove();" style="padding:10px 20px;border:1px solid var(--border);border-radius:9px;background:none;color:var(--text2);cursor:pointer;font-family:inherit;font-size:13px">취소</button>'
    +'<button id="docx-generate-btn" onclick="startDocxGenerate()" style="padding:10px 24px;background:var(--teal);border:none;border-radius:9px;color:#000;cursor:pointer;font-family:inherit;font-size:13px;font-weight:700">📝 보고서 생성</button>'
    +'</div>'
    +'</div>';
  document.body.appendChild(overlay);
  overlay.addEventListener('click',function(e){if(e.target===overlay)overlay.remove();});
  setTimeout(function(){var el=document.getElementById('docx-extra-input');if(el)el.focus();},100);
}

async function startDocxGenerate(){
  var extra=document.getElementById('docx-extra-input')?document.getElementById('docx-extra-input').value:'';
  var title=document.getElementById('docx-title-input')?document.getElementById('docx-title-input').value:'';
  var btn=document.getElementById('docx-generate-btn');
  if(btn){btn.innerHTML='⏳ 생성 중...';btn.disabled=true;}
  try{
    await _buildDocx(extra,title);
    var ov=document.getElementById('docx-modal-overlay');
    if(ov)ov.remove();
  }catch(e){
    console.error('DOCX 오류:',e);
    alert('DOCX 생성 실패: '+e.message);
    if(btn){btn.innerHTML='📝 보고서 생성';btn.disabled=false;}
  }
}

async function _buildDocx(extraInstructions,customTitle){
  // 1. docx.js 로드 (CDN fallback)
  if(!window.docx){
    var urls=[
      'https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.js',
      'https://unpkg.com/docx@8.5.0/build/index.js',
      'https://cdn.jsdelivr.net/npm/docx@7.8.2/build/index.js',
      'https://unpkg.com/docx@7.8.2/build/index.js'
    ];
    var loaded=false;
    for(var ui=0;ui<urls.length;ui++){
      try{
        await new Promise(function(res,rej){
          var s=document.createElement('script');
          s.src=urls[ui];
          s.onload=function(){loaded=true;res();};
          s.onerror=rej;
          document.head.appendChild(s);
        });
        if(window.docx)break;
      }catch(e){console.warn('CDN 실패:',urls[ui]);}
    }
    if(!window.docx)throw new Error('docx.js 로드 실패 — 네트워크 연결을 확인해주세요');
  }
  var D=window.docx;
  var p=S.portfolio;
  var hs=S.healthScore;
  var comps=S.comparisons||{};
  var totalRoi=+(Object.values(comps).reduce(function(s,c){return s+(c?c.roiK:0);},0)*(S.roiFactor||0.5)).toFixed(0);

  // 2. Claude API로 DOCX 전용 인사이트 생성
  var docxInsights={summary:'',portfolio:'',market:'',roi:'',action:''};
  if(S.apiKey){
    try{
      var dataSnap={
        company:S.companyName||'고객사',
        totalValMil:p?p.totValMil:0,
        totalVolTons:p?p.totVolTons:0,
        avgPrice:p?p.avgP:0,
        healthScore:hs?hs.total:null,
        healthGrade:hs?hs.grade:null,
        totalRoiK:totalRoi,
        roiFactorPct:Math.round((S.roiFactor||0.5)*100),
        categories:Object.entries(comps).map(function(en){
          var cat=en[0],cmp=en[1]||{};
          return {
            name:cat,
            roiK:cmp.roiK||0,
            topSupplier:(cmp.sameSupplier||[])[0]?{
              name:cmp.sameSupplier[0].supplier,
              clientPrice:cmp.sameSupplier[0].compP,
              marketBest:cmp.sameSupplier[0].bestPrice,
              gap:cmp.sameSupplier[0].overpayPerKg
            }:null,
            altOrigins:(cmp.altOrigins||[]).slice(0,2).map(function(a){return a.orig;})
          };
        })
      };
      var insPrompt='당신은 글로벌 식품 무역 전문가이자 B2B 세일즈 컨설턴트입니다.\n'
        +'아래 소싱 분석 데이터를 바탕으로 Word 보고서용 인사이트를 작성해주세요.\n'
        +'고객사 임원(C레벨)이 읽는 내부 보고서입니다. 전문적이고 간결하게.\n'
        +(extraInstructions?'추가 지시사항: '+extraInstructions+'\n\n':'\n')
        +'데이터:\n'+JSON.stringify(dataSnap,null,2)+'\n\n'
        +'아래 JSON 형식으로만 반환 (다른 텍스트 없이, 각 항목 3~5문장):\n'
        +'{"summary":"전체 요약 인사이트","portfolio":"포트폴리오 분석 인사이트","market":"시장 비교 핵심 발견","roi":"ROI 및 절감 기회 해설","action":"즉시 실행 가능한 액션 3가지"}';

      var aiRes=await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST',
        headers:{'Content-Type':'application/json','x-api-key':S.apiKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
        body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:2000,messages:[{role:'user',content:insPrompt}]})
      });
      var aiData=await aiRes.json();
      var aiTxt=(aiData.content||[]).map(function(c){return c.type==='text'?c.text:'';}).join('');
      var jsonMatch=aiTxt.match(/\{[\s\S]*\}/);
      if(jsonMatch)docxInsights=Object.assign(docxInsights,JSON.parse(jsonMatch[0]));
    }catch(e){console.warn('DOCX AI 인사이트 생성 실패, 기존 데이터로 진행:',e.message);}
  }

  // 3. 헬퍼 함수
  var NAVY='1A3C6E', TEAL='00A885', RED='C00000', GRAY='666666', LIGHTBLUE='EBF3FB', LIGHTGRAY='F5F5F5';

  function para(text,opts){
    opts=opts||{};
    return new D.Paragraph({
      children:[new D.TextRun({text:String(text||''),bold:opts.bold||false,size:opts.size||20,color:opts.color||'000000',italics:opts.italic||false})],
      spacing:{before:opts.spaceBefore||0,after:opts.spaceAfter||120},
      alignment:opts.align||D.AlignmentType.LEFT
    });
  }

  function sectionHeader(text,color){
    return new D.Paragraph({
      children:[new D.TextRun({text:String(text),bold:true,size:28,color:'FFFFFF'})],
      shading:{fill:color||NAVY,type:D.ShadingType.SOLID},
      spacing:{before:300,after:0},
      indent:{left:200,right:200}
    });
  }

  function h2(text){
    return new D.Paragraph({
      children:[new D.TextRun({text:String(text),bold:true,size:22,color:NAVY})],
      spacing:{before:200,after:80}
    });
  }

  function divider(){
    return new D.Paragraph({
      border:{bottom:{color:'CCCCCC',size:4,style:'single'}},
      spacing:{before:100,after:200}
    });
  }

  function pageBreak(){
    return new D.Paragraph({children:[new D.PageBreak()]});
  }

  function insightBox(text){
    return new D.Paragraph({
      children:[new D.TextRun({text:'💡 '+String(text||''),size:18,color:'1A3C6E',italics:true})],
      shading:{fill:LIGHTBLUE,type:D.ShadingType.SOLID},
      spacing:{before:100,after:200},
      indent:{left:200,right:200}
    });
  }

  function makeTable(headers,rows,colWidths){
    var headerRow=new D.TableRow({
      tableHeader:true,
      children:headers.map(function(h,i){
        return new D.TableCell({
          children:[new D.Paragraph({children:[new D.TextRun({text:String(h),bold:true,color:'FFFFFF',size:18})],alignment:D.AlignmentType.CENTER})],
          shading:{fill:NAVY,type:D.ShadingType.SOLID},
          width:{size:colWidths?colWidths[i]:Math.floor(9000/headers.length),type:D.WidthType.DXA}
        });
      })
    });
    var dataRows=rows.map(function(row,ri){
      return new D.TableRow({
        children:row.map(function(cell,ci){
          var fill=ri%2===0?LIGHTGRAY:'FFFFFF';
          var isNum=(typeof cell==='number')||/^\$|^-?\d/.test(String(cell||''));
          return new D.TableCell({
            children:[new D.Paragraph({children:[new D.TextRun({text:String(cell||'-'),size:18,bold:ci===0})],alignment:isNum?D.AlignmentType.CENTER:D.AlignmentType.LEFT})],
            shading:{fill:fill,type:D.ShadingType.SOLID},
            width:{size:colWidths?colWidths[ci]:Math.floor(9000/row.length),type:D.WidthType.DXA}
          });
        })
      });
    });
    return new D.Table({
      width:{size:9000,type:D.WidthType.DXA},
      rows:[headerRow].concat(dataRows),
      borders:{
        top:{style:D.BorderStyle.SINGLE,size:4,color:'CCCCCC'},
        bottom:{style:D.BorderStyle.SINGLE,size:4,color:'CCCCCC'},
        left:{style:D.BorderStyle.SINGLE,size:4,color:'CCCCCC'},
        right:{style:D.BorderStyle.SINGLE,size:4,color:'CCCCCC'},
        insideH:{style:D.BorderStyle.SINGLE,size:2,color:'DDDDDD'},
        insideV:{style:D.BorderStyle.SINGLE,size:2,color:'DDDDDD'}
      }
    });
  }

  // 4. 문서 조립
  var children=[];

  // ── 표지 ──
  children.push(new D.Paragraph({spacing:{after:600}}));
  children.push(new D.Paragraph({
    children:[new D.TextRun({text:'TRIDGE DATA SOLUTIONS',bold:true,size:20,color:GRAY,characterSpacing:200})],
    alignment:D.AlignmentType.CENTER,spacing:{after:200}
  }));
  children.push(new D.Paragraph({
    children:[new D.TextRun({text:customTitle||(S.companyName||'고객사')+' 소싱 경쟁력 진단 보고서',bold:true,size:48,color:NAVY})],
    alignment:D.AlignmentType.CENTER,spacing:{after:120}
  }));
  children.push(new D.Paragraph({
    children:[new D.TextRun({text:'소싱 경쟁력 진단 보고서',size:36,color:'333333'})],
    alignment:D.AlignmentType.CENTER,spacing:{after:80}
  }));
  children.push(new D.Paragraph({
    children:[new D.TextRun({text:new Date().toLocaleDateString('ko-KR')+' | Powered by Tridge',size:18,color:GRAY})],
    alignment:D.AlignmentType.CENTER,spacing:{after:600}
  }));

  // 헬스스코어 KPI 표 (표지 하단)
  if(hs){
    children.push(makeTable(
      ['항목','점수','등급','평가'],
      [
        ['소싱 헬스스코어',hs.total+'점',hs.grade+'등급',hs.label||''],
        ['가격 경쟁력',hs.price+'점',hs.price>=80?'우수':hs.price>=60?'보통':'개선필요','동일 공급사 단가 비교'],
        ['공급망 다양성',hs.diversity+'점',hs.diversity>=80?'우수':hs.diversity>=60?'보통':'개선필요','원산지·공급사 분산도'],
        ['구매 타이밍',hs.timing+'점',hs.timing>=80?'우수':hs.timing>=60?'보통':'개선필요','시장 저점 매수 비율'],
        ['데이터 활용도',hs.data+'점',hs.data>=80?'우수':hs.data>=60?'보통':'개선필요','거래 빈도·연속성']
      ],
      [2500,1200,1300,4000]
    ));
    children.push(new D.Paragraph({spacing:{after:200}}));
  }

  if(docxInsights.summary)children.push(insightBox(docxInsights.summary));
  children.push(pageBreak());

  // ── 포트폴리오 요약 ──
  children.push(sectionHeader('01  포트폴리오 요약',NAVY));
  children.push(new D.Paragraph({spacing:{after:160}}));

  // KPI 요약 표
  children.push(makeTable(
    ['구분','수치'],
    [
      ['총 수입액','$'+(p?p.totValMil:0)+'M'],
      ['총 수입 물량',(p?p.totVolTons:0)+'톤'],
      ['평균 단가','$'+(p?p.avgP:0)+'/kg'],
      ['거래 건수',(p?p.cnt:0)+'건'],
      ['분석 카테고리 수',Object.keys(comps).length+'개']
    ],
    [3000,6000]
  ));
  children.push(new D.Paragraph({spacing:{after:200}}));

  // 연도별 추이 표
  if(p&&p.yrData&&p.yrData.length){
    children.push(h2('연도별 수입 추이'));
    children.push(makeTable(
      ['연도','수입량(톤)','수입액($M)','평균단가($/kg)','전년대비'],
      p.yrData.map(function(y,i){
        var prev=i>0?p.yrData[i-1]:null;
        var diff=prev?((y.avgP-prev.avgP)/prev.avgP*100).toFixed(1)+'%':'—';
        return [y.year,y.volTons+'t','$'+y.valMil+'M','$'+y.avgP,diff];
      }),
      [1500,2000,2000,2000,1500]
    ));
    children.push(new D.Paragraph({spacing:{after:200}}));
  }

  // 카테고리별 비중 표
  if(p&&p.catData&&p.catData.length){
    children.push(h2('핵심 카테고리'));
    children.push(makeTable(
      ['카테고리','수입액($M)','비중(%)','평균단가($/kg)'],
      p.catData.slice(0,8).map(function(c){
        var pct=p.totValMil>0?(c.valMil/p.totValMil*100).toFixed(1):'—';
        return [c.cat,'$'+c.valMil+'M',pct+'%','$'+c.avgP];
      }),
      [3500,2000,1500,2000]
    ));
    children.push(new D.Paragraph({spacing:{after:200}}));
  }

  if(docxInsights.portfolio)children.push(insightBox(docxInsights.portfolio));
  children.push(pageBreak());

  // ── 시장 비교 분석 ──
  children.push(sectionHeader('02  시장 비교 분석',NAVY));
  children.push(new D.Paragraph({spacing:{after:160}}));

  Object.entries(comps).forEach(function(en){
    var cat=en[0],cmp=en[1]||{};
    if(!cmp.sameSupplier&&!cmp.origComp)return;

    children.push(h2('▌ '+cat+(cmp.roiK?' — 절감 기회 $'+cmp.roiK+'K':'')));

    // 공급사별 단가 비교
    if(cmp.sameSupplier&&cmp.sameSupplier.length){
      children.push(para('동일 공급사 바이어별 단가 비교',{bold:true,spaceAfter:80}));
      var ssRows=[];
      cmp.sameSupplier.forEach(function(s){
        ssRows.push([s.supplier,'$'+s.compP+'/kg','$'+s.bestPrice+'/kg','-$'+s.overpayPerKg+'/kg','$'+(s.overpayPerKg*s.compVolTons).toFixed(0)+'K']);
      });
      children.push(makeTable(
        ['공급사','고객사 단가','시장 최저가','단가 갭','연간 초과지불'],
        ssRows,
        [2500,1500,1500,1500,2000]
      ));
      children.push(new D.Paragraph({spacing:{after:160}}));
    }

    // 원산지별 단가
    if(cmp.origComp&&cmp.origComp.filter(function(o){return o.mAvg;}).length){
      children.push(para('원산지별 단가 비교',{bold:true,spaceAfter:80}));
      children.push(makeTable(
        ['원산지','고객사 단가','시장평균','갭($/kg)','구매물량(톤)'],
        cmp.origComp.filter(function(o){return o.mAvg;}).map(function(o){
          return [o.orig,'$'+o.cAvg,'$'+o.mAvg,(o.gap>0?'+':'')+o.gap.toFixed(3),o.cVolTons+'t'];
        }),
        [2000,1500,1500,1500,2500]
      ));
      children.push(new D.Paragraph({spacing:{after:160}}));
    }

    // 대안 원산지
    if(cmp.altOrigins&&cmp.altOrigins.length){
      children.push(para('대안 소싱 원산지',{bold:true,spaceAfter:80}));
      children.push(makeTable(
        ['원산지','시장평균','최저단가','현재대비 절감'],
        cmp.altOrigins.slice(0,4).map(function(a){
          return [a.orig,'$'+a.mAvg+'/kg','$'+a.mMin+'/kg','-$'+a.saving.toFixed(3)+'/kg'];
        }),
        [2500,2000,2000,2500]
      ));
      children.push(new D.Paragraph({spacing:{after:200}}));
    }
  });

  if(docxInsights.market)children.push(insightBox(docxInsights.market));
  children.push(pageBreak());

  // ── ROI & 기대효과 ──
  children.push(sectionHeader('03  ROI & 기대효과',TEAL));
  children.push(new D.Paragraph({spacing:{after:160}}));

  // 카테고리별 ROI 표
  var roiRows=Object.entries(comps).map(function(en){
    var cat=en[0],cmp=en[1]||{};
    var s1=cmp.roiK||0;
    var s2=s1+(cmp.altOrigins||[]).reduce(function(t,a){return t+a.saving*30;},0);
    return [cat,'$'+s1+'K','$'+s2.toFixed(0)+'K'];
  });
  roiRows.push(['합계','$'+totalRoi+'K','—']);

  children.push(makeTable(
    ['카테고리','시나리오1 (동일공급사)','시나리오2 (+대안소싱)'],
    roiRows,
    [3500,2750,2750]
  ));
  children.push(new D.Paragraph({spacing:{after:200}}));

  if(S.tridgeCost){
    children.push(para('Tridge 연간 구독료: $'+S.tridgeCost.toLocaleString(),{bold:true,spaceAfter:60}));
    var roiMult=(totalRoi/(S.tridgeCost/1000)).toFixed(1);
    children.push(para('ROI 배율: '+roiMult+'x (구독료 대비 절감 기회)',{bold:true,color:TEAL}));
    children.push(new D.Paragraph({spacing:{after:200}}));
  }

  if(docxInsights.roi)children.push(insightBox(docxInsights.roi));
  children.push(pageBreak());

  // ── 즉시 실행 액션 ──
  children.push(sectionHeader('04  즉시 실행 권고사항',RED));
  children.push(new D.Paragraph({spacing:{after:160}}));

  if(docxInsights.action){
    children.push(para(docxInsights.action,{spaceAfter:200}));
  }else{
    // 폴백: 데이터 기반 자동 생성
    var actions=[];
    Object.entries(comps).forEach(function(en){
      var cmp=en[1]||{};
      var ss=(cmp.sameSupplier||[])[0];
      if(ss)actions.push('【'+en[0]+'】 '+ss.supplier+' 재협상 — $'+ss.overpayPerKg+'/kg 갭 축소 목표');
      if(cmp.altOrigins&&cmp.altOrigins[0])actions.push('【'+en[0]+'】 대안 원산지('+cmp.altOrigins[0].orig+') 파일럿 소싱 검토');
    });
    actions.slice(0,5).forEach(function(a,i){
      children.push(para((i+1)+'. '+a,{spaceAfter:100}));
    });
  }

  children.push(divider());
  children.push(para('본 보고서는 Tridge 글로벌 통관 실거래 데이터 기반으로 작성되었습니다.',{italic:true,color:GRAY,size:16}));
  children.push(para('데이터 기준: '+new Date().toLocaleDateString('ko-KR')+' | contact@tridge.com',{color:GRAY,size:16}));

  // 5. 문서 생성 & 다운로드
  var doc=new D.Document({
    creator:'Tridge Data Solutions',
    title:(S.companyName||'고객사')+' 소싱 경쟁력 진단 보고서',
    sections:[{
      properties:{
        page:{
          margin:{top:900,right:900,bottom:900,left:900},
          size:{width:12240,height:15840}
        }
      },
      footers:{
        default:new D.Footer({
          children:[new D.Paragraph({
            children:[
              new D.TextRun({text:'Tridge Data Solutions  |  ',size:16,color:GRAY}),
              new D.TextRun({text:S.companyName||'',size:16,color:GRAY,bold:true}),
              new D.TextRun({text:'  |  ',size:16,color:GRAY}),
              new D.PageNumber({type:D.PageNumberFormat.DECIMAL})
            ],
            alignment:D.AlignmentType.CENTER,
            border:{top:{style:D.BorderStyle.SINGLE,size:2,color:'CCCCCC'}}
          })]
        })
      },
      children:children
    }]
  });

  var blob=await D.Packer.toBlob(doc);
  var a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=(customTitle||S.companyName||'보고서').replace(/\s/g,'_')+'_Tridge.docx';
  a.click();
  URL.revokeObjectURL(a.href);
}

// ── 미팅 준비 패널 ──
var meetingPrepOpen=false;
function showMeetingPrep(){
  meetingPrepOpen=!meetingPrepOpen;
  if(!meetingPrepOpen){
    var el=document.getElementById('meeting-prep-overlay');
    if(el)el.remove();
    return;
  }

  var el=document.createElement('div');
  el.id='meeting-prep-overlay';
  el.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:800;display:flex;justify-content:flex-end';
  el.onclick=function(e){if(e.target===el){meetingPrepOpen=false;el.remove();}};
  el.innerHTML='<div style="background:var(--card);border-left:1px solid var(--border2);width:420px;height:100%;overflow-y:auto;padding:24px;display:flex;flex-direction:column;gap:16px">'
    +'<div style="display:flex;align-items:center;justify-content:space-between">'
    +'<div style="font-size:16px;font-weight:800;color:var(--text1)">🎯 미팅 준비 체크리스트</div>'
    +'<button onclick="meetingPrepOpen=false;document.getElementById(\'meeting-prep-overlay\').remove()" style="background:none;border:none;color:var(--text2);cursor:pointer;font-size:18px">✕</button>'
    +'</div>'
    +'<div id="meeting-prep-content"><div style="color:var(--text2);text-align:center;padding:20px">아래 버튼을 눌러 AI가 미팅 준비 자료를 생성합니다.</div></div>'
    +'<button onclick="genMeetingPrep()" class="btn-primary" style="width:100%">🤖 AI 미팅 준비 생성</button>'
    +'</div>';
  document.body.appendChild(el);
}

// ── 영업 타겟 패널 ──
function showNextTargets(){
  var existing=document.getElementById('targets-overlay');
  if(existing){existing.remove();return;}

  var el=document.createElement('div');
  el.id='targets-overlay';
  el.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:800;display:flex;justify-content:flex-end';
  el.onclick=function(e){if(e.target===el)el.remove();};
  el.innerHTML='<div style="background:var(--card);border-left:1px solid var(--border2);width:380px;height:100%;overflow-y:auto;padding:24px;display:flex;flex-direction:column;gap:16px">'
    +'<div style="display:flex;align-items:center;justify-content:space-between">'
    +'<div style="font-size:16px;font-weight:800;color:var(--text1)">🏹 다음 영업 타겟</div>'
    +'<button onclick="document.getElementById(\'targets-overlay\').remove()" style="background:none;border:none;color:var(--text2);cursor:pointer;font-size:18px">✕</button>'
    +'</div>'
    +'<div style="font-size:12px;color:var(--text2)">같은 공급사에서 더 싸게 구매하는 업체 — 트릿지 미가입 가능성 높음</div>'
    +rNextTargets()
    +'</div>';
  document.body.appendChild(el);
}


// ══════════════════════════════════════
// 에러 처리 UI
// ══════════════════════════════════════
function showError(opts){
  // opts: {title, message, type, onRetry, onFallback, onCancel}
  var existing=document.getElementById('error-overlay');
  if(existing)existing.remove();

  var el=document.createElement('div');
  el.id='error-overlay';
  el.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px';

  var iconMap={
    api:   '🔑',
    file:  '📂',
    parse: '🔍',
    timeout:'⏱',
    warn:  '⚠',
    error: '❌'
  };
  var colorMap={
    api:'var(--amber)',file:'var(--blue)',parse:'var(--teal)',
    timeout:'var(--amber)',warn:'var(--amber)',error:'var(--red)'
  };
  var icon=iconMap[opts.type||'error']||'❌';
  var color=colorMap[opts.type||'error']||'var(--red)';

  var btns='';
  if(opts.onRetry)btns+='<button onclick="closeError();('+opts.onRetry+')()" style="padding:10px 20px;background:var(--teal);border:none;border-radius:8px;color:#000;font-weight:700;cursor:pointer;font-family:inherit;font-size:13px">↺ 재시도</button>';
  if(opts.onFallback)btns+='<button onclick="closeError();('+opts.onFallback+')()" style="padding:10px 20px;background:var(--card2);border:1px solid var(--border2);border-radius:8px;color:var(--text1);cursor:pointer;font-family:inherit;font-size:13px">⚡ 자동 매칭으로 진행</button>';
  if(opts.onCancel)btns+='<button onclick="closeError();('+opts.onCancel+')()" style="padding:10px 20px;background:var(--card2);border:1px solid var(--border2);border-radius:8px;color:var(--text2);cursor:pointer;font-family:inherit;font-size:13px">취소</button>';
  btns+='<button onclick="closeError();doReset()" style="padding:10px 20px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.2);border-radius:8px;color:var(--red);cursor:pointer;font-family:inherit;font-size:13px">🏠 처음으로</button>';

  el.innerHTML='<div style="background:var(--card);border:1px solid var(--border2);border-radius:16px;padding:32px;max-width:460px;width:100%;text-align:center">'
    +'<div style="font-size:40px;margin-bottom:12px">'+icon+'</div>'
    +'<div style="font-size:17px;font-weight:800;color:'+color+';margin-bottom:10px">'+esc(opts.title||'오류 발생')+'</div>'
    +'<div style="font-size:13px;color:var(--text2);line-height:1.7;margin-bottom:24px;white-space:pre-wrap">'+esc(opts.message||'')+'</div>'
    +'<div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center">'+btns+'</div>'
    +'</div>';

  document.body.appendChild(el);
}

function closeError(){
  var el=document.getElementById('error-overlay');
  if(el)el.remove();
}

// 처음 화면으로 버튼 (topbar에 추가)
function goHome(){
  if(S.portfolio&&!confirm('처음으로 돌아가면 현재 분석이 초기화됩니다.\n(분석 결과는 히스토리에 저장됩니다)\n\n계속할까요?'))return;
  doReset();
}

function doReset(){S.step=1;S.loading=false;S.loadingMsg='';S.loadingSteps=[];S.loadingCurrentStep=0;S.companyFile=null;S.companyRaw=null;S.marketFiles=[];S.portfolio=null;S.comparisons={};S.insights=null;S.companyName='';S.importerKw='';S.companyMemo='';S.repEmail='';S.repName='';S.activeCategory=0;S.activeSup=0;S.healthScore=null;S.waterfall=null;S.negMatrix=null;S.actionCards=null;S.findings=null;S.selectedCategories=[];S.categoryMatchings={};S.reportType='strategy';S.liveMode=false;S.companyResearch=null;S.researchLoading=false;Object.values(charts).forEach(function(c){c.destroy();});Object.keys(charts).forEach(function(k){delete charts[k];});render();}


function doExport(){
  var p=S.portfolio; var ins=S.insights; var hs=S.healthScore;
  var totalRoi=getTotalRoi();
  var s2K=totalRoi+Object.values(S.comparisons||{}).reduce(function(s,c){return s+(c?c.roiAltK:0);},0);
  var today=new Date().toLocaleDateString('ko-KR');

  function cap(id){try{var el=document.getElementById(id);return(el&&el.tagName==='CANVAS')?el.toDataURL('image/png'):null;}catch(e){return null;}}
  function tbl(ths,rows){var h='<table><thead><tr>'+ths.map(function(t){return '<th>'+t+'</th>';}).join('')+'</tr></thead><tbody>';rows.forEach(function(r){h+='<tr>'+r.map(function(c){return '<td>'+c+'</td>';}).join('')+'</tr>';});return h+'</tbody></table>';}

  var css=[
    '*{box-sizing:border-box;margin:0;padding:0}',
    'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#F8FAFC;color:#1E293B;font-size:14px}',
    '.page{max-width:960px;margin:0 auto;padding:40px}',
    '.cover{background:linear-gradient(135deg,#0A1628 0%,#1A3A6B 100%);color:#fff;padding:56px 48px;border-radius:16px;margin-bottom:28px}',
    '.cover-eyebrow{font-size:11px;color:#94C5F0;letter-spacing:.2em;text-transform:uppercase;margin-bottom:14px}',
    '.cover-title{font-size:46px;font-weight:800;line-height:1.1;margin-bottom:8px}',
    '.cover-sub{font-size:14px;color:#A8C8F0;margin-bottom:32px}',
    '.cover-accent{color:#00C9A7}',
    '.cover-krow{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}',
    '.cover-kpi{background:rgba(255,255,255,.1);border-radius:10px;padding:16px;text-align:center}',
    '.ckv{font-size:28px;font-weight:700;line-height:1}',
    '.ckl{font-size:11px;color:#94C5F0;margin-top:4px}',
    '.hs-box{background:linear-gradient(135deg,#0A1628,#1E3A5F);border:2px solid;border-radius:14px;padding:24px;margin-bottom:20px;display:flex;align-items:center;gap:32px}',
    '.hs-score-big{font-size:72px;font-weight:900;line-height:1}',
    '.hs-grade{font-size:22px;font-weight:700}',
    '.hs-label{font-size:14px;color:#94C5F0;margin-top:4px}',
    '.hs-bars{flex:1}',
    '.hs-row{display:flex;align-items:center;gap:10px;margin-bottom:10px;font-size:13px}',
    '.hs-bar-bg{flex:1;height:6px;background:rgba(255,255,255,.15);border-radius:3px}',
    '.hs-bar-fill{height:100%;border-radius:3px}',
    '.sec{background:#fff;border-radius:12px;padding:26px;margin-bottom:18px;box-shadow:0 1px 3px rgba(0,0,0,.08)}',
    '.sec h2{font-size:17px;font-weight:700;color:#0F2B5B;border-bottom:2px solid #E2E8F0;padding-bottom:8px;margin-bottom:18px}',
    '.sec h3{font-size:14px;font-weight:600;color:#1E5BA8;margin:18px 0 10px}',
    '.krow{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px}',
    '.kcard{background:#F1F5F9;border-radius:10px;padding:14px;text-align:center}',
    '.kv{font-size:26px;font-weight:700;line-height:1}',
    '.kl{font-size:11px;color:#64748B;margin-top:3px}',
    'table{width:100%;border-collapse:collapse;font-size:12px;margin:10px 0}',
    'thead tr{background:#0F2B5B}',
    'th{color:#fff;padding:8px 11px;text-align:left;font-size:11px;font-weight:600;letter-spacing:.04em}',
    'td{padding:8px 11px;border-bottom:1px solid #F1F5F9}',
    '.hl td{background:#FEF2F2}',
    '.best td{background:#F0FDF4}',
    '.phi{color:#DC2626;font-weight:600}',
    '.plo{color:#059669;font-weight:600}',
    '.pok{color:#059669;font-weight:600}',
    '.roi-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px}',
    '.roi-card{border:2px solid;border-radius:12px;padding:22px;text-align:center}',
    '.rv{font-size:46px;font-weight:800;line-height:1}',
    '.rs{font-size:12px;color:#64748B;margin-top:6px}',
    '.act-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:14px}',
    '.act-card{border:1px solid;border-radius:10px;padding:16px}',
    '.act-tag{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px}',
    '.act-title{font-size:13px;font-weight:600;margin-bottom:6px}',
    '.act-desc{font-size:11px;color:#64748B;line-height:1.5;margin-bottom:10px}',
    '.act-saving{font-size:18px;font-weight:700;color:#DC2626}',
    '.act-meta{font-size:11px;color:#94A3B8;margin-top:4px}',
    '.alert{border-left:4px solid;border-radius:0 8px 8px 0;padding:10px 14px;margin:8px 0;font-size:13px;line-height:1.5}',
    '.ar{background:#FEF2F2;border-color:#DC2626}',
    '.at{background:#F0FDF4;border-color:#059669}',
    '.aa{background:#FFFBEB;border-color:#F59E0B}',
    '.ins-item{display:flex;gap:10px;padding:8px 12px;background:#F0FDF4;border-radius:8px;font-size:13px;line-height:1.5;margin-bottom:5px}',
    '.opening{background:#EFF6FF;border:1px solid #BFDBFE;border-radius:10px;padding:14px;font-style:italic;font-size:13px;line-height:1.8;margin:10px 0}',
    '.q-item{display:flex;gap:12px;padding:10px 13px;background:#FFFBEB;border-radius:8px;font-size:13px;margin-bottom:5px}',
    '.qn{font-size:20px;font-weight:800;color:#D97706;flex-shrink:0}',
    'img.chart{width:100%;border-radius:8px;display:block;margin:10px 0}',
    'footer{text-align:center;padding:28px;color:#94A3B8;font-size:11px;border-top:1px solid #E2E8F0;margin-top:32px}',
    '.tag{display:inline-block;padding:2px 7px;border-radius:10px;font-size:10px;font-weight:600}',
    '.tagr{background:#FEE2E2;color:#DC2626}',
    '.tagt{background:#D1FAE5;color:#059669}'
  ].join('');

  // 핵심 발견 HTML
  var findingsHtml='';
  if(S.findings&&S.findings.length){
    var fcm={red:'#DC2626',amber:'#D97706',teal:'#059669',blue:'#2563EB'};
    findingsHtml='<div class="sec"><h2>🔍 핵심 발견</h2>';
    S.findings.forEach(function(f,i){
      findingsHtml+='<div style="display:flex;gap:12px;padding:12px 14px;background:#F8FAFC;border-radius:9px;margin-bottom:8px;border-left:3px solid '+(fcm[f.color]||'#059669')+'"><div style="font-size:18px;font-weight:800;color:'+(fcm[f.color]||'#059669')+'">'+(i+1)+'</div><div style="font-size:13px;line-height:1.6">'+f.text+'</div></div>';
    });
    findingsHtml+='</div>';
  }

  // 타이밍 + 기대효과 캡처
  var imgTcal=cap('ch-tcal'),imgTcmp=cap('ch-tcmp'),imgPay=cap('ch-pay'),imgBA=cap('ch-ba');

  // Chart images
  var imgAnn=cap('ch-a'),imgQ=cap('ch-q'),imgHS=cap('ch-hs'),imgOr=cap('ch-or'),imgPr=cap('ch-pr');
  var imgWF=cap('ch-wf'),imgMat=cap('ch-mat'),imgROI=cap('ch-roi');

  // Comparison sections
  var compSecs='';
  Object.entries(S.comparisons||{}).forEach(function(en){
    var cat=en[0],cmp=en[1]; if(!cmp) return;
    var ssRows='';
    (cmp.sameSupplier||[]).forEach(function(s){
      var cr=[]; s.comps.forEach(function(x,i){var d=(s.compP-x.avgP).toFixed(3);cr.push(['경쟁사 '+'ABCDEFGHI'[i],'<span class="plo">$'+x.avgP+'</span>',x.volTons+'t','<span class="tag '+(d>0?'tagt':'tagr')+'">'+(d>0?'-$':'+$')+Math.abs(d)+'</span>']);});
      cr.push(['<strong>★ '+esc(S.companyName.slice(0,14))+'</strong>','<span class="phi">$'+s.compP+'</span>',s.compVolTons+'t','<span class="tag tagr">기준</span>']);
      ssRows+='<h3>'+esc(s.supplier)+(s.mainProduct?' <span style="color:#94A3B8;font-size:12px">| '+esc(s.mainProduct)+'</span>':'')+'</h3>';
      ssRows+='<div class="alert ar"><strong>'+esc(s.supplier)+'</strong> — 이 회사 <strong>$'+s.compP+'/kg</strong> vs 경쟁사 최저 <strong style="color:#059669">$'+s.bestPrice+'/kg</strong> · 연간 <strong>$'+(s.overpayPerKg*s.compVolTons).toFixed(0)+'K</strong> 초과</div>';
      ssRows+=tbl(['바이어','단가','물량','이 회사 대비'],cr);
    });
    var origCR=[];(cmp.origComp||[]).filter(function(o){return o.mAvg;}).forEach(function(o){var g=o.gap||0;origCR.push([esc(o.orig),'<span class="'+(g>0?'phi':'plo')+'">$'+o.cAvg+'</span>','$'+o.mAvg,'<span class="tag '+(g>0?'tagr':'tagt')+'">'+(g>0?'+':'')+g.toFixed(3)+'</span>',o.cVolTons+'t']);});
    var altCR=[];(cmp.altOrigins||[]).forEach(function(a){altCR.push([esc(a.orig),'<span class="pok">$'+a.mAvg+'</span>','$'+a.mMin,'<span class="tag tagt">-$'+a.saving.toFixed(3)+'</span>',a.cnt+'건']);});
    var timingImg='';
    if(cmp.timing){
      timingImg='<h3>📅 경쟁사 소싱 타이밍</h3>'+(imgTcal?'<img class="chart" src="'+imgTcal+'">':'')+(imgTcmp?'<img class="chart" src="'+imgTcmp+'">':'')+'<div class="alert aa">시장 최저가 시즌 '+(cmp.timing.cheapMonthName||'')+' · 자사 구매 타이밍 시장평균 대비 '+Math.round((cmp.timing.timingIndex-1)*100)+'% · 타이밍 절감 $'+cmp.timing.timingSaving+'K</div>';
    }
    compSecs+='<div class="sec"><h2>📊 시장 비교 — '+esc(cat)+'</h2>'
      +'<div class="krow"><div class="kcard"><div class="kv" style="color:#DC2626">$'+cmp.roiK+'K</div><div class="kl">연간 초과 지불 추정</div></div><div class="kcard"><div class="kv">'+cmp.sameSupplier.length+'</div><div class="kl">갭 발견 공급사</div></div><div class="kcard"><div class="kv">'+cmp.origComp.filter(function(o){return o.mAvg;}).length+'</div><div class="kl">원산지 비교</div></div><div class="kcard"><div class="kv">'+cmp.altOrigins.length+'</div><div class="kl">대안 원산지</div></div></div>'
      +ssRows
      +(origCR.length?'<h3>원산지별 단가 비교</h3>'+tbl(['원산지','이 회사','시장평균','갭','물량'],origCR):'')
      +(altCR.length?'<h3>대안 소싱 원산지 (현재 미사용)</h3>'+tbl(['원산지','시장평균','최저단가','현재 대비','거래건수'],altCR):'')
      +timingImg
      +'</div>';
  });

  // Action cards HTML
  var actHtml='';
  if(S.actionCards&&S.actionCards.length){
    var colorMap2={green:'#059669',blue:'#2563EB',amber:'#D97706',purple:'#7C3AED',red:'#DC2626'};
    actHtml='<div class="act-grid">';
    S.actionCards.forEach(function(a){
      var c=colorMap2[a.color]||'#059669';
      actHtml+='<div class="act-card" style="border-color:'+c+'22">'
        +'<div class="act-tag" style="color:'+c+'">'+esc(a.tag)+'</div>'
        +'<div class="act-title">'+a.icon+' '+esc(a.title)+'</div>'
        +'<div class="act-desc">'+esc(a.desc)+'</div>'
        +(a.savingK?'<div class="act-saving">$'+a.savingK+'K 절감</div>':'')
        +'<div class="act-meta">⏱ '+esc(a.timeline)+' &nbsp; ● '+esc(a.difficulty)+'</div></div>';
    });
    actHtml+='</div>';
  }

  // Insights HTML
  var insHtml2='';
  if(ins&&ins.insights){
    var ii=''; ins.insights.forEach(function(t){ii+='<div class="ins-item"><div style="width:8px;height:8px;border-radius:50%;background:#059669;margin-top:5px;flex-shrink:0"></div><div>'+esc(t)+'</div></div>';});
    var qq=''; if(ins.questions) ins.questions.forEach(function(q,i){qq+='<div class="q-item"><div class="qn">'+(i+1)+'</div><div>'+esc(q)+'</div></div>';});
    insHtml2='<h3>핵심 인사이트</h3>'+ii
      +(ins.opening?'<h3>미팅 오프닝 멘트</h3><div class="opening">'+esc(ins.opening)+'</div>':'')
      +(qq?'<h3>추천 질문</h3>'+qq:'')
      +(ins.caution?'<h3>미팅 주의사항</h3><div class="alert aa">'+esc(ins.caution)+'</div>':'');
  }

  // HS breakdown table rows
  var hsTblRows=p.hsData.map(function(d){return [d.key,d.volTons+'t','$'+d.avgP,d.pct+'%',d.cnt+'건'];});
  var origTblRows=p.origData.map(function(d){return [esc(d.key),d.volTons+'t','$'+d.avgP,d.cnt+'건'];});
  var yrTblRows=p.yrData.map(function(d){return [d.year,d.volTons+'t',d.valMil?'$'+d.valMil+'M':'—','$'+d.avgP+'/kg'];});

  // Health score section
  var hsHtml='';
  if(hs){
    var hsBars='';
    Object.values(hs.breakdown).forEach(function(b){
      var pct2=+(b.score/b.max*100).toFixed(0);
      var c2=pct2>=80?'#059669':pct2>=50?'#F59E0B':'#DC2626';
      hsBars+='<div class="hs-row"><span style="width:130px;color:#94A3B8">'+b.icon+' '+b.label+'</span>'
        +'<div class="hs-bar-bg"><div class="hs-bar-fill" style="width:'+pct2+'%;background:'+c2+'"></div></div>'
        +'<span style="width:40px;text-align:right;color:'+c2+';font-weight:600">'+b.score+'/'+b.max+'</span></div>';
    });
    hsHtml='<div class="hs-box" style="border-color:'+hs.color+';color:#fff">'
      +'<div style="text-align:center"><div class="hs-score-big" style="color:'+hs.color+'">'+hs.total+'</div><div class="hs-grade" style="color:'+hs.color+'">'+hs.grade+'등급</div><div class="hs-label">'+hs.label+'</div></div>'
      +'<div class="hs-bars">'+hsBars+'</div>'
      +'</div>';
  }

  var html='<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">'
    +'<meta name="viewport" content="width=device-width,initial-scale=1">'
    +'<title>'+esc(S.companyName)+' × Tridge 소싱 분석 보고서</title>'
    +'<style>'+css+'</style></head><body><div class="page">'

    // COVER
    +'<div class="cover">'
    +'<div class="cover-eyebrow">TRIDGE SOURCING INTELLIGENCE · CONFIDENTIAL</div>'
    +'<div class="cover-title">'+esc(S.companyName)+'<br><span class="cover-accent">소싱 경쟁력 진단</span></div>'
    +'<div class="cover-sub">분석 보고서 · '+today+'</div>'
    +'<div class="cover-krow">'
    +'<div class="cover-kpi"><div class="ckv">'+p.totVolTons+'t</div><div class="ckl">누적 물량</div></div>'
    +'<div class="cover-kpi"><div class="ckv">$'+p.totValMil+'M</div><div class="ckl">누적 금액</div></div>'
    +'<div class="cover-kpi"><div class="ckv" style="color:#EF4444">$'+totalRoi+'K</div><div class="ckl">절감 추정</div></div>'
    +(hs?'<div class="cover-kpi"><div class="ckv" style="color:'+hs.color+'">'+hs.total+'점</div><div class="ckl">헬스스코어</div></div>':'')
    +'</div></div>'

    +findingsHtml
    // HEALTH SCORE
    +(hs?'<div class="sec"><h2>🎯 소싱 헬스 스코어</h2>'+hsHtml+'</div>':'')

    // PORTFOLIO
    +'<div class="sec"><h2>📊 포트폴리오 분석</h2>'
    +'<div class="krow"><div class="kcard"><div class="kv">'+p.totVolTons+'t</div><div class="kl">누적 물량</div></div><div class="kcard"><div class="kv">$'+p.totValMil+'M</div><div class="kl">누적 금액</div></div><div class="kcard"><div class="kv">$'+p.avgP+'</div><div class="kl">평균 단가/kg</div></div><div class="kcard"><div class="kv">'+p.cnt+'</div><div class="kl">거래 건수</div></div></div>'
    +(imgAnn||imgQ?'<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">'+(imgAnn?'<div><h3>연도별 물량 & 단가</h3><img class="chart" src="'+imgAnn+'"></div>':'')+(imgQ?'<div><h3>분기별 추이</h3><img class="chart" src="'+imgQ+'"></div>':'')+'</div>':'')
    +(imgHS||imgOr?'<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">'+(imgHS?'<div><h3>HS코드별 비중</h3><img class="chart" src="'+imgHS+'"></div>':'')+(imgOr?'<div><h3>원산지별 물량</h3><img class="chart" src="'+imgOr+'"></div>':'')+'</div>':'')
    +(imgPr?'<h3>품목별 물량</h3><img class="chart" src="'+imgPr+'">':'')
    +'<h3>HS코드별 상세</h3>'+tbl(['HS코드','물량','평균단가','비중','건수'],hsTblRows)
    +'<h3>원산지별 상세</h3>'+tbl(['원산지','물량','평균단가','건수'],origTblRows)
    +'<h3>연도별 수입 추이</h3>'+tbl(['연도','물량','금액','평균단가'],yrTblRows)
    +'</div>'

    +compSecs

    // ROI
    +(totalRoi?'<div class="sec"><h2>💰 ROI 시뮬레이션</h2>'
      +'<div class="roi-grid">'
      +'<div class="roi-card" style="border-color:#DC2626"><div class="act-tag" style="color:#DC2626">연간 절감 추정 (현실화 계수 '+Math.round((S.roiFactor||0.5)*100)+'% 적용)</div><div class="rv" style="color:#DC2626">$'+totalRoi+'K</div><div class="rs">≈ '+Math.round(totalRoi*1.35/10)*10+'백만원 / 연간</div></div>'
      +'<div class="roi-card" style="border-color:#059669"><div class="act-tag" style="color:#059669">시나리오 2 — 대안 소싱 포함</div><div class="rv" style="color:#059669">$'+s2K+'K</div><div class="rs">≈ '+Math.round(s2K*1.35/10)*10+'백만원 / 연간</div></div>'
      +'</div>'
      +(imgROI?'<img class="chart" src="'+imgROI+'">':'')
      +(imgPay?'<h3>💹 누적 절감 페이백 곡선</h3><img class="chart" src="'+imgPay+'">':'')
      +(imgBA?'<h3>🔄 Before / After 협상 목표</h3><img class="chart" src="'+imgBA+'">':'')
      +(imgWF?'<h3>💧 절감 폭포 차트</h3><img class="chart" src="'+imgWF+'">':'')
      +(imgMat?'<h3>🎯 협상력 매트릭스</h3><img class="chart" src="'+imgMat+'">':'')
      +(actHtml?'<h3>⚡ 즉시 실행 액션 TOP 3</h3>'+actHtml:'')
      +'</div>':'')

    // INSIGHTS
    +(insHtml2?'<div class="sec"><h2>🤖 AI 미팅 인사이트</h2>'+insHtml2+'</div>':'')

    +'<footer>TRIDGE SOURCING INTELLIGENCE · '+esc(S.companyName)+' · '+today+' · CONFIDENTIAL</footer>'
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
  var a=document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download=esc(S.companyName||'Tridge')+'_소싱분석보고서_'+today.replace(/\./g,'')+'.html';
  a.click();
}



// ═══════════════════════════════════════════
// 미팅 보고서 (C레벨 대상, 시각화 풍부)
var crBlind=false;
function exportClientReport(){
  var exist=document.getElementById('client-report-modal');
  if(exist)exist.remove();

  var overlay=document.createElement('div');
  overlay.id='client-report-modal';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
  overlay.innerHTML='<div style="background:var(--card);border-radius:18px;padding:32px;max-width:480px;width:100%;box-shadow:0 24px 60px rgba(0,0,0,.3)">'
    +'<div style="font-size:11px;font-weight:700;color:var(--teal);letter-spacing:.1em;margin-bottom:6px">미팅 보고서</div>'
    +'<h2 style="font-size:20px;font-weight:700;color:var(--text1);margin-bottom:6px">📋 미팅 보고서 설정</h2>'
    +'<p style="font-size:13px;color:var(--text2);margin-bottom:16px">Chart.js 시각화 + AI 인사이트가 포함된<br>C레벨 미팅용 HTML 보고서를 생성합니다.</p>'
    +'<div style="display:flex;align-items:center;justify-content:space-between;background:var(--card2);border:1px solid var(--border);border-radius:10px;padding:12px 16px;margin-bottom:16px">'
    +'<div><div style="font-size:13px;font-weight:600;color:var(--text1)">경쟁사 블라인드</div><div style="font-size:11px;color:var(--text3);margin-top:2px">ON: 경쟁사명 익명 처리 · 절감액 범위로만 표시</div></div>'
    +'<div id="cr-blind-toggle" onclick="crBlind=!crBlind;this.style.background=crBlind?\'var(--teal)\':\'rgba(100,116,139,.3)\';this.querySelector(\'span\').style.transform=crBlind?\'translateX(20px)\':\'translateX(0)\';" style="width:44px;height:24px;border-radius:12px;background:rgba(100,116,139,.3);cursor:pointer;position:relative;transition:background .2s;flex-shrink:0"><span style="display:block;width:20px;height:20px;border-radius:50%;background:#fff;position:absolute;top:2px;left:2px;transition:transform .2s"></span></div>'
    +'</div>'
    +'<div style="margin-bottom:14px">'
    +'<label style="font-size:12px;font-weight:600;color:var(--text2);display:block;margin-bottom:6px">보고서 제목</label>'
    +'<input id="cr-title-input" type="text" value="'+(S.companyName||'고객사')+' 소싱 경쟁력 진단 보고서" style="width:100%;border:1px solid var(--border);border-radius:9px;padding:10px 13px;font-size:13px;color:var(--text1);background:var(--card2);font-family:inherit">'
    +'</div>'
    +'<div style="margin-bottom:20px">'
    +'<label style="font-size:12px;font-weight:600;color:var(--text2);display:block;margin-bottom:6px">AI 추가 지시사항 <span style="font-weight:400;color:var(--text3)">(선택)</span></label>'
    +'<textarea id="cr-extra-input" rows="3" placeholder="예시:&#10;• 경쟁사 비교 섹션을 더 강조해줘&#10;• Tridge 소개 섹션 빼줘&#10;• 영어로 작성해줘" style="width:100%;border:1px solid var(--border);border-radius:9px;padding:10px 13px;font-size:13px;color:var(--text1);background:var(--card2);font-family:inherit;resize:vertical;line-height:1.5"></textarea>'
    +'</div>'
    +'<div style="display:flex;gap:10px;justify-content:flex-end">'
    +'<button onclick="var _o=document.getElementById(\'client-report-modal\');if(_o)_o.remove();" style="padding:10px 20px;border:1px solid var(--border);border-radius:9px;background:none;color:var(--text2);cursor:pointer;font-family:inherit;font-size:13px">취소</button>'
    +'<button id="cr-generate-btn" onclick="startClientReportGenerate()" style="padding:10px 24px;background:linear-gradient(135deg,#1A5C96,#00C9A7);border:none;border-radius:9px;color:#fff;cursor:pointer;font-family:inherit;font-size:13px;font-weight:700">📊 보고서 다운로드</button>'
    +'</div>'
    +'</div>';
  document.body.appendChild(overlay);
  overlay.addEventListener('click',function(e){if(e.target===overlay)overlay.remove();});
  setTimeout(function(){var el=document.getElementById('cr-extra-input');if(el)el.focus();},100);
}


async function startClientReportGenerate(){
  var extra=document.getElementById('cr-extra-input')?document.getElementById('cr-extra-input').value:'';
  var title=document.getElementById('cr-title-input')?document.getElementById('cr-title-input').value:'';
  var blind=typeof crBlind!=='undefined'&&crBlind;
  var modal=document.getElementById('client-report-modal');
  if(modal){
    modal.querySelector('div').innerHTML=
      '<div style="text-align:center;padding:20px 0">'
      +'<div style="font-size:11px;font-weight:700;color:var(--teal);letter-spacing:.1em;margin-bottom:12px">미팅 보고서 생성</div>'
      +'<h2 style="font-size:18px;font-weight:700;color:var(--text1);margin-bottom:24px">📋 보고서 생성 중...</h2>'
      +'<div style="text-align:left;min-width:300px">'
      +'<div id="crs-1" style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);color:var(--text3)"><span class="crs-icon">⏳</span><span>데이터 분석 준비</span></div>'
      +'<div id="crs-2" style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);color:var(--text3)"><span class="crs-icon">⏳</span><span>AI 인사이트 생성 (최대 3분)</span></div>'
      +'<div id="crs-3" style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);color:var(--text3)"><span class="crs-icon">⏳</span><span>차트 & 보고서 조립</span></div>'
      +'<div id="crs-4" style="display:flex;align-items:center;gap:10px;padding:10px 0;color:var(--text3)"><span class="crs-icon">⏳</span><span>파일 생성</span></div>'
      +'</div>'
      +'<div id="cr-done" style="display:none;margin-top:24px"></div>'
      +'</div>';
  }
  function setStep(n,done){
    var el=document.getElementById('crs-'+n);
    if(!el)return;
    el.style.color=done?'var(--teal)':'var(--amber,#F59E0B)';
    el.querySelector('.crs-icon').textContent=done?'✅':'🔄';
    el.style.fontWeight=done?'400':'700';
  }
  try{
    var blob=await _buildClientReport(extra,title,setStep,blind);
    var doneEl=document.getElementById('cr-done');
    if(doneEl){
      doneEl.style.display='block';
      var a=document.createElement('a');
      a.href=URL.createObjectURL(blob);
      a.download=(title||S.companyName||'미팅보고서').replace(/\s/g,'_')+'_Tridge.html';
      a.style.cssText='display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#1A5C96,#00C9A7);border-radius:10px;color:#fff;font-weight:700;font-size:14px;text-decoration:none;margin-bottom:10px';
      a.textContent='📥 보고서 다운로드';
      doneEl.appendChild(a);
      var closeBtn=document.createElement('button');
      closeBtn.textContent='닫기';
      closeBtn.style.cssText='display:block;width:100%;margin-top:8px;padding:10px;border:1px solid var(--border);border-radius:9px;background:none;color:var(--text2);cursor:pointer;font-family:inherit;font-size:13px';
      closeBtn.onclick=function(){var ov=document.getElementById('client-report-modal');if(ov)ov.remove();};
      doneEl.appendChild(closeBtn);
    }
  }catch(e){
    console.error('미팅보고서 오류:',e);
    var modal2=document.getElementById('client-report-modal');
    if(modal2)modal2.remove();
    alert('보고서 생성 실패: '+e.message);
  }
}

