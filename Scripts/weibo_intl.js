// 脚本自定义优化于：https://raw.githubusercontent.com/ddgksf2013/Scripts/master/weibo_json.js

const otherUrls = {
    // "php?a=search_topic": removeSearchTopic, // 搜索话题
    "php?a=user_center": modifiedUserCenter, // 用户中心
    "php?a=open_app": removeAdBanner,  // 帖子下方广告banner
    "php?a=trends": removeTopics,          // 趋势页card
    "php?a=get_coopen_ads": removeIntlOpenAds // 开屏广告
};

function getModifyMethod(url) {
    for (let key in otherUrls) {
        if (url.includes(key)) {
            return otherUrls[key]; 
        }
    }
    return null; 
}

// 
function removeAdBanner(e) {
    if (e.data) {
        if (e.data.close_ad_setting) delete e.data.close_ad_setting;
        if (e.data.vip_title_blog) delete e.data.vip_title_blog;
        if (e.data.tips) delete e.data.tips;
    }
    return e;
}

function modifiedUserCenter(e) {
    if (e.data && e.data.cards) {
        e.data.cards = e.data.cards.filter(card => {
            card.items = card.items.filter(item => 
                item.type !== "personal_vip" && item.type !== "ic_profile_wallpaper"
            );
            return card.items.length > 0;
        });
    }
    return e;
}

function removeTopics(e) {
    if (e.data) {
        e.data.order = ["discover", "search_topic"];
        if (Array.isArray(e.data.discover)) {
            e.data.discover.splice(0, 1);
        }
    }
    return e;
}

function removeIntlOpenAds(e) {
    if (e.data) {
        e.data = { display_ad: 1 };
    }
    return e;
}

// function removeSearchTopic(e) {
//     if (e.data && e.data.search_topic && e.data.search_topic.cards.length > 0) {
//         e.data.search_topic.cards = Object.values(e.data.search_topic.cards).filter(e => e.type !== "searchtop");
//         if (e.data.trending_topic) delete e.data.trending_topic;
//     }
//     return e;
// }


// 
var body = $response.body;
var url = $request.url;
let modifyFunction = getModifyMethod(url); 

if (modifyFunction) {
    //console.log(modifyFunction.name);
    let data = JSON.parse(body.match(/\{.*\}/)[0]); 
    modifyFunction(data); 
    body = JSON.stringify(data); 
}

$done({ body });
