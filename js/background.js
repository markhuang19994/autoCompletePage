(() => {
    chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
        if (changeInfo.status === 'complete' && tab.active) {
            chrome.browserAction.disable(tabId);
            if (new RegExp(/chrome.*:\/\//).test(tab.url)) return;

            const {getStorageData} = window.storageUtil;
            const {urlWhiteList} = await getStorageData('urlWhiteList');
            if (!isSupportPage(tab.url, urlWhiteList)) {
                return;
            }
            chrome.browserAction.setIcon({path: './image/icon.png'})
            chrome.browserAction.enable(tabId);

            chrome.tabs.executeScript(tabId, {file: "./js/storageUtil.js"});
            chrome.tabs.executeScript(tabId, {file: "./js/global.js"});
            chrome.tabs.executeScript(tabId, {file: "./js/vendor/jquery-3.3.1.min.js"});

            const {allProjectData} = await getStorageData('allProjectData');
            const projectInfo = getPageDataAndNeedCompletePageFromAllProjectData(allProjectData, tab.url);

            const needCompletePages = projectInfo['needCompletePages'];
            let isNeedAutoComplete = isPageNeedAutoComplete(tab.url, needCompletePages);
            chrome.tabs.executeScript(tabId, {
                code: `window.isNeedAutoComplete = ${isNeedAutoComplete}`
            });

            const pageData = projectInfo['pageData'];
            const pageDataStr = JSON.stringify(pageData);
            chrome.tabs.executeScript(tabId, {
                code: `window.pageData = ${pageDataStr ? pageDataStr.replace(/"#{(.*?)}"|\\"#{(.*?)}\\"/g, '$1') : '{}'}`
            });

            chrome.tabs.executeScript(tabId, {file: "./js/autoCompete.js"});
            printSquare();
        }
    });

    chrome.browserAction.onClicked.addListener(function (tab) {
        chrome.tabs.executeScript(tab.id, {
            code: ` 
                (() => {
                    let data = generalPageData(window.location.href);
                    console.log(JSON.stringify(data, null, '\t'));
                    alert('本頁資料已顯示於console');
                })();`
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
})();
