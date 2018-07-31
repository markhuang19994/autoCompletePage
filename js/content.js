console.log('content loaded');
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log(sender.tab ?
        "接收來自內容腳本的訊息：" + sender.tab.url
        : "接收來自擴充功能內部的訊息");
    if (request.name === "autoCompleteMsg") {
        console.log('get message: ');
        console.log(request);
        if (request.msg.action === 'triggerFunction') {
            try {
                let result = window[request.msg.function.name]
                    .apply(request.msg.function.target || this, request.msg.function.params);
                sendResponse(result);
            } catch (e) {
                sendResponse({result: 'execute function error', detail: e.toString()});
            }
        }
    }
});