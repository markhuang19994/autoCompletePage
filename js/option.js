(($) => {
    $(async function () {
        console.log('option.js is loaded!');
        const {getStorageData, setStorageData} = window.storageUtil;
        let projectName = 'none';

        (async () => {//page init
            $('input, textarea').attr("spellcheck", false);
            letTextAreaCanKeyTab();
            $('span.slider-trigger').addClass('disable-text-select');

            const {autoCompleteFunction} = await getStorageData('autoCompleteFunction');
            $('#toggle-autocomplete').html(autoCompleteFunction !== false ? '開啟' : '關閉');

            const allProjectData = await getAllProjectData();
            refreshAutoComplete(allProjectData);
        })();

        $('#projectName').on('change autocompletechange', async e => {
            projectName = e.currentTarget.value === '' ? 'none' : e.currentTarget.value;
            const allProjectData = await getAllProjectData();
            refreshAutoComplete(allProjectData);
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

            allProjectData[projectName]['needCompletePages'] =
                allProjectData[projectName]['needCompletePages'].concat(JSON.parse(patternsArrayString));
            setStorageData({allProjectData: JSON.stringify(allProjectData)});
            autoCompleteWithZeroLength('#remove-complete-url', allProjectData[projectName]['needCompletePages']);
            setMessageAfterElement(e, `已新增URL: ${patternsArrayString}`);
        });

        $('#remove-complete-url-commit').click(async e => {
            let allProjectData = await getAllProjectData();
            let rmURL = $('#remove-complete-url').val();
            let isRemove = false;

            allProjectData[projectName]['needCompletePages'].forEach((url, index) => {
                if (url === rmURL) {
                    allProjectData[projectName]['needCompletePages'] = allProjectData[projectName]['needCompletePages'].remove(index);
                    isRemove = true;
                }
            });
            let message = isRemove ? `已刪除URL: ${rmURL}` : `未找到此URL: ${rmURL}`;
            setStorageData({allProjectData: JSON.stringify(allProjectData)});
            autoCompleteWithZeroLength('#remove-complete-url', allProjectData[projectName]['needCompletePages']);
            setMessageAfterElement(e, message);
        });

        $('#toggle-autocomplete').click(async e => {
            const {autoCompleteFunction} = await getStorageData('autoCompleteFunction');
            const isOpen = autoCompleteFunction !== false;
            setStorageData({autoCompleteFunction: !isOpen});
            e.currentTarget.innerHTML = !isOpen ? '開啟' : '關閉';
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
                refreshAutoComplete(allProjectData);
                setMessageAfterElement(e, `專案${projectName}已成功刪除`);
            } else {
                setMessageAfterElement(e, '無此專案');
            }
        });

        $('#export-all-project-data').click(async () => {
            download('allPageData.json', JSON.stringify(await getAllProjectData(), null, '\t'));
        });

        $('#import-all-project-data').change(async e => {
            readFileAsText(e.delegateTarget.files[0]).then(async result => {
                try {
                    let allProjectData = JSON.parse(result);
                    setStorageData({allProjectData: JSON.stringify(allProjectData)});
                    refreshAutoComplete(allProjectData);
                    setMessageAfterElement(e, `檔案儲存成功`);
                } catch (err) {
                    setMessageAfterElement(e, `檔案轉換失敗，原因: ${err.toString()}`);
                }
            }).catch(err => {
                setMessageAfterElement(e, `檔案讀取失敗，原因: ${err.toString()}`);
            });
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
                source: Array.isArray(obj) ? obj : Object.keys(obj || {}),
                minLength: 0
            }).focus(function () {
                $(this).autocomplete('search', $(this).val());
            });
        }

        function refreshAutoComplete(allProjectData) {
            const allPageData = allProjectData[projectName]['allPageData'] || {};
            autoCompleteWithZeroLength('#get-page-data', allPageData);
            autoCompleteWithZeroLength('#projectName', allProjectData);
            autoCompleteWithZeroLength('#del-project-data', allProjectData);
            autoCompleteWithZeroLength('#remove-complete-url', allProjectData[projectName]['needCompletePages']);
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