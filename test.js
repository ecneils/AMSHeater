/* JS只做最小增强：温度高亮、快速操作按钮 */
(function(){
'use strict';
var RM=5000,RI;
function $(s){return document.querySelector(s)||document.getElementById(s)}
function ft(u,o){return new Promise(function(ok,no){var t=setTimeout(function(){no(1)},5000);fetch(u,o||{}).then(function(r){clearTimeout(t);ok(r)},function(e){clearTimeout(t);no(e)})}}
function gG(p){return ft(p).then(function(r){if(!r.ok)throw 0;return r.json()})}

/* 自动刷新（避免手动F5） */
async function autoRef(){
  try{
    var d=await gG('/sensor');
    var rows=document.querySelectorAll('.entity-row-state');
    /* 根据温度值高亮颜色 */
    rows.forEach(function(r){
      var t=parseFloat(r.textContent);
      if(!isNaN(t)&&t>40){r.style.color='#f43f5e';r.style.fontWeight='800'}
      else if(!isNaN(t)&&t>0){r.style.color='#22c55e';r.style.fontWeight='800'}
    });
  }catch(e){}
}

function init(){RI=setInterval(autoRef,RM);autoRef()}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
