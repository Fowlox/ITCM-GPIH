// ==UserScript==
// @name         [Fowlox-ITCM] Game Price & Information Helper
// @namespace    Fowlox
// @version      0.1
// @description  게임 목록에서 최저가 및 기타 정보를 확인 X)
// @author       아레스다
// @icon         http://itcm.co.kr/files/attach/xeicon/favicon.ico
// @match        *://itcm.co.kr/*
// @run-at       document-end
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

var stores = ["steam","amazonus","gamersgate","greenmangaming","origin","uplay","indiegalastore","gamesplanet","indiegamestand","gog","dlgamer","humblestore","squenix","bundlestars","wingamestore"];
function collectApp(list){
	var apps = [];
	var no_mi_app = list.getElementsByClassName("no_mi_app"),mi_app = list.getElementsByClassName("mi_app");
	for(var index=0; index<no_mi_app.length;index++) apps=apps.concat(no_mi_app[index]);
	for(var index=0; index<mi_app.length;index++) apps=apps.concat(mi_app[index]);
	return apps;
}
function applicate(item, index, apps){
	src = item.getElementsByClassName("name")[0].href.split("/");
	id = src[src.length-1];
	var div = document.createElement("div");
	div.className="infoTooltip";
	loadData(div,item,id);
	item.appendChild(div);
}
function loadData(tooltip,app,id){
	var name = app.getElementsByClassName("name")[0].textContent;
	jQuery(tooltip).append('<img class="tooltipImageHeader" src="http://cdn.akamai.steamstatic.com/steam/apps/'+id+'/header.jpg" alt=""><div class="container"><h4>'+name+'</h4><p>불러오는 중...</p></div>');
	url = "//api.isthereanydeal.com/v02/game/plain/?key=397b5c0da6342ca3e136345f2711ce060314a122&shop=steam&game_id=app%2F"+id;
	jQuery.ajax(url,{
		dataType: 'json',
		success: function(args){
			console.log(args);
		},
		error: function(e){
			tooltip.textContent="[오류]";
			console.log(e);
		}

	});
}
var sheet = (function(){
	var style = document.createElement("style");
	style.appendChild(document.createTextNode(""));
	document.head.appendChild(style);
	return style.sheet;
})();
sheet.insertRule(".no_mi_app {position:relative;}",0);
sheet.insertRule(".mi_app {position:relative;}",0);
sheet.insertRule(".infoTooltip {width: 400px; left: -380px; background-color:#F5F5F5; border-radius: 6px; box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2); position: absolute; z-index: 1; visibility: hidden;}",0);
sheet.insertRule(".no_mi_app:hover .infoTooltip {visibility:visible}",0);
sheet.insertRule(".mi_app:hover .infoTooltip {visibility:visible}",0);
sheet.insertRule(".infoTooltip:hover {visibility:visible; box-shadow: 0 8px 16px 0 rgba(0,0,0,0.2)}",0);
sheet.insertRule(".tooltipImageHeader {width:100%}",0);
sheet.insertRule(".container {padding: 2px 16px;}",0);
var hovered;
var listbox=document.getElementsByClassName("steam_read_selected")[0];
if(listbox != undefined){
	apps = collectApp(listbox);
	apps.forEach(applicate);
}