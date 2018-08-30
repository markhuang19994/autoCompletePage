/**
 * @author MarkHuang
 * @since  2018/7/27
 */
$(async function () {
    //目前allPageData由background.js取得後直接放入全域變數,因為chrome.tabs.executeScript可以直接eval function
    let pageData = window['pageData'];

    if (window['isNeedAutoComplete']) {
        completeData(pageData);
    }

    function completeData(pageData) {
        return Object.keys(pageData).asyncForEach(fieldName => {
            return new Promise(res => {
                let ele = document.getElementById(fieldName) || document.querySelector(fieldName);
                const field = pageData[fieldName];

                const val = field['val'];
                if (val) {
                    if (!ele) {
                        console.error(`錯誤,不能為不存在的欄位設定值: ` + fieldName);
                        res();
                        return false;
                    }
                    ele.value = typeof val === 'function' ? val() : val;
                }

                const action = field['act'];
                if (action && typeof ele[action] === 'function') {
                    ele[action]();
                }

                const triggerEvent = field['trig'];
                if (triggerEvent) {
                    triggerHTMLEvent(ele, triggerEvent)
                }

                const execFunction = field['func'];
                if (execFunction) {
                    execFunction();
                }

                const bindKey = field['bindKey'];
                if (bindKey) {
                    let keys = bindKey[0].replace(/\s/g, '').split('+');

                    $(document).on('keydown', e => {
                        let isMatch = true;
                        keys.forEach(key => {
                            if (key === 'shiftKey' || key === 'ctrlKey' || key === 'altKey') {
                                isMatch = e[key];
                            } else {
                                let code = isNaN(key) ? key.toUpperCase().charCodeAt(0) : ~~key;
                                isMatch = e.which === code;
                            }
                        });
                        isMatch && bindKey[1]();
                    });
                }

                const waitFunc = field['wait'];
                let waitPromise = Promise.resolve();
                if (waitFunc) {
                    waitPromise = waitCondition.call(ele || this, waitFunc);
                }

                waitPromise.then(() => {
                    const pauseTime = field['pause'];
                    if (pauseTime) {
                        pause(pauseTime).then(() => res());
                    } else {
                        res();
                    }
                });
            })
        });
    }

    $(document).on('keydown', e => {
        window.ctrlKey = e.ctrlKey;
        window.shiftKey = e.shiftKey;
        window.altKey = e.altKey;

        if (e.ctrlKey && e.shiftKey && e.which === 'A'.codePointAt(0)) {
            completeData(pageData);
        }
        if (e.ctrlKey && e.altKey && e.which === 'A'.codePointAt(0)) {
            sessionStorage.setItem('isAutoRun', true);
        }
        if (e.ctrlKey && e.altKey && e.which === 'Z'.codePointAt(0)) {
            sessionStorage.removeItem('isAutoRun');
        }
    });

    $(document).on('keyup', e => {
        window.ctrlKey = e.ctrlKey;
        window.shiftKey = e.shiftKey;
        window.altKey = e.altKey;
    });

    (function autoRun() {
        if (sessionStorage.getItem('isAutoRun')) {
            completeData(pageData).then(() => {
                let e = jQuery.Event("keydown");
                e.which = 13; // enter
                $(document).trigger(e);
            });
        }
    })();

    window.generalPageData = (nowPage) => {
        let genData = {[nowPage]: {}};
        let supportInputType = ['text', 'password'];
        if (window.ctrlKey) {
            supportInputType.push('hidden');
        }
        console.group('unSupportElement');
        Array.from(document.querySelectorAll('input, select')).forEach(e => {
            genData[nowPage][e.id] = {};
            if (e.id !== '' && (supportInputType.includes(e.type) || e.tagName === 'SELECT')) {
                if (e.value) {
                    genData[nowPage][e.id]['val'] = e.value;
                }
                if (e.tagName === 'SELECT') {
                    genData[nowPage][e.id]['trig'] = 'change';
                }
            } else if (e.id !== '' && (e.type === 'checkbox' || e.type === 'radio')) {
                if (e.checked) {
                    genData[nowPage][e.id]['act'] = 'click';
                }
            } else {
                delete genData[nowPage][e.id];
                console.info(e);
            }
        });
        console.groupEnd();
        return genData;
    };

    function mergePageData() {
        const newPageData = generalPageData('temp')['temp'];
        const originPageData = window['pageDataWithoutParseFunction'] || {};
        const allKeys = mergeArrayWithOrder(Object.keys(originPageData), Object.keys(newPageData));
        let result = {};
        allKeys.forEach(key => {
           if(originPageData[key]){
               result[key] = originPageData[key];
               if (newPageData[key]) {
                   if (newPageData[key]['val']) {
                       result[key]['val'] = newPageData[key]['val'];
                   }
                   if (newPageData[key]['act']) {
                       result[key]['act'] = newPageData[key]['act'];
                   }
                   if (newPageData[key]['trig']) {
                       result[key]['trig'] = newPageData[key]['trig'];
                   }
               }
           } else{
               result[key] = newPageData[key];
           }
        });
        return result;
    }

    function mergeArrayWithOrder(newArr, originArr) {
        let distinctNewArr = Array.from(new Set(newArr));
        let distinctOriginArr = Array.from(new Set(originArr));
        let result = [];
        let same = findArrayFirstSameValue(distinctNewArr, distinctOriginArr);
        if (same) {
            result = result
                .concat(
                    distinctNewArr
                        .slice(0)
                        .reverse()
                        .slice(distinctNewArr.length - distinctNewArr.indexOf(same))
                        .reverse()
                ).concat(
                    distinctOriginArr
                        .slice(0)
                        .reverse()
                        .slice(distinctOriginArr.length - distinctOriginArr.indexOf(same))
                        .reverse()
                ).concat([same]);
            let sliceNewArr = distinctNewArr.slice(distinctNewArr.indexOf(same) + 1);
            let sliceOriginArr = distinctOriginArr.slice(distinctOriginArr.indexOf(same) + 1);
            return result.concat(mergeArrayWithOrder(sliceNewArr, sliceOriginArr));
        } else {
            return result.concat(distinctNewArr).concat(distinctOriginArr);
        }
    }

    function findArrayFirstSameValue(arr1, arr2) {
        return arr1.filter(key => arr2.indexOf(key) !== -1)[0];
    }

    window.printPageData = (data) => {
        console.log(`%c${JSON.stringify(data, null, '\t')}`, 'color:#b90000;display: contents;');
    };

    function sendMessageToContent(doWhat) {
        new Promise(res => {
            chrome.runtime.sendMessage({msg, name: 'autoCompleteMsg'}, function (response) {
                res(response);
            });
        });
    }

    function triggerHTMLEvent(element, triggerEvent) {
        if ("createEvent" in document) {
            let evt = document.createEvent("HTMLEvents");
            evt.initEvent(triggerEvent, false, true);
            element.dispatchEvent(evt);
        }
        else
            element.fireEvent(`on${triggerEvent}`);
    }

    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        console.log(sender.tab ?
            "接收來自內容腳本的訊息：" + sender.tab.url
            : "接收來自擴充功能內部的訊息");
        if (request.name === "browserActionClick") {
            if (!window.shiftKey && !window.altKey) {
                let data = generalPageData(window.location.href);
                console.log(JSON.stringify(data, null, '	'));
                sendResponse({msg: '本頁資料已顯示於console'});
            } else {
               if(window.shiftKey){
                   sendResponse({shiftKey: window.shiftKey});
               }else if(window.altKey){
                   sendResponse({newPageData: mergePageData()});
               }
            }
        }
    });
});