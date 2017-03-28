// ==UserScript==
// @name         [Fowlox-ITCM] Game Price & Information Helper
// @namespace    Fowlox
// @version      0.1
// @description  게임 목록에서 최저가 및 기타 정보를 확인 X)
// @author       Fowlox
// @icon         http://itcm.co.kr/files/attach/xeicon/favicon.ico
// @match        *://itcm.co.kr/*
// @run-at       document-end
// @connect      isthereanydeal.com
// @grant        GM_xmlhttpRequest
// ==/UserScript==
var itad = {
    region: "us",
    cc: "KR",
    clientId: "a3a68eecfeeabff7",
    apiKey: "397b5c0da6342ca3e136345f2711ce060314a122",
    queryItem: function(game){
        this._getIdenifier(game,function(plain){
            var info = {
                plain : plain,
                title : game.title,
                price : false,
                historical : false,
                bundles : false,
                info : false,
                
                collectInfo : function(){
                    if(!!this.price&!!this.historical&!!this.bundles&!!this.info&!this._lock){
                        this._lock = true;
                        console.log(this);
                        jQuery(game.itad).append('<p><a href="'+this.price.lowest.url+'" target="_blank">현재 최저가: <span class="lowest_store clickable">'+this.price.lowest.shop.name+'</span> <span class="'+((this.price.lowest.price_new<this.historical.price)?"GPIH_newHistorical":((this.price.lowest.price_new===this.historical.price)?"GPIH_sameHistorical":""))+'">$'+this.price.lowest.price_new+'(-'+this.price.lowest.price_cut+'%)</span></a></p>');
                        jQuery(game.itad).append('<p><a href="'+this.historical.url+'" target="_blank">역대 최저가: <span class="clickable">'+this.historical.shop+'</span> $'+this.historical.price+'(-'+this.historical.cut+'%) '+this.historical.date+'</a></p>');
                        jQuery(game.itad).append('<p><a href="'+this.bundles.url+'" target="_blank">번들 횟수: <span class="GPIH_count'+this.bundles.count+'">'+this.bundles.count+'</span></a></p>');
                    }
                },
                _lock : false,
            };
            itad._getPrice(info);
            itad._getHistorical(info);
            itad._getBundeles(info);
            itad._getInfo(info);
        });
    },
    _getIdenifier: function(game, callback){
        var shop = "steam";
        var id = game.steamType + "/" + game.steamId;
        var url = "https://api.isthereanydeal.com/v02/game/plain/?key="+this.apiKey+"&shop="+shop+"&game_id="+id;
        GM_xmlhttpRequest({
            method:"GET",
            url: url,
            onload: function(response){
                var data = JSON.parse(response.responseText);
                if(!data[".meta"].active){
                    jQuery(game.itad).append('<p class="GPIH_alert">해당 항목은 정확한 정보가 없습니다.<br/>유사한 정보를 조회합니다.</p>');
                }
                callback(data.data.plain);
            }
        });
    },
    _getPrice: function(info){
        var url = "https://api.isthereanydeal.com/v01/game/prices/"+this.region+"/?key="+this.apiKey+"&plains="+info.plain+"&country="+this.cc;
        GM_xmlhttpRequest({
            method:"GET",
            url: url,
            onload: function(response){
                var data = JSON.parse(response.responseText);
                var price = {success: true};
                if(data.data[info.plain].list.length === 0){
                    price.lowest = null;
                    price.shops = null;
                    price.success = false;
                }else{
                    lowest = false;
                    for(var shop of data.data[info.plain].list) if(!lowest || shop.price_new < lowest.price_new) lowest = shop;
                    price.lowest = lowest;
                    price.shops = data.data[info.plain].list;
                }
                price.url = data.data[info.plain].urls.game;
                info.price = price;
                info.collectInfo();
            }
        });
    },
    _getHistorical: function(info){
        var url = "https://api.isthereanydeal.com/v01/game/lowest/"+this.region+"/?key="+this.apiKey+"&plains="+info.plain;
        GM_xmlhttpRequest({
            method:"GET",
            url: url,
            onload: function(response){
                var data = JSON.parse(response.responseText);
                var historical = {success: true};
                if(data.data[info.plain].shop===undefined){
                    historical.price = null;
                    historical.cut = null;
                    historical.date = null;
                    historical.shop = null;
                    historical.success = false;
                }else{
                    historical.price = data.data[info.plain].price;
                    historical.cut = data.data[info.plain].cut;
                    historical.date = (new Date(data.data[info.plain].added*1000)).toLocaleDateString();
                    historical.shop = data.data[info.plain].shop.name;
                }
                historical.url = data.data[info.plain].urls.history;
                info.historical = historical;
                info.collectInfo();
            }
        });
    },
    _getBundeles: function(info){
        var url = "https://api.isthereanydeal.com/v01/game/bundles/"+this.region+"/?key="+this.apiKey+"&plains="+info.plain;
        GM_xmlhttpRequest({
            method:"GET",
            url: url,
            onload: function(response){
                var data = JSON.parse(response.responseText);
                var bundles = {success: true};
                bundles.count = data.data[info.plain].total;
                bundles.url = data.data[info.plain].urls.bundles;
                info.bundles = bundles;
                info.collectInfo();
            }
        });
    },
    _getInfo: function(info){
        var url = "https://api.isthereanydeal.com/v01/game/info/?key="+this.apiKey+"&plains="+info.plain;
        GM_xmlhttpRequest({
            method:"GET",
            url: url,
            onload: function(response){
                var reviewText = function(text){
                    switch(text){
                        case "Overwhelmingly Positive":
                            return {text:"압도적으로 긍정적",class:"GPIH_OverwhelminglyPositive"};
                        case "Very Positive":
                            return {text:"매우 긍정적",class:"GPIH_Very_Positive"};
                        case "Positive":
                            return {text:"긍정적",class:"GPIH_Positive"};
                        case "Mostly Positive":
                            return {text:"대체로 긍정적",class:"GPIH_Mostly_Positive"};
                        case "Mixed":
                            return {text:"복합적",class:"GPIH_Mixed"};
                        case "Mostly Negative":
                            return {text:"대체로 부정적",class:"GPIH_Mostly_Negative"};
                        case "Negative":
                            return {text:"부정적",class:"GPIH_Negative"};
                        case "Very Negative":
                            return {text:"매우 부정적",class:"GPIH_Very_Negative"};
                        case "Overwhelmingly Negative":
                            return {text:"압도적으로 부정적",class:"GPIH_Overwhelmingly_Negative"};
                    }
                };
                var data = JSON.parse(response.responseText);
                var rinfo = {success: true};
                if(data.data[info.plain].reviews === null){
                    rinfo.review = null;
                }else{
                    rinfo.review = {};
                    rinfo.review.total = data.data[info.plain].reviews.steam.total;
                    rinfo.review.percent = data.data[info.plain].reviews.steam.perc_positive;
                    rinfo.review.text = reviewText(data.data[info.plain].reviews.steam.text);
                }
                info.info = rinfo;
                info.collectInfo();
            }
        });
    }
};
var app = {
    _listbox : document.getElementsByClassName("steam_read_selected")[0],

    _coveredStore: ["steam","amazonus","gamersgate","greenmangaming","origin","uplay","indiegalastore","gamesplanet","indiegamestand","gog","dlgamer","humblestore","squenix","bundlestars","wingamestore"],
    _coveredStoreString: false,
    getStores : function(){
        if(!this._coveredStoreString){
            var stores = "";
            jQuery.each(this._coveredStore, function(index, value) {
                stores += value + ",";
            });
            this._coveredStoreString = stores;
        }
        return this._coveredStoreString;
    },
    _games: false,

    _gameListCheck: function(){
        return this._listbox !== undefined;
    },

    _addLoader: function(htmlElement){
        var loader = document.createElement("div");
        loader.className = "GPIH_loader";
        htmlElement.appendChild(loader);
    },

    _removeLoader : function(htmlElement){
        var loader = htmlElement.getElementsByClassName("GPIH_loader");
        if((loader.length > 0)) for (var i = loader.length - 1; i >= 0; i--) loader[i].parentNode.removeChild(loader[i]);
    },

    addPower: function(power, htmlElement){
        var powerMsg = "Powered by "+power;
        var wraper = document.createElement("div");
        wraper.className = "GPIH_powerWraper";
        var powerElem = document.createElement("p");
        powerElem.className = "GPIH_power";
        powerElem.textContent = powerMsg;
        wraper.appendChild(powerElem);
        htmlElement.appendChild(wraper);
    },

    _createGame: function(itcmGameListElement){
        var drawTooltipUI = function(game){
            var getHeaderImage = function(){
                var imageHolder = document.createElement("div");
                app._addLoader(imageHolder);
                var loadingImage = new Image();
                loadingImage.className = "GPIH_tooltipImageHeader";
                loadingImage.onload = function(){
                    app._removeLoader(imageHolder);
                    imageHolder.appendChild(loadingImage);
                };
                loadingImage.src = game.steamHeaderImage;
                return imageHolder;
            };
            var tooltip = document.createElement("div");
            tooltip.className = "GPIH_infoTooltip";
            tooltip.appendChild(getHeaderImage());
            
            var container = document.createElement("div");
            container.className = "GPIH_tooltipWraper GPIH_container";
            jQuery(container).append('<h2><a href="'+game.steamStore+'" target="_blank">'+game.title+'</a></h2>');
            app._addLoader(container);
            game.container = container;

            var itadWrapper = document.createElement("div");
            itadWrapper.className = "GPIH_itad GPIH_container";
            var itad = document.createElement("div");
            itadWrapper.appendChild(itad);
            app.addPower("IsThereAnyDeal.com",itadWrapper);
            game.itad = itad;

            container.appendChild(itadWrapper);
            tooltip.appendChild(container);
            app.addPower("Fowlox",tooltip);
            return tooltip;
        };
        
        var game = {
            itcmGameListElement : itcmGameListElement,
            loadTooltip : function(){
                this.itcmGameListElement.appendChild(this.tooltip);
                this.tooltip.style.top = (this.tooltip.offsetTop+49)+"px";
                this.tooltip.style.left = (this.tooltip.offsetLeft-400)+"px";
            }
        };
        game.title = game.itcmGameListElement.getElementsByClassName("name")[0].textContent;
        game.steamStore = game.itcmGameListElement.getElementsByClassName("name")[0].href;
        var spl = game.steamStore.split("/");
        game.steamId = spl[spl.length-1];
        game.steamType = spl[spl.length-2];
        game.steamHeaderImage = 'http://cdn.akamai.steamstatic.com/steam/apps/'+game.steamId+'/header.jpg';
        game.tooltip = drawTooltipUI(game);
        return game;
    },

    _getGames : function(){
        if(!this._games){
            var games = [];
            var no_mi_app = this._listbox.getElementsByClassName("no_mi_app"),mi_app = this._listbox.getElementsByClassName("mi_app");
            for(index=0; index<no_mi_app.length;index++) games=games.concat(this._createGame(no_mi_app[index]));
            for(index=0; index<mi_app.length;index++) games=games.concat(this._createGame(mi_app[index]));
            this._games = games;
        }
        return this._games;
    },

    _loadData : function(game, index, games){
        var loadITAD = new Promise(function(resolve, reject){
            itad.queryItem(game);
            resolve(true);
            // var res = {};
            // var err = {};
            // if(!res) reject(err);
            // else resolve(res);
        });
        loadITAD.then(function(res){}).catch(function(err){});
        loadData(game.tooltip, game.itcmGameListElement,game.steamId,game);
        game.loadTooltip();
    },

    run : function(){
        if(this._gameListCheck()){
            this._setCSS();
            this._getGames().forEach(this._loadData);
        }
    },

    _setCSS: function(){
        var getSheet = function(){
            var style = document.createElement("style");
            style.appendChild(document.createTextNode(""));
            document.head.appendChild(style);
            return style.sheet;
        };
        var sheet = getSheet();
        sheet.insertRule(".no_mi_app {position:relative;}");
        sheet.insertRule(".mi_app {position:relative;}");
        sheet.insertRule(".GPIH_infoTooltip {width: 400px; right: auto; background-color:#F5F5F5; border-radius: 6px; box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2); position: absolute; z-index: 1; visibility: hidden;}");
        sheet.insertRule(".no_mi_app:hover .GPIH_infoTooltip {visibility:visible}");
        sheet.insertRule(".mi_app:hover .GPIH_infoTooltip {visibility:visible}");
        sheet.insertRule(".GPIH_infoTooltip:hover {visibility:visible; box-shadow: 0 8px 16px 0 rgba(0,0,0,0.2)}");
        sheet.insertRule(".GPIH_tooltipImageHeader {width:100%}");
        sheet.insertRule(".GPIH_container {padding: 2px 16px;}");
        sheet.insertRule(".GPIH_tooltipWraper {text-align:center;}");
        sheet.insertRule(".GPIH_itad {text-align:left; border: 1px solid; border-color: #BDBDBD; border-radius: 3px;}");
        sheet.insertRule(".GPIH_newHistorical {color: #D50000}");
        sheet.insertRule(".GPIH_sameHistorical {color: #0091EA}");
        sheet.insertRule(".GPIH_count0 {color:#00C853}");
        sheet.insertRule(".clickable {font-weight:bold;}");
        sheet.insertRule(".itadButton {border: none;outline: 0;display: inline-block;padding: 8px; color: white;background-color: #000;text-align: center;cursor: pointer;width: 100%;font-size: 18px;}");
        sheet.insertRule(".itadButton:hover, .clickable:hover {opacity: 0.7;}");
        sheet.insertRule("@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }");
        sheet.insertRule(".GPIH_loader { border: 16px solid #f3f3f3; border-top: 16px solid #3498db; border-radius: 50%; width: 120px; height: 120px; margin:auto; animation: spin 2s linear infinite; }");
        sheet.insertRule(".GPIH_powerWraper {text-align:center}");
        sheet.insertRule(".GPIH_power {font-size:5px;opacity:0.6}");
        sheet.insertRule(".GPIH_alert {color: red;}");
    }
};

