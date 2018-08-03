/**
 * @author MarkHuang
 * @since  2018/7/28
 */
(() => {
    let storageUtil = {};

    async function getStorageData(key) {
        return new Promise(res => {
            chrome.storage.local.get(key, function (items) {
                if (Object.keys(items).length > 0) {
                    console.log(`%cget ${key} form chrome storage: `, 'color:#b90000;');
                    console.log(JSON.stringify(items));
                    res(items);
                } else {
                    getSyncStorageData(key).then(() => res());
                }
            });
        })
    }

    async function getSyncStorageData(key) {
        return new Promise(res => {
            chrome.storage.sync.get(key, function (items) {
                console.log(`%cget ${key} form chrome sync storage: `, 'color:#b90000;');
                console.log(JSON.stringify(items));
                res(items);
            });
        })
    }

    function setStorageData(items) {
        chrome.storage.local.set(items);
        console.log(`%cset items in chrome storage: `, 'color:#b90000;');
        console.log(JSON.stringify(items));
    }

    storageUtil = {getStorageData, setStorageData};
    window.storageUtil = storageUtil;
})();
