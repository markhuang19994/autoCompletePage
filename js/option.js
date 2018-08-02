(($) => {
    $(async function () {
        console.log('option.js is loaded!');
        const {getStorageData, setStorageData} = window.storageUtil;
        let projectName = 'none';

        (async () => {//page init
            $('input, textarea').attr("spellcheck", false);
            letTextAreaCanKeyTab();
            const allProjectData = await getAllProjectData();
            autoCompleteWithZeroLength('#projectName', allProjectData);
            autoCompleteWithZeroLength('#del-project-data', allProjectData);
        })();

        $('#projectName').on('change autocompletechange', async e => {
            projectName = e.currentTarget.value === '' ? 'none' : e.currentTarget.value;
            const allProjectData = await getAllProjectData();
            const allPageData = allProjectData[projectName]['allPageData'] || {};
            autoCompleteWithZeroLength('#get-page-data', allPageData);
            autoCompleteWithZeroLength('#del-project-data', allProjectData);
        });

        $('.slider-trigger').click(e => {
            $(e.currentTarget).toggleClass('slider-action');
            $(e.currentTarget).parent().find('.slider').eq(0).slideToggle(500, function () {
                if ($(this).css('display') === 'none') {
                    $(e.currentTarget).parent()
                        .find('.slider')
                        .css({display: 'none'})
                        .end()
                        .find('.slider-action')
                        .removeClass('slider-action');
                }
            });
        });

        $('#support-url-commit').click(async e => {
            let urlPatterns = $('#support-url').val();
            let patternsArrStr = stringWithCommaToArrayString(urlPatterns);
            let message = `已設定pattern: ${patternsArrStr}`;

            setStorageData({urlWhiteList: patternsArrStr});
            setMessageAfterElement(e, message);
        });

        $('#complete-url-commit').click(async e => {
            let allProjectData = await getAllProjectData();
            let urlPatterns = $('#complete-url').val();
            let patternsArrayString = stringWithCommaToArrayString(urlPatterns);
            let message = `已設定pattern: ${patternsArrayString}`;

            allProjectData[projectName]['needCompletePages'] = JSON.parse(patternsArrayString);
            setStorageData({allProjectData: JSON.stringify(allProjectData)});
            setMessageAfterElement(e, message);
        });

        $('#import-autocomplete-urls').change(async e => {
            readFileAsText(e.delegateTarget.files[0]).then(async result => {
                try {
                    let allProjectData = await getAllProjectData();
                    allProjectData[projectName]['needCompletePages'] = JSON.parse(result);
                    setStorageData({allProjectData: JSON.stringify(allProjectData)});
                    setMessageAfterElement(e, `檔案儲存成功`);
                } catch (err) {
                    setMessageAfterElement(e, `檔案轉換失敗，原因: ${err.toString()}`);
                }
            }).catch(err => {
                setMessageAfterElement(e, `檔案讀取失敗，原因: ${err.toString()}`);
            });
        });

        $('#export-autocomplete-urls').click(async () => {
            let allProjectData = await getAllProjectData();
            let needCompletePages = allProjectData[projectName]['needCompletePages'];
            download('autoPagesURL.json', JSON.stringify(needCompletePages || [], null, '\t'));
        });

        $('#page-json-commit').click(async e => {
            let allProjectData = await getAllProjectData();
            let allPageData = allProjectData[projectName]['allPageData'];

            let url = $('#page-json-url').val();
            let pageData = validateAndParseJsonString($('#page-json_textarea').val());
            if (typeof pageData !== 'object') {
                setMessageAfterElement(e, 'json格式有誤');
                return;
            }
            let isCover = allPageData[url];
            allPageData[url] = pageData;

            allProjectData[projectName]['allPageData'] = allPageData;
            setStorageData({allProjectData: JSON.stringify(allProjectData)});
            setMessageAfterElement(e, isCover ? `已覆蓋${url}的資料` : `${url}已新增資料`);
        });

        $('#page-data-commit').click(async e => {
            let allProjectData = await getAllProjectData();
            let url = $('#get-page-data').val();
            let data = JSON.stringify(allProjectData[projectName]['allPageData'][url] || {}, null, '\t');
            setMessageAfterElement(e, '資料:  ' + data, '...易讀的format在console');
            console.log(data)
        });

        $('#import-all-page-data').change(async e => {
            readFileAsText(e.delegateTarget.files[0]).then(async result => {
                try {
                    let allProjectData = await getAllProjectData();
                    allProjectData[projectName]['allPageData'] = JSON.parse(result);
                    setStorageData({allProjectData: JSON.stringify(allProjectData)});
                    setMessageAfterElement(e, `檔案儲存成功`);
                } catch (err) {
                    setMessageAfterElement(e, `檔案轉換失敗，原因: ${err.toString()}`);
                }
            }).catch(err => {
                setMessageAfterElement(e, `檔案讀取失敗，原因: ${err.toString()}`);
            });
        });

        $('#export-all-page-data').click(async () => {
            const allProjectData = await getAllProjectData();
            download('allPageData.json', JSON.stringify(allProjectData[projectName]['allPageData'], null, '\t'));
        });

        $('#del-project-data-commit').click(async e => {
            const allProjectData = await getAllProjectData();
            let projectName = $('#del-project-data').val().replace(/\s/g, '');
            if (allProjectData[projectName]) {
                delete allProjectData[projectName];
                setStorageData({allProjectData: JSON.stringify(allProjectData)});
                autoCompleteWithZeroLength('#projectName', allProjectData);
                setMessageAfterElement(e, '專案已成功刪除');
            } else {
                setMessageAfterElement(e, '無此專案');
            }
        });

        $('#export-all-project-data').click(async () => {
            download('allPageData.json', JSON.stringify(await getAllProjectData(), null, '\t'));
        });

        function stringWithCommaToArrayString(str) {
            let strArr = str.replace(/\s/g, '').split(',');
            return JSON.stringify(strArr);
        }

        function setMessageAfterElement(e, ...msg) {
            let allMsg = msg.join('<br/>');
            if (e.currentTarget.nextElementSibling) {
                e.currentTarget.nextElementSibling.innerHTML = allMsg;
            } else {
                $(e.currentTarget).after(`<p class="print-message">${allMsg}</p>`)
            }
        }

        function validateAndParseJsonString(jsonStr) {
            let newJsonObj = '';
            try {
                newJsonObj = JSON.parse(jsonStr);
            } catch (e) {
                console.error(e);
                try {
                    let parseJson = new Function(`return ${jsonStr}`);
                    newJsonObj = parseJson();
                } catch (e2) {
                    console.error(e2);
                }
            }
            return newJsonObj;
        }

        function autoCompleteWithZeroLength(selector, obj) {
            $(selector).autocomplete({
                source: Object.keys(obj || {}),
                minLength: 0
            }).focus(function () {
                $(this).autocomplete('search', $(this).val());
            });
        }

        async function getAllProjectData() {
            return new Promise(async res => {
                let {allProjectData} = await getStorageData('allProjectData');
                let allProjectDataObj = allProjectData ? JSON.parse(allProjectData) : {};
                res($.extend(true, {}, {
                    [projectName]: {
                        needCompletePages: [],
                        allPageData: {}
                    }
                }, allProjectDataObj));
            });
        }
    });
})(jQuery);