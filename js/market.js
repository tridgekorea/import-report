// 시장분석
function computeHealthScore(portfolio,comparisons){
  var bd={};var cr=portfolio.concRisk;
  bd.concentration={score:cr<30?25:cr<50?18:cr<70?10:2,max:25,label:'공급사 분산도',icon:'🏭'};
  var totalGapK=Object.values(comparisons||{}).reduce(function(s,c){return s+(c?c.roiK:0);},0);
  var gapPct=portfolio.totValMil>0?(totalGapK/1000)/portfolio.totValMil*100:0;
  bd.priceGap={score:gapPct<0.5?35:gapPct<2?28:gapPct<5?18:gapPct<10?8:0,max:35,label:'단가 경쟁력',icon:'💰'};
  var dl=portfolio.disappeared.length;
  bd.stability={score:dl===0?20:dl===1?14:dl===2?8:2,max:20,label:'포트폴리오 안정성',icon:'📦'};
  var trend=0;if(portfolio.yrData.length>=2){var last=portfolio.yrData[portfolio.yrData.length-1],prev=portfolio.yrData[portfolio.yrData.length-2];var pc=prev.avgP>0?((last.avgP-prev.avgP)/prev.avgP*100):0;trend=pc;bd.trend={score:pc<0?20:pc<5?16:pc<10?10:pc<20?4:0,max:20,label:'단가 추세',icon:'📈'};}else{bd.trend={score:10,max:20,label:'단가 추세',icon:'📈'};}
  var total=Object.values(bd).reduce(function(s,b){return s+b.score;},0);
  var grade=total>=85?'A':total>=70?'B':total>=55?'C':total>=40?'D':'F';
  var color=total>=85?'#10B981':total>=70?'#3B82F6':total>=55?'#F59E0B':'#EF4444';
  var label=total>=85?'최우수':total>=70?'양호':total>=55?'개선 필요':total>=40?'위험':'심각';
  return {total:total,grade:grade,color:color,label:label,breakdown:bd};
}

function computeWaterfall(comparisons){var items=[];Object.entries(comparisons||{}).forEach(function(en){var cat=en[0],cmp=en[1];if(!cmp)return;(cmp.sameSupplier||[]).forEach(function(s){items.push({label:s.supplier.slice(0,14),saving:+(s.overpayPerKg*s.compVolTons).toFixed(1),supplier:s.supplier,category:cat,overpay:s.overpayPerKg,vol:s.compVolTons});});});items.sort(function(a,b){return b.saving-a.saving;});var total=items.reduce(function(s,i){return s+i.saving;},0);return {items:items,total:+total.toFixed(0)};}

function computeNegMatrix(comparisons){var points=[];Object.values(comparisons||{}).forEach(function(cmp){if(!cmp)return;(cmp.sameSupplier||[]).forEach(function(s){var gapPct=s.compP>0?+(s.overpayPerKg/s.compP*100).toFixed(1):0;points.push({supplier:s.supplier,volume:s.compVolTons,gapPct:gapPct,savingK:+(s.overpayPerKg*s.compVolTons).toFixed(0),compP:s.compP,bestP:s.bestPrice,mainProduct:s.mainProduct});});});var medVol=0;if(points.length>1){var vs=points.map(function(p){return p.volume;}).sort(function(a,b){return a-b;});medVol=vs[Math.floor(vs.length/2)];}points.forEach(function(p){p.quadrant=p.gapPct>=8&&p.volume>=medVol?'strategic':p.gapPct>=8?'quickwin':p.volume>=medVol?'monitor':'low';});return {points:points,medVol:medVol};}

