
const APP_VERSION='web-1.3.0';
const TESTS=[
{id:'cpt',runner:'attention',runnerTest:'cpt',name:'CPT',desc:'Attention soutenue, omissions, commissions et variabilité des temps de réponse.',time:'≈14 min',evidence:'A/B'},
{id:'mcst',runner:'attention',runnerTest:'mcst',name:'MCST',desc:'Flexibilité cognitive, changement de règle, erreurs et persévérations.',time:'≈6 min',evidence:'B'},
{id:'corsi',runner:'neuro',runnerTest:'corsi',name:'Corsi',desc:'Mémoire visuospatiale immédiate puis manipulation en ordre inverse.',time:'≈4 min',evidence:'B'},
{id:'digits',runner:'neuro',runnerTest:'digits',name:'Empan de chiffres',desc:'Mémoire auditivo-verbale directe puis mémoire de travail en ordre inverse.',time:'≈5 min',evidence:'B'},
{id:'stroop',runner:'neuro',runnerTest:'stroop',name:'Stroop',desc:'Inhibition d’une réponse dominante et coût de l’interférence couleur-mot.',time:'≈6 min',evidence:'B'},
{id:'tapping',runner:'neuro',runnerTest:'tapping',name:'Tapping',desc:'Régularité temporelle puis vitesse répétitive maximale des deux mains.',time:'≈5 min',evidence:'C / B contexte'},
{id:'fitts',runner:'visuo',runnerTest:'point',name:'Pointage Fitts',desc:'Efficience du geste dirigé à la souris selon taille et distance de la cible.',time:'≈3 min',evidence:'B'},
{id:'steering',runner:'visuo',runnerTest:'trace',name:'Steering',desc:'Compromis vitesse–précision à la souris dans des tunnels droits de 28 à 7 px.',time:'≈3 min',evidence:'B méthodo'},
{id:'dots',runner:'visuo',runnerTest:'dots',name:'Dots',desc:'Inhibition spatiale et attention alternée entre deux règles de réponse.',time:'≈6 min',evidence:'B'}
];
let session=createSession();let activeTest=null;let suppressUnload=false;
function uid(){return 'sess-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8)}
function createSession(){return{schemaVersion:'neuro-observation-session-1',appVersion:APP_VERSION,sessionId:uid(),startedAt:new Date().toISOString(),participant:{id:'',age:10,sex:'M',context:'',dominantHand:'droite'},completedTests:[],tests:{},analysisProfile:[],sessionAnalysis:{}}}
const $=id=>document.getElementById(id);const fmt=(v,d=0)=>Number.isFinite(+v)?(+v).toFixed(d).replace('.',','):'—';
function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function syncParticipant(){session.participant={id:$('pid').value.trim()||'-',age:10,sex:$('sex').value,context:$('context').value.trim(),dominantHand:$('hand').value}}
function hash(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function formFor(test){const n=(TESTS.find(x=>x.id===test)?.runner==='visuo')?4:3;return String.fromCharCode(65+(hash(session.sessionId+'|'+test)%n))}
function render(){syncParticipant();renderCards();renderProgress();renderSessionAnalysis();}
function renderCards(){const g=$('testsGrid');g.innerHTML=TESTS.map((t,i)=>{const done=!!session.tests[t.id];return `<article class="testcard ${done?'done':''}"><div class="testhead"><span class="num">${String(i+1).padStart(2,'0')}</span><span class="status">${done?'TERMINÉ':'À PASSER'}</span></div><h3>${escapeHtml(t.name)}</h3><p class="summary2">${escapeHtml(t.desc)}</p><div class="meta">${t.time} · ${escapeHtml(t.evidence)}</div><div class="cardactions">${done?`<button onclick="showResult('${t.id}')">Voir résultat</button><button class="secondary" onclick="launchTest('${t.id}',true)">Refaire</button>`:`<button onclick="launchTest('${t.id}')">Passer le test</button>`}</div></article>`}).join('')}
function renderProgress(){const n=session.completedTests.length;$('doneCount').textContent=`${n} / ${TESTS.length}`;$('progressFill').style.width=`${100*n/TESTS.length}%`;const b=$('downloadBtn');b.textContent=`Télécharger JSON · ${n}/${TESTS.length}`;b.disabled=n===0}
function launchTest(id,redo=false){syncParticipant();if(redo&&!confirm('Refaire cette épreuve ? Le nouveau résultat remplacera le précédent dans la séance.'))return;const t=TESTS.find(x=>x.id===id);if(!t)return;activeTest=id;const q=new URLSearchParams({runner:'1',test:t.runnerTest,pid:session.participant.id,sex:session.participant.sex,cond:session.participant.context,hand:session.participant.dominantHand,form:formFor(id),session:session.sessionId});$('frame').src=`runners/${t.runner}.html?${q}`;$('overlayTitle').textContent=t.name+' · forme '+formFor(id);$('testOverlay').classList.add('on');document.body.style.overflow='hidden'}
function closeTest(){if(!activeTest)return;if(confirm('Quitter cette épreuve ? Les essais de l’épreuve en cours ne seront pas conservés.')){closeOverlay()}}
function closeOverlay(){activeTest=null;$('frame').src='about:blank';$('testOverlay').classList.remove('on');document.body.style.overflow=''}
window.addEventListener('message',e=>{const m=e.data;if(!m||m.app!=='neuro-observation-web')return;if(m.type==='test-complete'){const id=activeTest;if(!id)return;session.tests[id]={testId:id,name:TESTS.find(x=>x.id===id).name,completedAt:new Date().toISOString(),form:formFor(id),...m.payload};if(!session.completedTests.includes(id))session.completedTests.push(id);rebuildProfile();closeOverlay();render();showResult(id);toast(`${TESTS.find(x=>x.id===id).name} enregistré dans la séance`)}else if(m.type==='test-cancelled'){closeOverlay()}});
function rebuildProfile(){
  session.analysisProfile=Object.values(session.tests).flatMap(x=>Array.isArray(x.analysisProfile)?x.analysisProfile:[]);
  session.functionalAnalysis=computeFunctionalAnalysis();
  session.sessionAnalysis=computeSessionAnalysis()
}
function mean(a){const x=(a||[]).filter(Number.isFinite);return x.length?x.reduce((s,v)=>s+v,0)/x.length:null}
function pctDelta(a,b){return Number.isFinite(a)&&Number.isFinite(b)&&b!==0?100*(a-b)/Math.abs(b):null}
function findProfile(id){return session.analysisProfile.find(x=>x.id===id)}
function refPosition(id){const m=findProfile(id);if(!m||!m.reference||m.reference.comparable!==true||!Number.isFinite(+m.reference.mean)||!Number.isFinite(+m.reference.sd)||+m.reference.sd<=0||!Number.isFinite(+m.value))return null;const z=(+m.value-+m.reference.mean)/+m.reference.sd;return{id,label:m.label,value:+m.value,unit:m.unit||'',z,mean:+m.reference.mean,sd:+m.reference.sd,age:m.reference.age||'',direction:m.direction||'neutral',evidence:m.evidence||'',source:m.source||'',band:Math.abs(z)<1.5?'dans_le_repere':z>=1.5?'au_dessus_du_repere':'au_dessous_du_repere'}}
function addMetric(arr,id,label,value,unit,evidence,paradigm,note='',details=null){if(value===null||value===undefined||(typeof value==='number'&&!Number.isFinite(value)))return;arr.push({id,label,value,unit,evidence,paradigm,note,details})}
function computeFunctionalAnalysis(){
  const metrics=[],observations=[],adjustments=[],quality=[];
  const t=session.tests;

  // 1–4 CPT : attente + évolution tardive. Contrastes descriptifs, pas seuils cliniques.
  const cpt=t.cpt?.result;
  if(cpt){
    const byIsi=Object.fromEntries((cpt.byIsi||[]).map(x=>[+x.isi,x]));
    const i1=byIsi[1000],i4=byIsi[4000];
    if(i1&&i4){
      addMetric(metrics,'cpt.waiting_rt_cost','CPT — coût RT attente 4 s − 1 s',i4.rt-i1.rt,'ms','B développemental','cpt','L’ISI module le RT dans la référence Conners.');
      addMetric(metrics,'cpt.waiting_rt_relative','CPT — coût relatif de l’attente',pctDelta(i4.rt,i1.rt),'%','C','cpt','Contraste intra-individuel 4 s vs 1 s.');
      addMetric(metrics,'cpt.waiting_variability_ratio','CPT — ratio variabilité 4 s / 1 s',i1.sd?i4.sd/i1.sd:null,'ratio','B développemental','cpt','L’ISI module aussi la variabilité des RT.');
    }
    const b=cpt.blocks||[];
    if(b.length>=6){
      const mid=b.filter(x=>[2,3].includes(+x.b)),late=b.filter(x=>[5,6].includes(+x.b));
      const midRt=mean(mid.map(x=>+x.rt)),lateRt=mean(late.map(x=>+x.rt));
      const midCv=mean(mid.map(x=>+x.cv)),lateCv=mean(late.map(x=>+x.cv));
      addMetric(metrics,'cpt.late_rt_shift','CPT — évolution tardive du RT',Number.isFinite(midRt)&&Number.isFinite(lateRt)?lateRt-midRt:null,'ms','C','cpt','Moyenne blocs 5–6 moins blocs 2–3 ; la dynamique temporelle publiée est non linéaire.');
      addMetric(metrics,'cpt.late_cv_shift','CPT — évolution tardive de la variabilité',Number.isFinite(midCv)&&Number.isFinite(lateCv)?lateCv-midCv:null,'CV','C','cpt','Moyenne blocs 5–6 moins blocs 2–3.');
    }
  }

  // 5–8 Dots : changement de règle, exactitude, inhibition stable, asymétrie du switch.
  const dots=t.dots?.result;
  if(dots){
    addMetric(metrics,'dots.switch_rt_cost','Dots — coût local de switch RT',+dots.switchCost,'ms','B développemental','task_switching','Switch moins stay dans le même bloc Mixed.');
    addMetric(metrics,'dots.switch_error_cost','Dots — coût local de switch exactitude',+dots.errorCost,'points','B développemental','task_switching','Différence de taux d’erreur switch − stay.');
    addMetric(metrics,'dots.stable_inhibition_rt_cost','Dots — coût inhibition stable',+dots.steadyInhibitionCostRT,'ms','B développemental','task_switching','Incongruent − Congruent dans les blocs stables.');
    const sc=dots.cells?.switchCong?.rt,si=dots.cells?.switchInc?.rt;
    addMetric(metrics,'dots.switch_rule_asymmetry','Dots — asymétrie switch vers même vs opposé',Number.isFinite(+sc)&&Number.isFinite(+si)?+sc-+si:null,'ms','C','task_switching','Décomposition secondaire ; positive = switch vers règle congruente plus lent.',{switchCongruent:sc,switchIncongruent:si});
  }

  // 9–10 MCST : coût de transition et réussite juste après changement.
  const mc=t.mcst?.result;
  if(mc){
    addMetric(metrics,'mcst.change_rt_cost','MCST — coût temporel après changement',+mc.coutChangement,'ms','C','mcst','RT après changement moins RT stable.');
    const sw=(mc.trials||[]).filter(x=>x.justAfterSwitch===true);
    if(sw.length)addMetric(metrics,'mcst.post_change_error_rate','MCST — erreurs juste après changement',100*sw.filter(x=>!x.correct).length/sw.length,'%','C','mcst','Part des essais immédiatement post-changement incorrects.',{n:sw.length});
  }

  // 11–13 Stroop : coût relatif, coût d’erreur, gradient orthographique.
  const st=t.stroop?.result;
  if(st){
    const b=st.byCond?.baseline,w=st.byCond?.wordIncong,fl=st.byCond?.firstlastIncong,sc=st.byCond?.scrambledIncong;
    if(b&&w){
      addMetric(metrics,'stroop.relative_interference','Stroop — interférence relative',pctDelta(w.rt,b.rt),'%','C','stroop','Surcoût incongruent rapporté à la vitesse de base.');
      addMetric(metrics,'stroop.interference_error_cost','Stroop — coût d’erreur incongruent',100*((w.errRate||0)-(b.errRate||0)),'points','B contexte','stroop','Erreur incongruente moins baseline ; vitesse et exactitude doivent être lues ensemble.');
    }
    if(b&&w&&fl&&sc){
      const vals={word:w.rt-b.rt,firstLast:fl.rt-b.rt,scrambled:sc.rt-b.rt};
      const range=Math.max(...Object.values(vals))-Math.min(...Object.values(vals));
      addMetric(metrics,'stroop.orthographic_interference_range','Stroop — amplitude du gradient orthographique',range,'ms','C','stroop','Écart entre les trois formes d’interférence orthographique.',vals);
    }
  }

  // 14 Corsi : coût de manipulation + positions normatives quand comparables.
  const co=t.corsi?.result;
  if(co)addMetric(metrics,'corsi.manipulation_cost','Corsi — coût direct − inverse',+co.direct-+co.inverse,'empan','C','corsi','Contraste stockage vs manipulation visuospatiale.');

  // 15 Chiffres : coût de manipulation sur empan et score continu.
  const dg=t.digits?.result;
  if(dg)addMetric(metrics,'digits.manipulation_cost','Chiffres — coût direct − inverse',+dg.direct-+dg.inverse,'empan','C','digit_span_audio','Contraste stockage vs manipulation verbale.',{continuousCost:Number.isFinite(+dg.totalDirect)&&Number.isFinite(+dg.totalInverse)?+dg.totalDirect-+dg.totalInverse:null});

  // Repères normatifs génériques déjà validés dans analysisProfile : z descriptif uniquement.
  const referencePositions=session.analysisProfile.map(x=>refPosition(x.id)).filter(Boolean);

  // Qualité : empêche l’interprétation de métriques défaillantes.
  if(t.steering?.result?.quality?.interpretable===false)quality.push({test:'steering',severity:'exclude',text:'Steering non interprétable : la relation difficulté–temps n’atteint pas le contrôle qualité.'});

  // Observations déterministes. Les seuils ci-dessous servent uniquement à éviter d’afficher du bruit ; ce ne sont pas des seuils cliniques.
  const get=id=>metrics.find(x=>x.id===id)?.value;
  const dotsRel=Number.isFinite(get('dots.switch_rt_cost'))&&dots?.rtStay?100*get('dots.switch_rt_cost')/dots.rtStay:null;
  const mcRel=Number.isFinite(get('mcst.change_rt_cost'))&&mc?.rtStable?100*get('mcst.change_rt_cost')/mc.rtStable:null;
  if((Number.isFinite(dotsRel)&&dotsRel>=8)||(Number.isFinite(mcRel)&&mcRel>=15)){
    const support=[];if(Number.isFinite(dotsRel)&&dotsRel>=8)support.push(`Dots +${Math.round(get('dots.switch_rt_cost'))} ms`);if(Number.isFinite(mcRel)&&mcRel>=15)support.push(`MCST +${Math.round(get('mcst.change_rt_cost'))} ms`);
    observations.push({id:'transition_cost',title:'Les changements de règle demandent une réorganisation',confidence:support.length>=2?'convergente':'à confirmer',text:support.length>=2?'Deux épreuves différentes montrent un coût au moment de changer de règle, alors que les performances stables peuvent rester efficaces.':'Une épreuve montre un coût mesurable au moment du changement de règle.',support});
    adjustments.push({id:'transition_preview',forObservation:'transition_cost',text:'À essayer : annoncer les transitions, nommer explicitement la nouvelle règle et éviter de changer plusieurs paramètres en même temps.',observe:'Observer si le temps de reprise, l’agitation ou les erreurs diminuent.'});
  }

  if(cpt&&Number.isFinite(get('cpt.waiting_rt_relative'))&&get('cpt.waiting_rt_relative')>=45&&Number.isFinite(get('cpt.waiting_variability_ratio'))&&get('cpt.waiting_variability_ratio')>=1.5){
    observations.push({id:'waiting_sensitivity',title:'Les temps d’attente semblent augmenter le coût attentionnel',confidence:'à confirmer',text:'Lorsque l’intervalle entre stimuli s’allonge, le temps de réponse et sa variabilité augmentent ensemble. L’effet d’ISI est attendu en population générale ; ici l’intérêt est son amplitude intra-individuelle.',support:[`RT 4s−1s +${Math.round(get('cpt.waiting_rt_cost'))} ms`,`variabilité ×${fmt(get('cpt.waiting_variability_ratio'),2)}`]});
    adjustments.push({id:'active_waiting',forObservation:'waiting_sensitivity',text:'À essayer : réduire les temps morts non structurés, annoncer quand l’action va commencer ou donner un repère simple pendant l’attente.',observe:'Observer si les rappels, réponses précipitées ou décrochages diminuent.'});
  }

  const stBase=referencePositions.find(x=>x.id==='stroop.baseline_rt'),stInt=referencePositions.find(x=>x.id==='stroop.word_interference'),stErr=referencePositions.find(x=>x.id==='stroop.incongruent_error');
  if(stBase&&stBase.z>=1.5&&stInt&&Math.abs(stInt.z)<1.5&&(!stErr||stErr.z<=1.5)){
    observations.push({id:'general_slowness_not_interference',title:'Ralentissement général plutôt que coût sélectif d’interférence',confidence:'soutenue',text:'La vitesse de base est plus lente que le repère publié, mais le surcoût dû au conflit reste dans le repère et l’exactitude est préservée.',support:[`baseline z=${fmt(stBase.z,1)}`,`interférence z=${fmt(stInt.z,1)}`]});
    adjustments.push({id:'time_without_overhelp',forObservation:'general_slowness_not_interference',text:'À essayer : laisser un peu plus de temps de réponse sans multiplier les relances quand la consigne est comprise.',observe:'Observer si la précision reste bonne et si la tension diminue.'});
  }

  const corsiF=referencePositions.find(x=>x.id==='corsi.forward'),corsiB=referencePositions.find(x=>x.id==='corsi.backward');
  if(corsiF&&corsiB&&corsiF.z>=1.5&&corsiB.z>=1.5){
    observations.push({id:'visuospatial_strength',title:'La mémoire visuospatiale constitue un point d’appui',confidence:'soutenue',text:'Les empans direct et inverse se situent nettement au-dessus du repère publié et la manipulation ne fait pas chuter l’empan.',support:[`direct z=${fmt(corsiF.z,1)}`,`inverse z=${fmt(corsiB.z,1)}`]});
    adjustments.push({id:'visual_externalization',forObservation:'visuospatial_strength',text:'À essayer : rendre les étapes visibles — schéma, checklist, pictogrammes ou consigne laissée à l’écran — surtout dans les situations chargées.',observe:'Observer si cela réduit les demandes de répétition et facilite le retour à la tâche.'});
  }

  if(dots&&Number.isFinite(get('dots.switch_error_cost'))&&get('dots.switch_error_cost')>=5&&Number.isFinite(get('dots.switch_rt_cost'))&&get('dots.switch_rt_cost')<40){
    observations.push({id:'insufficient_slowing_under_switch',title:'La complexité semble davantage coûter en précision qu’en ralentissement',confidence:'à confirmer',text:'Lors des changements de règle, les erreurs augmentent alors que le ralentissement reste relativement limité. Cela peut correspondre à une compensation temporelle insuffisante.',support:[`erreurs +${fmt(get('dots.switch_error_cost'),1)} pts`,`RT +${Math.round(get('dots.switch_rt_cost'))} ms`]});
    adjustments.push({id:'micro_pause',forObservation:'insufficient_slowing_under_switch',text:'À essayer : installer une micro-pause avant l’action dans les situations changeantes (« je regarde → je choisis → j’agis »).',observe:'Observer si les erreurs impulsives diminuent sans conflit supplémentaire.'});
  }

  if(cpt&&Number.isFinite(get('cpt.late_cv_shift'))&&get('cpt.late_cv_shift')>=0.08){
    observations.push({id:'late_instability',title:'La stabilité devient plus variable en fin d’effort',confidence:'à confirmer',text:'La variabilité des temps de réponse augmente dans les derniers blocs par rapport au milieu de tâche.',support:[`ΔCV tardif ${fmt(get('cpt.late_cv_shift'),2)}`]});
    adjustments.push({id:'planned_breaks',forObservation:'late_instability',text:'À essayer : fractionner l’effort ou proposer une pause avant que la performance ne devienne irrégulière.',observe:'Observer si les erreurs, relances et signes d’agacement diminuent.'});
  }

  return{version:'functional-analysis-1.0',generatedAt:new Date().toISOString(),derivedMetrics:metrics,referencePositions,observations,adjustmentsToTry:adjustments,qualityFlags:quality,methodNote:'Calculs déterministes locaux. Les seuils d’affichage des observations sont des heuristiques de bruit, jamais des seuils diagnostiques ou cliniques.'}
}
function quick(id,r){if(!r)return{lead:'Aucun résultat.',metrics:[]};
 if(id==='cpt')return{lead:`${fmt(r.omPct,1)} % d’omissions, ${fmt(r.coPct,1)} % de commissions ; variabilité CV ${fmt(r.cv,2)}.`,metrics:[['RT moyen',fmt(r.rtMean)+' ms'],['Omissions',fmt(r.omPct,1)+' %'],['Commissions',fmt(r.coPct,1)+' %'],['d′',fmt(r.dprime,2)],['CV RT',fmt(r.cv,2)]]};
 if(id==='mcst')return{lead:`${r.cats??'—'} catégories complétées ; ${r.persev??'—'} erreurs persévératives sur ${r.totalErr??'—'} erreurs.`,metrics:[['Catégories',r.cats],['Erreurs totales',r.totalErr],['Persévérations',r.persev],['Conceptuel',fmt(r.conceptualPct,1)+' %'],['CE+',fmt(r.cePlus,1)]]};
 if(id==='corsi')return{lead:`Empan visuospatial direct ${r.direct}, inverse ${r.inverse} ; écart ${r.ecart}.`,metrics:[['Direct',r.direct],['Inverse',r.inverse],['Écart',r.ecart]]};
 if(id==='digits')return{lead:`Empan auditif direct ${r.direct}, inverse ${r.inverse}; scores continus ${r.totalDirect}/${r.totalInverse}.`,metrics:[['Direct',r.direct],['Inverse',r.inverse],['Correct direct',r.totalDirect],['Correct inverse',r.totalInverse]]};
 if(id==='stroop'){const b=r.byCond?.baseline?.rt,wi=r.byCond?.wordIncong?.rt;return{lead:`Exactitude globale ${fmt((r.accuracy||0)*100,1)} % ; coût mot incongruent vs baseline ${fmt(r.wordDiff)} ms.`,metrics:[['Baseline',fmt(b)+' ms'],['Mot incongruent',fmt(wi)+' ms'],['Coût',fmt(r.wordDiff)+' ms'],['Exactitude',fmt((r.accuracy||0)*100,1)+' %']]}}
 if(id==='tapping'){const a=r.regularity||{},s=r.speed||{};return{lead:`Régularité CV ${fmt(a.cvMoyen,2)} ; vitesse dominante ${fmt(s.dominant?.meanTaps,1)} frappes/10 s.`,metrics:[['CV régularité',fmt(a.cvMoyen,2)],['ITI moyen',fmt(a.itiMoyen)+' ms'],['Dominante',fmt(s.dominant?.meanTaps,1)],['Non dominante',fmt(s.nondominant?.meanTaps,1)]]}}
 if(id==='fitts')return{lead:`${fmt(r.hitRate,1)} % de cibles atteintes ; relation Fitts R²=${fmt(r.r2,2)}.`,metrics:[['Réussite',fmt(r.hitRate,1)+' %'],['RT moyen',fmt(r.rtMean)+' ms'],['Pente',fmt(r.slope)+' ms/ID'],['R²',fmt(r.r2,2)],['Trajectoire',fmt(r.pathEfficiencyMean,2)]]};
 if(id==='steering'){const ok=r.quality?.interpretable!==false;return ok?{lead:`Pilotage sur 12 passages ; relation Steering cohérente, R²=${fmt(r.regression?.r2,2)}.`,metrics:[['Pente',fmt(r.regression?.pente)+' ms/ID'],['R²',fmt(r.regression?.r2,2)],['Indice',fmt(r.regression?.ip,2)+' ID/s'],['Passages',r.passes?.length||0]]}:{lead:`Pilotage sur 12 passages ; relation Steering non interprétable (R²=${fmt(r.regression?.r2,2)}).`,metrics:[['Pente brute',fmt(r.regression?.pente)+' ms/ID'],['R²',fmt(r.regression?.r2,2)],['Qualité','non validée'],['Passages',r.passes?.length||0]]}};
 if(id==='dots')return{lead:`Coût de switch ${fmt(r.switchCost)} ms ; coût d’exactitude ${fmt(r.errorCost,1)} points dans le bloc Mixed.`,metrics:[['Congruent',fmt(r.blocks?.congruent?.rtMedian)+' ms'],['Incongruent',fmt(r.blocks?.incongruent?.rtMedian)+' ms'],['Mixed',fmt(r.blocks?.mixed?.rtMedian)+' ms'],['Switch',fmt(r.switchCost)+' ms'],['Erreur switch',fmt(r.errorCost,1)+' pts']]};
 return{lead:'Résultat disponible.',metrics:[]}}
function computeSessionAnalysis(){
  const completed=session.completedTests;const domains=[];
  if(completed.some(x=>['cpt','dots','stroop'].includes(x)))domains.push('attention / inhibition');
  if(completed.some(x=>['mcst','dots'].includes(x)))domains.push('flexibilité');
  if(completed.some(x=>['corsi','digits'].includes(x)))domains.push('mémoire de travail');
  if(completed.includes('tapping'))domains.push('rythme et vitesse motrice');
  if(completed.some(x=>['fitts','steering'].includes(x)))domains.push('contrôle visuomoteur');
  const notes=completed.map(id=>`${TESTS.find(t=>t.id===id).name} : ${quick(id,session.tests[id]?.result).lead}`);
  const fa=session.functionalAnalysis||{};
  return{completed:completed.length,domains,notes,remaining:TESTS.filter(t=>!session.tests[t.id]).map(t=>t.name),functionalObservations:fa.observations||[],adjustmentsToTry:fa.adjustmentsToTry||[],qualityFlags:fa.qualityFlags||[]}
}
function renderSessionAnalysis(){
  rebuildProfile();const a=session.sessionAnalysis;const box=$('sessionAnalysis');
  if(!a.completed){box.innerHTML='<div class="panel"><h2>Analyse de séance</h2><p class="muted">Elle se construira au fur et à mesure des épreuves. Aucun diagnostic ni score global n’est produit.</p></div><div class="panel"><h2>Données</h2><p class="muted">Les résultats restent uniquement en mémoire JavaScript jusqu’au rafraîchissement ou à la fermeture de cette page.</p></div>';return}
  const obs=a.functionalObservations||[],adj=a.adjustmentsToTry||[],q=a.qualityFlags||[];
  const functional=obs.length?`<div class="panel"><h2>Repères fonctionnels</h2>${obs.map(o=>`<div class="functional"><h3>${escapeHtml(o.title)}</h3><p>${escapeHtml(o.text)}</p><p class="muted">${escapeHtml(o.confidence)} · ${escapeHtml((o.support||[]).join(' · '))}</p>${adj.filter(x=>x.forObservation===o.id).map(x=>`<p><strong>${escapeHtml(x.text)}</strong><br><span class="muted">${escapeHtml(x.observe)}</span></p>`).join('')}</div>`).join('')}<p class="muted">Ces pistes sont des hypothèses à tester dans la vie quotidienne, pas des prescriptions ni des conclusions diagnostiques.</p></div>`:'';
  const quality=q.length?`<div class="panel"><h2>Qualité des mesures</h2><ul class="signals">${q.map(x=>`<li>${escapeHtml(x.text)}</li>`).join('')}</ul></div>`:'';
  box.innerHTML=`<div class="panel"><h2>Ce que la séance montre jusqu’ici</h2><p><strong>${a.completed}/${TESTS.length} épreuves terminées.</strong> Domaines documentés : ${escapeHtml(a.domains.join(', ')||'—')}.</p><ul class="signals">${a.notes.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul><p class="muted">Lecture descriptive et progressive : les métriques C/D ne sont pas transformées automatiquement en fragilité clinique.</p></div>${functional}${quality}<div class="panel"><h2>À compléter</h2>${a.remaining.length?`<p class="muted">Les conclusions restent partielles tant que ces épreuves ne sont pas passées :</p><p>${a.remaining.map(escapeHtml).join(' · ')}</p>`:'<p>Les 9 épreuves sont terminées. Le JSON contient l’ensemble des données et profils d’analyse.</p>'}<p class="muted">${session.analysisProfile.length} métriques structurées + ${session.functionalAnalysis?.derivedMetrics?.length||0} calculs fonctionnels disponibles dans le JSON.</p></div>`
}
function showResult(id){const t=TESTS.find(x=>x.id===id),pack=session.tests[id];if(!pack)return;const q=quick(id,pack.result);$('resultView').innerHTML=`<section class="resultview"><div class="eyebrow">Résultat enregistré</div><h2>${escapeHtml(t.name)}</h2><div class="panel"><h3>Analyse rapide</h3><p>${escapeHtml(q.lead)}</p><p class="muted">Cette lecture est descriptive. Les références, niveaux de preuve et données détaillées sont conservés dans l’export.</p></div><div class="metrics">${q.metrics.map(([k,v])=>`<div class="metric"><span>${escapeHtml(k)}</span><b>${escapeHtml(v)}</b></div>`).join('')}</div><details open><summary><strong>Données brutes de l’épreuve</strong></summary><pre class="raw">${escapeHtml(JSON.stringify(pack.result,null,2))}</pre></details><div class="cardactions" style="margin-top:12px"><button onclick="launchTest('${id}',true)">Refaire</button><button class="secondary" onclick="document.getElementById('testsGrid').scrollIntoView({behavior:'smooth'})">Retour aux tests</button></div></section>`;$('resultView').scrollIntoView({behavior:'smooth',block:'start'})}
function payload(){syncParticipant();rebuildProfile();return{...session,exportedAt:new Date().toISOString()}}
async function downloadJSON(){if(!session.completedTests.length)return false;const data=JSON.stringify(payload(),null,2);const safe=(session.participant.id||'session').replace(/[^a-z0-9_-]/gi,'_');const name=`batterie_${safe}_${new Date().toISOString().slice(0,10)}.json`;try{if(window.showSaveFilePicker){const h=await showSaveFilePicker({suggestedName:name,types:[{description:'JSON',accept:{'application/json':['.json']}}]});const w=await h.createWritable();await w.write(data);await w.close();toast('JSON enregistré');return true}}catch(e){if(e.name==='AbortError')return false}const blob=new Blob([data],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.style.display='none';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);toast('Téléchargement JSON lancé');return true}
async function copyJSON(){try{await navigator.clipboard.writeText(JSON.stringify(payload(),null,2));toast('JSON copié')}catch(e){toast('Copie bloquée par le navigateur')}}
function requestImportJSON(){
  if(session.completedTests.length&&!confirm('Importer une séance remplacera les résultats actuellement en mémoire. Continuer ?'))return;
  $('importJsonInput').click()
}
async function handleImportJSON(input){
  const file=input.files&&input.files[0];input.value='';if(!file)return;
  try{
    const text=await file.text();
    const data=JSON.parse(text);
    if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('Le fichier ne contient pas un objet JSON de séance.');
    if(!data.tests||typeof data.tests!=='object'||Array.isArray(data.tests))throw new Error('Le fichier ne contient pas de bloc tests exploitable.');
    const importedAge=data.participant?.age;
    if(importedAge!==undefined&&importedAge!==null&&Number(importedAge)!==10)throw new Error(`Cette version de l’application est paramétrée pour 10 ans ; le JSON indique ${importedAge} ans.`);
    const known=new Set(TESTS.map(t=>t.id));
    const importedTests={};
    for(const [id,pack] of Object.entries(data.tests))if(known.has(id)&&pack&&typeof pack==='object')importedTests[id]=pack;
    const idsFromFile=Array.isArray(data.completedTests)?[...new Set(data.completedTests.filter(id=>known.has(id)&&importedTests[id]))]:[];
    const completed=[...idsFromFile,...Object.keys(importedTests).filter(id=>!idsFromFile.includes(id))];
    if(!completed.length)throw new Error('Aucune des 9 épreuves reconnues n’est présente dans ce JSON.');
    const defaults=createSession();
    session={
      schemaVersion:data.schemaVersion||defaults.schemaVersion,
      appVersion:APP_VERSION,
      sessionId:data.sessionId||defaults.sessionId,
      startedAt:data.startedAt||defaults.startedAt,
      participant:{...defaults.participant,...(data.participant||{}),age:10},
      completedTests:completed,
      tests:importedTests,
      analysisProfile:[],
      sessionAnalysis:{},
      importedFrom:{fileName:file.name,originalAppVersion:data.appVersion||null,originalExportedAt:data.exportedAt||null,importedAt:new Date().toISOString()}
    };
    activeTest=null;$('frame').src='about:blank';$('testOverlay').classList.remove('on');document.body.style.overflow='';$('resultView').innerHTML='';
    $('pid').value=session.participant.id&&session.participant.id!=='-'?session.participant.id:'';
    $('sex').value=['M','F'].includes(session.participant.sex)?session.participant.sex:'M';
    $('context').value=session.participant.context||'';
    $('hand').value=['droite','gauche'].includes(session.participant.dominantHand)?session.participant.dominantHand:'droite';
    rebuildProfile();render();
    const unknown=Object.keys(data.tests).filter(id=>!known.has(id)).length;
    toast(`Séance importée · ${completed.length}/${TESTS.length} épreuves${unknown?` · ${unknown} entrée(s) ignorée(s)`:''}`);
    window.scrollTo({top:0,behavior:'smooth'});
  }catch(err){
    console.error(err);alert(`Import impossible : ${err.message||err}`)
  }
}
function openNewSession(){if(!session.completedTests.length){resetSession();return}$('newSessionDialog').showModal()}
function resetSession(){session=createSession();activeTest=null;$('frame').src='about:blank';$('testOverlay').classList.remove('on');$('resultView').innerHTML='';$('pid').value='';$('context').value='';$('sex').value='M';$('hand').value='droite';render();const d=$('newSessionDialog');if(d.open)d.close();window.scrollTo({top:0,behavior:'smooth'});toast('Nouvelle séance')}
async function downloadThenReset(){const ok=await downloadJSON();if(ok)resetSession()}
function toast(s){const el=$('toast');el.textContent=s;el.classList.add('on');clearTimeout(toast._t);toast._t=setTimeout(()=>el.classList.remove('on'),1800)}
window.addEventListener('beforeunload',e=>{if(suppressUnload||!session.completedTests.length)return;e.preventDefault();e.returnValue=''})
['pid','sex','context','hand'].forEach(id=>$(id).addEventListener('input',syncParticipant));
render();
