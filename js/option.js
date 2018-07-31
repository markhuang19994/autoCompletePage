(($) => {
    $(async function () {
        console.log('option.js is loaded!');
        const {getStorageData, setStorageData} = window.storageUtil;
        const {allPageDataStr} = await getStorageData('allPageDataStr');
        const allPageData = allPageDataStr ? JSON.parse(allPageDataStr) : {};

        (() => {//page init
            $('input, textarea').attr("spellcheck", false);
            $('#get-page-data').autocomplete({source: Object.keys(allPageData), minLength: 0}).focus(function () {
                $(this).autocomplete('search', $(this).val());
            });
            textAreaWithTabKey();
        })();

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

        $('#support-url-commit').click(e => {
            let urlPatterns = $('#support-url').val();
            let patternsArrStr = stringWithCommaToArrayString(urlPatterns);
            setStorageData({urlWhiteList: patternsArrStr});

            let message = `已設定pattern: ${patternsArrStr}`;
            setMessageAfterElement(e, message);
        });

        $('#complete-url-commit').click(e => {
            let urlPatterns = $('#complete-url').val();
            let patternsArrStr = stringWithCommaToArrayString(urlPatterns);
            setStorageData({needCompletePages: patternsArrStr});

            let message = `已設定pattern: ${patternsArrStr}`;
            setMessageAfterElement(e, message);
        });

        $('#import-autocomplete-urls').change(e => {
            readFileAsText(e.delegateTarget.files[0]).then(result => {
                try {
                    const needCompletePagesArr = JSON.parse(result);
                    const needCompletePages = JSON.stringify(needCompletePagesArr);
                    setStorageData({needCompletePages});
                    setMessageAfterElement(e, `檔案儲存成功`);
                } catch (err) {
                    setMessageAfterElement(e, `檔案轉換失敗，原因: ${err.toString()}`);
                }
            }).catch(err => {
                setMessageAfterElement(e, `檔案讀取失敗，原因: ${err.toString()}`);
            });
        });

        $('#export-autocomplete-urls').click(async e => {
            const {needCompletePages} = await getStorageData('allPageDataStr');
            download('autoPagesURL.json', JSON.stringify(JSON.parse(needCompletePages || "[]"), null, '\t'));
        });

        $('#page-json-commit').click(async e => {
            let url = $('#page-json-url').val();
            let pageData = validateAndParseJsonString($('#page-json').val());
            if (typeof pageData !== 'object') {
                setMessageAfterElement(e, 'json格式有誤');
                return;
            }
            let isCover = allPageData[url];
            allPageData[url] = pageData;

            const allPageDataStr = JSON.stringify(allPageData);
            setStorageData({allPageDataStr});
            setMessageAfterElement(e, isCover ? `已覆蓋${url}的資料` : `${url}已新增資料`);
        });

        $('#page-data-commit').click(e => {
            let data = JSON.stringify(allPageData[$('#get-page-data').val()], null, '\t');
            setMessageAfterElement(e, '資料:  ' + data + '...易讀的format在console');
            console.log(data)
        });

        $('#import-all-page-data').change(e => {
            readFileAsText(e.delegateTarget.files[0]).then(result => {
                try {
                    const allPageData = JSON.parse(result);
                    const allPageDataStr = JSON.stringify(allPageData);
                    setStorageData({allPageDataStr});
                    setMessageAfterElement(e, `檔案儲存成功`);
                } catch (err) {
                    setMessageAfterElement(e, `檔案轉換失敗，原因: ${err.toString()}`);
                }
            }).catch(err => {
                setMessageAfterElement(e, `檔案讀取失敗，原因: ${err.toString()}`);
            });
        });

        $('#export-all-page-data').click(async e => {
            const {allPageDataStr} = await getStorageData('allPageDataStr');
            download('allPageData.json', JSON.stringify(JSON.parse(allPageDataStr || "{}"), null, '\t'));
        });

        function stringWithCommaToArrayString(str) {
            let strArr = str.replace(/\s/g, '').split(',');
            return JSON.stringify(strArr);
        }

        function setMessageAfterElement(e, msg) {
            if (e.currentTarget.nextElementSibling) {
                e.currentTarget.nextElementSibling.innerHTML = msg;
            } else {
                $(e.currentTarget).after(`<p class="print-message">${msg}</p>`)
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
    });
})(jQuery);