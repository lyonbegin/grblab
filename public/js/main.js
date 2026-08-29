const menuBtn=document.querySelector('.menu-button');
const mobileNav=document.querySelector('.mobile-nav');
if(menuBtn&&mobileNav){menuBtn.addEventListener('click',()=>{const open=menuBtn.getAttribute('aria-expanded')==='true';menuBtn.setAttribute('aria-expanded',String(!open));mobileNav.hidden=open;});mobileNav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{mobileNav.hidden=true;menuBtn.setAttribute('aria-expanded','false')}));}
const io=new IntersectionObserver((entries)=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}}),{threshold:.08});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
