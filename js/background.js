(() => {
    const {getStorageData, setStorageData} = window.storageUtil;
    chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
        if (changeInfo.status === 'complete' && tab.active) {
            chrome.browserAction.disable(tabId);
            if (new RegExp(/(chrome.*:\/\/)|(.*chrome.google.com.*)/).test(tab.url)) return;

            const {urlWhiteList} = await getStorageData('urlWhiteList');
            if (!isSupportPage(tab.url, urlWhiteList)) {
                return;
            }
            chrome.browserAction.setIcon({path: './image/icon.png', tabId: tab.id});
            chrome.browserAction.enable(tabId);

            chrome.tabs.executeScript(tabId, {file: "./js/storageUtil.js"});
            chrome.tabs.executeScript(tabId, {file: "./js/word.js"});
            chrome.tabs.executeScript(tabId, {file: "./js/global.js"});
            chrome.tabs.executeScript(tabId, {file: "./js/vendor/jquery-3.3.1.min.js"});

            const {allProjectData} = await getStorageData('allProjectData');
            const projectInfo = getPageDataAndNeedCompletePageFromAllProjectData(allProjectData, tab.url);
            if (Object.keys(projectInfo['pageData']).length === 0) {
                chrome.browserAction.setIcon({path: './image/icon-red.png', tabId: tab.id});
            } else {
                const needCompletePages = projectInfo['needCompletePages'];

                const {autoCompleteFunction} = await getStorageData('autoCompleteFunction');
                if (autoCompleteFunction !== false) {
                    const isNeedAutoComplete = isPageNeedAutoComplete(tab.url, needCompletePages);
                    chrome.tabs.executeScript(tabId, {
                        code: `window.isNeedAutoComplete = ${isNeedAutoComplete}`
                    });
                    chrome.browserAction.setTitle({title: 'auto page complete function enable'});
                } else {
                    chrome.browserAction.setIcon({path: './image/icon-orange.png', tabId: tab.id});
                    chrome.browserAction.setTitle({title: 'auto page complete function unable'});
                }

                const pageData = projectInfo['pageData'];
                const pageDataStr = JSON.stringify(pageData);
                chrome.tabs.executeScript(tabId, {
                    code: `
                        window.pageData = ${pageDataStr ? pageDataStr.replace(/"#{(.*?)}"|\\"#{(.*?)}\\"/g, '$1') : '{}'};
                        window.pageDataWithoutParseFunction = ${pageDataStr ? pageDataStr : '{}'};
                        if(!window.pageData){
                            console.error('頁面json的function轉換失敗');
                            window.pageData = pageDataStr;
                        }
                    `
                });
            }

            chrome.tabs.executeScript(tabId, {file: "./js/autoCompete.js"});
            printSquare();
        }
    });

    chrome.browserAction.onClicked.addListener(async function (tab) {
        chrome.tabs.sendMessage(tab.id, {name: 'browserActionClick'}, async resp => {
            if (!resp) return;
            if (resp['shiftKey']) {
                const {autoCompleteFunction} = await getStorageData('autoCompleteFunction');
                setStorageData({autoCompleteFunction: autoCompleteFunction === false});
                chrome.browserAction.setIcon({
                    path: `./image/icon${autoCompleteFunction !== false ? '-orange' : ''}.png`,
                    tabId: tab.id
                });
                alert(`已${autoCompleteFunction !== false ? '關閉' : '開啟'}頁面自動填充功能`);
            } else if (resp['newPageData']) {
                console.log(`new page data: ${resp['newPageData']}`);
                const {allProjectData} = await getStorageData('allProjectData');
                const {mergeProject, newAllProjectData} = mergePageData(allProjectData, resp['newPageData'], tab.url);
                if (mergeProject === '') {
                    alert(`未找到與本頁面(${tab.url})對應的專案`);
                } else {
                    setStorageData({allProjectData: JSON.stringify(newAllProjectData)});
                    alert(`已更新專案${mergeProject}資料`);
                }
            } else if (resp['msg']) {
                alert(resp['msg']);
            }
        });
    });

    //負責從autoComplete.js接收message在轉發給content.js
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (request.name === 'autoCompleteMsg') {
            chrome.tabs.sendMessage(sender.tab.id, request, function (response) {
                sendResponse(response);
                console.log(`回復觸發訊息: ${JSON.stringify(response)}`);
            });
        }
    });

    function isSupportPage(pageUrl, urlList = "{}") {
        let arrUrlList = JSON.parse(urlList);
        return Array.isArray(arrUrlList) && arrUrlList.some(urlPattern => urlPattern !== '' && new RegExp(urlPattern).test(pageUrl));
    }

    function isPageNeedAutoComplete(pageUrl, urlList = []) {
        return urlList.some(urlPattern => urlPattern !== '' && urlPattern === pageUrl);
    }

    function printSquare() {
        console.log("%c ", "padding:5px 50px;line-height:120px;background:url('https://media.giphy.com/media/x5Iz2cPx6MA80/giphy.gif') no-repeat;background-size: 120px;height: 120px;");
    }

    function getPageDataAndNeedCompletePageFromAllProjectData(allProjectData, pageURL) {
        let result = {pageData: {}, needCompletePages: []};
        let allProjectDataObj = allProjectData ? JSON.parse(allProjectData) : {};
        Object.keys(allProjectDataObj).forEach(projectData => {
            let projectInfo = allProjectDataObj[projectData];
            Object.keys(projectInfo).forEach(info => {
                if (info === 'allPageData') {
                    let allPageData = projectInfo[info];
                    Object.keys(allPageData).forEach(url => {
                        if (pageURL === url) {
                            result.pageData = allPageData[url] || {};
                            result.needCompletePages = projectInfo['needCompletePages'] || [];
                        }
                    })
                }
            })
        });
        return result;
    }

    function mergePageData(allProjectData, newPageData, pageUrl) {
        let mergeProject = '';
        let allProjectDataObj = JSON.parse(allProjectData);
        Object.keys(allProjectDataObj).forEach(projectName => {
            if (
                allProjectDataObj[projectName] &&
                allProjectDataObj[projectName]['allPageData'] &&
                allProjectDataObj[projectName]['allPageData'][pageUrl]
            ) {
                allProjectDataObj[projectName]['allPageData'][pageUrl] = newPageData;
                mergeProject = projectName;
            }
        });
        return {mergeProject, newAllProjectData: allProjectDataObj};
    }
})();
