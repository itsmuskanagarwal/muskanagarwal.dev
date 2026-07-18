
/* ---------- data ---------- */
const ACHIEVEMENTS=[
 ["Promoted in < 1 Year","Recognized for exceptional performance","Recognized for exceptional performance and promoted from Software Analyst to Software Engineer at OnGraph Technologies in under 12 months, well ahead of the typical track."],
 ["AI Sprint Accelerator","40% sprint work completed by AI agents with 90%+ accuracy","Designed and orchestrated multi-agent AI workflows that handled 40% of sprint-level tasks autonomously, maintaining over 90% project accuracy. Redefined what a 'sprint' looks like for the team."],
 ["Polyglot Language Contributor","Worked on a programming language spanning 6+ languages","Contributed to the design and implementation of a programming language with components written in Rust, Python, Go, JavaScript, C#, and C++. A rare full-spectrum engineering challenge."],
 ["AI Agent Pipeline Owner","End-to-end AI orchestration in production","Led end-to-end design and implementation of an AI agent orchestration system integrated into a production frontend product. Owned the full lifecycle from prompt engineering to deployment."],
 ["Angular Champion","Component libraries across 3 client projects","Internal recognition for building reusable Angular component libraries adopted across 3 separate client projects — saving weeks of duplicated work per quarter."],
 ["Full-Stack Delivery","Solo greenfield frontend + backend","Single-handedly delivered a greenfield Node.js/.NET API layer paired with an Angular frontend for a mid-size enterprise client — from architecture to prod deployment."]
];
const SKILLS={
 "Frontend":["Angular (Advanced)","AngularJS","TypeScript","JavaScript (ES6+)","RxJS","NgRx","Angular CLI","HTML5","CSS3","SCSS","Bootstrap","Responsive Design","Syncfusion","ChartJS","ExcelJS"],
 "Backend":["Node.js","NestJS","Express.js",".NET","RESTful APIs","WebSockets","Socket.io"],
 "Testing & Quality":["Unit Testing","Jasmine / Karma","Code Reviews","PR Validation","Debugging","Static Analysis"],
 "CI/CD & Cloud":["Git","GitHub","Azure (AZ-900)","Azure AI (AI-900)","CI/CD Pipelines","Docker","Webpack","npm"],
 "Databases":["MongoDB","MySQL","SQL"],
 "AI & Automation":["LLM APIs (Claude, OpenAI)","GitHub Copilot","Prompt Engineering","AI Agent Development","Agentic Workflows","Multi-Agent Systems","LLM Integration","RAG Pipelines","Eval Harnesses"],
 "Languages":["TypeScript","JavaScript","Python","Rust"],
 "Remote Collaboration":["Microsoft Teams","Slack","Jira","Confluence","GitHub (async PR workflows)","Async cross-timezone delivery"]
};
const PROJECTS=[
 ["01","Open Collaboration","Rust Compiler Collab","With a senior Google engineer","Collaborated on a Rust-based compiler that translates a simplified system design syntax into Python, Java, Go, C, C#, JavaScript, and UML diagrams.","One of the most technically stretching projects I've worked on — parsing, code generation across seven targets, and UML emission from a single grammar."],
 ["02","Internal Library","Angular Package Engineering","Internal component libraries","Designed and published internal Angular component libraries as npm packages — reusable across projects, versioned, tree-shakeable.","Learned the science behind building for other developers, not just end users: semver discipline, API surface design, and docs that answer questions before they're asked."],
 ["03","Personal Build","PenPal AI","AI writing agent for professionals","Built an AI agent that writes polished conversational texts, emails, and notes for professionals. No login required — AI credits allocated per unique IP.","Thoughtful about privacy from day one: no accounts, no stored messages, rate limits enforced per IP at the edge."],
 ["04","Client Work (NDA)","Enterprise Client Delivery","SaaS · Government · Scale","Worked on production applications generating millions in annual revenue — SaaS platforms, government systems, and enterprise Angular apps.","Domains spanned finance, HR, and public sector. Details kept confidential per NDA."],
 ["05","Dev Tool","Caveman Local UI","Dev tooling — zero extra dependencies","Built a local-environment version of the caveman repo with a full UI layer, so developers can integrate it into their projects visually.","No additional libraries to install, no setup friction — drop it in and go."],
 ["06","Side Projects","Side Projects Lab","Chatbots · AI tools · Experiments","A running collection of smaller builds: AI-powered chatbots, resume builders with LLM integration, quick automation scripts, and weekend experiments.","These are where I test ideas before they grow into real projects."]
];
const CURATED_REPOS=["effective-agents-lab","review-rails","clauselens-rag","memory-matrix","ng-reaper","agent-pipe","ng-perf-lens","professional-message-rewriter","claude-pack","caveman-but-local","caveman-mcp"];
const REPO_FALLBACK={
 "effective-agents-lab":"Anthropic's 'Building Effective AI Agents' playbook, implemented end to end: 13 pattern/agent modules, an eval harness, and a 13-chapter learning guide.",
 "review-rails":"PR review automation that enforces your team's standards: deterministic checks first, LLM judgment only where rules cannot reach, inside your own CI.",
 "clauselens-rag":"Local-first hybrid-retrieval RAG pipeline for contract intelligence: structural chunking, BM25 + dense fusion, citation-validated synthesis. 90.7% retrieval on a 43-question golden set.",
 "memory-matrix":"A Claude skill that scans any legacy codebase and builds a durable 'memory matrix': frontend, backend, security, and database inventories with file:line evidence.",
 "ng-reaper":"Find provably dead code in your Angular app — components, templates, services, pipes, NgRx — and delete the safe parts automatically.",
 "agent-pipe":"A small, typed, composable pipeline library for multi-step LLM workflows in TypeScript.",
 "ng-perf-lens":"Chrome DevTools extension + npm agent making Angular change-detection cost visible per component, per cycle, in real time.",
 "professional-message-rewriter":"AI-powered workplace communication assistant — rewrites Slack, email, and Jira messages with the right tone.",
 "caveman-but-local":"Caveman token-saving files that can be dropped into any project locally.",
 "claude-pack":"A curated pack of Claude Code artifacts — skills, subagents, slash commands, and hooks — for teams working on large or legacy codebases.",
 "caveman-mcp":"Claude Code skill that cuts tokens by talking like caveman (forked)."
};
const BLUEPRINTS=[
 ["ClauseLens","Legal Ops","Post-signature contract intelligence over your existing repository: renewal and obligation answers with clause-level citations. Reference implementation open-sourced — hybrid retrieval, RRF fusion, citation validation.","live","https://github.com/itsmuskanagarwal/clauselens-rag"],
 ["AuditLoom","Compliance","Evidence-to-control reasoning layer for SOC 2 / ISO 27001: answers auditors and finds gaps before they do.","blueprint",null],
 ["BidForge","Sales / GRC","RFP and security-questionnaire first-draft engine with a self-learning, freshness-scored answer library.","blueprint",null],
 ["AuthPilot","Healthcare Ops","Continuously-crawled payer-policy corpus: prior-auth requirements, checklists, and change alerts for clinics and RCM firms.","blueprint",null],
 ["LedgerScope","Financial","Filings + transcripts + credit-agreement intelligence with covenant extraction, for small credit and equity funds.","blueprint",null]
];
const ROADMAP=[
 ["01","Portfolio, live on my own domain","Shipped: portfolio, projects, RAG demos, and articles live on muskanagarwal.dev. Blog cadence and new demos continue from here."],
 ["02","review-rails v1 on GitHub Marketplace","Tagged release, marketplace listing, dogfooded on my own repositories."],
 ["03","ClauseLens to production spec","Real embeddings, pgvector, and a hosted rate-limited demo you can try right here."],
 ["04","Writing","One deep-dive post per shipped system — architecture decisions, honest benchmarks, what broke."]
];

