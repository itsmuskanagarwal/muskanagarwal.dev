
const PROJECTS=[
 {name:"review-rails",stage:["beta","Beta — v1 imminent"],
  what:"PR review automation for GitHub Actions: your team's standards become executable rules; an LLM is consulted only where regex can't judge.",
  who:"Engineering teams whose review standards live in a wiki nobody reads. Enterprises that can't send code to review SaaS.",
  next:"v1 tag, GitHub Marketplace listing, dogfooding on all my own repos.",
  repo:"https://github.com/itsmuskanagarwal/review-rails",demo:"/demos/review-rails/"},
 {name:"clauselens-rag",stage:["shipped","Reference build · open source"],
  what:"Hybrid-retrieval RAG for contract intelligence: structural chunking, BM25 + dense fusion, citation-validated answers. 90.7% retrieval on a 43-question golden set.",
  who:"Anyone building retrieval over legal or structured documents; teams who want a RAG pipeline without agent-framework overhead.",
  next:"Production build per blueprint: real embeddings, pgvector, hosted rate-limited demo.",
  repo:"https://github.com/itsmuskanagarwal/clauselens-rag",demo:"/systems/"},
 {name:"effective-agents-lab",stage:["shipped","Complete · learning resource"],
  what:"Anthropic's 'Building Effective AI Agents' playbook implemented end to end: 13 pattern modules, an eval harness, a 13-chapter guide. 206 offline tests.",
  who:"Engineers learning agent patterns who want runnable code behind every concept, not slideware.",
  next:"Keep synced with new Claude SDK releases; add cost-benchmark chapters.",
  repo:"https://github.com/itsmuskanagarwal/effective-agents-lab"},
 {name:"memory-matrix",stage:["shipped","Complete · Claude skill"],
  what:"A Claude skill that scans legacy codebases into durable frontend/backend/security/database inventories — markdown for humans, JSON for tooling — with file:line evidence.",
  who:"Teams onboarding onto large legacy systems; anyone tired of re-explaining a codebase to every new AI session.",
  next:"Community feedback round, then a v2 with incremental re-scan.",
  repo:"https://github.com/itsmuskanagarwal/memory-matrix"},
 {name:"ng-reaper",stage:["beta","Usable · hardening"],
  what:"Finds provably dead code in Angular apps — components, templates, services, pipes, NgRx — and deletes the safe parts automatically.",
  who:"Teams with years-old Angular codebases carrying dead weight through every build and every onboarding.",
  next:"Wider fixture coverage, npx one-shot mode polish.",
  repo:"https://github.com/itsmuskanagarwal/ng-reaper",demo:"/demos/ng-reaper/"},
 {name:"agent-pipe",stage:["beta","Usable · API stabilizing"],
  what:"A small, typed, composable pipeline library for multi-step LLM workflows in TypeScript. No framework, no magic — just typed steps.",
  who:"TypeScript developers who want LLM workflow structure without adopting a heavyweight agent framework.",
  next:"v1 API freeze, docs site, npm publish.",
  repo:"https://github.com/itsmuskanagarwal/agent-pipe"},
 {name:"ng-perf-lens",stage:["wip","v0.1 — spike passed"],
  what:"Chrome DevTools extension + npm agent making Angular change-detection cost visible per component, per cycle, live.",
  who:"Angular teams fighting change-detection storms in data-heavy dashboards.",
  next:"Resolve the overhead-measurement methodology gap (documented in SPIKE-RESULTS), then MVP UI.",
  repo:"https://github.com/itsmuskanagarwal/ng-perf-lens"},
 {name:"How to Talk Corporate",stage:["shipped","Live · try it now"],
  what:"AI workplace-communication assistant: rewrites Slack/email/Jira messages with the right tone. Web app + browser extension, PII stripping, 10 free rewrites a day, no login.",
  who:"Professionals who rewrite the same awkward message five times before sending it.",
  next:"Browser extension packaging, then usage-based tone presets.",
  repo:"https://github.com/itsmuskanagarwal/professional-message-rewriter",demo:"https://professional-message-rewriter-web.vercel.app"}
];
const el=h=>{const t=document.createElement('template');t.innerHTML=h.trim();return t.content.firstChild};
const pg=document.getElementById('projGrid');
PROJECTS.forEach(p=>{
  pg.appendChild(el(`<div class="card proj">
    <div class="stagebar"><span class="stage-pill ${p.stage[0]}">${p.stage[1]}</span></div>
    <h3>${p.name}</h3>
    <div class="row"><b>What</b><span>${p.what}</span></div>
    <div class="row"><b>For whom</b><span>${p.who}</span></div>
    <div class="row"><b>Next</b><span>${p.next}</span></div>
    <div class="links"><a href="${p.repo}" rel="noopener" target="_blank">Repository →</a>${p.demo?`<a href="${p.demo}">Live demo →</a>`:''}</div>
  </div>`));
});
/* live repos */
const rg=document.getElementById('repoGrid');
const CURATED=["effective-agents-lab","review-rails","clauselens-rag","memory-matrix","ng-reaper","agent-pipe","ng-perf-lens","professional-message-rewriter","claude-pack","caveman-but-local","caveman-mcp"];
const REPO_FALLBACK={
 "effective-agents-lab":"Anthropic's 'Building Effective AI Agents' playbook, implemented end to end: 13 pattern/agent modules, an eval harness, and a 13-chapter learning guide.",
 "review-rails":"PR review automation that enforces your team's standards: deterministic checks first, LLM judgment only where rules cannot reach, inside your own CI.",
 "clauselens-rag":"Local-first hybrid-retrieval RAG pipeline for contract intelligence: structural chunking, BM25 + dense fusion, citation-validated synthesis. 90.7% retrieval on a 43-question golden set.",
 "memory-matrix":"A Claude skill that scans any legacy codebase and builds a durable 'memory matrix': frontend, backend, security, and database inventories with file:line evidence.",
 "ng-reaper":"Find provably dead code in your Angular app — components, templates, services, pipes, NgRx — and delete the safe parts automatically.",
 "agent-pipe":"A small, typed, composable pipeline library for multi-step LLM workflows in TypeScript.",
 "ng-perf-lens":"Chrome DevTools extension + npm agent making Angular change-detection cost visible per component, per cycle, in real time.",
 "professional-message-rewriter":"AI-powered workplace communication assistant — rewrites messages for tone. Live, no login, 10 free rewrites a day.",
 "caveman-but-local":"Caveman token-saving files that can be dropped into any project locally.",
 "caveman-mcp":"Claude Code skill that cuts tokens by talking like caveman (forked).",
 "claude-pack":"A curated pack of Claude Code artifacts — skills, subagents, slash commands, and hooks — for teams working on large or legacy codebases."
};
function card(n,d,l,s,u,fork){return el(`<a class="repo" href="${u}" rel="noopener" target="_blank"><h3>▣ ${n}${fork?' <span class="fork-tag">FORK</span>':''}</h3><p>${d||''}</p><div class="meta">${l?`<span class="lang">${l}</span>`:''}${s?`<span>★ ${s}</span>`:''}</div></a>`)}
fetch('https://api.github.com/users/itsmuskanagarwal/repos?per_page=100&sort=pushed')
 .then(r=>{if(!r.ok)throw 0;return r.json()})
 .then(rs=>{const by=Object.fromEntries(rs.map(r=>[r.name,r]));
   CURATED.forEach(n=>{const r=by[n];if(r)rg.appendChild(card(r.name,r.description||REPO_FALLBACK[n],r.language,r.stargazers_count,r.html_url,r.fork))});
   if(!rg.children.length)throw 0})
 .catch(()=>CURATED.forEach(n=>rg.appendChild(card(n,'View on GitHub',null,null,`https://github.com/itsmuskanagarwal/${n}`))));