function computeActionCards(portfolio,comparisons){
  var actions=[];var allSS=[];Object.values(comparisons||{}).forEach(function(cmp){if(cmp&&cmp.sameSupplier)allSS=allSS.concat(cmp.sameSupplier);});allSS.sort(function(a,b){return (b.overpayPerKg*b.compVolTons)-(a.overpayPerKg*a.compVolTons);});
  if(allSS.length>0){var top=allSS[0];var saving=+(top.overpayPerKg*top.compVolTons).toFixed(0);actions.push({priority:1,icon:'🎯',color:'green',tag:'즉시 실행',title:top.supplier+' 단가 재협상',desc:'시장 실거래가 $'+top.bestPrice+'/kg 근거 제시 → 현재 $'+top.compP+' → 목표 $'+top.bestPrice+'/kg 협상',savingK:saving,difficulty:'쉬움',diffColor:'green',timeline:'1~2주'});}
  // 타이밍 액션
  var bestTiming=null;Object.values(comparisons||{}).forEach(function(cmp){if(cmp&&cmp.timing&&cmp.timing.timingSaving>0){if(!bestTiming||cmp.timing.timingSaving>bestTiming.timingSaving)bestTiming=cmp.timing;}});
  if(bestTiming&&bestTiming.timingSaving>5){actions.push({priority:2,icon:'📅',color:'blue',tag:'단기',title:'구매 타이밍 최적화',desc:'시장 최저가 시즌은 '+bestTiming.cheapMonthName+'($'+bestTiming.cheapMonthPrice+'/kg). 이 시기로 매수를 이동하면 협상 없이 절감 가능',savingK:bestTiming.timingSaving,difficulty:'쉬움',diffColor:'green',timeline:'다음 시즌'});}
  else if(allSS.length>1){var s2=allSS[1];var saving2=+(s2.overpayPerKg*s2.compVolTons).toFixed(0);actions.push({priority:2,icon:'📊',color:'blue',tag:'단기',title:s2.supplier+' 경쟁 공급사 발굴',desc:'현재 $'+s2.compP+'/kg에서 경쟁 입찰 진행. 최저 시장가 $'+s2.bestPrice+'/kg 목표',savingK:saving2,difficulty:'보통',diffColor:'amber',timeline:'2~4주'});}
  var allAlt=[];Object.values(comparisons||{}).forEach(function(cmp){if(cmp&&cmp.altOrigins)allAlt=allAlt.concat(cmp.altOrigins);});allAlt.sort(function(a,b){return b.saving-a.saving;});
  if(allAlt.length>0){var a=allAlt[0];var estSaving=+(a.saving*50).toFixed(0);actions.push({priority:3,icon:'🌏',color:'purple',tag:'중장기',title:a.orig+'산 파일럿 소싱',desc:'현재 단가 대비 $'+a.saving.toFixed(3)+'/kg 저렴. 소량 파일럿으로 품질 검증 후 전환',savingK:estSaving,difficulty:'보통',diffColor:'amber',timeline:'1~2달'});}
  else if(portfolio.disappeared.length>0){var d=portfolio.disappeared[0];actions.push({priority:3,icon:'🔄',color:'amber',tag:'중장기',title:d.product+' 소싱 재개 검토',desc:d.lastYear+'년 이후 미수입. 대체 공급사 발굴 또는 협상 재개로 볼륨 회복',savingK:null,difficulty:'보통',diffColor:'amber',timeline:'2~4주'});}
  return actions.slice(0,3);
}

