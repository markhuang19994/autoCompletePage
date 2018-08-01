/**
 * @author MarkHuang
 * @since  2018/7/29
 */

Array.prototype.asyncForEach = function f(func) {
    return new Promise(res => {
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