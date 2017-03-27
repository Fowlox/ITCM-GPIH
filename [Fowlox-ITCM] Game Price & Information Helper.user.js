// ==UserScript==
// @name         [Fowlox-ITCM] Game Price & Information Helper
// @namespace    Fowlox
// @version      0.1.1
// @description  게임 목록에서 최저가 및 기타 정보를 확인 X)
// @author       Fowlox
// @icon         http://itcm.co.kr/files/attach/xeicon/favicon.ico
// @match        *://itcm.co.kr/*
// @run-at       document-end
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// ==/UserScript==

var app= {
    client_id:"a3a68eecfeeabff7",
    apikey:"397b5c0da6342ca3e136345f2711ce060314a122",
    state: Date.now(),
    _token: false,

    authURL: function(){
        return "http://api.isthereanydeal.com/oauth/authorize/?response_type=token&client_id=" + this.client_id + "&scope=coll_read&redirect_uri="+window.location.href+"&state=" + this.state;
    },

    token: function(){
        if(!this._token){
            if (window.location.hash) {
                var a = window.location.hash.substr(1).split("&");

                var token = false;
                for (var i=0; i< a.length; i++) {
                    var param = a[i].split("=");
                    var key = param[0];
                    var val = param[1];

                    if (key == "access_token") {
                        token = val;
                    } else if (key == "state" && token) {
                        if (GM_getValue("oauth_state") == val) {
                            this._token = token;
                            GM_setValue("token", this._token);
                        }
                        GM_deleteValue("oauth_state");
                    }
                }
            }

            // check cache
            this._token = GM_getValue("token", false);
        }
        return this._token;
    },

    clearToken: function(){
        GM_deleteValue("token");
        this._token = false;
    }
};

function xAtrib(atr, value) {
    return "contains(concat(' ', normalize-space(@"+atr+"), ' '), ' "+value+" ')";
}

var page = {
    expiry: 24*60*60*1000,
    shop: null,
    plain:null,
    status:{
        plain: false
    },
    _container: null,
    _cacheKey: function(){
        return "collection:"+this.shop;
    },
    _addHTML: function(content){
        switch(this.shop){
            case "steam":
                this.container().innerHTML = content + this.container().innerHTML;
                break;
        }
    },
    container: function(){
        if(!this._container){
            switch(this.shop) {
                case "steam":
                    this._container = document.evaluate(
                        "//div["+xAtrib("class", "column--right")+"]/div["+xAtrib("class", "module-header")+"][1]",
                        document,
                        null,
                        XPathResult.FIRST_ORDERED_NODE_TYPE,
                        null
                    ).singleNodeValue;
            }
        }
        return this._container;
    },
    requestAuthorization: function() {
        switch(this.shop) {
            case "steam":
                this._addHTML("<a href='" + app.authURL() + "' id='itad-authorize' style='float:right;text-decoration:underline'>Authorize on ITAD</a>");
                break;
        }

        document.getElementById("itad-authorize").addEventListener("click", function() {
            GM_setValue("oauth_state", app.state);
        });
    },
    _loadPlain: function(id, url, title) {
        var ref = this;
        var request = "";
        if (id) { request += "&game_id="+encodeURIComponent(id); }
        if (url) { request += "&url="+encodeURIComponent(url); }
        if (title) { request += "&title="+encodeURIComponent(title); }

        if (request == "") {return;}

        GM_xmlhttpRequest({
            method: "GET",
            url: "http://api.isthereanydeal.com/v02/game/plain/?key=" + app.apikey + "&shop=" + ref.shop + request,
            onload: function(response) {
                var data = JSON.parse(response.responseText);
                if (!data.error && data['.meta'].match !== false) {
                    ref.plain = data.data.plain;
                    ref.status.plain = true;
                    ref._checkOwnership();
                }
            }
        });
    },

    /**
     * Get info from store page and use it to identify the game and loading plain
     */
    getPlain: function() {
        switch(this.shop) {
            case "steam":
                var gamedata = unsafeWindow.gogData.gameProductData;
                this._loadPlain(gamedata.id, gamedata.url, gamedata.title);
                break;
        }
    }
};

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
    url = "//api.isthereanydeal.com/v02/game/plain/?key=397b5c0da6342ca3e136345f2711ce060314a122&shop=steam&game_id=app%2F"+id+"&callback=?";
    var request = "";
    if (id) { request += "&game_id="+encodeURIComponent(id); }
    if (request == "") {return;}

    GM_xmlhttpRequest({
        method: "GET",
        url: "http://api.isthereanydeal.com/v02/game/plain/?key=" + app.apikey + "&shop=" + page.shop + request,
        onload: function(response) {
            var data = JSON.parse(response.responseText);
            if (!data.error && data['.meta'].match !== false) {
                console.log(data.data.plain);
                ref.plain = data.data.plain;
                ref.status.plain = true;
                ref._checkOwnership();
            }
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


page.shop = "steam";
if(!app.token()){
    page.requestAuthorization();
}