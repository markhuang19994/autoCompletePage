/**
 * @author MarkHuang
 * @since  2018/7/27
 */
$(async function () {
    //目前allPageData由background.js取得後直接放入全域變數,因為chrome.tabs.executeScript可以直接eval function
    let allPageData = window['allPageData'];
    let pageData = allPageData[window.location.href];

    if (window['isNeedAutoComplete']) {
        completeData(pageData);
    }

    function completeData(pageData) {
        return Object.keys(pageData).asyncForEach(fieldName => {
            return new Promise(res => {
                let ele = document.getElementById(fieldName);
                const field = pageData[fieldName];

                const val = field['val'];
                if (val) {
                    ele.value = val;
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
                    execFunction.apply(ele || this);
                }

                const bindKey = field['bindKey'];
                if (bindKey) {
                    let keys = bindKey[0].replace(/\s/g, '').split('+');

                    $(document).on('keydown', (e) => {
                        let isMatch = true;
                        keys.forEach(key => {
                            if (key === 'shiftKey' || key === 'ctrlKey' || key === 'altKey') {
                                isMatch = e[key];
                            } else {
                                let code = isNaN(key) ? key.toUpperCase().charCodeAt(0) : ~~key;
                                isMatch = e.which === code;
                            }
                        });
                        isMatch && bindKey[1].apply(ele || this);
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
        let genData = {};
        genData[nowPage] = {};
        console.group('unSupportElement');
        Array.from(document.querySelectorAll('input, select')).forEach(e => {
            genData[nowPage][e.id] = {};
            if (e.id !== '' && (e.type === 'text' || e.tagName === 'SELECT')) {
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
});