// ─── 핵심 발견 (평문 요약) ───
// ── findings 폴백 (API 실패 시 사용) ──────────────────────────────
function computeFindingsFallback(portfolio,comparisons,healthScore){
  var f=[];var name=S.companyName||'이 회사';
  var totalRoi=+(Object.values(comparisons||{}).reduce(function(s,c){return s+(c?c.roiK:0);},0)*(S.roiFactor||0.5)).toFixed(0);
  var allSS=[];Object.values(comparisons||{}).forEach(function(c){if(c&&c.sameSupplier)allSS=allSS.concat(c.sameSupplier);});
  if(allSS.length>0&&totalRoi>0){var best=allSS[0];f.push({icon:'💰',color:'red',text:'같은 공급사('+best.supplier+')에서 경쟁사보다 비싸게 구매 중 — 전체 품목 합산 시 <strong>연 $'+totalRoi+'K(≈'+Math.round(totalRoi*1.35/10)*10+'백만원)</strong> 초과 지불 추정'});}
  var bestTiming=null;Object.values(comparisons||{}).forEach(function(cmp){if(cmp&&cmp.timing&&cmp.timing.timingSaving>5){if(!bestTiming||cmp.timing.timingSaving>bestTiming.timingSaving)bestTiming=cmp.timing;}});
  if(bestTiming){f.push({icon:'📅',color:'amber',text:'구매 타이밍이 시장 평균보다 <strong>'+Math.round((bestTiming.timingIndex-1)*100)+'% 비싼 시점</strong>에 집중 — 최저가 시즌('+bestTiming.cheapMonthName+')으로 이동 시 <strong>연 $'+bestTiming.timingSaving+'K</strong> 추가 절감 가능'});}
  if(portfolio.disappeared.length>0){var d=portfolio.disappeared[0];f.push({icon:'🚨',color:'red',text:'<strong>'+d.product+'</strong>이 '+d.lastYear+'년 이후 수입 중단 — 단가 상승 시 즉각 이탈하는 패턴으로, 대안 공급사 사전 확보가 필요'});}
  if(portfolio.yrData.length>=2){var last=portfolio.yrData[portfolio.yrData.length-1],prev=portfolio.yrData[portfolio.yrData.length-2];var pc=prev.avgP>0?+(((last.avgP-prev.avgP)/prev.avgP)*100).toFixed(0):0;if(pc>5&&f.length<3)f.push({icon:'📈',color:'amber',text:'평균 수입 단가가 전년 대비 <strong>'+pc+'% 상승</strong> — 시장 단가 모니터링으로 선매입 타이밍 포착이 필요한 시점'});}
  var allAlt=[];Object.values(comparisons||{}).forEach(function(c){if(c&&c.altOrigins)allAlt=allAlt.concat(c.altOrigins);});
  if(allAlt.length>0&&f.length<3){var a=allAlt[0];f.push({icon:'🌏',color:'teal',text:'현재 미사용 중인 <strong>'+a.orig+'산</strong>이 시장 최저가 대비 저렴 — 대안 소싱 루트로 검토 가치 있음'});}
  if(f.length<3&&healthScore){f.push({icon:'🎯',color:healthScore.total<70?'amber':'teal',text:'소싱 헬스 스코어 <strong>'+healthScore.total+'점('+healthScore.grade+'등급)</strong> — '+(healthScore.total<70?'단가 경쟁력 확보가 최우선 과제':'양호하나 지속적 시장 모니터링 권장')});}
  return f.slice(0,3);
}

