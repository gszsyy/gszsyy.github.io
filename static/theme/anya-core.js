/* anya-core.js — 全站间谍过家家交互核心（单 rAF；仅 transform/opacity）
   任何页面引入即可：需要一个 .ac-root 容器。元素按 class/data-* 自动接管。 */
(function(){
  "use strict";
  function init(){
    var root=document.querySelector(".ac-root")||document.body;
    var cursor=document.querySelector(".ac-cursor");
    var cursorLabel=cursor&&cursor.querySelector(".ac-cursor-label");
    var buddy=document.querySelector(".ac-buddy");
    var buddyBubble=buddy&&buddy.querySelector(".bubble");
    var reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion:reduce)").matches;
    var pointer={active:false,x:innerWidth/2,y:innerHeight/2,tx:innerWidth/2,ty:innerHeight/2};
    var scrollProgress=0;
    var buddyState="",buddyIdx=0;
    var phrases={calm:["哇酷哇酷…","任务进行中","看你呢…","花生君…"],
                 look:["嗯？","那边有线索？","唔…","情报？"],
                 excited:["哇酷哇酷！","发现你了！","一起做任务！","Stella ★!"]};

    /* local clock (any [data-clock]) */
    var clocks=[].slice.call(document.querySelectorAll("[data-clock]"));
    function tick(){var t=new Intl.DateTimeFormat("zh-CN",{hour:"2-digit",minute:"2-digit",second:"2-digit"}).format(new Date());clocks.forEach(function(c){c.textContent=t;});}
    if(clocks.length){tick();setInterval(tick,1000);}

    function setCursor(label){
      if(!cursor)return;
      var has=Boolean(label);
      cursor.classList.toggle("is-view",has);
      if(cursorLabel&&label)cursorLabel.textContent=label;
    }

    document.addEventListener("pointermove",function(e){
      pointer.active=true;pointer.tx=e.clientX;pointer.ty=e.clientY;
      root.classList.add("is-pointer");
      root.style.setProperty("--pointer-x",e.clientX+"px");
      root.style.setProperty("--pointer-y",e.clientY+"px");
      root.style.setProperty("--tilt-x",((e.clientX/innerWidth-.5)*2).toFixed(3));
      root.style.setProperty("--tilt-y",((e.clientY/innerHeight-.5)*2).toFixed(3));
    },{passive:true});
    document.addEventListener("pointerleave",function(){pointer.active=false;root.classList.remove("is-pointer");setCursor("");},{passive:true});

    document.querySelectorAll("[data-cursor-label],a,button").forEach(function(el){
      el.addEventListener("pointerenter",function(){setCursor(el.getAttribute("data-cursor-label")||"");});
      el.addEventListener("pointerleave",function(){setCursor("");});
    });

    document.querySelectorAll("[data-magnetic]").forEach(function(el){
      el.classList.add("ac-magnetic");
      var f=Number(el.getAttribute("data-magnetic")||14);
      el.addEventListener("pointermove",function(e){
        var r=el.getBoundingClientRect();
        var mx=((e.clientX-r.left)/Math.max(1,r.width)-.5)*f;
        var my=((e.clientY-r.top)/Math.max(1,r.height)-.5)*f;
        el.style.transform="translate3d("+mx.toFixed(2)+"px,"+my.toFixed(2)+"px,0)";
      },{passive:true});
      el.addEventListener("pointerleave",function(){el.style.transform="";});
    });

    document.querySelectorAll("[data-tilt]").forEach(function(el){
      el.classList.add("ac-tilt3d");
      var f=Number(el.getAttribute("data-tilt")||9);
      el.addEventListener("pointermove",function(e){
        var r=el.getBoundingClientRect();
        var px=(e.clientX-r.left)/Math.max(1,r.width)-.5;
        var py=(e.clientY-r.top)/Math.max(1,r.height)-.5;
        el.style.transform="perspective(820px) rotateY("+(px*f).toFixed(2)+"deg) rotateX("+(-py*f).toFixed(2)+"deg)";
      },{passive:true});
      el.addEventListener("pointerleave",function(){el.style.transform="";});
    });

    /* PV : 静音自动循环播放（像动图，不用点） */
    document.querySelectorAll(".ac-pv[data-yt]").forEach(function(el){
      var id=el.getAttribute("data-yt");
      var f=document.createElement("iframe");
      f.src="https://www.youtube.com/embed/"+id+"?autoplay=1&mute=1&loop=1&playlist="+id+"&controls=0&modestbranding=1&playsinline=1&rel=0";
      f.allow="autoplay; encrypted-media; picture-in-picture";
      f.setAttribute("loading","lazy");f.setAttribute("frameborder","0");f.setAttribute("allowfullscreen","");
      el.innerHTML="";el.appendChild(f);el.classList.add("is-auto");
    });

    /* anchor smooth scroll */
    document.querySelectorAll('a[href^="#"]').forEach(function(a){
      a.addEventListener("click",function(e){var t=document.querySelector(a.getAttribute("href"));if(t){e.preventDefault();t.scrollIntoView({behavior:"smooth",block:"start"});}});
    });

    /* reveal */
    if("IntersectionObserver" in window){
      var io=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting)en.target.classList.add("is-in");});},{threshold:.14,rootMargin:"0px 0px -8% 0px"});
      document.querySelectorAll(".ac-reveal").forEach(function(el){io.observe(el);});
    }else{
      document.querySelectorAll(".ac-reveal").forEach(function(el){el.classList.add("is-in");});
    }

    /* scroll progress bar */
    var bar=document.createElement("div");bar.className="ac-progress";root.appendChild(bar);

    /* accordion (打开方式) */
    document.querySelectorAll("[data-acc]").forEach(function(h){
      h.addEventListener("click",function(){
        var item=h.closest(".ac-acc-item")||h.parentNode;item.classList.toggle("open");
      });
    });

    /* dropdown (下拉) */
    document.querySelectorAll("[data-dd]").forEach(function(btn){
      var menu=document.getElementById(btn.getAttribute("data-dd"));
      if(!menu)return;
      btn.addEventListener("click",function(e){e.stopPropagation();menu.classList.toggle("open");});
    });
    document.addEventListener("click",function(){
      document.querySelectorAll(".ac-dd-menu.open").forEach(function(m){m.classList.remove("open");});
    });

    /* horizontal wheel scroll (滚轮横向) */
    document.querySelectorAll("[data-hscroll]").forEach(function(el){
      el.addEventListener("wheel",function(e){
        if(Math.abs(e.deltaY)<=Math.abs(e.deltaX))return;
        var max=el.scrollWidth-el.clientWidth;
        if((el.scrollLeft<=0&&e.deltaY<0)||(el.scrollLeft>=max&&e.deltaY>0))return;
        e.preventDefault();el.scrollLeft+=e.deltaY;
      },{passive:false});
    });

    /* count-up (数字滚动) */
    if("IntersectionObserver" in window){
      var cio=new IntersectionObserver(function(es){es.forEach(function(en){
        if(!en.isIntersecting)return;var el=en.target;cio.unobserve(el);
        var to=Number(el.getAttribute("data-count"))||0;var t0=null;
        function step(ts){if(t0===null)t0=ts;var k=Math.min(1,(ts-t0)/1000);el.textContent=Math.round(to*k);if(k<1)requestAnimationFrame(step);else el.textContent=to;}
        requestAnimationFrame(step);
      });},{threshold:.5});
      document.querySelectorAll("[data-count]").forEach(function(el){cio.observe(el);});
    }

    var parallax=[].slice.call(document.querySelectorAll("[data-depth]"));
    var headers=[].slice.call(document.querySelectorAll("[data-scroll-shrink]"));
    function render(){
      pointer.x+=(pointer.tx-pointer.x)*.22;pointer.y+=(pointer.ty-pointer.y)*.22;
      if(cursor){cursor.style.left=pointer.x.toFixed(2)+"px";cursor.style.top=pointer.y.toFixed(2)+"px";}
      var maxS=Math.max(1,document.documentElement.scrollHeight-innerHeight);
      scrollProgress=scrollY/maxS;
      root.style.setProperty("--scroll",scrollProgress.toFixed(4));
      headers.forEach(function(h){h.classList.toggle("is-scrolled",scrollY>100);});
      if(!reduce){
        parallax.forEach(function(el){
          var d=Number(el.getAttribute("data-depth")||.1);
          var px=pointer.active?((pointer.x/innerWidth)-.5)*d*60:0;
          var py=scrollY*d*-.18;
          el.style.transform="translate3d("+px.toFixed(1)+"px,"+py.toFixed(1)+"px,0)";
        });
      }
      if(buddy){
        var rb=buddy.getBoundingClientRect();
        var bcx=rb.left+rb.width/2,bcy=rb.top+rb.height*.42;
        var ddx=pointer.x-bcx,dist=Math.hypot(ddx,pointer.y-bcy);
        var near=dist<240,side=!near&&Math.abs(ddx)>40;
        var rot=Math.max(-14,Math.min(14,ddx*.05));
        buddy.style.transform="rotate("+rot.toFixed(2)+"deg) scale("+(near?1.07:1)+")";
        buddy.classList.toggle("is-excited",near);
        buddy.classList.toggle("is-look",side);
        var st=near?"excited":(side?"look":"calm");
        if(st!==buddyState){buddyState=st;if(buddyBubble){var arr=phrases[st];buddyIdx=(buddyIdx+1)%arr.length;buddyBubble.textContent=arr[buddyIdx];}}
      }
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