/* ---------- render ---------- */
const el=(h)=>{const t=document.createElement('template');t.innerHTML=h.trim();return t.content.firstChild};

const badges=document.getElementById('badges');
ACHIEVEMENTS.forEach(([t,s,l])=>{
  const b=el(`<div class="badge"><h3>${t}<span class="plus">+</span></h3><div class="short">${s}</div><div class="long">${l}</div></div>`);
  b.onclick=()=>b.classList.toggle('open');badges.appendChild(b);
});

const sb=document.getElementById('skillsBody');
Object.entries(SKILLS).forEach(([cat,items])=>{
  sb.appendChild(el(`<div class="skill-cat"><h4>${cat}</h4><div class="chiplist">${items.map(i=>`<span class="chip">${i}</span>`).join('')}</div></div>`));
});

const notes=document.getElementById('notes');
PROJECTS.forEach(([n,c,t,s,p,lg])=>{
  const nEl=el(`<div class="note"><span class="num">${n}</span> · <span class="cat">${c}</span><h3>${t}</h3><div class="sub">${s}</div><p>${p}</p><div class="long"><p>${lg}</p></div><span class="more">Read more</span></div>`);
  nEl.onclick=()=>{nEl.classList.toggle('open');nEl.querySelector('.more').textContent=nEl.classList.contains('open')?'Show less':'Read more'};
  notes.appendChild(nEl);
});

