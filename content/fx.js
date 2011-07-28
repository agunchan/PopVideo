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
        if((lmnpopFx.pget( 'close') ^ vnt.ctrlKey) && !gBrowser.mCurrentTab.pinned)
            gBrowser.removeCurrentTab();
        else if(!lmnpopFx.pget( 'clone'))
            lmnpopFx.blockVideo(lmn, id);
    },

    openLmnPop : function(lmn, url, vnt) {
        var args = [];
        var pLmnid = lmnpopFx.pgetLmnId(url);
        if (lmn) {
            args['url'] = url;
            args['istoloadpage'] = (pLmnid != null) || lmnpopFx.pgetIsToLoad(url);
            args['lmn'] = lmn.cloneNode(true);
            args['lmnid'] = pLmnid || lmn.id || lmn.parentNode.id;
            args['lmnrect'] = lmn.getBoundingClientRect();
        } else if (url) {
            args['url'] = url;
            args['istoloadpage'] = true;
            args['lmn'] = null;
            args['lmnid'] = pLmnid;
            args['lmnrect'] = null;
        }
        args['ontop'] = lmnpopFx.pget('ontop') ^ vnt.shiftKey;
        args['toolboxcolor'] = lmnpopFx.pget('toolboxcolorused') ? lmnpopFx.pget('toolboxcolor') : false;
        args['allowmove'] = lmnpopFx.pget('allowmove');
        args['winlite'] = lmnpopFx.pget('winlite') && url.indexOf('www.letv.com') == -1;
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
                background: url("chrome://lmnpop/skin/icon-64.png") no-repeat center;';
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

    fill : function lp_fill(mp){
        var bsp = lmnpopFx.pget('blink.speed');
        var bst = bsp > 0 && lmnpopFx.pget('blink.style');
        var lms = lmnpopFx.pick(lmnpopFx.pget('xpath')), fmt = lmnpopFx.pget('format');
        lms.forEach(function(lmn){
            var mi = menuitem({
                label: lmnpopFx.format(lmn, fmt),
                crop: 'center',
                oncommand: 'lmnpopFx.openVideoDlg(this.lmn, event)'
            });
            mi.lmn = lmn;
            bst && mi.addEventListener('DOMMenuItemActive', blink, false);
        });
        if(lms.length){
            mp.appendChild(document.createElement('menuseparator'));
            if(lms.length > 1){
                menuitem({
                    label: 'Pop All',
                    accesskey: 'A',
                    oncommand: 'this.lms.forEach(function(lm) lmnpopFx.openVideoDlg(lm, event))'
                }).lms = lms;
            }
        }
        menuitem({
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
        function menuitem(atrs){
            var mi = document.createElement('menuitem');
            for(var k in atrs) mi.setAttribute(k, atrs[k]);
            return mp.appendChild(mi);
        }
    },

    pick : function lp_pick(xpath){
        var lms = [];
        var doc = document.commandDispatcher.focusedWindow.document;
        var els = doc.evaluate(xpath, doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        for (var j = 0; j < els.snapshotLength; ++j) {
            var lm = els.snapshotItem(j);
            if (lm.style.display != 'none' && lm.parentNode.style.display != 'none')
                lms.push(lm);
        }
        return lms;
    },

    pget : function  lp_pget(key){
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

    format : function lp_format(lmn, fmt){
        return (fmt || lmnpopFx.pget('format')).replace(/{.+?}/g, function($){
            for(let [, k] in new Iterator($.slice(1, -1).split('|'))){
                let v = lmn[k];
                if(v)
                    return String(v).replace(/^http:.*\/(.*)/, '$1').split('?')[0];
            }
            return '';
        });
    }
};

window.addEventListener('load', lmnpopFx.init, false);