// ── findings API 호출 (메인) ──────────────────────────────────────
async function computeFindings(portfolio,comparisons,healthScore){
  var name=S.companyName||'이 회사';
  var apiKey=S.apiKey||'';

  // 데이터 조립
  var allSS=[];
  Object.values(comparisons||{}).forEach(function(c){if(c&&c.sameSupplier)allSS=allSS.concat(c.sameSupplier);});
  var totalRoi=+(Object.values(comparisons||{}).reduce(function(s,c){return s+(c?c.roiK:0);},0)*(S.roiFactor||0.5)).toFixed(0);

  var gapSummary=allSS.map(function(s){
    var cheaperCount=(s.comps||[]).filter(function(c){return c.avgP<s.compP;}).length;
    return {
      supplier:s.supplier,
      product:s.mainProduct||'',
      ourPrice:s.compP,
      marketBest:s.bestPrice,
      gapPerKg:s.overpayPerKg,
      gapPct:s.compP>0?+((s.compP-s.bestPrice)/s.compP*100).toFixed(1):0,
      annualOverpayK:+(s.overpayPerKg*s.compVolTons).toFixed(0),
      cheaperBuyers:cheaperCount
    };
  });

  var timingSummary=[];
  Object.entries(comparisons||{}).forEach(function(en){
    var cat=en[0],cmp=en[1];
    if(cmp&&cmp.timing){
      var idx=cmp.timing.timingIndex||1;
      timingSummary.push({
        category:cat,
        timingIndexVsMarket:+((idx-1)*100).toFixed(1),
        cheapestMonth:cmp.timing.cheapMonthName||'',
        savingPotentialK:cmp.timing.timingSaving||0
      });
    }
  });

  var yrLen=portfolio.yrData.length;
  var priceTrend=yrLen>=2?+(((portfolio.yrData[yrLen-1].avgP-portfolio.yrData[yrLen-2].avgP)/portfolio.yrData[yrLen-2].avgP)*100).toFixed(1):0;
  var volTrend=yrLen>=2?+(((portfolio.yrData[yrLen-1].volTons-portfolio.yrData[yrLen-2].volTons)/portfolio.yrData[yrLen-2].volTons)*100).toFixed(1):0;

  var topSup=portfolio.supData&&portfolio.supData.length?portfolio.supData[0]:null;
  var topSupShare=topSup&&portfolio.totVolTons?+((topSup.volTons/portfolio.totVolTons)*100).toFixed(1):0;

  var altOrigins=[];
  Object.values(comparisons||{}).forEach(function(c){if(c&&c.altOrigins)altOrigins=altOrigins.concat(c.altOrigins);});

  var data={
    company:name,
    healthScore:healthScore?{score:healthScore.total,grade:healthScore.grade,label:healthScore.label}:null,
    totalVolTons:portfolio.totVolTons,
    totalValMil:portfolio.totValMil,
    avgPrice:portfolio.avgP,
    priceTrendPct:priceTrend,
    volTrendPct:volTrend,
    topSupplier:topSup?{name:topSup.key,sharePct:topSupShare}:null,
    supplierGaps:gapSummary,
    timingAnalysis:timingSummary,
    altOrigins:altOrigins.slice(0,3),
    disappeared:portfolio.disappeared.slice(0,2),
    totalOverpayK:totalRoi
  };

  var prompt='당신은 Tridge 소싱 인텔리전스 전문가입니다. 아래 데이터를 \"데이터 분석 사고법\"에 따라 분석하여 핵심 발견 3개를 작성하세요.\n\n[데이터]\n'+JSON.stringify(data,null,2)+'\n\n[분석 사고법 — 반드시 준수]\n1. 절대값 금지: 단가 자체가 아닌 \"시장 대비 상대 위치(격차 = 귀사단가÷시장단가-1)\"로 서술하라. 예) \"$5.92/kg\" 대신 \"시장 평균 대비 +12.3% 초과 지불\"\n2. 시장 공통 요인 통제: 단가 상승이 시장 전체 현상인지, 귀사만의 문제인지 구분하라. 격차가 벌어진 것이 핵심이지 절대 단가 변동이 아니다.\n3. Skeptic Test 통과: 각 발견에 \"그냥 원자재 가격 때문 아냐?\", \"싼 등급으로 갈아탄 거 아냐?\" 반박을 스스로 차단하는 근거를 포함하라.\n4. 메커니즘 분해: 결과(격차)만이 아니라 원인(공급사 집중도 변화, 원산지 편중, 타이밍 패턴)을 밝혀라.\n5. 판단 기준 적용:\n   - 격차 5% 미만: 정상 범위\n   - 격차 5~15%: 협상 레버리지 존재, 즉시 검토 필요\n   - 격차 15% 이상: 구조적 문제, 긴급 재협상\n   - 공급사 1개 비중 70% 이상: 리스크 경고\n   - 타이밍 최저가 시즌 대비 2개월 이상 늦음: 구조적 타이밍 손실\n6. 완결 문장: 각 finding은 ① 상대 수치 근거 → ② 시장 맥락 해석 → ③ 구체적 액션으로 완결된 하나의 문장\n7. JSON 외 출력 금지\n\n[판단 불가 시]: 데이터가 부족해 격차를 계산할 수 없으면 \"데이터 부족\"이라고 text에 명시하고 color는 \"amber\"로\n\n[출력 형식]\n{"findings":[{"icon":"...","color":"...","text":"..."},{"icon":"...","color":"...","text":"..."},{"icon":"...","color":"...","text":"..."}]}';

  try{
    var headers={'Content-Type':'application/json','anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'};
    if(apiKey)headers['x-api-key']=apiKey;
    var controller=new AbortController();
    var timeout=setTimeout(function(){controller.abort();},60000);
    var res=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',signal:controller.signal,headers:headers,
      body:JSON.stringify({
        model:'claude-sonnet-4-6',
        max_tokens:2000,
        messages:[{role:'user',content:prompt}]
      })
    });
    clearTimeout(timeout);
    var d=await res.json();
    var txt=(d.content&&d.content[0]&&d.content[0].text)||'';
    var parsed=JSON.parse(txt.replace(/```json|```/g,'').trim());
    if(parsed.findings&&parsed.findings.length)return parsed.findings.slice(0,3);
    return computeFindingsFallback(portfolio,comparisons,healthScore);
  }catch(e){
    return computeFindingsFallback(portfolio,comparisons,healthScore);
  }
}