const bpg=document.getElementById('bpGrid');
BLUEPRINTS.forEach(([name,vert,desc,status,repo])=>{
  bpg.appendChild(el(`<div class="bp"><span class="bp-tag ${status==='live'?'live':''}">${status==='live'?'Reference build on GitHub':'Blueprint · Build queued'}</span><h3>${name}</h3><div class="vertical">${vert}</div><p>${desc}</p><div class="bp-links">${repo?`<a href="${repo}" target="_blank" rel="noopener">Repository →</a>`:''}</div></div>`));
});

const laneEl=document.getElementById('lane');
ROADMAP.forEach(([ph,t,d])=>laneEl.appendChild(el(`<div class="lane-item"><div class="phase">${ph}</div><div><h3>${t}</h3><p>${d}</p></div></div>`)));

/* GitHub repos — live fetch with fallback */
const rg=document.getElementById('repoGrid');
function repoCard(name,desc,lang,stars,url,fork){
  return el(`<a class="repo" href="${url}" target="_blank" rel="noopener"><h3>▣ ${name}${fork?' <span class="fork-tag">FORK</span>':''}</h3><p>${desc||''}</p><div class="meta">${lang?`<span class="lang">${lang}</span>`:''}${stars?`<span>★ ${stars}</span>`:''}</div></a>`);
}
fetch('https://api.github.com/users/itsmuskanagarwal/repos?per_page=100&sort=pushed')
 .then(r=>{if(!r.ok)throw 0;return r.json()})
 .then(repos=>{
   const byName=Object.fromEntries(repos.map(r=>[r.name,r]));
   CURATED_REPOS.forEach(n=>{const r=byName[n];if(r)rg.appendChild(repoCard(r.name,r.description||REPO_FALLBACK[n],r.language,r.stargazers_count,r.html_url,r.fork))});
   if(!rg.children.length)throw 0;
 })
 .catch(()=>{CURATED_REPOS.forEach(n=>rg.appendChild(repoCard(n,REPO_FALLBACK[n],null,null,`https://github.com/itsmuskanagarwal/${n}`)))});

/* ---------- behavior ---------- */
document.getElementById('year').textContent=new Date().getFullYear();
const nav=document.getElementById('nav');
addEventListener('scroll',()=>nav.classList.toggle('show',scrollY>innerHeight*.6));
const io=new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting&&e.target.classList.add('visible')),{threshold:.15});
document.querySelectorAll('.stop,.reveal').forEach(s=>io.observe(s));

/* profile photo: drop assets/profile.jpg + assets/about.jpg into the repo and these swap in automatically */
[['avatar','/assets/profile.jpg'],['aboutPhoto','/assets/about.jpg']].forEach(([id,src])=>{
  const img=new Image();img.onload=()=>{const d=document.getElementById(id);d.innerHTML='';d.style.background=`center/cover url('${src}')`};img.src=src;
});
