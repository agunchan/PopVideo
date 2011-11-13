var lmnpopFx = {
    openedWins : [],
    targetLmn : null,
    
    init : function(event) {        
        document.getElementById('contentAreaContextMenu').addEventListener('popupshowing', function(){
            //Pop up to hide item and icons if needed
            var popvideoMenu = document.getElementById('lmnpop-ctxmnu');
            var poplinkItem = document.getElementById('lmnpop-ctxitm');

            var showMenuIcons = lmnpopFx.pget('menuicons');
            popvideoMenu.className = showMenuIcons ? 'menu-iconic' : '';
            poplinkItem.className = showMenuIcons ? 'menuitem-iconic' : '';

            popvideoMenu.setAttribute('hidden', !lmnpopFx.pget('contextmenu'));
            if (lmnpopFx.pget('contextmenuitem') && gContextMenu.onLink
                && lmnpopFx.pgetLmnId(gContextMenu.linkURL)) {
                poplinkItem.setAttribute('hidden', false);
            } else {
                poplinkItem.setAttribute('hidden', true);
            }
        }, false);

        gBrowser.addEventListener('DOMContentLoaded', function(event){
            var htmlDocument = event.originalTarget;
            if (! htmlDocument instanceof HTMLDocument || !lmnpopFx.pget('videobutton')) {
                return;
            }

            var videobtn;

            htmlDocument.addEventListener('mouseover', function(ev) {
                var lmn = ev.originalTarget;
                if (lmn instanceof HTMLEmbedElement || lmn instanceof HTMLObjectElement) {
                    lmnpopFx.targetLmn = lmn;
                    lmnpopFx.targetLmn.addEventListener('mouseout', function() {
                        videobtn.style.opacity = 0;
                        this.removeEventListener('mouseout', arguments.callee, false);
                    }, false);

                    if (!videobtn) {
                        videobtn = lmnpopFx.addVideoBtn(htmlDocument);
                    }
                    var rect = lmn.getBoundingClientRect();
                    videobtn.style.left = rect.left + rect.width + 'px';
                    videobtn.style.top  = rect.top + 'px';
                    videobtn.style.opacity = 1;
                }
            }, false);
        }, false);
    },

    openVideoDlg : function(lmn, vnt) {
        if (!lmn || !lmn instanceof Node) {
            return;
        }

        var id = lmnpopFx.openLmnPop(lmn, lmn.ownerDocument.URL, vnt);
        if((lmnpopFx.pget( 'close') ^ (vnt && vnt.ctrlKey)) && !gBrowser.mCurrentTab.pinned)
            gBrowser.removeCurrentTab();
        else if(!lmnpopFx.pget( 'clone'))
            lmnpopFx.blockVideo(lmn, id);
    },

    openLmnPop : function(lmn, url, vnt, hisArgs) {
        var args = [];
        var pLmnid = url ? lmnpopFx.pgetLmnId(url) : lmnpopFx.pgetLmnId(hisArgs['url']);
        if (hisArgs) {
            //pop video from hisory
            args['url'] = url = hisArgs['url'];;
            args['loadpage'] = hisArgs['loadpage'];
            args['title'] = hisArgs['title'];
            if (pLmnid) {
                args['lmn'] = null;
            } else {
                let range=document.commandDispatcher.focusedWindow.document.createRange();
                let fragment = range.createContextualFragment(hisArgs['embedHTML']);
                args['lmn'] = fragment;
            }
            args['lmnid'] = pLmnid;
            args['width'] = hisArgs['embedWidth'];
            args['height'] = hisArgs['embedHeight'];
        } else if (lmn) {
            //pop video from page
            args['url'] = url;
            args['loadpage'] = (pLmnid != null) || lmnpopFx.pgetIsToLoad(url);
            args['lmn'] = lmn.cloneNode(true);
            args['lmnid'] = pLmnid || lmn.id;
            let rect = lmn.getBoundingClientRect();
            args['width'] = rect.width;
            args['height'] = rect.height;
        } else if (url) {
            //pop up target link
            args['url'] = url;
            args['loadpage'] = true;
            args['lmn'] = null;
            args['lmnid'] = pLmnid;
            args['width'] = 0;
            args['height'] = 0;
        } 
        args['lmnpopHistory'] = lmnpopHistory;
        args['ontop'] = lmnpopFx.pget('ontop') ^ (vnt && vnt.shiftKey);
        args['toolboxcolor'] = lmnpopFx.pget('toolboxcolorused') ? lmnpopFx.pget('toolboxcolor') : false;
        args['allowmove'] = lmnpopFx.pget('allowmove');
        args['winlite'] = lmnpopFx.pget('winlite');
        args['asvideosize'] = lmnpopFx.pget('asvideosize') || lmnpopFx.pgetNonResizable(url);
        args.wrappedJSObject = args;

        var id = 'lmnpop_' + new Date().getTime();
        if(lmnpopFx.pget('singleton')) {
            for (var i=0; i<lmnpopFx.openedWins.length; ++i)
                lmnpopFx.openedWins[i].close();
            lmnpopFx.openedWins.length = 0;
        }
        lmnpopFx.openedWins.push(openDialog('chrome://lmnpop/content/lmnpop.xul', id,
            'resizable,dialog=no,scrollbars=no' + (args['winlite'] ? ',titlebar=no' : ''), args));
        return id;
    },

    addVideoBtn : function(doc) {
        var videobtn = doc.createElement('img');
        videobtn.id = 'lp_video_button';
        videobtn.title = 'Click here to popup video';
        videobtn.addEventListener('mouseover', function() {
            this.style.opacity = 1;
        }, false);
        videobtn.addEventListener('mouseout', function() {
            this.style.opacity = 0;
        }, false);
        videobtn.addEventListener('click', function(event){
            this.style.left = '-100px';
            this.style.top  = '-100px';
            lmnpopFx.openVideoDlg(lmnpopFx.targetLmn, event);
        }, false);
        videobtn.style.cssText = 'width: 18px; height: 18px; z-index: 9999;\
                border-style: none; cursor: pointer; \
                background: url("chrome://lmnpop/skin/videobtn.png") no-repeat center;\
                position:fixed; left:-100px; top:-100px; opacity:0;\
                -moz-transition-property: opacity; -moz-transition-duration: 0.5s; -moz-transition-timing-function: linear;';
        doc.body.appendChild(videobtn);
        return videobtn;
    },

    blockVideo : function(lmn, id) {
        if (lmn.parentNode.nodeName.toUpperCase() == 'OBJECT') {
            lmn = lmn.parentNode;
        }
        var block = document.createElement('div');
        block.id = id;
        block.style.cssText = 'border-style: none; cursor: pointer; \
                background: url("chrome://lmnpop/skin/icon64.png") no-repeat center;';
        var rect = lmn.getBoundingClientRect();
        block.style.width = (rect.width > 64 ? rect.width : 64) + 'px';
        block.style.height = (rect.height > 64 ? rect.height : 64) + 'px';
        block.onclick = function (e) {
            if (e.button == 0) {
                e.target.parentNode.removeChild(e.target);
                lmn.style.display = 'block';
                //Close popup window
                for(var i=0; i<lmnpopFx.openedWins.length; ++i){
                    if(lmnpopFx.openedWins[i].name == id) {
                        lmnpopFx.openedWins[i].close();
                    }
                }
            }
        };
        lmn.parentNode.insertBefore(block, lmn);
        lmn.style.display = 'none';
    },

    pgetNonResizable : function(url) {
        var arrays = lmnpopFx.pget('nonresizable').split(',');
        for (var i=0; i<arrays.length; ++i) {
            if (arrays[i] != '' && url.indexOf(arrays[i]) != -1) {
                return true;
            }
        }

        return false;
    },

    pgetIsToLoad : function(url) {
        var arrays = lmnpopFx.pget('loadpagelist').split(',');
        for (var i=0; i<arrays.length; ++i) {
            if (arrays[i] != '' && url.indexOf(arrays[i]) != -1) {
                return true;
            }
        }

        return false;
    },

    pgetLmnId : function(url) {
        var lmnid = lmnpopFx.pget('lmnidlist').split(',');
        for (var i=0; i<lmnid.length; ++i) {
            var hostAndId = lmnid[i].split('#');
            if (url.indexOf(hostAndId[0]) != -1) {
                return hostAndId[1];
            }
        }

        return null;
    },

    fill : function(mp){
        var bsp = lmnpopFx.pget('blink.speed');
        var bst = bsp > 0 && lmnpopFx.pget('blink.style');
        var lms = lmnpopFx.pickElements();
        lms.forEach(function(lmn){
            var mi = lmnpopFx.createMI(mp,
            {
                label: lmnpopFx.format(lmn),
                crop: 'center',
                oncommand: 'lmnpopFx.openVideoDlg(this.lmn, event)'
            });
            mi.lmn = lmn;
            bst && mi.addEventListener('DOMMenuItemActive', blink, false);
        });
        if(lms.length){
            mp.appendChild(document.createElement('menuseparator'));
            if(lms.length > 1){
                lmnpopFx.createMI(mp,
                {
                    label: 'Pop All',
                    accesskey: 'A',
                    oncommand: 'this.lms.forEach(function(lm) lmnpopFx.openVideoDlg(lm, event))'
                }).lms = lms;
            }
        }
        lmnpopFx.createMI(mp,
        {
            label: 'Options',
            accesskey: 'O',
            oncommand: 'openDialog("chrome://lmnpop/content/options.xul", "lmnpopOptions", "resizable=no").focus();'
        });

        function blink(){
            var lmn = this.lmn, stl = lmn.style, i = 6;
            window.setTimeout(function loop(){
                if (--i < 0) {
                    return;
                }
                else {
                    window.setTimeout(loop, bsp);
                    stl.outline = (i & 1 == 1) ? bst : 'none';
                }
            }, 0);
            lmn.scrollIntoView(false);
        }
    },

    pickElements : function(){
        var lms = [];
        var doc = document.commandDispatcher.focusedWindow.document;
        var els = doc.evaluate(lmnpopFx.pget('xpath'), doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        for (var j = 0; j < els.snapshotLength; ++j) {
            var lm = els.snapshotItem(j);
            if (lm.style.display != 'none' && lm.parentNode.style.display != 'none')
                lms.push(lm);
        }
        return lms;
    },

    pget : function(key){
        const PS = gPrefService;
        switch(PS.getPrefType(key = 'extensions.lmnpop.'+ key)){
            case PS.PREF_STRING:
                return PS.getComplexValue(key, Ci.nsISupportsString).data;
            case PS.PREF_BOOL:
                return PS.getBoolPref(key);
            case PS.PREF_INT:
                return PS.getIntPref(key);
        }
    },

    format : function(lmn){
        return lmnpopFx.pget('format').replace(/{.+?}/g, function($){
            for(let [, k] in new Iterator($.slice(1, -1).split('|'))){
                let v = lmn[k];
                if(v)
                    return String(v).replace(/^http:.*\/(.*)/, '$1').split('?')[0];
            }
            return '';
        });
    },
    
    createMI : function(mp, atrs) {
        var mi = document.createElement('menuitem');
        for(var k in atrs) 
            mi.setAttribute(k, atrs[k]);
        return mp.appendChild(mi);
    },
    
    openPageVideoDlg : function(vnt) {
        var doc = document.commandDispatcher.focusedWindow.document;
        var url = doc.URL;
        var pLmnid = lmnpopFx.pgetLmnId(url);
        if (pLmnid) {
            lmnpopFx.openVideoDlg(doc.getElementById(pLmnid), vnt);
        } else {
            var els = doc.evaluate(lmnpopFx.pget('xpath'), doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
            if (els.snapshotLength > 0) {
                lmnpopFx.openVideoDlg(els.snapshotItem(0), vnt);
            }
        }
    },
    
    openOptionsDlg : function() {
        window.openDialog("chrome://lmnpop/content/options.xul", "lmnpopOptions", "chrome,modal=yes,resizable=no").focus();
    },
    
    trimString : function(str) {
        return str.length > 20 ? str.substring(0, 20) + '...' : str;
    },
    
    showHistory : function(mp) {
        if (!lmnpopHistory.changed) {
            return;
        }
        
        while(mp.childNodes.length>3) 
            mp.removeChild(mp.lastChild);
        var sepAdded = false;
        lmnpopHistory.query(function(row)
        {
            if (!sepAdded) {
                mp.appendChild(document.createElement('menuseparator'));
                sepAdded = true;
            }
            var args = [];
            args['id'] = row.getResultByName('id');
            args['title'] = row.getResultByName('title');
            args['url'] = row.getResultByName('url');
            args['loadpage'] = row.getResultByName('loadpage');
            args['embedHTML'] = row.getResultByName('embedHTML')
            args['embedWidth'] = row.getResultByName('embedWidth')
            args['embedHeight'] = row.getResultByName('embedHeight');
            var mi = lmnpopFx.createMI(mp,
            {
                label: lmnpopFx.trimString(args['title']),
                tooltiptext : args['title'] + '\n' + args['url'],
                oncommand: "lmnpopHistory.del(this.args['id']);lmnpopFx.openLmnPop(null,null,null,this.args);"
            });
            mi.args = args;
        });
    },
    
    clearHistory : function(mp) {
        lmnpopHistory.clear();
    }
};

window.addEventListener('load', lmnpopFx.init, false);

