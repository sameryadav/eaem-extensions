(function ($, $document) {
    var BUTTON_URL = "/apps/eaem-publish-page-to-review-env/content/publish-toreview-toolbar-ext.html",
        QUICK_PUBLISH_ACTIVATOR = "cq-siteadmin-admin-actions-quickpublish-activator",
        REVIEW_STATUS_URL = "/bin/eaem/sites/review/status?folderPath=",
        PUBLISH_TO_REVIEW = "/bin/eaem/sites/review/publish?pagePaths=",
        F_CONTENT_LOADED = "foundation-contentloaded",
        F_MODE_CHANGE = "foundation-mode-change",
        F_SEL_CHANGE = "foundation-selections-change",
        F_COL_ITEM_ID = "foundationCollectionItemId",
        F_COL_ACTION = "foundationCollectionAction",
        FOUNDATION_COLLECTION_ID = "foundation-collection-id",
        LAYOUT_COL_VIEW  = "column",
        LAYOUT_LIST_VIEW = "list",
        LAYOUT_CARD_VIEW = "card",
        COLUMN_VIEW = "coral-columnview",
        EVENT_COLUMNVIEW_CHANGE = "coral-columnview:change",
        FOUNDATION_COLLECTION_ITEM = ".foundation-collection-item",
        FOUNDATION_COLLECTION_ITEM_ID = "foundation-collection-item-id",
        CORAL_COLUMNVIEW_PREVIEW = "coral-columnview-preview",
        CORAL_COLUMNVIEW_PREVIEW_ASSET = "coral-columnview-preview-asset",
        EAEM_BANNER_CLASS = "eaem-banner",
        EAEM_BANNER = ".eaem-banner",
        FOUNDATION_COLLECTION_ITEM_TITLE = ".foundation-collection-item-title",
        SITE_ADMIN_CHILD_PAGES = ".cq-siteadmin-admin-childpages",
        NEW_BANNER = "New",
        colViewListenerAdded = false,
        reviewButtonAdded = false;

    $document.on(F_CONTENT_LOADED, removeNewBanner);

    $document.on(F_CONTENT_LOADED, checkReviewStatus);

    $document.on(F_SEL_CHANGE, function () {
        if(reviewButtonAdded){
            return;
        }

        reviewButtonAdded = true;

        colViewListenerAdded = false;

        checkReviewStatus();

        $.ajax(BUTTON_URL).done(addButton);
    });

    function removeNewBanner(){
        var $container = $(SITE_ADMIN_CHILD_PAGES), $label,
            $items = $container.find(FOUNDATION_COLLECTION_ITEM);

        _.each($items, function(item){
            $label = $(item).find("coral-card-info coral-tag");

            if(_.isEmpty($label) || $label.html().trim() != NEW_BANNER){
                return;
            }

            $label.remove();
        });
    }

    function checkReviewStatus(){
        var folderPath = $(SITE_ADMIN_CHILD_PAGES).data(FOUNDATION_COLLECTION_ID);

        if(_.isEmpty(folderPath)){
            return;
        }

        $.ajax(REVIEW_STATUS_URL + folderPath).done(showBanners);
    }

    function showBanners(pathsObj){
        if(isColumnView()){
            handleColumnView();
        }

        if(_.isEmpty(pathsObj)){
            return;
        }

        if(isCardView()){
            addCardViewBanner(pathsObj);
        }else if(isListView()){
            addListViewBanner(pathsObj)
        }
    }

    function handleColumnView(){
        var $columnView = $(COLUMN_VIEW);

        if(colViewListenerAdded){
            return;
        }

        colViewListenerAdded = true;

        $columnView.on(EVENT_COLUMNVIEW_CHANGE, handleColumnItemSelection);
    }

    function handleColumnItemSelection(event){
        var detail = event.originalEvent.detail,
            $asset = $(detail.selection[0]),
            assetPath = $asset.data(FOUNDATION_COLLECTION_ITEM_ID);

        if(_.isEmpty(assetPath)){
            return;
        }
    }

    function addColumnViewBanner(assetObj){
        getUIWidget(CORAL_COLUMNVIEW_PREVIEW).then(handler);

        function handler($colPreview){
            var $assetPreview = $colPreview.find(CORAL_COLUMNVIEW_PREVIEW_ASSET);

            $assetPreview.find(EAEM_BANNER).remove();

            $assetPreview.prepend(getBannerColumnView(assetObj));
        }
    }

    function getBannerColumnView(size){
        var ct = getColorText(size);

        if(!ct.color){
            return;
        }

        return "<coral-tag style='background-color: " + ct.color + ";z-index: 9999; width: 100%' class='" + EAEM_BANNER_CLASS + "'>" +
                    "<i class='coral-Icon coral-Icon--bell coral-Icon--sizeXS' style='margin-right: 10px'></i>" + ct.text +
                "</coral-tag>";
    }

    function getBannerHtml(a3mState){
        var ct = getColorText(a3mState);

        if(!ct.color){
            return;
        }

        return "<coral-alert style='background-color:" + ct.color + "' class='" + EAEM_BANNER_CLASS + "'>" +
                    "<coral-alert-content>" + ct.text + "</coral-alert-content>" +
               "</coral-alert>";
    }

    function getColorText(a3mState){
        var color, state, text;

        if(!_.isEmpty(a3mState)){
            state = a3mState.substring(0, a3mState.indexOf(":"));
            text = a3mState.substring(a3mState.indexOf(":") + 1);
        }

        if(state == "ERROR"){
            color = "#ff7f7f";
        }else if(state == "INFO"){
            color = "#FFBF00";
        }

        return{
            color: color,
            text: text
        }
    }

    function addListViewBanner(pathsObj){
        var $container = $(SITE_ADMIN_CHILD_PAGES), $item, clazz, assetPath, ct, size,
            folderPath = $container.data(FOUNDATION_COLLECTION_ID);

        _.each(pathsObj, function(a3mState, assetPath){
            $item = $container.find("[data-" + FOUNDATION_COLLECTION_ITEM_ID + "='" + assetPath + "']");

            if(!_.isEmpty($item.find(EAEM_BANNER))){
                return;
            }

            ct = getColorText(a3mState);

            if(!ct.color){
                return;
            }

            $item.find("td").css("background-color" , ct.color).addClass(EAEM_BANNER_CLASS);

            $item.find(FOUNDATION_COLLECTION_ITEM_TITLE).prepend(getListViewBannerHtml());
        });
    }

    function getListViewBannerHtml(){
        return "<i class='coral-Icon coral-Icon--bell coral-Icon--sizeXS' style='margin-right: 10px'></i>";
    }

    function addCardViewBanner(pathsObj){
        var $container = $(SITE_ADMIN_CHILD_PAGES), $item;

        _.each(pathsObj, function(a3mState, assetPath){
            $item = $container.find("[data-" + FOUNDATION_COLLECTION_ITEM_ID + "='" + assetPath + "']");

            if(_.isEmpty($item)){
                return;
            }

            if(!_.isEmpty($item.find(EAEM_BANNER))){
                return;
            }

            $item.find("coral-card-info").append(getBannerHtml(a3mState));
        });
    }

    function isColumnView(){
        return ( getAssetsConsoleLayout() === LAYOUT_COL_VIEW );
    }

    function isListView(){
        return ( getAssetsConsoleLayout() === LAYOUT_LIST_VIEW );
    }

    function isCardView(){
        return (getAssetsConsoleLayout() === LAYOUT_CARD_VIEW);
    }

    function getAssetsConsoleLayout(){
        var $childPage = $(SITE_ADMIN_CHILD_PAGES),
            foundationLayout = $childPage.data("foundation-layout");

        if(_.isEmpty(foundationLayout)){
            return "";
        }

        return foundationLayout.layoutId;
    }

    function getUIWidget(selector){
        if(_.isEmpty(selector)){
            return;
        }

        var deferred = $.Deferred();

        var INTERVAL = setInterval(function(){
            var $widget = $(selector);

            if(_.isEmpty($widget)){
                return;
            }

            clearInterval(INTERVAL);

            deferred.resolve($widget);
        }, 250);

        return deferred.promise();
    }

    function startsWith(val, start){
        return val && start && (val.indexOf(start) === 0);
    }

    function addButton(html) {
        var $eActivator = $("." + QUICK_PUBLISH_ACTIVATOR);

        if ($eActivator.length == 0) {
            return;
        }

        var $convert = $(html).css("margin-left", "20px").insertBefore($eActivator);

        $convert.click(postConvertRequest);
    }

    function postConvertRequest(){
        var actionConfig = ($(this)).data(F_COL_ACTION);

        var $items = $(".foundation-selections-item"),
            pagePaths = [];

        $items.each(function () {
            pagePaths.push($(this).data(F_COL_ITEM_ID));
        });

        $.ajax(PUBLISH_TO_REVIEW + pagePaths.join(",")).done(function(){
            showAlert(actionConfig.data.text, "Publish");
        });
    }

    function showAlert(message, title, callback){
        var fui = $(window).adaptTo("foundation-ui"),
            options = [{
                id: "ok",
                text: "OK",
                primary: true
            }];

        message = message || "Unknown Error";
        title = title || "Error";

        fui.prompt(title, message, "default", options, callback);
    }

}(jQuery, jQuery(document)));
