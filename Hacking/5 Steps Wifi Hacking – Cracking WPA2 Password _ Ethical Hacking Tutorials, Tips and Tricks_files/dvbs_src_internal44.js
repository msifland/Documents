
function dv_rolloutManager(handlersDefsArray, baseHandler) {
    this.handle = function () {
        var errorsArr = [];

        var handler = chooseEvaluationHandler(handlersDefsArray);
        if (handler) {
            var errorObj = handleSpecificHandler(handler);
            if (errorObj === null) {
                return errorsArr;
            }
            else {
                var debugInfo = handler.onFailure();
                if (debugInfo) {
                    for (var key in debugInfo) {
                        if (debugInfo.hasOwnProperty(key)) {
                            if (debugInfo[key] !== undefined || debugInfo[key] !== null) {
                                errorObj[key] = encodeURIComponent(debugInfo[key]);
                            }
                        }
                    }
                }
                errorsArr.push(errorObj);
            }
        }

        var errorObjHandler = handleSpecificHandler(baseHandler);
        if (errorObjHandler) {
            errorObjHandler['dvp_isLostImp'] = 1;
            errorsArr.push(errorObjHandler);
        }
        return errorsArr;
    };

    function handleSpecificHandler(handler) {
        var request;
        var errorObj = null;

        try {
            request = handler.createRequest();
            if (request && !request.isSev1) {
                var url = request.url || request;
                if (url) {
                    if (!handler.sendRequest(url)) {
                        errorObj = createAndGetError('sendRequest failed.',
                            url,
                            handler.getVersion(),
                            handler.getVersionParamName(),
                            handler.dv_script);
                    }
                } else {
                    errorObj = createAndGetError('createRequest failed.',
                        url,
                        handler.getVersion(),
                        handler.getVersionParamName(),
                        handler.dv_script,
                        handler.dvScripts,
                        handler.dvStep,
                        handler.dvOther
                    );
                }
            }
        }
        catch (e) {
            errorObj = createAndGetError(e.name + ': ' + e.message, request ? (request.url || request) : null, handler.getVersion(), handler.getVersionParamName(), (handler ? handler.dv_script : null));
        }

        return errorObj;
    }

    function createAndGetError(error, url, ver, versionParamName, dv_script, dvScripts, dvStep, dvOther) {
        var errorObj = {};
        errorObj[versionParamName] = ver;
        errorObj['dvp_jsErrMsg'] = encodeURIComponent(error);
        if (dv_script && dv_script.parentElement && dv_script.parentElement.tagName && dv_script.parentElement.tagName == 'HEAD') {
            errorObj['dvp_isOnHead'] = '1';
        }
        if (url) {
            errorObj['dvp_jsErrUrl'] = url;
        }
        if (dvScripts) {
            var dvScriptsResult = '';
            for (var id in dvScripts) {
                if (dvScripts[id] && dvScripts[id].src) {
                    dvScriptsResult += encodeURIComponent(dvScripts[id].src) + ":" + dvScripts[id].isContain + ",";
                }
            }
            
            
            
        }
        return errorObj;
    }

    function chooseEvaluationHandler(handlersArray) {
        var config = window._dv_win.dv_config;
        var index = 0;
        var isEvaluationVersionChosen = false;
        if (config.handlerVersionSpecific) {
            for (var i = 0; i < handlersArray.length; i++) {
                if (handlersArray[i].handler.getVersion() == config.handlerVersionSpecific) {
                    isEvaluationVersionChosen = true;
                    index = i;
                    break;
                }
            }
        }
        else if (config.handlerVersionByTimeIntervalMinutes) {
            var date = config.handlerVersionByTimeInputDate || new Date();
            var hour = date.getUTCHours();
            var minutes = date.getUTCMinutes();
            index = Math.floor(((hour * 60) + minutes) / config.handlerVersionByTimeIntervalMinutes) % (handlersArray.length + 1);
            if (index != handlersArray.length) { 
                isEvaluationVersionChosen = true;
            }
        }
        else {
            var rand = config.handlerVersionRandom || (Math.random() * 100);
            for (var i = 0; i < handlersArray.length; i++) {
                if (rand >= handlersArray[i].minRate && rand < handlersArray[i].maxRate) {
                    isEvaluationVersionChosen = true;
                    index = i;
                    break;
                }
            }
        }

        if (isEvaluationVersionChosen == true && handlersArray[index].handler.isApplicable()) {
            return handlersArray[index].handler;
        }
        else {
            return null;
        }
    }
}

function doesBrowserSupportHTML5Push() {
    "use strict";
    return typeof window.parent.postMessage === 'function' && window.JSON;
}

function dv_GetParam(url, name, checkFromStart) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = (checkFromStart ? "(?:\\?|&|^)" : "[\\?&]") + name + "=([^&#]*)";
    var regex = new RegExp(regexS, 'i');
    var results = regex.exec(url);
    if (results == null)
        return null;
    else
        return results[1];
}

function dv_Contains(array, obj) {
    var i = array.length;
    while (i--) {
        if (array[i] === obj) {
            return true;
        }
    }
    return false;
}

function dv_GetDynamicParams(url) {
    try {
        var regex = new RegExp("[\\?&](dvp_[^&]*=[^&#]*)", "gi");
        var dvParams = regex.exec(url);

        var results = new Array();
        while (dvParams != null) {
            results.push(dvParams[1]);
            dvParams = regex.exec(url);
        }
        return results;
    }
    catch (e) {
        return [];
    }
}

function dv_createIframe() {
    var iframe;
    if (document.createElement && (iframe = document.createElement('iframe'))) {
        iframe.name = iframe.id = 'iframe_' + Math.floor((Math.random() + "") * 1000000000000);
        iframe.width = 0;
        iframe.height = 0;
        iframe.style.display = 'none';
        iframe.src = 'about:blank';
    }

    return iframe;
}

function dv_GetRnd() {
    return ((new Date()).getTime() + "" + Math.floor(Math.random() * 1000000)).substr(0, 16);
}

function dv_SendErrorImp(serverUrl, errorsArr) {

    for (var j = 0; j < errorsArr.length; j++) {
        var errorObj = errorsArr[j];
        var errorImp = dv_CreateAndGetErrorImp(serverUrl, errorObj);
        dv_sendImgImp(errorImp);
    }
}

function dv_CreateAndGetErrorImp(serverUrl, errorObj) {
    var errorQueryString = '';
    for (key in errorObj) {
        if (errorObj.hasOwnProperty(key)) {
            if (key.indexOf('dvp_jsErrUrl') == -1) {
                errorQueryString += '&' + key + '=' + errorObj[key];
            }
            else {
                var params = ['ctx', 'cmp', 'plc', 'sid'];
                for (var i = 0; i < params.length; i++) {
                    var pvalue = dv_GetParam(errorObj[key], params[i]);
                    if (pvalue) {
                        errorQueryString += '&dvp_js' + params[i] + '=' + pvalue;
                    }
                }
            }
        }
    }

    var windowProtocol = 'https:';
    var sslFlag = '&ssl=1';

    var errorImp = windowProtocol + '//' + serverUrl + sslFlag + errorQueryString;
    return errorImp;
}

function dv_sendImgImp(url) {
    (new Image()).src = url;
}

function dv_sendScriptRequest(url) {
    document.write('<scr' + 'ipt type="text/javascript" src="' + url + '"></scr' + 'ipt>');
}

function dv_getPropSafe(obj, propName) {
    try {
        if (obj)
            return obj[propName];
    } catch (e) {
    }
}

