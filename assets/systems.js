
/* ---- Real recorded runs from clauselens-rag/benchmark_results.json ---- */
const RUNS=[
 {q:"Does the MSA auto-renew?",ms:2.63,doc:"msa_acme.txt §2.2",
  chunk:"This Agreement automatically renews for successive 12-month terms unless either\nparty provides written notice of non-renewal at least 60 days before the end of\nthe then-current term.",
  ans:"Yes. The MSA automatically renews for successive 12-month terms unless either party gives written notice of non-renewal at least 60 days before the end of the then-current term."},
 {q:"How many days notice to terminate the MSA for convenience?",ms:1.52,doc:"msa_acme.txt §3.1",
  chunk:"Customer may terminate this Agreement for convenience upon 30 days written notice.\nVendor may not terminate for convenience during the initial term.",
  ans:"30 days written notice — but only the Customer holds that right. The Vendor may not terminate for convenience during the initial term."},
 {q:"What is the liability cap in the MSA?",ms:1.43,doc:"msa_acme.txt §4.1",
  chunk:"Except for breaches of confidentiality or indemnification obligations, each party's\ntotal liability under this Agreement shall not exceed the fees paid in the 12 months\npreceding the claim.",
  ans:"Liability is capped at fees paid in the 12 months preceding the claim — with carve-outs: confidentiality and indemnification breaches are not capped."},
 {q:"What state law governs the MSA?",ms:1.34,doc:"msa_acme.txt §6.1",
  chunk:"This Agreement is governed by the laws of the State of Delaware, without regard to\nconflict of law principles.",
  ans:"Delaware law governs, expressly excluding conflict-of-law principles."},
 {q:"How long do confidentiality obligations survive?",ms:1.30,doc:"msa_acme.txt §8.1",
  chunk:"Confidentiality obligations survive termination of this Agreement for 36 months.",
  ans:"Confidentiality obligations survive for 36 months after the MSA terminates. Note: the NDA with Beta Corp uses 60 months — a cross-document inconsistency ClauseLens flags."},
 {q:"What is the fixed fee in the Q3 Statement of Work?",ms:1.48,doc:"sow_acme_q3.txt §3.1",
  chunk:"Customer shall pay Vendor a fixed fee of $120,000, invoiced monthly at $40,000.",
  ans:"The Q3 SOW fixed fee is $120,000, invoiced monthly at $40,000."},
 {q:"Which agreement does the Q3 SOW fall under?",ms:1.51,doc:"sow_acme_q3.txt §4.1",
  chunk:"All terms of the Master Services Agreement, including the liability cap in Section\n4.1 and the termination provisions in Section 3, apply to this Statement of Work\nunless expressly modified herein. No modifications to those terms are made here.",
  ans:"The Q3 SOW is entered under the MSA dated March 1, 2024 and incorporates all MSA terms by reference — including the §4.1 liability cap and §3 termination provisions, unmodified."},
 {q:"What law governs the NDA?",ms:1.53,doc:"nda_beta.txt §5.1",
  chunk:"This Agreement is governed by the laws of the State of California.",
  ans:"The NDA between Beta Corp and Customer is governed by California law — unlike the MSA, which is governed by Delaware law."}
];
const BLUEPRINTS=[
 ["ClauseLens","Legal Ops","Post-signature contract intelligence: renewal & obligation answers with clause-level citations.","Reference build ✓ open source","https://github.com/itsmuskanagarwal/clauselens-rag"],
 ["AuditLoom","Compliance","Evidence-to-control reasoning for SOC 2 / ISO 27001 — answers auditors, finds gaps first.","Blueprint · queued",null],
 ["BidForge","Sales / GRC","RFP & security-questionnaire first-draft engine with freshness-scored answer library.","Blueprint · queued",null],
 ["AuthPilot","Healthcare Ops","Crawled payer-policy corpus: prior-auth requirements, checklists, change alerts.","Blueprint · queued",null],
 ["LedgerScope","Financial","Filings + transcripts + credit-agreement intelligence with covenant extraction.","Blueprint · queued",null]
];

const bpg=document.getElementById('bpGrid');
BLUEPRINTS.forEach(([n,v,d,s,url])=>{
  const div=document.createElement('div');div.className='card-dark';
  div.innerHTML=`<div style="font-size:.7rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--gold)">${s}</div>
  <h3 style="margin:8px 0 2px;font-size:1.15rem">${n}</h3>
  <div style="color:var(--gold-deep);font-weight:800;font-size:.82rem;margin-bottom:8px">${v}</div>
  <p style="font-size:.9rem;color:#C9C4BA">${d}</p>
  ${url?`<a href="${url}" rel="noopener" style="color:var(--gold);font-weight:800;font-size:.8rem;text-transform:uppercase">Repository →</a>`:''}`;
  bpg.appendChild(div);
});

/* ---- replay engine ---- */
const body=document.getElementById('termBody'),btns=document.getElementById('qButtons');
let playing=false;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;');
async function typeInto(elm,text,speed=14){
  for(const ch of text){elm.textContent+=ch;await sleep(speed)}
}
async function play(run,btn){
  if(playing)return;playing=true;
  document.querySelectorAll('.qbtn').forEach(b=>b.classList.remove('active'));
  btn&&btn.classList.add('active');
  body.innerHTML='';
  const q=document.createElement('div');q.className='qline';body.appendChild(q);
  q.textContent='❯ query: ';await typeInto(q,run.q,22);
  await sleep(250);
  const s1=document.createElement('div');s1.className='stage';body.appendChild(s1);
  await typeInto(s1,'  → rewriting query · expanding legal aliases',6);
  const s2=document.createElement('div');s2.className='stage';body.appendChild(s2);
  await typeInto(s2,'  → hybrid retrieval: BM25 + dense · reciprocal-rank fusion',6);
  await sleep(300);
  const hit=document.createElement('div');hit.className='hitline';body.appendChild(hit);
  hit.textContent=`  ✓ top chunk retrieved in ${run.ms}ms `;
  const cite=document.createElement('span');cite.className='cite';cite.textContent=run.doc;hit.appendChild(cite);
  const box=document.createElement('div');box.className='chunkbox';body.appendChild(box);
  await typeInto(box,run.chunk,4);
  await sleep(280);
  const s3=document.createElement('div');s3.className='stage';body.appendChild(s3);
  await typeInto(s3,'  → synthesis + citation validation (every claim must verify against a chunk)',6);
  const ans=document.createElement('div');ans.className='ansbox';body.appendChild(ans);
  const strong=document.createElement('div');strong.textContent='ANSWER';strong.style.cssText='font-size:.68rem;letter-spacing:.2em;color:#8FCE9B;font-weight:800;margin-bottom:4px';
  ans.appendChild(strong);
  const at=document.createElement('div');ans.appendChild(at);
  await typeInto(at,run.ans,12);
  const c2=document.createElement('div');c2.style.marginTop='8px';
  c2.innerHTML=`<span class="cite">source: ${esc(run.doc)}</span> <span class="cite">citation ✓ validated</span>`;
  ans.appendChild(c2);
  const caret=document.createElement('span');caret.className='caret';body.appendChild(caret);
  playing=false;
}
RUNS.forEach((r,i)=>{
  const b=document.createElement('button');b.className='qbtn';b.textContent=r.q;
  b.onclick=()=>play(r,b);btns.appendChild(b);
});
play(RUNS[0],btns.children[0]);
