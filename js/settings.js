// 설정·테마·히스토리
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