function computePayback(annualSavingK,tridgeCostK){
  var monthly=annualSavingK/12;var points=[];var breakeven=null;
  for(var m=0;m<=12;m++){var cum=monthly*m;var net=cum-tridgeCostK;points.push({month:m,cumSaving:+cum.toFixed(0),net:+net.toFixed(0),cost:tridgeCostK});if(breakeven===null&&net>=0&&m>0)breakeven=m;}
  return {points:points,breakeven:breakeven,monthlySaving:+monthly.toFixed(1)};
}

async function callClaude(portfolio,comparisons,companyName,apiKey,companyMemo,healthScore){
  // ── 공급사 갭 (카테고리별 상세 + 경쟁사 수 포함)
  var gaps=[];
  Object.entries(comparisons||{}).forEach(function(en){
    var cat=en[0],cmp=en[1];
    if(cmp&&cmp.sameSupplier&&cmp.sameSupplier.length){
      cmp.sameSupplier.forEach(function(s){
        var cheaperCount=(s.comps||[]).filter(function(c){return c.avgP<s.compP;}).length;
        gaps.push({
          category:cat,
          supplier:s.supplier,
          ourPrice:'$'+s.compP+'/kg',
          marketBest:'$'+s.bestPrice+'/kg',
          gapPerKg:'$'+s.overpayPerKg+'/kg',
          gapPct:s.compP>0?+(((s.compP-s.bestPrice)/s.compP)*100).toFixed(1)+'%':'N/A',
          ourVolTons:s.compVolTons,
          annualOverpayK:+(s.overpayPerKg*s.compVolTons).toFixed(0),
          cheaperBuyerCount:cheaperCount+'개 업체가 더 낮은 단가로 구매 중',
          mainProduct:s.mainProduct||''
        });
      });
    }
  });

  // ── 타이밍 (구체적 월명 + 시장대비 지수 포함)
  var timingNotes=[];
  Object.entries(comparisons||{}).forEach(function(en){
    var cat=en[0],cmp=en[1];
    if(cmp&&cmp.timing&&cmp.timing.timingSaving>0){
      var idx=cmp.timing.timingIndex||1;
      var pct=+((idx-1)*100).toFixed(1);
      timingNotes.push({
        category:cat,
        ourBuyingSeasonIndex:idx,
        vsMarketAvg:(pct>=0?'+':'')+pct+'% (시장평균 대비 우리 구매 시점)',
        cheapestMonth:cmp.timing.cheapMonthName||'',
        expensiveMonth:cmp.timing.expMonthName||'',
        timingSavingK:cmp.timing.timingSaving,
        interpretation:pct>5?'비싼 시점에 집중 구매 — 시즌 조정으로 협상 없이 절감 가능':
                       pct<-5?'유리한 타이밍에 구매 중 — 강점으로 활용 가능':
                       '시장 평균과 유사한 타이밍'
      });
    }
  });

  // ── 원산지별 단가 비교
  var origDetails=[];
  Object.entries(comparisons||{}).forEach(function(en){
    var cat=en[0],cmp=en[1];
    if(cmp&&cmp.origComp&&cmp.origComp.length){
      cmp.origComp.filter(function(o){return o.mAvg;}).forEach(function(o){
        origDetails.push({
          category:cat,
          origin:o.orig,
          ourAvgPrice:'$'+o.cAvg+'/kg',
          marketAvgPrice:'$'+o.mAvg+'/kg',
          diff:o.cAvg>o.mAvg?'+'+(o.cAvg-o.mAvg).toFixed(3)+'/kg 초과':
               (o.mAvg-o.cAvg).toFixed(3)+'/kg 유리'
        });
      });
    }
  });

  // ── 카테고리별 ROI 순위
  var roiByCategory=[];
  Object.entries(comparisons||{}).forEach(function(en){
    var cat=en[0],cmp=en[1];
    if(cmp&&cmp.roiK>0)roiByCategory.push({category:cat,roiK:+(cmp.roiK*(S.roiFactor||0.5)).toFixed(0)});
  });
  roiByCategory.sort(function(a,b){return b.roiK-a.roiK;});

  // ── 공급사 집중도
  var supConcentration=[];
  if(portfolio.supData&&portfolio.supData.length){
    var totalVol=portfolio.totVolTons||1;
    portfolio.supData.slice(0,3).forEach(function(s){
      supConcentration.push({supplier:s.key,sharePct:+((s.volTons/totalVol)*100).toFixed(1)+'%',volTons:s.volTons});
    });
  }

  var totalRoi=+(Object.values(comparisons||{}).reduce(function(s,c){return s+(c?c.roiK:0);},0)*(S.roiFactor||0.5)).toFixed(0);

  var summary={
    company:companyName,
    healthScore:healthScore?healthScore.total+'점 ('+healthScore.grade+'등급, '+healthScore.label+')':'N/A',
    totalVolTons:portfolio.totVolTons,
    totalValMil:portfolio.totValMil,
    avgPrice:'$'+portfolio.avgP+'/kg',
    topCategories:portfolio.hsData.slice(0,3).map(function(d){return d.key+'(물량비중 '+d.pct+'%)'}),
    topProducts:portfolio.prodData?portfolio.prodData.slice(0,5).map(function(d){return d.key+'('+d.volTons+'t)'}): [],
    yearTrend:portfolio.yrData.map(function(d){return d.year+'년: '+d.volTons+'t / 평균단가 $'+d.avgP+'/kg';}),
    supplierConcentration:supConcentration,
    disappeared:portfolio.disappeared.map(function(d){return d.product+'('+d.lastYear+'년 이후 미수입)'}),
    supplierPriceGaps:gaps,
    timingAnalysis:timingNotes,
    originComparison:origDetails,
    roiByCategory:roiByCategory,
    totalEstimatedOverpayK:totalRoi
  };

  var memoSection=companyMemo?'\n\n[영업담당자 메모]\n'+companyMemo:'';

  var prompt='당신은 Tridge 소싱 인텔리전스 전문가이자 McKinsey급 전략 컨설턴트입니다.\n아래 실제 거래 데이터를 \"데이터 분석 사고법\"에 따라 분석하여 B2B 영업 미팅 준비 자료를 작성하세요.\n\n[분석 데이터]\n'+JSON.stringify(summary,null,2)+memoSection+'\n\n[데이터 분석 사고법 — 반드시 준수]\n핵심 원칙: 절대값이 아닌 시장 대비 상대 위치(격차)를 측정하라.\n\n격차 공식: (귀사 단가 ÷ 시장 평균 단가) - 1\n- 양수 = 시장보다 비싸게 구매 (열위)\n- 음수 = 시장보다 싸게 구매 (우위)\n\n판단 기준:\n- 격차 5% 미만 → 정상 범위\n- 격차 5~15% → 협상 레버리지 존재, 즉시 검토 필요  \n- 격차 15% 이상 → 구조적 문제, 긴급 재협상\n- 공급사 1개 집중도 70% 이상 → 리스크 경고\n- 구매 타이밍 최저가 대비 2개월 이상 늦음 → 구조적 타이밍 손실\n\nSceptic Test (각 인사이트마다 통과해야 함):\n- \"그냥 시장 전체가 올라서 아냐?\" → 격차가 벌어졌는지로 반박\n- \"싼 등급으로 갈아탄 거 아냐?\" → 동일 품목 기준임을 명시\n- \"소량 거래 이상치 아냐?\" → 물량 가중 평균 기준임을 명시\n\n메커니즘 분해: 결과(격차)만이 아니라 왜 그런지(공급사 집중, 원산지 편중, 타이밍 패턴)를 반드시 밝혀라.\n\n정직성 원칙: 인과를 단언하지 말고 \"시장 대비 관측됨\"으로 표현하라. 데이터가 부족한 항목은 추정임을 명시.\n\n[작성 규칙]\n- 모든 문장은 ① 상대 수치 근거 → ② 시장 맥락 해석 → ③ 구체적 실행 액션 순서로 완결\n- \"검토 필요\", \"모니터링 권장\" 같은 모호한 표현 금지 — 무엇을 언제 어떻게 해야 하는지 명확히\n- 회사명('+companyName+')을 직접 언급하여 맞춤형으로 작성\n- 절감액은 반드시 \"시장 평균 대비, 해당 기간 기준\"으로 라벨링\n- 문장은 반드시 완결 (절대 끊기지 않게)\n- JSON 외 어떤 텍스트도 출력하지 말 것\n\n[출력 형식 — 반드시 이 JSON 구조만]\n{\n  "insights": [\n    "인사이트1: 시장 대비 격차 수치 → 시장 맥락(공통요인 통제) → 구체적 액션. 완결.",\n    "인사이트2: 동일 구조",\n    "인사이트3: 동일 구조",\n    "인사이트4: 동일 구조"\n  ],\n  "opening": "오프닝 멘트: 절대값이 아닌 시장 대비 위치로 흥미를 유발. 방어적 반응 없이 데이터 기반 호기심 자극. 완결.",\n  "questions": [\n    "질문1: 현재 소싱 의사결정 구조 파악용 열린 질문",\n    "질문2: 공급사 협상 이력·타이밍 전략 관련",\n    "질문3: 대안 소싱·원산지 다변화 관련"\n  ],\n  "caution": "미팅 주의사항: 구체적 상황과 대응 방식까지 완결된 문장"\n}';

  try{
    var headers={'Content-Type':'application/json','anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'};
    if(apiKey)headers['x-api-key']=apiKey;
    var controller=new AbortController();
    var timeout=setTimeout(function(){controller.abort();},120000);
    var res=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',signal:controller.signal,headers:headers,
      body:JSON.stringify({
        model:'claude-sonnet-4-6',
        max_tokens:3000,
        messages:[{role:'user',content:prompt}]
      })
    });
    clearTimeout(timeout);
    var data=await res.json();
    var txt=(data.content&&data.content[0]&&data.content[0].text)||'';
    var result=JSON.parse(txt.replace(/```json|```/g,'').trim());
    result._prompt=prompt;
    return result;
  }catch(e){
    return localInsights(portfolio,comparisons,companyName,prompt,companyMemo,healthScore);
  }
}

