/**
 * @author MarkHuang
 * @since  2018/7/28
 */
(() => {
    let storageUtil = {};

    async function getStorageData(key) {
        return new Promise(res => {
            chrome.storage.sync.get(key, function (items) {
                console.log(`%cget ${key} form chrome storage: `, 'color:#b90000;');
                console.log(JSON.stringify(items));
                res(items);
            });
        })
    }

    function setStorageData(items) {
        chrome.storage.sync.set(items);
        console.log(`%cset items in chrome storage: `, 'color:#b90000;');
        console.log(JSON.stringify(items));
    }

    storageUtil = {getStorageData, setStorageData};
    window.storageUtil = storageUtil;
})();