function dvBsType() {
    var that = this;
    var eventsForDispatch = {};
    this.t2tEventDataZombie = {};

    this.processT2TEvent = function (data, tag) {
        try {
            if (tag.ServerPublicDns) {
                data.timeStampCollection.push({"beginProcessT2TEvent": getCurrentTime()});
                data.timeStampCollection.push({'beginVisitCallback': tag.beginVisitCallbackTS});
                var tpsServerUrl = tag.dv_protocol + '//' + tag.ServerPublicDns + '/event.gif?impid=' + tag.uid;

                if (!tag.uniquePageViewId) {
                    tag.uniquePageViewId = data.uniquePageViewId;
                }

                tpsServerUrl += '&dvp_upvid=' + tag.uniquePageViewId;
                tpsServerUrl += '&dvp_numFrames=' + data.totalIframeCount;
                tpsServerUrl += '&dvp_numt2t=' + data.totalT2TiframeCount;
                tpsServerUrl += '&dvp_frameScanDuration=' + data.scanAllFramesDuration;
                tpsServerUrl += '&dvp_scene=' + tag.adServingScenario;
                tpsServerUrl += '&dvp_ist2twin=' + (data.isWinner ? '1' : '0');
                tpsServerUrl += '&dvp_numTags=' + Object.keys($dvbs.tags).length;
                tpsServerUrl += '&dvp_isInSample=' + data.isInSample;
                tpsServerUrl += (data.wasZombie) ? '&dvp_wasZombie=1' : '&dvp_wasZombie=0';
                tpsServerUrl += '&dvp_ts_t2tCreatedOn=' + data.creationTime;
                if (data.timeStampCollection) {
                    if (window._dv_win.t2tTimestampData) {
                        for (var tsI = 0; tsI < window._dv_win.t2tTimestampData.length; tsI++) {
                            data.timeStampCollection.push(window._dv_win.t2tTimestampData[tsI]);
                        }
                    }

                    for (var i = 0; i < data.timeStampCollection.length; i++) {
                        var item = data.timeStampCollection[i];
                        for (var propName in item) {
                            if (item.hasOwnProperty(propName)) {
                                tpsServerUrl += '&dvp_ts_' + propName + '=' + item[propName];
                            }
                        }
                    }
                }
                $dvbs.domUtilities.addImage(tpsServerUrl, tag.tagElement.parentElement);
            }
        } catch (e) {
            try {
                dv_SendErrorImp(window._dv_win.dv_config.tpsErrAddress + '/visit.jpg?ctx=818052&cmp=1619415&dvtagver=6.1.src&jsver=0&dvp_ist2tProcess=1', {dvp_jsErrMsg: encodeURIComponent(e)});
            } catch (ex) {
            }
        }
    };

    this.processTagToTagCollision = function (collision, tag) {
        var i;
        var tpsServerUrl = tag.dv_protocol + '//' + tag.ServerPublicDns + '/event.gif?impid=' + tag.uid;
        var additions = [
            '&dvp_collisionReasons=' + collision.reasonBitFlag,
            '&dvp_ts_reporterDvTagCreated=' + collision.thisTag.dvTagCreatedTS,
            '&dvp_ts_reporterVisitJSMessagePosted=' + collision.thisTag.visitJSPostMessageTS,
            '&dvp_ts_reporterReceivedByT2T=' + collision.thisTag.receivedByT2TTS,
            '&dvp_ts_collisionPostedFromT2T=' + collision.postedFromT2TTS,
            '&dvp_ts_collisionReceivedByCommon=' + collision.commonRecievedTS,
            '&dvp_collisionTypeId=' + collision.allReasonsForTagBitFlag
        ];
        tpsServerUrl += additions.join("");

        for (i = 0; i < collision.reasons.length; i++) {
            var reason = collision.reasons[i];
            tpsServerUrl += '&dvp_' + reason + "MS=" + collision[reason + "MS"];
        }

        if (tag.uniquePageViewId) {
            tpsServerUrl += '&dvp_upvid=' + tag.uniquePageViewId;
        }
        $dvbs.domUtilities.addImage(tpsServerUrl, tag.tagElement.parentElement);
    };

    var messageEventListener = function (event) {
        try {
            var timeCalled = getCurrentTime();
            var data = window.JSON.parse(event.data);
            if (!data.action) {
                data = window.JSON.parse(data);
            }
            if (data.timeStampCollection) {
                data.timeStampCollection.push({messageEventListenerCalled: timeCalled});
            }
            var myUID;
            var visitJSHasBeenCalledForThisTag = false;
            if ($dvbs.tags) {
                for (var uid in $dvbs.tags) {
                    if ($dvbs.tags.hasOwnProperty(uid) && $dvbs.tags[uid] && $dvbs.tags[uid].t2tIframeId === data.iFrameId) {
                        myUID = uid;
                        visitJSHasBeenCalledForThisTag = true;
                        break;
                    }
                }
            }

            switch (data.action) {
                case 'uniquePageViewIdDetermination' :
                    if (visitJSHasBeenCalledForThisTag) {
                        $dvbs.processT2TEvent(data, $dvbs.tags[myUID]);
                        $dvbs.t2tEventDataZombie[data.iFrameId] = undefined;
                    }
                    else {
                        data.wasZombie = 1;
                        $dvbs.t2tEventDataZombie[data.iFrameId] = data;
                    }
                    break;
                case 'maColl':
                    var tag = $dvbs.tags[myUID];
                    
                    tag.AdCollisionMessageRecieved = true;
                    if (!tag.uniquePageViewId) {
                        tag.uniquePageViewId = data.uniquePageViewId;
                    }
                    data.collision.commonRecievedTS = timeCalled;
                    $dvbs.processTagToTagCollision(data.collision, tag);
                    break;
            }

        } catch (e) {
            try {
                dv_SendErrorImp(window._dv_win.dv_config.tpsErrAddress + '/visit.jpg?ctx=818052&cmp=1619415&dvtagver=6.1.src&jsver=0&dvp_ist2tListener=1', {dvp_jsErrMsg: encodeURIComponent(e)});
            } catch (ex) {
            }
        }
    };

    if (window.addEventListener)
        addEventListener("message", messageEventListener, false);
    else
        attachEvent("onmessage", messageEventListener);

    this.pubSub = new function () {

        var subscribers = [];

        this.subscribe = function (eventName, uid, actionName, func) {
            if (!subscribers[eventName + uid])
                subscribers[eventName + uid] = [];
            subscribers[eventName + uid].push({Func: func, ActionName: actionName});
        };

        this.publish = function (eventName, uid) {
            var actionsResults = [];
            if (eventName && uid && subscribers[eventName + uid] instanceof Array)
                for (var i = 0; i < subscribers[eventName + uid].length; i++) {
                    var funcObject = subscribers[eventName + uid][i];
                    if (funcObject && funcObject.Func && typeof funcObject.Func == "function" && funcObject.ActionName) {
                        var isSucceeded = runSafely(function () {
                            return funcObject.Func(uid);
                        });
                        actionsResults.push(encodeURIComponent(funcObject.ActionName) + '=' + (isSucceeded ? '1' : '0'));
                    }
                }
            return actionsResults.join('&');
        };
    };

    this.domUtilities = new function () {

        this.addImage = function (url, parentElement, trackingPixelCompleteCallbackName) {
            var image = parentElement.ownerDocument.createElement("img");
            image.width = 0;
            image.height = 0;
            image.style.display = 'none';
            if (trackingPixelCompleteCallbackName && typeof window[trackingPixelCompleteCallbackName] === "function") {
                image.addEventListener("load", window[trackingPixelCompleteCallbackName]);
            }
            image.src = appendCacheBuster(url);
            parentElement.insertBefore(image, parentElement.firstChild);
        };

        this.addScriptResource = function (url, parentElement) {
            if (parentElement) {
                var scriptElem = parentElement.ownerDocument.createElement("script");
                scriptElem.type = 'text/javascript';
                scriptElem.src = appendCacheBuster(url);
                parentElement.insertBefore(scriptElem, parentElement.firstChild);
            }
            else {
                addScriptResourceFallBack(url);
            }
        };

        function addScriptResourceFallBack(url) {
            var scriptElem = document.createElement('script');
            scriptElem.type = "text/javascript";
            scriptElem.src = appendCacheBuster(url);
            var firstScript = document.getElementsByTagName('script')[0];
            firstScript.parentNode.insertBefore(scriptElem, firstScript);
        }

        this.addScriptCode = function (srcCode, parentElement) {
            var scriptElem = parentElement.ownerDocument.createElement("script");
            scriptElem.type = 'text/javascript';
            scriptElem.innerHTML = srcCode;
            parentElement.insertBefore(scriptElem, parentElement.firstChild);
        };

        this.addHtml = function (srcHtml, parentElement) {
            var divElem = parentElement.ownerDocument.createElement("div");
            divElem.style = "display: inline";
            divElem.innerHTML = srcHtml;
            parentElement.insertBefore(divElem, parentElement.firstChild);
        };
    };

    this.resolveMacros = function (str, tag) {
        var viewabilityData = tag.getViewabilityData();
        var viewabilityBuckets = viewabilityData && viewabilityData.buckets ? viewabilityData.buckets : {};
        var upperCaseObj = objectsToUpperCase(tag, viewabilityData, viewabilityBuckets);
        var newStr = str.replace('[DV_PROTOCOL]', upperCaseObj.DV_PROTOCOL);
        newStr = newStr.replace('[PROTOCOL]', upperCaseObj.PROTOCOL);
        newStr = newStr.replace(/\[(.*?)\]/g, function (match, p1) {
            var value = upperCaseObj[p1];
            if (value === undefined || value === null)
                value = '[' + p1 + ']';
            return encodeURIComponent(value);
        });
        return newStr;
    };

    this.settings = new function () {
    };

    this.tagsType = function () {
    };

    this.tagsPrototype = function () {
        this.add = function (tagKey, obj) {
            if (!that.tags[tagKey])
                that.tags[tagKey] = new that.tag();
            for (var key in obj)
                that.tags[tagKey][key] = obj[key];
        };
    };

    this.tagsType.prototype = new this.tagsPrototype();
    this.tagsType.prototype.constructor = this.tags;
    this.tags = new this.tagsType();

    this.tag = function () {
    };
    this.tagPrototype = function () {
        this.set = function (obj) {
            for (var key in obj)
                this[key] = obj[key];
        };

        this.getViewabilityData = function () {
        };
    };

    this.tag.prototype = new this.tagPrototype();
    this.tag.prototype.constructor = this.tag;

    this.getTagObjectByService = function (serviceName) {

        for (var impressionId in this.tags) {
            if (typeof this.tags[impressionId] === 'object'
                && this.tags[impressionId].services
                && this.tags[impressionId].services[serviceName]
                && !this.tags[impressionId].services[serviceName].isProcessed) {
                this.tags[impressionId].services[serviceName].isProcessed = true;
                return this.tags[impressionId];
            }
        }


        return null;
    };

    this.addService = function (impressionId, serviceName, paramsObject) {

        if (!impressionId || !serviceName)
            return;

        if (!this.tags[impressionId])
            return;
        else {
            if (!this.tags[impressionId].services)
                this.tags[impressionId].services = {};

            this.tags[impressionId].services[serviceName] = {
                params: paramsObject,
                isProcessed: false
            };
        }
    };

    this.Enums = {
        BrowserId: {Others: 0, IE: 1, Firefox: 2, Chrome: 3, Opera: 4, Safari: 5},
        TrafficScenario: {OnPage: 1, SameDomain: 2, CrossDomain: 128}
    };

    this.CommonData = {};

    var runSafely = function (action) {
        try {
            var ret = action();
            return ret !== undefined ? ret : true;
        } catch (e) {
            return false;
        }
    };

    var objectsToUpperCase = function () {
        var upperCaseObj = {};
        for (var i = 0; i < arguments.length; i++) {
            var obj = arguments[i];
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    upperCaseObj[key.toUpperCase()] = obj[key];
                }
            }
        }
        return upperCaseObj;
    };

    var appendCacheBuster = function (url) {
        if (url !== undefined && url !== null && url.match("^http") == "http") {
            if (url.indexOf('?') !== -1) {
                if (url.slice(-1) == '&')
                    url += 'cbust=' + dv_GetRnd();
                else
                    url += '&cbust=' + dv_GetRnd();
            }
            else
                url += '?cbust=' + dv_GetRnd();
        }
        return url;
    };

    
    var messagesClass = function () {
        var waitingMessages = [];

        this.registerMsg = function(dvFrame, data) {
            if (!waitingMessages[dvFrame.$frmId]) {
                waitingMessages[dvFrame.$frmId] = [];
            }

            waitingMessages[dvFrame.$frmId].push(data);

            if (dvFrame.$uid) {
                sendWaitingEventsForFrame(dvFrame, dvFrame.$uid);
            }
        };

        this.startSendingEvents = function(dvFrame, impID) {
            sendWaitingEventsForFrame(dvFrame, impID);
            
        };

        function sendWaitingEventsForFrame(dvFrame, impID) {
            if (waitingMessages[dvFrame.$frmId]) {
                var eventObject = {};
                for (var i = 0; i < waitingMessages[dvFrame.$frmId].length; i++) {
                    var obj = waitingMessages[dvFrame.$frmId].pop();
                    for (var key in obj) {
                        if (typeof obj[key] !== 'function' && obj.hasOwnProperty(key)) {
                            eventObject[key] = obj[key];
                        }
                    }
                }
                that.registerEventCall(impID, eventObject);
            }
        }

        function startMessageManager() {
            for (var frm in waitingMessages) {
                if (frm && frm.$uid) {
                    sendWaitingEventsForFrame(frm, frm.$uid);
                }
            }
            setTimeout(startMessageManager, 10);
        }
    };
    this.messages = new messagesClass();

    this.dispatchRegisteredEventsFromAllTags = function () {
        for (var impressionId in this.tags) {
            if (typeof this.tags[impressionId] !== 'function' && typeof this.tags[impressionId] !== 'undefined')
                dispatchEventCalls(impressionId, this);
        }
    };

    var dispatchEventCalls = function (impressionId, dvObj) {
        var tag = dvObj.tags[impressionId];
        var eventObj = eventsForDispatch[impressionId];
        if (typeof eventObj !== 'undefined' && eventObj != null) {
            var url = tag.protocol + '//' + tag.ServerPublicDns + "/bsevent.gif?impid=" + impressionId + '&' + createQueryStringParams(eventObj);
            dvObj.domUtilities.addImage(url, tag.tagElement.parentElement);
            eventsForDispatch[impressionId] = null;
        }
    };

    this.registerEventCall = function (impressionId, eventObject, timeoutMs) {
        addEventCallForDispatch(impressionId, eventObject);

        if (typeof timeoutMs === 'undefined' || timeoutMs == 0 || isNaN(timeoutMs))
            dispatchEventCallsNow(this, impressionId, eventObject);
        else {
            if (timeoutMs > 2000)
                timeoutMs = 2000;

            var dvObj = this;
            setTimeout(function () {
                dispatchEventCalls(impressionId, dvObj);
            }, timeoutMs);
        }
    };

    var dispatchEventCallsNow = function (dvObj, impressionId, eventObject) {
        addEventCallForDispatch(impressionId, eventObject);
        dispatchEventCalls(impressionId, dvObj);
    };

    var addEventCallForDispatch = function (impressionId, eventObject) {
        for (var key in eventObject) {
            if (typeof eventObject[key] !== 'function' && eventObject.hasOwnProperty(key)) {
                if (!eventsForDispatch[impressionId])
                    eventsForDispatch[impressionId] = {};
                eventsForDispatch[impressionId][key] = eventObject[key];
            }
        }
    };

    if (window.addEventListener) {
        window.addEventListener('unload', function () {
            that.dispatchRegisteredEventsFromAllTags();
        }, false);
        window.addEventListener('beforeunload', function () {
            that.dispatchRegisteredEventsFromAllTags();
        }, false);
    }
    else if (window.attachEvent) {
        window.attachEvent('onunload', function () {
            that.dispatchRegisteredEventsFromAllTags();
        }, false);
        window.attachEvent('onbeforeunload', function () {
            that.dispatchRegisteredEventsFromAllTags();
        }, false);
    }
    else {
        window.document.body.onunload = function () {
            that.dispatchRegisteredEventsFromAllTags();
        };
        window.document.body.onbeforeunload = function () {
            that.dispatchRegisteredEventsFromAllTags();
        };
    }

    var createQueryStringParams = function (values) {
        var params = '';
        for (var key in values) {
            if (typeof values[key] !== 'function') {
                var value = encodeURIComponent(values[key]);
                if (params === '')
                    params += key + '=' + value;
                else
                    params += '&' + key + '=' + value;
            }
        }

        return params;
    };
}