function localInsights(portfolio,comparisons,companyName,promptTxt,companyMemo,healthScore){
  var name=companyName||'해당 업체';var allSS=[];Object.values(comparisons||{}).forEach(function(c){if(c&&c.sameSupplier)allSS=allSS.concat(c.sameSupplier);});
  var totalRoi=+(Object.values(comparisons||{}).reduce(function(s,c){return s+(c?c.roiK:0);},0)*(S.roiFactor||0.5)).toFixed(0);
  var insights=[];
  if(portfolio.yrData.length>=2){var last=portfolio.yrData[portfolio.yrData.length-1],prev=portfolio.yrData[portfolio.yrData.length-2];var vc=prev.volTons>0?+(((last.volTons-prev.volTons)/prev.volTons)*100).toFixed(0):0;var pc=prev.avgP>0?+(((last.avgP-prev.avgP)/prev.avgP)*100).toFixed(0):0;if(Math.abs(vc)>3)insights.push(last.year+'년 수입 물량이 전년 대비 '+(vc>0?'+':'')+vc+'%. '+(vc>0?'성장세 지속으로 소싱 체계화가 필요한 시점':'성장 둔화 — 원가 최적화로 수익성 방어가 핵심')+'이에요.');if(pc>5)insights.push('평균 수입 단가가 '+pc+'% 상승했어요. 소싱 최적화 없이는 수익성 압박이 계속될 구조예요.');}
  if(allSS.length>0){var best=allSS[0];insights.push(best.supplier+' 동일 공급사에서 경쟁사 $'+best.bestPrice+'/kg, '+name+' $'+best.compP+'/kg — 볼륨 기반 협상력 강화만으로도 즉시 절감 가능해요.');}
  var bestTiming=null;Object.values(comparisons||{}).forEach(function(cmp){if(cmp&&cmp.timing&&cmp.timing.timingSaving>5){if(!bestTiming||cmp.timing.timingSaving>bestTiming.timingSaving)bestTiming=cmp.timing;}});
  if(bestTiming)insights.push('구매 타이밍이 시장 평균보다 '+Math.round((bestTiming.timingIndex-1)*100)+'% 비싼 시점에 몰려 있어요. 최저가 시즌인 '+bestTiming.cheapMonthName+'으로 매수를 옮기면 협상 없이 연 $'+bestTiming.timingSaving+'K 절감이 가능해요.');
  if(totalRoi>0&&insights.length<4)insights.push('전체 데이터 기준 연간 약 $'+totalRoi+'K(≈'+Math.round(totalRoi*1.35/10)*10+'백만원) 절감 기회. Tridge 구독료 대비 수십 배 ROI예요.');
  var opening=name+'의 수입 데이터를 살펴보니 흥미로운 패턴이 있었어요. '+(allSS.length>0?'현재 사용 중인 공급사에서 동일한 물건을 더 저렴하게 구매하는 업체들이 시장에 있더라고요. ':'소싱 구조에서 개선 포인트가 몇 가지 보였어요. ')+'오늘은 설득하러 온 게 아니라, 데이터로 확인된 것들을 같이 한번 보시자는 취지로 왔습니다.';
  var questions=['현재 주요 공급사와 단가 협상을 마지막으로 하신 게 언제인가요? 시장 실거래가를 근거로 재협상하면 유리한 위치에 서실 수 있어요.','연중 어느 시기에 주로 매수하시나요? 시장 단가가 낮은 시즌을 데이터로 짚어드릴 수 있어요.','새로운 원산지나 공급사를 최근에 검토해 보신 적 있으신가요? 미활용 소싱 루트가 시장에 존재합니다.'];
  return {insights:insights.slice(0,4),opening:opening,questions:questions,caution:'경쟁사 실명과 구체적 단가를 직접 언급하면 방어적 반응이 생길 수 있어요. "시장 데이터상 이런 패턴이 있어요"처럼 간접 접근이 효과적이에요.',_local:true,_prompt:promptTxt};
}


var charts={};
// roiFactor 적용된 절감액 계산
function getTotalRoi(){
  var raw=Object.values(S.comparisons||{}).reduce(function(s,c){return s+(c?c.roiK:0);},0);
  return +(raw*(S.roiFactor||0.5)).toFixed(0);
}
function getRawTotalRoi(){
  return Object.values(S.comparisons||{}).reduce(function(s,c){return s+(c?c.roiK:0);},0);
}
