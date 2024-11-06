let body = $response.body;
let url = $request.url;
let obj;

try {
    obj = JSON.parse(body);
} catch (e) {
    console.error("JSON 解析错误:", e);
    $done({ body });
    return;
}

// ------------------ 函数定义 ------------------

// 删除属性
function deleteFields(obj, fields) {
    fields.forEach(field => {
        if (obj && obj.hasOwnProperty(field)) {
            delete obj[field];
        }
    });
}

// 移除广告
function RemoveAds(array = []) {
    let result = [];
    for (let i = 0; i < array.length; i++) {
        const item = array[i];
        const isSearchAd =
            ["hot_ad", "trend"].includes(item?.item_category) ||
            item?.data?.mblogtypename === "广告" ||
            item?.data?.ad_state === 1 ||
	    item?.isInsert == false && item?.msg_card?.ad_tag?.text == '广告'; // 消息动态推广

        if (!isSearchAd) {
            result.push(item);
        }
    }
    array.length = 0;
    array.push(...result);
}

// 移除模块
function RemoveCardtype(array = []) {
    const group_itemId = [
        "card86_card11_cishi", 
        "card86_card11", 
        "INTEREST_PEOPLE", 
        "profile_collection",			 // 那年今日/近期热门
    ];
    
    const card_itemId = [
        "finder_channel",  			// 发现功能分类
        "finder_window",   			// 发现轮播广告
	// "sg_bottom_tab_search_input",		// 超话搜索关键词
	// "mine_topics",			 // 我的超话
	"new_sg_bottom_tab_hot_channels",	// 超话分类
	"new_sg_bottom_tab_discovery",		// 超话轮播卡片
    ];
	
	/* 超话处理
	10001_sgbottomnav_209fcyec6ize9 	感兴趣的话题 item.title === "关注你感兴趣的超话"
	*/

    const hot_card_keywords = [
        "hot_character", 
        "local_hot_band", 
        "hot_video", 
        "hot_chaohua_list", 
        "hot_link_mike"
    ];

    let result = [];

    for (let i = 0; i < array.length; i++) {
        const item = array[i];
        const isSearchCard = 
            (item?.category === "group" && group_itemId.includes(item?.itemId)) ||
            (item?.category === "card" && card_itemId.includes(item?.data?.itemid)) ||
            (item?.itemId && hot_card_keywords.some(keyword => item?.itemId.includes(keyword))) ||
            (item?.data?.wboxParam) || // wboxParam
            (item?.data?.cate_id === "1114"); // wboxParam.png
	
	if (item?.data?.itemId=== "sg_bottom_tab_search_input") {
		delete item?.data?.itemId.hotwords} // 超话搜索关键词
        
	    if (!isSearchCard) {
            result.push(item); // 移除多余卡片
        }
    }

    array.length = 0;
    array.push(...result);
}

// 处理嵌套的 items数组
function processItems(array = []) {
    RemoveAds(array);
    RemoveCardtype(array);

    array.forEach(item => {
        if (Array.isArray(item?.items)) {
            processItems(item.items);
        }
    });
}

// ------------------ 处理响应 ------------------

if (url.includes("comments/build_comments")) {
    // 详情
    if (obj.datas) {
        obj.datas = obj.datas.filter(item => !item.adType);
    }
}

else if (url.includes("guest/statuses_extend") || url.includes("statuses/extend")) {
    // 详情
    // 删除属性
    deleteFields(obj, ['head_cards', 'trend', 'snapshot_share_customize_dic', 'dynamic_share_items', 'report_data', 'loyal_fans_guide_info', 'top_cards']);
}

else if (url.includes("search/finder")) {
    // 首次发现
    const channels = obj?.channelInfo?.channels;
    if (channels && channels.length > 0) {
        const payload = channels[0]?.payload;
        if (payload) {
            deleteFields(payload.loadedInfo, ['headerBack', 'searchBarContent']);
            processItems(payload.items); 
        }
    }
}

else if (url.includes("search/container_timeline") || url.includes("search/container_discover")) {
    // 刷新发现
    if (obj?.loadedInfo) {
        deleteFields(obj.loadedInfo, ['headerBack', 'searchBarContent']);
    }
    processItems(obj.items);
}

else if (url.includes("/2/searchall?")) {
    // 搜索
    processItems(obj.items);
}

else if (url.includes("/statuses/container_timeline") || url.includes("profile/container_timeline")) {
    // 推荐
    processItems(obj.items);
}

else if (url.includes("/profile/me")) {
    obj.items = obj.items.slice(0, 2);
    if (obj.items.length > 0 && obj.items[0].header) {
        deleteFields(obj.items[0].header, ['vipIcon', 'vipView']);
    }
}

else if (url.includes("aj/appicon/list")) {
    const list = obj.data.list;
    list.forEach(item => {
        item.cardType = "2";
        item.tag = "";
    });
}

else if (url.includes("/messageflow/notice")) {
    RemoveAds(obj.messages)
}

// ------------------ 返回处理结果 ------------------
$done({ body: JSON.stringify(obj) });
