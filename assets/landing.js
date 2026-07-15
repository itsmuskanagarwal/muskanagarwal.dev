
/* 3D hero: golden particle wave field, mouse parallax. Falls back to static gradient. */
(function(){
  const canvas=document.getElementById('bg3d');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!window.THREE||reduced){canvas.style.background='radial-gradient(circle at 70% 30%,rgba(233,179,59,.25),transparent 60%)';return}
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(60,1,.1,100);
  camera.position.set(0,6,14);

  /* particle wave */
  const COLS=120,ROWS=60,SP=.45;
  const geo=new THREE.BufferGeometry();
  const pos=new Float32Array(COLS*ROWS*3);
  let i=0;
  for(let x=0;x<COLS;x++)for(let z=0;z<ROWS;z++){
    pos[i++]=(x-COLS/2)*SP; pos[i++]=0; pos[i++]=(z-ROWS/2)*SP;
  }
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const mat=new THREE.PointsMaterial({color:0xE9B33B,size:.06,transparent:true,opacity:.85});
  const pts=new THREE.Points(geo,mat);
  scene.add(pts);

  /* faint second layer, cream */
  const mat2=new THREE.PointsMaterial({color:0xFAF7F0,size:.03,transparent:true,opacity:.28});
  const pts2=new THREE.Points(geo.clone(),mat2);
  pts2.position.y=.6;scene.add(pts2);

  /* wireframe torus knot accent drifting slowly */
  const knot=new THREE.Mesh(
    new THREE.TorusKnotGeometry(2.1,.5,110,14),
    new THREE.MeshBasicMaterial({color:0xE9B33B,wireframe:true,transparent:true,opacity:.16}));
  knot.position.set(6.5,4.2,-4);scene.add(knot);

  let mx=0,my=0;
  addEventListener('pointermove',e=>{mx=(e.clientX/innerWidth-.5);my=(e.clientY/innerHeight-.5)});
  function resize(){
    const rect=canvas.parentElement.getBoundingClientRect();
    const w=Math.min(rect.width,innerWidth),h=Math.min(rect.height,innerHeight);
    if(!w||!h)return;
    renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()
  }
  resize();
  let resizeTimer;
  addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(resize,120)});

  const p1=geo.attributes.position,p2=pts2.geometry.attributes.position;
  let t=0,visible=true;
  new IntersectionObserver(es=>visible=es[0].isIntersecting).observe(canvas);
  (function loop(){
    requestAnimationFrame(loop);
    if(!visible)return;
    t+=.014;
    for(let n=0;n<p1.count;n++){
      const x=p1.getX(n),z=p1.getZ(n);
      const y=Math.sin(x*.55+t)*Math.cos(z*.45+t*.8)*1.15+Math.sin((x+z)*.2+t*.6)*.5;
      p1.setY(n,y);p2.setY(n,y*.8);
    }
    p1.needsUpdate=true;p2.needsUpdate=true;
    knot.rotation.x+=.0016;knot.rotation.y+=.0022;
    camera.position.x+= (mx*3-camera.position.x)*.04;
    camera.position.y+= (6-my*2-camera.position.y)*.04;
    camera.lookAt(0,0,0);
    renderer.render(scene,camera);
  })();
})();
document.getElementById('mq').innerHTML+=document.getElementById('mq').innerHTML; /* seamless marquee */
