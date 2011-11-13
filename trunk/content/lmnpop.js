var lmnpop = {
    url : "",
    lmn : null,
    lmnID : null,
    istoloadpage : false,
    winlite : false,
    allowmove : false,
    hWnd : null,
    browser : null,
    toolbox : null,
    moving : false,
    clickClientX : 0,
    clickClientY : 0,
    oriClientWidth : 600,
    oriClientHeight : 450,
    isOnTopBefBlur : false,
    isVideoAdjusted : false,

    init : function () {
        if (window.arguments.length < 1) {
            return;
        }

        lmnpop.setLoading(true);
        var args = window.arguments[0].wrappedJSObject;
        lmnpop.lmn = args['lmn'];
        lmnpop.lmnID = args['lmnid'];
        lmnpop.allowmove = args['allowmove'];
        lmnpop.istoloadpage = args['loadpage'];
        lmnpop.url = args['url'];
        lmnpop.winlite = args['winlite'];
        lmnpop.getVideoOriSize(args['asvideosize'], args['width'], args['height']);
        lmnpopHistory = args['lmnpopHistory'];

        //tool menu for Firefox 3.6 and later
        window.addEventListener ("keydown", function(vnt){
            if (vnt.altKey && vnt.keyCode == 77) {  //Alt+M
                lmnpop.showMenu(true);
                return false;
            } else if(vnt.keyCode == 27 && !vnt.ctrlKey && !vnt.shiftKey) {  //ESC
                lmnpop.winMax(false);
                return false;
            } else {
                return true;
            }
        }, true);
        
        //tool box for Firefox 4
        lmnpop.toolbox = document.getElementById('lp-toolbox');
        lmnpop.toolbox.setAttribute('topmost', false);
        if(args['toolboxcolor'])
            lmnpop.toolbox.style.backgroundColor = args['toolboxcolor'];
        lmnpop.alwaysOnTop(args['ontop'] ? true : false);
        if (args['ontop'] && !lmnpop.isOnTop() ) {
            //set ontop to false when failure
            lmnpopPref.setValue('ontop', false);
        }
        
        //document title must be set after alwaysOnTop because of FindWindowW
        if (args['title'])
            document.title = args['title'];

        //lite window
        lmnpop.toolbox.setAttribute('winlite', lmnpop.winlite ? 'yes' : 'no');
        if (lmnpop.winlite) {
            lmnpop.toolbox.setAttribute('sizemode', 'normal');
            //Double click
            lmnpop.toolbox.addEventListener ("dblclick", function(){lmnpop.winMax(!lmnpop.isWinMaximized());}, false);
        }

        //Min button position
        var minBtn = document.getElementById('lp-min');
        minBtn.style.marginLeft = (window.innerWidth - 175) + 'px';
        window.onresize = function () {
            minBtn.style.marginLeft = (window.innerWidth - 175) + 'px';
            //in case video has parent node
            if (!lmnpop.isVideoAdjusted && lmnpop.lmn && lmnpop.lmn.hasChildNodes()) {
                lmnpop.adjustChildVideo(lmnpop.lmn);
                lmnpop.isVideoAdjusted = true;
            }
        }

        //Allow moving window
        window.addEventListener("mousedown", lmnpop.msdown, false);
        //Focus
        window.onfocus = function () {
            //in case minimized
            if (lmnpop.isOnTopBefBlur) {
                lmnpop.alwaysOnTop(true, true);
                lmnpop.isOnTopBefBlur = false;
            }
        }
        window.onblur = function() {
            if (!lmnpop.isOnTopBefBlur)
                lmnpop.isOnTopBefBlur = lmnpop.isOnTop();
        }

        //set browser src
        lmnpop.browser = document.getElementById('lp-browser');
        lmnpop.setBrowserSrc(lmnpop.istoloadpage);
        lmnpop.browser.addEventListener('DOMContentLoaded', lmnpop.loadBrowserContent, false);
    },

    setLoading : function(value) {
        document.getElementById('lmnpop').setAttribute('loading', value);
    },

//    switchLoadMode : function(istoload) {
//        if (lmnpop.istoloadpage == istoload)
//            return;
//
//        lmnpop.istoloadpage = istoload;
//        lmnpopPref.setLoadPage(lmnpop.url, lmnpop.istoloadpage);
//        lmnpop.setBrowserSrc(lmnpop.istoloadpage);
//    },

    setBrowserSrc : function(istoload) {
        lmnpop.toolbox.setAttribute('loadpage', istoload);
        if (istoload) {
            lmnpop.browser.setAttribute('src', lmnpop.url);
            lmnpop.browser.addEventListener('DOMTitleChanged', function(){
                //Set loading when changing to next video automatically
                var head = window.content.document.querySelector("head");
                if (head && head.getAttribute('bodyhidden') != 'true') {
                    lmnpop.setLoading(true);
                }
            }, false);
        } else {
            lmnpop.browser.setAttribute('src', 'about:blank');
        }
    },

    loadBrowserContent : function(event) {
        var doc = event.originalTarget;
        var view = doc.defaultView;
        if (! doc instanceof HTMLDocument || !view || view.top != view)
            return;

        var htm = doc.documentElement;
        var body = doc.body;
        htm.setAttribute('style', 'height:100%;');
        body.setAttribute('style', 'margin:0;');
        body.style.display = 'none';

        //Get video object
        var video;
        if (lmnpop.istoloadpage) {
            lmnpop.url = doc.URL;   //for continuous playing
            video = lmnpop.lmnID ? doc.getElementById(lmnpop.lmnID) : lmnpop.lmn;
            var head = doc.querySelector("head");
            if (head) {
                head.setAttribute('bodyhidden', true);
            }
        } else {
            video = lmnpop.lmn;
        }
        
        if (video) {
            if (video.tagName) {
                //Append and refresh video element
                lmnpop.lmn = video = lmnpop.changeVideoAttrs(video);
            } else {
                //Document fragment
                lmnpop.lmn = video = lmnpop.lmn.lastChild;
            }
            
            video.setAttribute('style', 'margin:0;display:block;overflow:auto;width:100%;height:99%;');
            video = htm.appendChild(doc.adoptNode(video));
            window.setTimeout(function(){
                lmnpop.setLoading(false);
                video.style.height = "100%";
            }, lmnpop.getVideoDelayedTime());
            lmnpop.toolbox.setAttribute('tooltiptext', document.title);
            if (lmnpopPref.getValue('savehistory'))
                lmnpop.saveHistory();
        } else {
            if (lmnpop.lmn) {
                //delete host from load page list
                lmnpopPref.setLoadPage(lmnpop.url, false);
            } else {
                //context menu to open link
                lmnpop.restoreTab();
            }
        }
    },
    
    getOuterHTML : function(ele) {
        var a=ele.attributes, str="<"+ele.tagName;
        for(var i=0;i<a.length;i++) 
            if(a[i].specified) 
                str+=" "+a[i].name+'="'+a[i].value+'"'; 
        if(/^(area|base|basefont|col|frame|hr|img|br|input|isindex|link|meta|param)$/.test(ele.tagName.toLowerCase())) 
            return str+" />"; 
        return str+">"+ele.innerHTML+"</"+ele.tagName+">";   
    },
    
    saveHistory : function() {
        try {
            var args = [];
            if (lmnpop.historyID) {
                args['id'] = lmnpop.historyID;
                args['title'] = document.title;
                args['url'] = lmnpop.url;
                args['embedHTML'] = lmnpop.getOuterHTML(lmnpop.lmn);
                lmnpopHistory.update(args);
            } else {
                args['id'] = null;
                args['title'] = document.title;
                args['url'] = lmnpop.url;
                args['loadpage'] = lmnpop.istoloadpage;
                args['embedHTML'] = lmnpop.getOuterHTML(lmnpop.lmn);
                args['embedWidth'] = lmnpop.oriClientWidth;
                args['embedHeight'] = lmnpop.oriClientHeight;
                lmnpopHistory.insert(args, function(id){
                    lmnpop.historyID = id;
                });
            }
        } catch(ex) {
        }
    },

    getVideoDelayedTime : function() {
        return lmnpop.url.indexOf('www.tudou.com') != -1 ? 1500 : 500;
    },

    getVideoOriSize : function(asVideoSize, width, height) {
        if (lmnpop.url.indexOf('v.ifeng.com') != -1 && lmnpop.url.indexOf('v.ifeng.com/live') == -1
            || lmnpop.url.indexOf('v.pptv.com') != -1) {
            lmnpop.oriClientWidth = 560;
            lmnpop.oriClientHeight = 420;
        } else if (lmnpop.url.indexOf('v.163.com') != -1) {
            lmnpop.oriClientWidth = 600;
            lmnpop.oriClientHeight = 481;
        } else {
            if (width) {
                lmnpop.oriClientWidth = width;
                lmnpop.oriClientHeight = height;
                if(lmnpop.url.indexOf('www.tudou.com') != -1 && lmnpop.oriClientHeight < 500) {
                    lmnpop.oriClientWidth = 600;    //two sides ad
                }
            } else {
                lmnpop.oriClientWidth = 600;
                lmnpop.oriClientHeight = 450;
            }
        }

        if (asVideoSize)
            lmnpop.oriSize();
    },

    changeVideoAttrs : function(lmn) {
        var doc = lmn.ownerDocument;
        if (doc.title != '') {
            document.title = doc.title;
        }
            
        lmnpop.isVideoAdjusted = false;
        lmn = lmnpop.changeVideoToEmbed(lmn);
        var src = lmn.getAttribute('src');
        var flashvars;
        var matches;
        if (lmn.nodeName.toUpperCase() != 'EMBED' || !src) {
            if (lmnpop.url.indexOf('v.pptv.com') != -1) {
                var obj = lmn.childNodes[0];
                var embed = lmnpop.changeVideoToEmbed(obj);
                lmn.removeChild(obj);
                lmn = lmn.appendChild(embed);
                src = lmn.getAttribute('src');
                flashvars = lmn.getAttribute('flashvars');
                lmn.setAttribute('flashvars', flashvars.replace(/vw=\d+&vh=\d+/,'vw=560&vh=420'));
            } else {
                lmnpop.adjustChildVideo(lmn);
                return lmn;
            }
        }

        if (src.indexOf("/player.ku6cdn.com/default/common/player/") != -1) {
            //To process the outside swf of ku6.com
            if (matches = lmn.getAttribute('flashvars').match(/vid=([^&]*)/)){
                lmn.setAttribute('src', 'http://player.ku6.com/refer/' + matches[1] + '/v.swf&auto=1');
            } 
        } else if (src. indexOf("/") == 0) {
            if (matches = lmnpop.url.match(/(https?:\/\/.*?)\//i)) {
                lmn.setAttribute('src', matches[1] + src.replace("//", "/"));
            }
        } else if (src.indexOf("http://player.youku.com/player.php/") != -1) {
            //To process the full screen and autoPlay of Youku.com
            flashvars = lmn.getAttribute('flashvars');
            if (flashvars == null)
                flashvars = '';
            lmn.setAttribute('flashvars', flashvars + '&isAutoPlay=true&winType=interior');
        } else if (src.indexOf("http://js.tudouui.com/bin/player_online/TudouVideoPlayer_Homer") != -1
                || src.indexOf("http://www.tudou.com/") != -1) {
            //To process two side ads and autoPlay of Tudou.com
            flashvars = lmn.getAttribute('flashvars');
            if (flashvars == null)
                flashvars = '';
            lmn.setAttribute('flashvars', flashvars + '&scale=1&autoPlay=true');
        } else if (src.indexOf("http://img1.cache.netease.com/v/player/OlyVPlayer") != -1)  {
            //To process the 163 video
            if (matches = lmnpop.url.match(/http:\/\/v\.163\.com\/video\/.*\/(\w+)\.html/)) {
                lmn.setAttribute('src', 'http://img1.cache.netease.com/flvplayer081128/~true~0085_' + matches[1] + '~.swf');
                lmn.setAttribute('wmode', 'transparent');
            }
        } else if (src.indexOf("http://p.you.video.sina.com.cn/swf/bokePlayer") != -1) {
            //To process the sina video
            var pic = doc.querySelector('li.cur img');
            if (matches = pic.getAttribute('src').match(/http:\/\/.*\/(\d+_\d+)\.jpg/)) {
                lmn.setAttribute('src', 'http://you.video.sina.com.cn/api/sinawebApi/outplayrefer.php/vid=' + matches[1] + '&autoPlay=1/s.swf');
                lmn.setAttribute('flashvars', '');
            }
        } else if (src.indexOf("img.ifeng.com/swf") != -1) {
            //To process v.ifeng.com/v
            flashvars = lmn.getAttribute('flashvars');
            if (matches = flashvars.match(/guid=(.+)&from/)) {
                lmn.setAttribute('src', 'http://v.ifeng.com/include/exterior.swf?guid=' + matches[1] + "&AutoPlay=true");
                lmn.setAttribute('wmode', 'opaque');
                lmn.setAttribute('flashvars', flashvars.replace('ADPlay=true','ADPlay=false'));
            }
        }

        //Set video wmode
        var wmode = lmn.getAttribute('wmode');
        if (!wmode || wmode == 'window' || wmode == 'direct') {
            lmn.setAttribute('wmode', 'opaque');
        }
        lmn.setAttribute("classid", "java:lmnpop");     //in case flashblock
        lmnpop.isVideoAdjusted = true;
        return lmn;
    },
    
    adjustChildVideo : function(lmn) {
        lmn.className = '';
        var children = lmn.childNodes;
        for(var j=0; j<children.length; ++j) {
            if (children[j].nodeName.toUpperCase() == 'EMBED') {
                var wmode = children[j].getAttribute('wmode');
                if (!wmode || wmode == 'window' || wmode == 'direct') {
                    children[j].setAttribute('wmode', 'opaque');
                }
                children[j].setAttribute("classid", "java:lmnpop");     //in case flashblock
                children[j].setAttribute('style', 'margin:0;display:block;overflow:auto;width:100%;height:100%;');
                break;
            }
        }
    },

    changeVideoToEmbed: function (lmn) {
        if (lmn.nodeName.toUpperCase() != 'OBJECT') {
            return lmn;
        }

        var embed;
        var ownerDoc = lmn.ownerDocument;
        var children = lmn.childNodes;
        for(var j=0; j<children.length; ++j) {
            if (children[j].nodeName.toUpperCase() == 'EMBED') {
                embed = children[j].cloneNode(true);
                break;
            }
        }

        if (!embed) {
            embed = ownerDoc.createElement('embed');
            for(var i=0; i<children.length; ++i) {
                if (children[i].nodeName.toUpperCase() == 'PARAM') {
                    embed.setAttribute(children[i].getAttribute('name'), children[i].getAttribute('value'));
                }
            }
            embed.setAttribute('type', "application/x-shockwave-flash");
            embed.setAttribute('src', lmn.getAttribute('data'));
        }

        if (embed.id == '') {
            embed.id = (lmn.id == '' ? 'lmnpopPlayer' : lmn.id);
        }
        return embed;
    },

    msdown : function(vnt) {
        if (vnt.button == 0) {
            if (vnt.shiftKey) {
                lmnpop.alwaysOnTop(false);
            }

            if (lmnpop.winlite && vnt.clientY < 20 ||
                lmnpop.allowmove && vnt.clientY < window.innerHeight - 40) {
                lmnpop.moving = true;
                lmnpop.clickClientX = vnt.screenX - window.screenX;
                lmnpop.clickClientY = vnt.screenY - window.screenY;
                window.addEventListener("mousemove", lmnpop.msmove, false);
                window.addEventListener("mouseup", lmnpop.msup, false);
            }
        }
    },

    msmove : function(vnt) {
        if (lmnpop.moving) {
            window.moveTo(vnt.screenX - lmnpop.clickClientX, vnt.screenY - lmnpop.clickClientY);
        }
    },

    msup : function(vnt) {
        lmnpop.moving = false;
        window.removeEventListener("mousemove", lmnpop.msmove, false);
        window.removeEventListener("mouseup", lmnpop.msup, false);
    },

    oriSize : function() {
        window.innerWidth = lmnpop.oriClientWidth;
        window.innerHeight = lmnpop.oriClientHeight;
    },

    restoreTab : function() {
        var gBrowser = window.opener.gBrowser;
        if (gBrowser) {
            var num = gBrowser.browsers.length;
            var found = false;
            for (var i = 0; i < num; i++) {
                var doc = gBrowser.getBrowserAtIndex(i).contentDocument;
                var blockNode;
                if (lmnpop.url == doc.URL && (blockNode=doc.getElementById(window.name))) {
                    gBrowser.selectedTab = gBrowser.tabContainer.childNodes[i];
                    blockNode.click();
                    found = true;
                    break;
                }
            }

            if (!found) {
                gBrowser.selectedTab = gBrowser.addTab(lmnpop.url);
                window.close();
            }
        } else {
            var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                            .getService(Components.interfaces.nsIWindowMediator);
            var mainWindow = wm.getMostRecentWindow("navigator:browser");
            if (mainWindow) {
                mainWindow.gBrowser.selectedTab = mainWindow.gBrowser.addTab(lmnpop.url);
            } else {
                window.open(lmnpop.url);
                window.close();
            }
        }
    },

    isOnTop : function() {
        return lmnpop.toolbox.getAttribute('topmost') == 'true';
    },

    alwaysOnTop : function(topMost, force) {
        if (lmnpop.isOnTop() == topMost && !force)
            return;

        try {
            Components.utils.import("resource://gre/modules/ctypes.jsm");
            var lib = ctypes.open("user32.dll");
            var afterFx4 = ctypes.jschar ? true : false;
            var winABI = afterFx4 ?  (ctypes.size_t.size == 8 ? ctypes.default_abi : ctypes.winapi_abi) : ctypes.stdcall_abi;
            var wstrType = afterFx4 ? ctypes.jschar.ptr : ctypes.ustring;
            var winClass = afterFx4 ? "MozillaWindowClass" : "MozillaUIWindowClass";

            if (!lmnpop.hWnd) {
                var funcFindWindow = lib.declare("FindWindowW",
                                                winABI,
                                                ctypes.int32_t,
                                                wstrType,
                                                wstrType);

                lmnpop.hWnd = funcFindWindow(winClass, document.title);
            }

            if (lmnpop.hWnd) {
                var funcSetWindowPos = lib.declare("SetWindowPos",
                                                winABI,
                                                ctypes.bool,
                                                ctypes.int32_t,
                                                ctypes.int32_t,
                                                ctypes.int32_t,
                                                ctypes.int32_t,
                                                ctypes.int32_t,
                                                ctypes.int32_t,
                                                ctypes.uint32_t);

                var hwndAfter = -2;
                if (topMost)
                    hwndAfter = -1;

                funcSetWindowPos(lmnpop.hWnd, hwndAfter, 0, 0, 0, 0, 19);
                lmnpop.toolbox.setAttribute('topmost', topMost);
            }
        } catch (ex) {
            if (lib) {
                alert(ex);
            } 
        } finally {
            if (lib) {
                lib.close();
            }
        }
    },

    isWinMaximized : function() {
        return lmnpop.toolbox.getAttribute('sizemode') == 'maximized';
    },

    winMin : function() {
        window.minimize();
    },

    winMax : function(toMax) {
        if (lmnpop.isWinMaximized() == toMax)
            return;

        if (toMax) {
            lmnpop.toolbox.setAttribute('sizemode', 'maximized');
            window.maximize();
        } else {
            lmnpop.toolbox.setAttribute('sizemode', 'normal');
            window.restore();
        }
    },

    winClose : function() {
        window.close();
    },
    
    showMenu : function() {
        var menu = document.getElementById('lp-menu');
        menu.childNodes[0].setAttribute("checked", lmnpop.isOnTop());
        menu.childNodes[7].setAttribute("checked", lmnpop.isWinMaximized());
        menu.openPopup(null, "after_end", 0, 0, false, false);
    }
};

window.addEventListener('load', lmnpop.init, false);