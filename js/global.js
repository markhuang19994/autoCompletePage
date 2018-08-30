/**
 * @author MarkHuang
 * @since  2018/7/29
 */

Array.prototype.asyncForEach = function f(func) {
    return new Promise(res => {
        if (this.length === 0) {
            res();
            return false;
        }
        let arr = this;
        let len = arr.length;
        let index = 0;

        (function asyncCall(func) {
            func(arr[index++]).then(() => {
                if (index < len) {
                    asyncCall(func);
                } else {
                    res();
                }
            });
        })(func);
    })
};

Array.prototype.remove = function (from, to) {
    to = to || from;
    let newArr = this.slice();
    let rest = newArr.slice(to + 1 || newArr.length);
    newArr.length = from < 0 ? newArr.length + from : from;
    newArr.push.apply(newArr, rest);
    return newArr;
};

const pause = time => {
    return new Promise(res => setTimeout(() => res(), time));
};

const waitCondition = func => {
    return new Promise(res => {
        (function _wait() {
            if (func()) {
                res();
            } else {
                setTimeout(_wait);
            }
        })();
    });
};

const waitSelectHasValue = (id, value) => Array.from(document.querySelectorAll(`#${id} option`)).some(e => e.value === value);

const waitElementLoaded = id => !!document.getElementById(id);

const jsonStringifyWithFunction = objWithFunction => {
    return JSON.stringify(objWithFunction, function (key, val) {
        if (typeof val === 'function') {
            return val + '';
        }
        return val;
    });
};

const readFileAsText = file => {
    return new Promise((res, rej) => {
        let fr = new FileReader();
        fr.onload = () => res(fr.result);
        fr.onerror = (e) => rej(e);
        fr.readAsText(file);
    });
};

const download = (filename, text) => {
    let e = document.createElement("a");
    e.setAttribute(
        "href",
        "data:text/plain;charset=utf-8," + encodeURIComponent(text)
    );
    e.setAttribute("download", filename);
    e.style.display = "none";
    document.body.appendChild(e);
    e.click();
    document.body.removeChild(e);
};

const letTextAreaCanKeyTab = () => {
    //text area with tab from https://stackoverflow.com/questions/6637341/use-tab-to-indent-in-textarea #user1949974
    let textareas = document.getElementsByTagName('textarea');
    let count = textareas.length;
    for (let i = 0; i < count; i++) {
        textareas[i].onkeydown = function (e) {
            if (e.keyCode === 9 || e.which === 9) {
                e.preventDefault();
                let s = this.selectionStart;
                this.value = this.value.substring(0, this.selectionStart) + "\t" + this.value.substring(this.selectionEnd);
                this.selectionEnd = s + 1;
            }
        }
    }
};

const generateUniformNumberArray = (init, end) => {
    let result = [];
    if (init <= end) {
        for (let i = init; i <= end; i++) {
            result.push(i);
        }
    } else {
        for (let i = end; i >= init; i--) {
            result.push(i);
        }
    }
    return result;
};

function generateRandomIdCardNumber() {
    const idFirstWordArr = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
    const idFirstWordNumberArr = ["10", "11", "12", "13", "14", "15", "16", "17", "34", "18", "19", "20", "21", "22", "35", "23", "24", "25", "26", "27", "28", "29", "32", "30", "31", "33"]
    const firstWord = getSubRandomArray(idFirstWordArr, 1).join('');
    const secNumber = getSubRandomArray([1, 2], 1).join('');
    const other7Number = getSubRandomArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 7).join('');
    const lastNumber = 10 - (calcIdCard(idFirstWordNumberArr[idFirstWordArr.indexOf(firstWord)] + secNumber + other7Number) % 10);
    return firstWord + secNumber + other7Number + lastNumber;
}

function calcIdCard(idCardWithOutCheckNum) {
    const weighting = [1, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    let sum = 0;
    for (let i = 0; i < weighting.length; i++) {
        sum += ~~idCardWithOutCheckNum[i] * weighting[i];
    }
    return sum;
}

const generateRandomChinese = length => {
    let result = '';
    let chineseRange = parseInt(parseInt('9000', 16).toString(10)) - parseInt(parseInt('4E00', 16).toString(10));
    for (let i = 0; i < length; i++) {
        const chineseDig = ~~(Math.random() * (chineseRange + 1) + parseInt(parseInt('4E00', 16).toString(10)));
        const chineseUni = parseInt(chineseDig, 10).toString(16);
        result += (unescape('%u' + chineseUni + new Array(4 - chineseUni.length + 1).join('0')));
    }
    return result;
};

const generateNormalChinese = length => {
    const chinese = (normalChinese + normalName)
        .replace(/\s/g, '')
        .split('')
        .filter(word => /[\u4E00-\u9000]/.test(word));
    return getSubRandomArray(chinese, length).join('');
};

const generateNormalChineseName = nameLength => {
    const nameFirstWordArray = normalName.replace(/\s/g, '').split('');
    return getSubRandomArray(nameFirstWordArray, nameLength).join('');
};

const generateRandomNumber = length => {
    let result = '';
    for (let i = 0; i < length; i++) {
        result += ~~(Math.random() * 10 );
    }
    return result;
};

const generateRandomEnglishAndNumber = length => {
    return getSubRandomArray((allNumber + allEnglish).split(''), length).join('');
};

/*
* 以陣列中最大的長度當作基準,剩下的全部補零到基準長度
* */
const fillIntegerArrayFrontZero = intArray => {
    let maxLength = 0;
    intArray.forEach(i => {
        let len = (i + '').length;
        maxLength = maxLength > len ? maxLength : len;
    });
    return intArray.map(i => new Array(maxLength - (i + '').length + 1).join('0') + i);
};

const fillIntegerFrontZero = (i, length) => {
    return (i + '').length < length ? new Array(length - (i + '').length + 1).join('0') + i : i;
};

const getSubRandomArray = (arr, subArrayLength) => {
    const result = [];
    const arrLen = arr.length;
    for (let i = 0; i < subArrayLength; i++) {
        result.push(arr[~~(Math.random() * arrLen)]);
    }
    return result;
};