var stores = ["steam","amazonus","gamersgate","greenmangaming","origin","uplay","indiegalastore","gamesplanet","indiegamestand","gog","dlgamer","humblestore","squenix","bundlestars","wingamestore"];
function loadData(tooltip,itcmGameListElement,id,game){
    // var container = tooltip.getElementsByClassName("container")[0];
    var success = function(res){
        // var data = JSON.parse(res);
        var container = tooltip.getElementsByClassName("container")[0];
        if(res === null){
            jQuery(container).append('<p>불러오는데 실패했습니다 ;(</p>');
            return;
        }
        app._removeLoader(game.container);
        jQuery(game.container).append('<p>현재 최저가: $'+res.price.price+'(-'+res.price.cut+'%) -> <a class="lowest_store clickable" href="'+res.price.url+'" target="_blank">'+res.price.store+'</a></p>');
        record = new Date(res.lowest.recorded*1000);
        jQuery(game.container).append('<p>역대 최저가: $'+res.lowest.price+'(-'+res.lowest.cut+'%) -> <span class="lowest_store">'+res.lowest.store+'</span> | '+record.toLocaleDateString()+'</p>');
        jQuery(game.container).append('<p>번들 횟수: <span class="count_'+res.bundles.count+'">'+res.bundles.count+'</span></p>');
        jQuery(game.container).append('<p><a class="clickable" href="'+res.urls.info+'" target="_blank"><button class="itadButton">IsThereAnyDeal 확인하러 가기</button></a>');
    };
    var fail = function(jajax, status, error){
        app._removeLoader(game.container);
        jQuery(game.container).append('<p>불러오는데 실패했습니다 ;(</p>');
    };
    // var name = app.getElementsByClassName("name")[0].textContent;
    // jQuery(tooltip).append('<img class="tooltipImageHeader" src="http://cdn.akamai.steamstatic.com/steam/apps/'+id+'/header.jpg" alt=""><div class="container"><h4><a href="'+app.getElementsByClassName("name")[0].href+'" target="_blank">'+name+'</a></h4><p class="loading">불러오는 중...</p></div>');
    // url = "//api.isthereanydeal.com/v02/game/plain/?key=397b5c0da6342ca3e136345f2711ce060314a122&shop=steam&game_id=app%2F"+id+"&callback=?";
    // var storestring = "";
    // jQuery.each(stores, function(index, value) {
    //     storestring += value + ",";
    // });
    var url = "//api.enhancedsteam.com/pricev2/?search=app/" + id + "&stores=" + app.getStores() + "&cc=ko&coupon=true";
    var jajax = jQuery.ajax(url);
    jajax.done(success);
    jajax.fail(fail);
    return jajax;
}

app.run();