function dv_baseHandler(){function J(){var b="http:";"http:"!=window._dv_win.location.protocol&&(b="https:");return b}function G(b,c){var e=document.createElement("iframe");e.name=window._dv_win.dv_config.emptyIframeID||"iframe_"+A();e.width=0;e.height=0;e.id=c;e.style.display="none";e.src=b;return e}function C(b,c,e){e=e||150;var f=window._dv_win||window;if(f.document&&f.document.body)return c&&c.parentNode?c.parentNode.insertBefore(b,c):f.document.body.insertBefore(b,f.document.body.firstChild),
!0;if(0<e)setTimeout(function(){C(b,c,--e)},20);else return!1}function K(b){var c=window._dv_win.dv_config=window._dv_win.dv_config||{};c.cdnAddress=c.cdnAddress||"cdn.doubleverify.com";return'<html><head><script type="text/javascript">('+function(){try{window.$dv=window.$dvbs||parent.$dvbs,window.$dv.dvObjType="dvbs"}catch(e){}}.toString()+')();\x3c/script></head><body><script type="text/javascript">('+(b||"function() {}")+')("'+c.cdnAddress+'");\x3c/script><script type="text/javascript">setTimeout(function() {document.close();}, 0);\x3c/script></body></html>'}
function L(b){var c=null;try{if(c=b&&b.contentDocument)return c}catch(e){}try{if(c=b.contentWindow&&b.contentWindow.document)return c}catch(e){}try{if(c=window._dv_win.frames&&window._dv_win.frames[b.name]&&window._dv_win.frames[b.name].document)return c}catch(e){}return null}function H(b){var c=0,e;for(e in b)b.hasOwnProperty(e)&&++c;return c}function M(b,c){a:{var e={};try{if(b&&b.performance&&b.performance.getEntries){var f=b.performance.getEntries();for(b=0;b<f.length;b++){var d=f[b],g=d.name.match(/.*\/(.+?)\./);
if(g&&g[1]){var n=g[1].replace(/\d+$/,""),l=c[n];if(l){for(var u=0;u<l.stats.length;u++){var q=l.stats[u];e[l.prefix+q.prefix]=Math.round(d[q.name])}delete c[n];if(!H(c))break}}}}var k=e;break a}catch(m){}k=void 0}if(k&&H(k))return k}function N(b,c){var e,f=window._dv_win.document.visibilityState;window[b.tagObjectCallbackName]=function(d){var g=window._dv_win.$dvbs;if(g){var n=c?"https:":J();e=d.ImpressionID;g.tags.add(d.ImpressionID,b);g.tags[d.ImpressionID].set({tagElement:b.script,impressionId:d.ImpressionID,
dv_protocol:b.protocol,protocol:n,uid:b.uid,serverPublicDns:d.ServerPublicDns,ServerPublicDns:d.ServerPublicDns});b.script&&b.script.dvFrmWin&&(b.script.dvFrmWin.$uid=d.ImpressionID,g.messages&&g.messages.startSendingEvents&&g.messages.startSendingEvents(b.script.dvFrmWin,d.ImpressionID));(function(){function g(){var c=window._dv_win.document.visibilityState;"prerender"===f&&"prerender"!==c&&"unloaded"!==c&&(f=c,window._dv_win.$dvbs.registerEventCall(d.ImpressionID,{prndr:0}),window._dv_win.document.removeEventListener(b,
g))}if("prerender"===f)if("prerender"!==window._dv_win.document.visibilityState&&"unloaded"!==visibilityStateLocal)window._dv_win.$dvbs.registerEventCall(d.ImpressionID,{prndr:0});else{var b;"undefined"!==typeof window._dv_win.document.hidden?b="visibilitychange":"undefined"!==typeof window._dv_win.document.mozHidden?b="mozvisibilitychange":"undefined"!==typeof window._dv_win.document.msHidden?b="msvisibilitychange":"undefined"!==typeof window._dv_win.document.webkitHidden&&(b="webkitvisibilitychange");
window._dv_win.document.addEventListener(b,g,!1)}})()}try{var l=M(window,{verify:{prefix:"vf",stats:[{name:"duration",prefix:"dur"}]}});l&&window._dv_win.$dvbs.registerEventCall(d.ImpressionID,l)}catch(u){}};window[b.callbackName]=function(c){var g=window._dv_win.$dvbs&&"object"==typeof window._dv_win.$dvbs.tags[e]?window._dv_win.$dvbs.tags[e]:b;var d=window._dv_win.dv_config.bs_renderingMethod||function(c){document.write(c)};switch(c.ResultID){case 1:g.tagPassback?d(g.tagPassback):c.Passback?d(decodeURIComponent(c.Passback)):
c.AdWidth&&c.AdHeight&&d(decodeURIComponent("%3Cstyle%3E%0A.dvbs_container%20%7B%0A%09border%3A%201px%20solid%20%233b599e%3B%0A%09overflow%3A%20hidden%3B%0A%09filter%3A%20progid%3ADXImageTransform.Microsoft.gradient(startColorstr%3D%27%23315d8c%27%2C%20endColorstr%3D%27%2384aace%27)%3B%0A%09%2F*%20for%20IE%20*%2F%0A%09background%3A%20-webkit-gradient(linear%2C%20left%20top%2C%20left%20bottom%2C%20from(%23315d8c)%2C%20to(%2384aace))%3B%0A%09%2F*%20for%20webkit%20browsers%20*%2F%0A%09background%3A%20-moz-linear-gradient(top%2C%20%23315d8c%2C%20%2384aace)%3B%0A%09%2F*%20for%20firefox%203.6%2B%20*%2F%0A%7D%0A.dvbs_cloud%20%7B%0A%09color%3A%20%23fff%3B%0A%09position%3A%20relative%3B%0A%09font%3A%20100%25%22Times%20New%20Roman%22%2C%20Times%2C%20serif%3B%0A%09text-shadow%3A%200px%200px%2010px%20%23fff%3B%0A%09line-height%3A%200%3B%0A%7D%0A%3C%2Fstyle%3E%0A%3Cscript%20type%3D%22text%2Fjavascript%22%3E%0A%09function%0A%20%20%20%20cloud()%7B%0A%09%09var%20b1%20%3D%20%22%3Cdiv%20class%3D%5C%22dvbs_cloud%5C%22%20style%3D%5C%22font-size%3A%22%3B%0A%09%09var%20b2%3D%22px%3B%20position%3A%20absolute%3B%20top%3A%20%22%3B%0A%09%09document.write(b1%20%2B%20%22300px%3B%20width%3A%20300px%3B%20height%3A%20300%22%20%2B%20b2%20%2B%20%2234px%3B%20left%3A%2028px%3B%5C%22%3E.%3C%5C%2Fdiv%3E%22)%3B%0A%09%09document.write(b1%20%2B%20%22300px%3B%20width%3A%20300px%3B%20height%3A%20300%22%20%2B%20b2%20%2B%20%2246px%3B%20left%3A%2010px%3B%5C%22%3E.%3C%5C%2Fdiv%3E%22)%3B%0A%09%09document.write(b1%20%2B%20%22300px%3B%20width%3A%20300px%3B%20height%3A%20300%22%20%2B%20b2%20%2B%20%2246px%3B%20left%3A50px%3B%5C%22%3E.%3C%5C%2Fdiv%3E%22)%3B%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%0A%09%09document.write(b1%20%2B%20%22400px%3B%20width%3A%20400px%3B%20height%3A%20400%22%20%2B%20b2%20%2B%20%2224px%3B%20left%3A20px%3B%5C%22%3E.%3C%5C%2Fdiv%3E%22)%3B%0A%20%20%20%20%7D%0A%20%20%20%20%0A%09function%20clouds()%7B%0A%20%20%20%20%20%20%20%20var%20top%20%3D%20%5B%27-80%27%2C%2780%27%2C%27240%27%2C%27400%27%5D%3B%0A%09%09var%20left%20%3D%20-10%3B%0A%20%20%20%20%20%20%20%20var%20a1%20%3D%20%22%3Cdiv%20style%3D%5C%22position%3A%20relative%3B%20top%3A%20%22%3B%0A%09%09var%20a2%20%3D%20%22px%3B%20left%3A%20%22%3B%0A%20%20%20%20%20%20%20%20var%20a3%3D%20%22px%3B%5C%22%3E%3Cscr%22%2B%22ipt%20type%3D%5C%22text%5C%2Fjavascr%22%2B%22ipt%5C%22%3Ecloud()%3B%3C%5C%2Fscr%22%2B%22ipt%3E%3C%5C%2Fdiv%3E%22%3B%0A%20%20%20%20%20%20%20%20for(i%3D0%3B%20i%20%3C%208%3B%20i%2B%2B)%20%7B%0A%09%09%09document.write(a1%2Btop%5B0%5D%2Ba2%2Bleft%2Ba3)%3B%0A%09%09%09document.write(a1%2Btop%5B1%5D%2Ba2%2Bleft%2Ba3)%3B%0A%09%09%09document.write(a1%2Btop%5B2%5D%2Ba2%2Bleft%2Ba3)%3B%0A%09%09%09document.write(a1%2Btop%5B3%5D%2Ba2%2Bleft%2Ba3)%3B%0A%09%09%09if(i%3D%3D4)%0A%09%09%09%7B%0A%09%09%09%09left%20%3D-%2090%3B%0A%09%09%09%09top%20%3D%20%5B%270%27%2C%27160%27%2C%27320%27%2C%27480%27%5D%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20else%20%0A%09%09%09%09left%20%2B%3D%20160%3B%0A%09%09%7D%0A%09%7D%0A%0A%3C%2Fscript%3E%0A%3Cdiv%20class%3D%22dvbs_container%22%20style%3D%22width%3A%20"+
c.AdWidth+"px%3B%20height%3A%20"+c.AdHeight+"px%3B%22%3E%0A%09%3Cscript%20type%3D%22text%2Fjavascript%22%3Eclouds()%3B%3C%2Fscript%3E%0A%3C%2Fdiv%3E"));break;case 2:case 3:g.tagAdtag&&d(g.tagAdtag);break;case 4:c.AdWidth&&c.AdHeight&&d(decodeURIComponent("%3Cstyle%3E%0A.dvbs_container%20%7B%0A%09border%3A%201px%20solid%20%233b599e%3B%0A%09overflow%3A%20hidden%3B%0A%09filter%3A%20progid%3ADXImageTransform.Microsoft.gradient(startColorstr%3D%27%23315d8c%27%2C%20endColorstr%3D%27%2384aace%27)%3B%0A%7D%0A%3C%2Fstyle%3E%0A%3Cdiv%20class%3D%22dvbs_container%22%20style%3D%22width%3A%20"+
c.AdWidth+"px%3B%20height%3A%20"+c.AdHeight+"px%3B%22%3E%09%0A%3C%2Fdiv%3E"))}}}function O(b){var c=null,e=null,f=function(c){var b=dv_GetParam(c,"cmp");c=dv_GetParam(c,"ctx");return"919838"==c&&"7951767"==b||"919839"==c&&"7939985"==b||"971108"==c&&"7900229"==b||"971108"==c&&"7951940"==b?"</scr'+'ipt>":/<\/scr\+ipt>/g}(b.src);"function"!==typeof String.prototype.trim&&(String.prototype.trim=function(){return this.replace(/^\s+|\s+$/g,"")});var d=function(b){!(b=b.previousSibling)||"#text"!=b.nodeName||
null!=b.nodeValue&&void 0!=b.nodeValue&&0!=b.nodeValue.trim().length||(b=b.previousSibling);if(b&&"SCRIPT"==b.tagName&&b.getAttribute("type")&&("text/adtag"==b.getAttribute("type").toLowerCase()||"text/passback"==b.getAttribute("type").toLowerCase())&&""!=b.innerHTML.trim()){if("text/adtag"==b.getAttribute("type").toLowerCase())return c=b.innerHTML.replace(f,"\x3c/script>"),{isBadImp:!1,hasPassback:!1,tagAdTag:c,tagPassback:e};if(null!=e)return{isBadImp:!0,hasPassback:!1,tagAdTag:c,tagPassback:e};
e=b.innerHTML.replace(f,"\x3c/script>");b=d(b);b.hasPassback=!0;return b}return{isBadImp:!0,hasPassback:!1,tagAdTag:c,tagPassback:e}};return d(b)}function I(b,c,e,f,d,g,n,l,u,q){var k;void 0==c.dvregion&&(c.dvregion=0);try{var m=f;for(k=0;10>k&&m!=window._dv_win.top;)k++,m=m.parent;f.depth=k;var h=P(f);var r="&aUrl="+encodeURIComponent(h.url);var y="&aUrlD="+h.depth;var B=f.depth+d;g&&f.depth--}catch(w){y=r=B=f.depth=""}void 0!=c.aUrl&&(r="&aUrl="+c.aUrl);a:{try{if("object"==typeof window.$ovv||"object"==
typeof window.parent.$ovv){var t=1;break a}}catch(w){}t=0}d=c.script.src;t="&ctx="+(dv_GetParam(d,"ctx")||"")+"&cmp="+(dv_GetParam(d,"cmp")||"")+"&plc="+(dv_GetParam(d,"plc")||"")+"&sid="+(dv_GetParam(d,"sid")||"")+"&advid="+(dv_GetParam(d,"advid")||"")+"&adsrv="+(dv_GetParam(d,"adsrv")||"")+"&unit="+(dv_GetParam(d,"unit")||"")+"&isdvvid="+(dv_GetParam(d,"isdvvid")||"")+"&uid="+c.uid+"&tagtype="+(dv_GetParam(d,"tagtype")||"")+"&adID="+(dv_GetParam(d,"adID")||"")+"&app="+(dv_GetParam(d,"app")||"")+
"&sup="+(dv_GetParam(d,"sup")||"")+"&isovv="+t+"&gmnpo="+(dv_GetParam(d,"gmnpo")||"")+"&crt="+(dv_GetParam(d,"crt")||"");(g=dv_GetParam(d,"xff"))&&(t+="&xff="+g);(g=dv_GetParam(d,"useragent"))&&(t+="&useragent="+g);t+="&dup="+dv_GetParam(d,"dup");if(void 0!=window._dv_win.$dvbs.CommonData.BrowserId&&void 0!=window._dv_win.$dvbs.CommonData.BrowserVersion&&void 0!=window._dv_win.$dvbs.CommonData.BrowserIdFromUserAgent)k=window._dv_win.$dvbs.CommonData.BrowserId,m=window._dv_win.$dvbs.CommonData.BrowserVersion,
g=window._dv_win.$dvbs.CommonData.BrowserIdFromUserAgent;else{var p=g?decodeURIComponent(g):navigator.userAgent;k=[{id:4,brRegex:"OPR|Opera",verRegex:"(OPR/|Version/)"},{id:1,brRegex:"MSIE|Trident/7.*rv:11|rv:11.*Trident/7|Edge/",verRegex:"(MSIE |rv:| Edge/)"},{id:2,brRegex:"Firefox",verRegex:"Firefox/"},{id:0,brRegex:"Mozilla.*Android.*AppleWebKit(?!.*Chrome.*)|Linux.*Android.*AppleWebKit.* Version/.*Chrome",verRegex:null},{id:0,brRegex:"AOL/.*AOLBuild/|AOLBuild/.*AOL/|Puffin|Maxthon|Valve|Silk|PLAYSTATION|PlayStation|Nintendo|wOSBrowser",
verRegex:null},{id:3,brRegex:"Chrome",verRegex:"Chrome/"},{id:5,brRegex:"Safari|(OS |OS X )[0-9].*AppleWebKit",verRegex:"Version/"}];g=0;m="";for(h=0;h<k.length;h++)if(null!=p.match(new RegExp(k[h].brRegex))){g=k[h].id;if(null==k[h].verRegex)break;p=p.match(new RegExp(k[h].verRegex+"[0-9]*"));null!=p&&(m=p[0].match(new RegExp(k[h].verRegex)),m=p[0].replace(m[0],""));break}k=h=Q();m=h===g?m:"";window._dv_win.$dvbs.CommonData.BrowserId=k;window._dv_win.$dvbs.CommonData.BrowserVersion=m;window._dv_win.$dvbs.CommonData.BrowserIdFromUserAgent=
g}t+="&brid="+k+"&brver="+m+"&bridua="+g;(g=dv_GetParam(d,"turl"))&&(t+="&turl="+g);(g=dv_GetParam(d,"tagformat"))&&(t+="&tagformat="+g);g="";try{var v=window._dv_win.parent;g+="&chro="+(void 0===v.chrome?"0":"1");g+="&hist="+(v.history?v.history.length:"");g+="&winh="+v.innerHeight;g+="&winw="+v.innerWidth;g+="&wouh="+v.outerHeight;g+="&wouw="+v.outerWidth;v.screen&&(g+="&scah="+v.screen.availHeight,g+="&scaw="+v.screen.availWidth)}catch(w){}t+=g;v=R();a:{g=window._dv_win;m=0;try{for(;10>m;){if(g.maple&&
"object"===typeof g.maple){var x=!0;break a}if(g==g.parent)break;m++;g=g.parent}}catch(w){}x=!1}c=(window._dv_win.dv_config.verifyJSURL||c.protocol+"//"+(window._dv_win.dv_config.bsAddress||"rtb"+c.dvregion+".doubleverify.com")+"/verify.js")+"?jsCallback="+c.callbackName+"&jsTagObjCallback="+c.tagObjectCallbackName+"&num=6"+t+"&srcurlD="+f.depth+"&ssl="+c.ssl+(q?"&dvf=0":"")+(x?"&dvf=1":"")+"&refD="+B+c.tagIntegrityFlag+c.tagHasPassbackFlag+"&htmlmsging="+(n?"1":"0")+(null!=v?"&aadid="+v:"");(f=dv_GetDynamicParams(d).join("&"))&&
(c+="&"+f);if(!1===l||u)c=c+("&dvp_isBodyExistOnLoad="+(l?"1":"0"))+("&dvp_isOnHead="+(u?"1":"0"));e="srcurl="+encodeURIComponent(e);if((l=window._dv_win[F("=@42E:@?")][F("2?46DE@C~C:8:?D")])&&0<l.length){u=[];u[0]=window._dv_win.location.protocol+"//"+window._dv_win.location.hostname;for(f=0;f<l.length;f++)u[f+1]=l[f];l=u.reverse().join(",")}else l=null;l&&(e+="&ancChain="+encodeURIComponent(l));l=4E3;/MSIE (\d+\.\d+);/.test(navigator.userAgent)&&7>=new Number(RegExp.$1)&&(l=2E3);if(d=dv_GetParam(d,
"referrer"))d="&referrer="+d,c.length+d.length<=l&&(c+=d);r.length+y.length+c.length<=l&&(c+=y,e+=r);(r=S())&&(c+="&m1="+r);(r=T())&&(c+="&bsig="+r);r=U();c+="&vavbkt="+r.vdcd;c+="&lvvn="+r.vdcv;""!=r.err&&(c+="&dvp_idcerr="+encodeURIComponent(r.err));"prerender"===window._dv_win.document.visibilityState&&(c+="&prndr=1");c+="&eparams="+encodeURIComponent(F(e))+"&"+b.getVersionParamName()+"="+b.getVersion();return{isSev1:!1,url:c}}function U(){var b="";try{var c=eval(function(b,c,d,g,n,l){n=function(b){return(b<
c?"":n(parseInt(b/c)))+(35<(b%=c)?String.fromCharCode(b+29):b.toString(36))};if(!"".replace(/^/,String)){for(;d--;)l[n(d)]=g[d]||n(d);g=[function(b){return l[b]}];n=function(){return"\\w+"};d=1}for(;d--;)g[d]&&(b=b.replace(new RegExp("\\b"+n(d)+"\\b","g"),g[d]));return b}("(19(){1n{1n{3i('1a?1y:1F')}1q(e){v{m:\"-5z\"}}19 3q(1H,2v,21){18(d 1N 5A 1H){w(1N.2u(2v)>-1&&(!21||21(1H[1N])))v 1y}v 1F}19 g(s){d h=\"\",t=\"5B.;j&5C}5y/0:5x'5t=B(5u-5v!,5w)5r\\\\{ >5D+5E\\\"5L<\";18(i=0;i<s.1e;i++)f=s.2t(i),e=t.2u(f),0<=e&&(f=t.2t((e+41)%82)),h+=f;v h}19 1R(2r,1x){1n{w(2r())m.1C((1a==1a.3m?-1:1)*1x)}1q(e){m.1C(-5P*1x);X.1C(1x+\"=\"+(e.5K||\"5J\"))}}d c=['5F\"1r-5G\"5H\"29','p','l','60&p','p','{','\\\\<}4\\\\5I-5s<\"5q\\\\<}4\\\\5a<Z?\"6','e','5b','-5,!u<}\"5c}\"','p','J','-5d}\"<59','p','=o','\\\\<}4\\\\2w\"2f\"y\\\\<}4\\\\2w\"2f\"58}2\"<,u\"<5}?\"6','e','J=',':<54}T}<\"','p','h','\\\\<}4\\\\8-2}\"E(n\"16}b?\\\\<}4\\\\8-2}\"E(n\"2E<N\"[1A*1t\\\\\\\\2I-55<2J\"2O\"56]1i}C\"13','e','57','\\\\<}4\\\\5e;5f||\\\\<}4\\\\5m?\"6','e','+o','\"1f\\\\<}4\\\\2S\"I<-5n\"2x\"5\"5o}2A<}5p\"1f\\\\<}4\\\\1o}1M>1I-1U}2}\"2x\"5\"5l}2A<}5k','e','=J','10}U\"<5}5g\"7}F\\\\<}4\\\\[5h}5i:5j]k}9\\\\<}4\\\\[t:2W\"5Q]k}9\\\\<}4\\\\[5R})5-u<}t]k}9\\\\<}4\\\\[6n]k}9\\\\<}4\\\\[6o}6p]k}6q','e','6m',':6l}<\"H-1L/2M','p','6h','\\\\<}4\\\\12<U/1p}9\\\\<}4\\\\12<U/!k}b','e','=l','1d\\\\<}4\\\\6i}/6j}U\"<5}6k\"7}6r<2B}6s\\\\6z\"6A}/k}2C','e','=S=','\\\\<}4\\\\E-6B\\\\<}4\\\\E-6C\"5\\\\U?\"6','e','+J','\\\\<}4\\\\2z!6y\\\\<}4\\\\2z!6t)p?\"6','e','6u','-}\"6v','p','x{','\\\\<}4\\\\E<2K-6w}6g\\\\<}4\\\\6f\"5Y-5Z\\\\<}4\\\\61.42-2}\"62\\\\<}4\\\\5X<N\"H}5W?\"6','e','+S','10}U\"<5}O\"17\"7}F\\\\<}4\\\\G<1J\"1f\\\\<}4\\\\G<2c}U\"<5}1j\\\\<}4\\\\1m-2.42-2}\"y\\\\<}4\\\\1m-2.42-2}\"1u\"L\"\"M<3y\"3t\"3u<\"<5}3f\"3e\\\\<Z\"3l<W\"3k{3d:3c\\\\3b<1D}3n-3a<}39\"3s\"1v%3z<W\"1v%3r?\"38\"14\"7}34','e','5S','5T:,','p','5U','\\\\<}4\\\\5V\\\\<}4\\\\2y\"2q\\\\<}4\\\\2y\"2j,T}2i+++++1j\\\\<}4\\\\63\\\\<}4\\\\2p\"2q\\\\<}4\\\\2p\"2j,T}2i+++++t','e','6b','\\\\<}4\\\\6c\"1L\"6d}9\\\\<}4\\\\E\\\\6e<M?\"6','e','6a','10}U\"<5}O:69\\\\<}4\\\\8-2}\"1u\".42-2}\"65-66<N\"67<68<6D}C\"3H<4J<3W[<]E\"27\"1r}\"2}\"3X[<]E\"27\"1r}\"2}\"E<}1g&3Y\"1\\\\<}4\\\\2h\\\\3V\\\\<}4\\\\2h\\\\1o}1M>1I-1U}2}\"z<3R-2}\"3S\"2.42-2}\"3T=3Z\"7}40\"7}P=48','e','x','49)','p','+','\\\\<}4\\\\2g:4a<5}47\\\\<}4\\\\2g\"46?\"6','e','3Q','L!!44.45.H 4b','p','x=','\\\\<}4\\\\3I}3D)u\"3E\\\\<}4\\\\3M-2?\"6','e','+=','\\\\<}4\\\\2k\"3N\\\\<}4\\\\2k\"3O--3L<\"2f?\"6','e','x+','\\\\<}4\\\\8-2}\"2l}\"2o<N\"y\\\\<}4\\\\8-2}\"2l}\"2o<N\"3G\")3J\"<:3F\"3K}b?\"6','e','+x','\\\\<}4\\\\2n)u\"3P\\\\<}4\\\\2n)u\"3C?\"6','e','43','\\\\<}4\\\\2m}s<52\\\\<}4\\\\2m}s<4L\" 4M-4N?\"6','e','4O','\\\\<}4\\\\E\"4K-2}\"E(n\"4c<N\"[1A*4F\"4E<4G]4H?\"6','e','+e','\\\\<}4\\\\8-2}\"E(n\"16}b?\\\\<}4\\\\8-2}\"E(n\"4I<:[\\\\4P}}2M][\\\\4Q,5}2]4Y}C\"13','e','4Z','1d\\\\<}4\\\\50}51\\\\<}4\\\\4X$4W','e','4S',':4R<Z','p','4T','\\\\<}4\\\\E-4U\\\\<}4\\\\E-4V}4D\\\\<}4\\\\E-4C<4l?\"6','e','4m','$H:4n}Z!4o','p','+h','\\\\<}4\\\\E\"1T\\\\<}4\\\\E\"1P-4k?\"6','e','4j','1d\\\\<}4\\\\4e:,31}U\"<5}1B\"7}4d<4g<2B}2C','e','4i','\\\\<}4\\\\12<U/4p&2V\"E/2T\\\\<}4\\\\12<U/4q}C\"3o\\\\<}4\\\\12<U/f[&2V\"E/2T\\\\<}4\\\\12<U/4A[S]]2S\"4B}b?\"6','e','4x','4w}4s}4r>2s','p','4t','\\\\<}4\\\\1h:<1Y}s<4u}9\\\\<}4\\\\1h:<1Y}s<4v<}f\"u}2P\\\\<}4\\\\2H\\\\<}4\\\\1h:<1Y}s<C[S]E:2W\"1p}b','e','l{','64\\'<}4\\\\T}6E','p','==','\\\\<}4\\\\G<1J\\\\<}4\\\\G<2d\\\\<Z\"2a\\\\<}4\\\\G<2b<W\"?\"6','e','8A','\\\\<}4\\\\2X}2e-30\"}2Y<8B\\\\<}4\\\\2X}2e-30\"}2Y/2Q?\"6','e','=8x','\\\\<}4\\\\E\"2f\"8t\\\\<}4\\\\8u<8v?\"6','e','o{','\\\\<}4\\\\8w-)2\"2U\"y\\\\<}4\\\\1h-8C\\\\1r}s<C?\"6','e','+l','\\\\<}4\\\\2R-2\"8D\\\\<}4\\\\2R-2\"8L<Z?\"6','e','+{','\\\\<}4\\\\E:8M}9\\\\<}4\\\\8J-8I}9\\\\<}4\\\\E:8E\"<8F\\\\}k}b?\"6','e','{S','\\\\<}4\\\\1l}\"11}8G\"-8H\"2f\"q\\\\<}4\\\\r\"<5}8s?\"6','e','o+',' &H)&8r','p','8d','\\\\<}4\\\\E.:2}\"c\"<8e}9\\\\<}4\\\\8f}9\\\\<}4\\\\8c<}f\"u}2P\\\\<}4\\\\2H\\\\<}4\\\\1o:}\"k}b','e','88','89\"5-\\'2G:2M','p','J{','\\\\<}4\\\\8a\"5-\\'2G:8O}8h=8o:D|q=2F|8p-5|8q--1L/2\"|2N-2F|8i\"=8j\"2f\"q\\\\<}4\\\\1V\"25:24<1D}D?\"6','e','=8k','\\\\<}4\\\\8-2}\"E(n\"16}b?\\\\<}4\\\\8-2}\"E(n\"2E<N\"[1A*1t\\\\\\\\2I-2J\"2O/95<97]1i}C\"13','e','98',')96!93}s<C','p','8T','\\\\<}4\\\\2L<<8U\\\\<}4\\\\2L<<8R<}f\"u}94?\"6','e','{l','\\\\<}4\\\\33.L>g;H\\'T)Y.8P\\\\<}4\\\\33.L>g;8V&&8W>H\\'T)Y.I?\"6','e','l=','1d\\\\<}4\\\\91\\\\92>90}U\"<5}1B\"7}F\"32}U\"<5}8Z\\\\<}4\\\\8X<2K-20\"u\"8Y}U\"<5}1B\"7}F\"32}U\"<5}85','e','{J','H:<Z<:5','p','77','\\\\<}4\\\\k\\\\<}4\\\\E\"78\\\\<}4\\\\r\"<5}3x\"3p}/1j\\\\<}4\\\\8-2}\"3w<}1g&79\\\\<}4\\\\r\"<5}1k\"}u-76=?10}U\"<5}O\"17\"7}75\\\\<}4\\\\1l}\"r\"<5}71\"14\"7}F\"72','e','73','\\\\<}4\\\\1S-U\\\\y\\\\<}4\\\\1S-74\\\\<}4\\\\1S-\\\\<}?\"6','e','7a','7b-N:7i','p','7j','\\\\<}4\\\\1X\"7k\\\\<}4\\\\1X\"86\"<5}7h\\\\<}4\\\\1X\"7g||\\\\<}4\\\\7c?\"6','e','h+','7d<u-7e/','p','{=','\\\\<}4\\\\r\"<5}1k\"}u-7f\\\\<}4\\\\1o}1M>1I-1U}2}\"q\\\\<}4\\\\r\"<5}1k\"}u-2D','e','=S','\\\\<}4\\\\70\"1f\\\\<}4\\\\6Z}U\"<5}1j\\\\<}4\\\\6L?\"6','e','{o','\\\\<}4\\\\6M}<6N\\\\<}4\\\\6K}?\"6','e','=6J','\\\\<}4\\\\G<1J\\\\<}4\\\\G<2d\\\\<Z\"2a\\\\<}4\\\\G<2b<W\"y\"1f\\\\<}4\\\\G<2c}U\"<5}t?\"6','e','J+','c>A','p','=','10}U\"<5}O\"17\"7}F\\\\<}4\\\\E\"6F\"6G:6H}6I^[6O,][6P+]6W\\'<}4\\\\6X\"2f\"q\\\\<}4\\\\E}u-6Y\"14\"7}6V=6U','e','6Q','\\\\<}4\\\\1G:!3g\\\\<}4\\\\8-2}\"E(n\"16}b?\\\\<}4\\\\8-2}\"E(n\"1O<:[f\"29*6R<W\"6S]6T<:[<Z*1t:Z,1Q]1i}C\"13','e','=7l','\\\\<}4\\\\28\"<22-23-u}7m\\\\<}4\\\\28\"<22-23-u}7Q?\"6','e','{x','7R}7K','p','7S','\\\\<}4\\\\8-2}\"E(n\"16}b?\\\\<}4\\\\8-2}\"E(n\"1O<:[<Z*1t:Z,1Q]F:<7P[<Z*7O]1i}C\"13','e','h=','7J-2}\"r\"<5}k}b','e','7L','\\\\<}4\\\\8-2}\"E(n\"16}b?\\\\<}4\\\\8-2}\"E(n\"1O<:[<Z*7M}1Q]R<-C[1A*7T]1i}C\"13','e','81','1d\\\\<}4\\\\26\"\\\\83\\\\<}4\\\\26\"\\\\84','e','80','\\\\<}4\\\\1V\"y\\\\<}4\\\\1V\"25:24<1D}?\"6','e','{e','\\\\<}4\\\\7V}Z<}7W}9\\\\<}4\\\\7X<f\"k}9\\\\<}4\\\\7Y/<}C!!7I<\"42.42-2}\"1p}9\\\\<}4\\\\7H\"<5}k}b?\"6','e','7u','T>;7v\"<4f','p','h{','\\\\<}4\\\\7s<u-7r\\\\7n}9\\\\<}4\\\\1h<}7p}b?\"6','e','7q','\\\\<}4\\\\E\"1T\\\\<}4\\\\E\"1P-35}U\"<5}O\"17\"7}F\\\\<}4\\\\1l}\"r\"<5}1k\"E<}1g&36}3j=y\\\\<}4\\\\1l}\"8-2}\"1u\".42-2}\"7w}\"u<}7x}7E\"14\"7}F\"3h?\"6','e','{h','\\\\<}4\\\\7F\\\\<}4\\\\7G}<(7D?\"6','e','7C','\\\\<}4\\\\7y<U-2Z<7z&p?1d\\\\<}4\\\\7B<U-2Z<8z/31}U\"<5}1B\"7}F\"7A','e','=7o','7t\\'<7Z\"','p','{{','\\\\<}4\\\\E\"1T\\\\<}4\\\\E\"1P-35}U\"<5}O\"17\"7}F\\\\<}4\\\\1l}\"r\"<5}1k\"E<}1g&36}3j=7U\"14\"7}F\"3h?\"6','e','7N','10}U\"<5}O\"17\"7}F\\\\<}4\\\\1G:!3g\\\\<}4\\\\1m-2.42-2}\"y\\\\<}4\\\\1m-2.42-2}\"1u\"L\"\"M<3y\"3t\"3u<\"<5}3f\"3e\\\\<Z\"3l<W\"3k{3d:3c\\\\3b<1D}3n-3a<}39\"3s\"1v%3z<W\"1v%3r?\"38\"14\"7}34','e','{+','\\\\<}4\\\\8S<8N a}8l}9\\\\<}4\\\\E}8m\"8n 8g- 1p}b','e','87','8b\\\\<}4\\\\r\"<5}1G}8K\"5M&M<C<}8y}C\"3o\\\\<}4\\\\r\"<5}3x\"3p}/1j\\\\<}4\\\\8-2}\"4z\\\\<}4\\\\8-2}\"3w<}1g&4y[S]4h=?\"6','e','l+'];d 1w='(19(){d m=[],X=[];'+3q.37()+1R.37()+'';18(d j=0;j<c.1e;j+=3){1w+='1R(19(){v '+(c[j+1]=='p'?'1a[\"'+g(c[j])+'\"]!=3U':g(c[j]))+'}, '+53(g(c[j+2]))+');'}1w+='v {m:m,X:X}})();';d K=[];d 1K=[];d 1c=1a;18(d i=0;i<6x;i++){d V=1c.3i(1w);w(V.X.1e>15){v{m:V.X[0]}}18(d 1b=0;1b<V.m.1e;1b++){d 1z=1F;18(d Q=0;Q<K.1e;Q++){w(K[Q]==V.m[1b]){1z=1y;1s}3B w(1Z.1E(K[Q])==1Z.1E(V.m[1b])){K[Q]=1Z.1E(K[Q]);1z=1y;1s}}w(!1z)K.1C(V.m[1b])}w(1c==1a.3m){1s}3B{1n{w(1c.3v.5O.5N)1c=1c.3v}1q(e){1s}}}d 1W={m:K.3A(\",\")};w(1K.1e>0)1W.X=1K.3A(\"&\");v 1W}1q(e){v{m:\"-8Q\"}}})();",
62,567,"    Z5  Ma2vsu4f2 aM EZ5Ua a44OO  a44  var       P1  res a2MQ0242U    E45Uu    return if  OO        E3 _   results    qD8  ri     currentResults C3 err   qsa  EBM 3RSvsu4f2 U3q2D8M2  5ML44P1 MQ8M2 for function window cri currWindow U5q length QN25sF Z27 E_ WDE42 tOO E35f ENuM2 EsMu try E2 fP1 catch g5 break  EC2 vFoS fc ci true exists fMU q5D8M2 push ZZ2 abs false Eu wnd Tg5 M5OO errors uM U5Z2c prop 5ML44qWZ UT _t ei Euf UIuCTZOO N5 EfaNN_uZf_35f response EuZ ZU5 Math  func _7Z fC_ 2MM _5 zt__  Ea Q42 3OO M5E32 M511tsa M5E 5Mu  E27 z5 Z2711t Q42E EU E_UaMM2 ELZg5 EufB 0UM EuZ_lEf Q42OO fu  charAt indexOf str Ef35M ENM5 EuZ_hEf E_Y Z2s ZP1 a44nD  5ML44qWfUM uZf ALZ02M ELMMuQOO BuZfEU5 kN7 sMu E__   MuU U25sF  E__N Ef2 2Qfq  BV2U uf ENu 2M_  _NuM tzsa QN25sF511tsa EcIT_0 Fsu4f2HnnDqD NTZOOqsa sqtfQ toString Ma2vsu4f2nUu m42s uMC vF3 2Ms45 SN7HF5 2HFB5MZ2MvFSN7HF vFuBf54a 4uQ2MOO Ma2HnnDqD eval uNfQftD11m vFl 3vFJlSN7HF32 top HF 3RSOO vB4u co Ht vFmheSN7HF42s 2qtf Q42tD11tN5f parent EM2s2MM2ME E3M2sP1tuB5a Ba HFM join else ujuM Z42 uOO 2r2 EZ5p5  EA5Cba 2s2MI5pu 35ZP1 MU0 EuZZTsMu 7__OO 7__E2U u_Z2U5Z2OO xJ 1Z5Ua EUM2u tDRm null E2fUuN2z21 sq2 OO2 sqt DM2 PSHM2   oo _ALb A_pLr IQN2 _V5V5OO HnDqD Ld0 2Mf cAA_cg 5MqWfUM F5ENaB4 zt_M  f32M_faB D11m lJ oJ NTZ NLZZM2ff Je V0 7A5C fOO fDE42 fY45 5IMu hx CP1 CF M2 ox squ EM2s2MM2MOO fD aNP1 2MUaMQE sOO kC5 1tk27 UEVft WD 5ML44qtZ 99D uCUuZ2OOZ5Ua CEC2 Mu 2cM4 JJ UmBu Um u_faB Jl hJ 2MUaMQOO 2MUaMQEU5 _tD zt_ tDE42 eS zt__uZ_M f_tDOOU5q COO parseInt ZBu kUM EVft eo r5 u4f ENaBf_uZ_faB xh g5a fgM2Z2 E7LZfKrA 24N2MTZ qD8M2 tf5a ZA2 24t 2Zt QN2P1ta E7GXLss0aBTZIuC 25a QN211ta 2ZtOO QOO  5Zu4 Kt Q6T uic2EHVO LnG s7 YDoMw8FRp3gd94 99 in Ue PzA NhCZ lkSvfxWX C2 Na 2Z0 ENaBf_uZ_uZ unknown message 1bqyJIma  href location 1000 r5Z2t tUZ xx _M he EuZ_hOO 5Z2f EfUM 2TsMu 2OO  EuZZ I5b5ZQOO EuZ_lOO UufUuZ2 fbQIuCpu 2qtfUM tDHs5Mq 1SH uMF21 xo xl Ef aM4P1 2BfM2Z EaNZu U2OO ho zt_4 Mtzsa q5BVD8M2 u_a ee tUBt tB LMMt a44nDqD F5BVEa a44OO5BVEu445 AEBuf2g lS M__ 2_M2s2M2 100 AOO IuMC2 b4u UCMOO UCME i2E42 s5 5NENM5U2ff_ uC_ uMfP1 a44OOk Sh EuZfBQuZf E5U4U5qDEN4uQ ELZ0 N2MOO um Sm xe 1t32 vFSN7t FZ HnnDqD FP 8lzn kE 2DnUu E5U4U511tsa E5U4U5OO E3M2szsu4f2nUu Ma2nnDqDvsu4f2 oS M2sOO FN1 2DRm hh 5NOO sq JS ___U E35aMfUuND _NM _uZB45U 2P1 CfE35aMfUuN OOq _ZBf le CfOO So uC2MOO f2MP1 Sl N4uU2_faUU2ffP1 Jo bM5 ENM LZZ035NN2Mf lo _c bQTZqtMffmU5 2MtD11 EIMuss u60 Ma2nDvsu4f2 ztIMuss ol a2TZ a44HnUu E_NUCOO E_NUCEYp_c Eu445Uu gI Z5Ua  eh 1tB2uU5 Jx 1tfMmN4uQ2Mt Z25 uC2MEUB B24 xS 1tNk4CEN3Nt HnUu E4u CcM4P1 Ef2A ENuM ZC2 lh oe  B__tDOOU5q B_UB_tD tnD CfEf2U lx ll gaf Egaf u1 ErF hl 4P1 ErP1 M5 wZ8 uZf35f DkE SS UP1 _f 5M2f zlnuZf2M UUUN 2N5 rLTp E3M2sD fNNOO E0N2U u4buf2Jl E_Vu Se fzuOOuE42 ubuf2b45U Jh ZOO fN uCOO u_ 2M_f35 a44OOkuZwkwZ8ezhn7wZ8ezhnwE3 4kE fC532M2P1 ENuMu U2f uCEa u_uZ_M2saf2_M2sM2f3P1 4Zf 2MOOkq IOO 999 ZfF EUuU oh ZfOO _I AbL zt af_tzsa tnDOOU5q A_tzsa ztBM5 f2Mc 4Qg5 U25sFLMMuQ kZ 2u4 fN4uQLZfEVft eJ".split(" "),
0,{}));c.hasOwnProperty("err")&&(b=c.err);return{vdcv:25,vdcd:c.res,err:b}}catch(e){return{vdcv:25,vdcd:"0",err:b}}}function P(b){try{if(1>=b.depth)return{url:"",depth:""};var c=[];c.push({win:window._dv_win.top,depth:0});for(var e,f=1,d=0;0<f&&100>d;){try{if(d++,e=c.shift(),f--,0<e.win.location.toString().length&&e.win!=b)return 0==e.win.document.referrer.length||0==e.depth?{url:e.win.location,depth:e.depth}:{url:e.win.document.referrer,depth:e.depth-1}}catch(l){}var g=e.win.frames.length;for(var n=
0;n<g;n++)c.push({win:e.win.frames[n],depth:e.depth+1}),f++}return{url:"",depth:""}}catch(l){return{url:"",depth:""}}}function F(b){new String;var c=new String,e;for(e=0;e<b.length;e++){var f=b.charAt(e);var d="!\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~".indexOf(f);0<=d&&(f="!\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~".charAt((d+47)%94));c+=f}return c}function A(){return Math.floor(1E12*(Math.random()+
""))}function Q(){try{if("function"===typeof window.callPhantom)return 99;try{if("function"===typeof window.top.callPhantom)return 99}catch(e){}if(void 0!=window.opera&&void 0!=window.history.navigationMode||void 0!=window.opr&&void 0!=window.opr.addons&&"function"==typeof window.opr.addons.installExtension)return 4;if(void 0!=window.chrome&&"function"==typeof window.chrome.csi&&"function"==typeof window.chrome.loadTimes&&void 0!=document.webkitHidden&&(1==document.webkitHidden||0==document.webkitHidden))return 3;
if(void 0!=window.mozInnerScreenY&&"number"==typeof window.mozInnerScreenY&&void 0!=window.mozPaintCount&&0<=window.mozPaintCount&&void 0!=window.InstallTrigger&&void 0!=window.InstallTrigger.install)return 2;if(void 0!=document.uniqueID&&"string"==typeof document.uniqueID&&(void 0!=document.documentMode&&0<=document.documentMode||void 0!=document.all&&"object"==typeof document.all||void 0!=window.ActiveXObject&&"function"==typeof window.ActiveXObject)||window.document&&window.document.updateSettings&&
"function"==typeof window.document.updateSettings)return 1;var b=!1;try{var c=document.createElement("p");c.innerText=".";c.style="text-shadow: rgb(99, 116, 171) 20px -12px 2px";b=void 0!=c.style.textShadow}catch(e){}return(0<Object.prototype.toString.call(window.HTMLElement).indexOf("Constructor")||window.webkitAudioPannerNode&&window.webkitConvertPointFromNodeToPage)&&b&&void 0!=window.innerWidth&&void 0!=window.innerHeight?5:0}catch(e){return 0}}function S(){try{var b=0,c=function(c,d){d&&32>c&&
(b=(b|1<<c)>>>0)},e=function(b,c){return function(){return b.apply(c,arguments)}},f="svg"===document.documentElement.nodeName.toLowerCase(),d=function(){return"function"!==typeof document.createElement?document.createElement(arguments[0]):f?document.createElementNS.call(document,"http://www.w3.org/2000/svg",arguments[0]):document.createElement.apply(document,arguments)},g=["Moz","O","ms","Webkit"],n=["moz","o","ms","webkit"],l={style:d("modernizr").style},u=function(b,c,g,e){function k(){h&&(delete l.style,
delete l.modElem)}e="undefined"===typeof e?!1:e;if("undefined"!==typeof g){var f=nativeTestProps(b,g);if("undefined"!==typeof f)return f}for(f=["modernizr","tspan","samp"];!l.style&&f.length;){var h=!0;l.modElem=d(f.shift());l.style=l.modElem.style}var m=b.length;for(f=0;f<m;f++){var n=b[f];var q=l.style[n];~(""+n).indexOf("-")&&(n=cssToDOM(n));if(void 0!==l.style[n]){if(e||"undefined"===typeof g)return k(),"pfx"==c?n:!0;try{l.style[n]=g}catch(w){}if(l.style[n]!=q)return k(),"pfx"==c?n:!0}}k();return!1},
q=function(b,c,d,f,l){var k=b.charAt(0).toUpperCase()+b.slice(1),h=(b+" "+g.join(k+" ")+k).split(" ");if("string"===typeof c||"undefined"===typeof c)return u(h,c,f,l);h=(b+" "+n.join(k+" ")+k).split(" ");for(var m in h)if(h[m]in c){if(!1===d)return h[m];b=c[h[m]];return"function"===typeof b?e(b,d||c):b}return!1};c(0,!0);c(1,!!function(b,c,d){if(0===b.indexOf("@"))return atRule(b);-1!=b.indexOf("-")&&(b=cssToDOM(b));return c?q(b,c,d):q(b,"pfx")}("requestFileSystem",window));c(2,window.CSS?"function"==
typeof window.CSS.escape:!1);c(3,q("shapeOutside","content-box",!0));return b}catch(k){return 0}}function T(){try{var b=window,c=0;try{for(;b.parent&&b!=b.parent&&b.parent.document&&!(b=b.parent,10<c++););}catch(d){}var e=0;c=function(b,c){c&&(e=(e|1<<b)>>>0)};var f=b.document;c(14,b.playerInstance&&f.querySelector('script[src*="ads-player.com"]'));c(14,(b.CustomWLAdServer||b.DbcbdConfig)&&(a=f.querySelector('p[class="footerCopyright"]'),a&&a.textContent.match(/ MangaLife 2016/)));c(15,b.zpz&&b.zpz.createPlayer);
c(15,b.vdApp&&b.vdApp.createPlayer);c(15,f.querySelector('body>div[class="z-z-z"]'));c(16,b.xy_checksum&&b.place_player&&(b.logjwonready&&b.logContentPauseRequested||b.jwplayer));c(17,b==b.top&&""==f.title?(a=f.querySelector('body>object[id="player"]'),a&&a.data&&1<a.data.indexOf("jwplayer")&&"visibility: visible;"==a.getAttribute("style")):!1);c(17,f.querySelector('script[src*="sitewebvideo.com"]'));c(17,b.InitPage&&b.cef&&b.InitAd);c(17,b==b.top&&""==f.title?(a=f.querySelector("body>#player"),null!=
a&&null!=(null!=a.querySelector('div[id*="opti-ad"]')||a.querySelector('iframe[src="about:blank"]'))):!1);c(17,b==b.top&&""==f.title&&b.InitAdPlayer?(a=f.querySelector('body>div[id="kt_player"]'),null!=a&&null!=a.querySelector('div[class="flash-blocker"]')):!1);c(17,null!=b.clickplayer&&null!=b.checkRdy2);return e}catch(d){return 0}}function R(){function b(b){if(null==b||""==b)return"";var c=function(b,c){return b<<c|b>>>32-c},d=function(b){for(var c="",d,e=7;0<=e;e--)d=b>>>4*e&15,c+=d.toString(16);
return c},g=[1518500249,1859775393,2400959708,3395469782];b+=String.fromCharCode(128);for(var e=Math.ceil((b.length/4+2)/16),f=Array(e),m=0;m<e;m++){f[m]=Array(16);for(var h=0;16>h;h++)f[m][h]=b.charCodeAt(64*m+4*h)<<24|b.charCodeAt(64*m+4*h+1)<<16|b.charCodeAt(64*m+4*h+2)<<8|b.charCodeAt(64*m+4*h+3)}f[e-1][14]=8*(b.length-1)/Math.pow(2,32);f[e-1][14]=Math.floor(f[e-1][14]);f[e-1][15]=8*(b.length-1)&4294967295;b=1732584193;h=4023233417;var r=2562383102,y=271733878,B=3285377520,t=Array(80);for(m=0;m<
e;m++){for(var p=0;16>p;p++)t[p]=f[m][p];for(p=16;80>p;p++)t[p]=c(t[p-3]^t[p-8]^t[p-14]^t[p-16],1);var v=b;var x=h;var w=r;var z=y;var A=B;for(p=0;80>p;p++){var E=Math.floor(p/20),C=c(v,5);a:{switch(E){case 0:var D=x&w^~x&z;break a;case 1:D=x^w^z;break a;case 2:D=x&w^x&z^w&z;break a;case 3:D=x^w^z;break a}D=void 0}E=C+D+A+g[E]+t[p]&4294967295;A=z;z=w;w=c(x,30);x=v;v=E}b=b+v&4294967295;h=h+x&4294967295;r=r+w&4294967295;y=y+z&4294967295;B=B+A&4294967295}return d(b)+d(h)+d(r)+d(y)+d(B)}function c(){try{return!!window.sessionStorage}catch(g){return!0}}
function e(){try{return!!window.localStorage}catch(g){return!0}}function f(){var b=document.createElement("canvas");if(b.getContext&&b.getContext("2d")){var c=b.getContext("2d");c.textBaseline="top";c.font="14px 'Arial'";c.textBaseline="alphabetic";c.fillStyle="#f60";c.fillRect(0,0,62,20);c.fillStyle="#069";c.fillText("!image!",2,15);c.fillStyle="rgba(102, 204, 0, 0.7)";c.fillText("!image!",4,17);return b.toDataURL()}return null}try{var d=[];d.push(["lang",navigator.language||navigator.browserLanguage]);
d.push(["tz",(new Date).getTimezoneOffset()]);d.push(["hss",c()?"1":"0"]);d.push(["hls",e()?"1":"0"]);d.push(["odb",typeof window.openDatabase||""]);d.push(["cpu",navigator.cpuClass||""]);d.push(["pf",navigator.platform||""]);d.push(["dnt",navigator.doNotTrack||""]);d.push(["canv",f()]);return b(d.join("=!!!="))}catch(g){return null}}this.createRequest=function(){var b=!1,c=window._dv_win,e=0,f=!1,d;try{for(d=0;10>=d;d++)if(null!=c.parent&&c.parent!=c)if(0<c.parent.location.toString().length)c=c.parent,
e++,b=!0;else{b=!1;break}else{0==d&&(b=!0);break}}catch(r){b=!1}0==c.document.referrer.length?b=c.location:b?b=c.location:(b=c.document.referrer,f=!0);if(!window._dv_win.dvbsScriptsInternal||!window._dv_win.dvbsProcessed||0==window._dv_win.dvbsScriptsInternal.length)return{isSev1:!1,url:null};var g=window._dv_win.dv_config&&window._dv_win.dv_config.isUT?window._dv_win.dvbsScriptsInternal[window._dv_win.dvbsScriptsInternal.length-1]:window._dv_win.dvbsScriptsInternal.pop();d=g.script;this.dv_script_obj=
g;this.dv_script=d;window._dv_win.dvbsProcessed.push(g);window._dv_win._dvScripts.push(d);var n=d.src;this.dvOther=0;this.dvStep=1;var l=window._dv_win.dv_config?window._dv_win.dv_config.bst2tid?window._dv_win.dv_config.bst2tid:window._dv_win.dv_config.dv_GetRnd?window._dv_win.dv_config.dv_GetRnd():A():A();g=window.parent.postMessage&&window.JSON;var u=!0,q=!1;if("0"==dv_GetParam(n,"t2te")||window._dv_win.dv_config&&1==window._dv_win.dv_config.supressT2T)q=!0;if(g&&0==q)try{var k=G(window._dv_win.dv_config.bst2turl||
"https://cdn3.doubleverify.com/bst2tv3.html","bst2t_"+l);u=C(k)}catch(r){}k={};try{q=/[\?&]([^&]*)=([^&#]*)/gi;for(var m=q.exec(n);null!=m;)"eparams"!==m[1]&&(k[m[1]]=m[2]),m=q.exec(n);var h=k}catch(r){h=k}h.perf=this.perf;h.uid=l;h.script=this.dv_script;h.callbackName="__verify_callback_"+h.uid;h.tagObjectCallbackName="__tagObject_callback_"+h.uid;h.tagAdtag=null;h.tagPassback=null;h.tagIntegrityFlag="";h.tagHasPassbackFlag="";0==(null!=h.tagformat&&"2"==h.tagformat)&&(m=O(h.script),h.tagAdtag=m.tagAdTag,
h.tagPassback=m.tagPassback,m.isBadImp?h.tagIntegrityFlag="&isbadimp=1":m.hasPassback&&(h.tagHasPassbackFlag="&tagpb=1"));(m=(/iPhone|iPad|iPod|\(Apple TV|iOS|Coremedia|CFNetwork\/.*Darwin/i.test(navigator.userAgent)||navigator.vendor&&"apple, inc."===navigator.vendor.toLowerCase())&&!window.MSStream)?k="https:":(k=h.script.src,n="http:",l=window._dv_win.location.toString().match("^http(?:s)?"),"https"!=k.match("^https")||"https"!=l&&"http"==l||(n="https:"),k=n);h.protocol=k;h.ssl="0";"https:"===
h.protocol&&(h.ssl="1");k=h;(n=window._dv_win.dvRecoveryObj)?("2"!=k.tagformat&&(n=n[k.ctx]?n[k.ctx].RecoveryTagID:n._fallback_?n._fallback_.RecoveryTagID:1,1===n&&k.tagAdtag?document.write(k.tagAdtag):2===n&&k.tagPassback&&document.write(k.tagPassback)),k=!0):k=!1;if(k)return{isSev1:!0};this.dvStep=2;N(h,m);d=d&&d.parentElement&&d.parentElement.tagName&&"HEAD"===d.parentElement.tagName;this.dvStep=3;return I(this,h,b,c,e,f,g,u,d,m)};this.sendRequest=function(b){var c=dv_GetParam(b,"tagformat");c&&
"2"==c?$dvbs.domUtilities.addScriptResource(b,document.body):dv_sendScriptRequest(b);try{var e=K(this.dv_script_obj&&this.dv_script_obj.injScripts),f=G("about:blank");f.id=f.name;var d=f.id.replace("iframe_","");f.setAttribute&&f.setAttribute("data-dv-frm",d);C(f,this.dv_script);if(this.dv_script){var g=this.dv_script;a:{b=null;try{if(b=f.contentWindow){var n=b;break a}}catch(q){}try{if(b=window._dv_win.frames&&window._dv_win.frames[f.name]){n=b;break a}}catch(q){}n=null}g.dvFrmWin=n}var l=L(f);if(l)l.open(),
l.write(e);else{try{document.domain=document.domain}catch(q){}var u=encodeURIComponent(e.replace(/'/g,"\\'").replace(/\n|\r\n|\r/g,""));f.src='javascript: (function(){document.open();document.domain="'+window.document.domain+"\";document.write('"+u+"');})()"}}catch(q){e=(window._dv_win.dv_config=window._dv_win.dv_config||{}).tpsAddress||"tps30.doubleverify.com",dv_SendErrorImp(e+"/verify.js?ctx=818052&cmp=1619415",[{dvp_jsErrMsg:"DvFrame: "+encodeURIComponent(q)}])}return!0};this.isApplicable=function(){return!0};
this.onFailure=function(){};window.debugScript&&(window.CreateUrl=I);this.getVersionParamName=function(){return"ver"};this.getVersion=function(){return"95"}};


function dvbs_src_main(dvbs_baseHandlerIns, dvbs_handlersDefs) {

    this.bs_baseHandlerIns = dvbs_baseHandlerIns;
    this.bs_handlersDefs = dvbs_handlersDefs;

    this.exec = function () {
        try {
            window._dv_win = (window._dv_win || window);
            window._dv_win.$dvbs = (window._dv_win.$dvbs || new dvBsType());

            window._dv_win.dv_config = window._dv_win.dv_config || {};
            window._dv_win.dv_config.bsErrAddress = window._dv_win.dv_config.bsAddress || 'rtb0.doubleverify.com';

            var errorsArr = (new dv_rolloutManager(this.bs_handlersDefs, this.bs_baseHandlerIns)).handle();
            if (errorsArr && errorsArr.length > 0)
                dv_SendErrorImp(window._dv_win.dv_config.bsErrAddress + '/verify.js?ctx=818052&cmp=1619415&num=6', errorsArr);
        }
        catch (e) {
            try {
                dv_SendErrorImp(window._dv_win.dv_config.bsErrAddress + '/verify.js?ctx=818052&cmp=1619415&num=6&dvp_isLostImp=1', {dvp_jsErrMsg: encodeURIComponent(e)});
            } catch (e) {
            }
        }
    };
};

try {
    window._dv_win = window._dv_win || window;
    var dv_baseHandlerIns = new dv_baseHandler();
	

    var dv_handlersDefs = [];
    (new dvbs_src_main(dv_baseHandlerIns, dv_handlersDefs)).exec();
} catch (e) { }