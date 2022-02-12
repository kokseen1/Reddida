const REDDIT_URL = "https://www.reddit.com";

let clicked_title;
let leaderLines = [];

function getJson(url, limit) {
    if (!url.endsWith("/")) url += "/";
    url += ".json";
    if (limit) url += `?limit=${limit}`;
    return url;
}

function getUrlFromSub(sub, limit) {
    let url = `${REDDIT_URL}/r/${sub}`;
    return getJson(url, limit);
}

function getUrlFromPerma(perma, limit) {
    let url = `${REDDIT_URL}/${perma}`;
    return getJson(url, limit);
}

function viewPost() {
    let self = $(this).data("obj");
    let perma = self.data.permalink;
    let urlPerma = getUrlFromPerma(perma);
    console.log(urlPerma);
    $("body").empty();
    // $.getJSON(urlPerma, function (jsonData) {
    //     jsonData[1].data.children.forEach(commentJson => {
    //         let comment = new Comment(commentJson);
    //     })
    // })
}

function viewComment() {
    let self = $(this).data("obj");
    console.log(self.data);
}
function repositionLeaderLines() {
    leaderLines.forEach(lL => {
        lL.position();
    });
}

function repositionTileLeaderLine(tileObj) {
    let leaderLineArr = tileObj.leaderLineArr;
    if (!leaderLineArr) return;
    console.log(leaderLineArr)
    leaderLineArr.forEach(function (lL) {
        lL.position();
    })
}

function onTileDrag() {
    // repositionLeaderLines();
    let tileObj = $(this).data("obj");
    repositionTileLeaderLine(tileObj);
}

$.fn.isInViewport = function () {
    var elementTop = $(this).offset().top;
    var elementBottom = elementTop + $(this).outerHeight();

    var viewportTop = $(window).scrollTop();
    var viewportBottom = viewportTop + $(window).height();

    return elementBottom > viewportTop && elementTop < viewportBottom;
};

class Tile {
    constructor(rawJson) {
        this.data = rawJson;
        this.leaderLineArr = [];
        this.tileElem = $('<div/>', {
            class: "asm-box"
        });
        this.tileElem.data("obj", this);
        this.tileElem.draggable({
            cancel: ".asm-content",
            drag: onTileDrag
        });
        $("#rightcol").append(this.tileElem);
        // let clickMethod;
        // let content;
        // switch (this.constructor.name) {
        //     case "Post":
        //         clickMethod = viewPost;
        //         content = "title";
        //         break;
        //     case "Comment":
        //         clickMethod = viewComment;
        //         content = "body";
        //         break;
        // }
        // this.generateTiles(clickMethod,content);
    }



}

class Comment extends Tile {
    constructor(rawJson, parentObj) {
        super(rawJson)
        this.parent = parentObj;
        this.generateTiles();
    }

    generateTiles() {
        let item = this.data;
        let depthMargin = 40 + item.data.depth * 300;
        this.tileElem
            .css("margin-left", `${depthMargin.toString()}px`)
            .append($("<div/>", {
                class: "asm-toolbar"
            }))
            .append($("<div/>", {
                class: "asm-content",
                html: `<p class='asm-head'>${item.data.author}</p><span class='asm-var'>Score</span>= dword ptr  <span class='asm-var'>${item.data.score.toString(10).toUpperCase()}h</span><p class='asm-title'>${item.data.body}</p>`
            }));
        // console.log(item.data.score);
        // console.log(this.parent);
        if (this.parent) {
            // Maybe just update global lL list
            let leaderLineObj = new LeaderLine($(this.tileElem)[0], $(this.parent.tileElem)[0], {
                startPlug: "arrow1",
                endPlug: "behind",
                path: "grid",
                color: "red",
                size: 2
            });
            this.leaderLineArr.push(leaderLineObj);
            this.parent.leaderLineArr.push(leaderLineObj);
            // leaderLines.push(leaderLineObj);
        }
        generateComments(item.data.replies, this);
    };
    // generateTiles() {
    //     if (!this.data.body) return;
    //     let commentsDict = this.data.replies;
    //     let commentDepth = this.data.depth;
    //     let postTile = $(`<div class="asm-content">${"---".repeat(commentDepth)} ${this.data.body}</div>`);
    //     postTile.data("obj", this);
    //     postTile.appendTo("body");
    //     postTile.on("click", viewComment);
    //     postTile.draggable();
    //     if (!commentsDict) return;
    //     console.log(commentsDict.data.children)
    //     generateComments(commentsDict);
    // };
}

class Post extends Tile {

    constructor(jsonData) {
        super(jsonData);
        this.generateTiles();
        // $("#rightcol").append(this.tileElem);
    }

    generateTiles() {
        let item = this.data;
        this.tileElem
            .append($("<div/>", {
                class: "asm-toolbar"
            }))
            .append($("<div/>", {
                class: "asm-content",
                html: `<p class='asm-head'>${item.data.author}</p><span class='asm-var'>Score</span>= dword ptr  <span class='asm-var'>${item.data.score.toString(16).toUpperCase()}h</span><p class='asm-title'>${item.data.title}</p>`
            }));

    };
    //  {
    //     let postTile = $(`<div class="asm-content">${this.data.title}</div>`);
    //     postTile.data("obj", this);
    //     postTile.appendTo("#rightcol");
    // };
}

// Grey the selected heading when clicked
$(document).on("click", ".asm-head", function () {
    $(clicked_title).css("background-color", "transparent");
    clicked_title = $(this);
    $(clicked_title).css("background-color", "#e5e5e5");
});

// Grey the selected title when clicked
$(document).on("click", ".asm-title", function () {
    $(clicked_title).css("background-color", "transparent");
    clicked_title = $(this);
    $(clicked_title).css("background-color", "#e5e5e5");
});


// Style box toolbars when selected and reset style for other boxes
$(document).on("mousedown", ".asm-box", function () {
    $("#rightcol").children().each(function (i, element) {
        $(element).children("div").first().css("background-color", "transparent");
    });
    let clicked_box = $(this);
    $(clicked_box).children().first().css("background-color", "#a0cfcf");
    // img_url = $(clicked_box).data("url");
    // $("#img-window").css("background-image", `url(${img_url})`);
    // $("#img-window").attr("href", `${DOMAIN + $(clicked_box).find(".asm-title").data("permalink")}`);
    // if (!isValidImageURL(img_url)) $("#img-window").css("background-image", `url("../img/graphview_image.png")`);
});

// Retrieve comments of selected post when double clicked
$(document).on("dblclick", ".asm-title", function () {
    let postObj = $(this).parent().parent().data("obj");
    let postCommentsUrl = getUrlFromPerma(postObj.data.data.permalink);
    $("#rightcol").empty();
    // $.getJSON(postCommentsUrl, function (jsonData) {
    $.getJSON("comment.json", function (jsonData) {
        console.log(jsonData);
        generateComments(jsonData[1]);
    })
    // let comments_url = DOMAIN + $(this).data("permalink") + ".json";
    // $(clicked_title).css("background-color", "transparent");
    // subreddit_save = $("#rightcol").html();
    // $("#rightcol").empty();
    // $.getJSON(comments_url, function (data) {
    //     $.each(data[1].data.children, function (i, item) {
    //         $('<div/>', {
    //             class: "asm-box"
    //         })
    //             .append($("<div/>", {
    //                 class: "asm-toolbar"
    //             }))
    //             .append($("<div/>", {
    //                 class: "asm-content",
    //                 html: `<p class='asm-head'>${item.data.author}</p><span class='asm-var'>Score</span>= dword ptr  <span class='asm-var'>${item.data.score.toString(16).toUpperCase()}h</span><p class='asm-title' data-permalink='${item.data.permalink}'>${item.data.body}</p>`
    //             }))
    //             .appendTo("#rightcol");
    //     });
    // });
});


function retrieve_subreddit(subName) {
    // $.getJSON(getUrlFromSub(subName), function (jsonData) {
    $.getJSON("sub.json", function (jsonData) {
        let postArr = jsonData.data.children;
        postArr.forEach(postData => {
            let postObj = new Post(postData);
        });
    })
}


// $.getJSON(getUrlFromSub("askreddit"), function (jsonData) {
//     // Iterate array of posts
//     jsonData.data.children.forEach(postJson => {
//         let post = new Post(postJson);
//         // obj.printSelf();
//         console.log(post.data);
//     });
// });

function generateComments(commentsDict, parentObj) {
    if (!commentsDict.data || !commentsDict.data.children) return;
    commentsDict.data.children.forEach(commentJson => {
        if (commentJson.kind == "more") return;
        let commentObj = new Comment(commentJson, parentObj);
    })
}

// // For testing only
// $.getJSON("comment.json", function (jsonData) {
//     generateComments(jsonData[1])
// })


// Populate the functions window with 50 subreddits from the frontpage
function populateFunctionsWindow() {
    // $.getJSON(getUrlFromPerma(""), function (jsonData) {
    $.getJSON("home.json", function (jsonData) {
        let subArray = jsonData.data.children;
        subArray.forEach(item => {
            let subName = item.data.subreddit;
            let subElem = $("<div/>", {
                class: "functions-window-item"
            })
                .append($("<div/>", {
                    class: "function-icon"
                }))
                .append($("<span/>", {
                    class: "function_item_text",
                    text: subName
                }));
            $("#functionswindow").append(subElem);
        });
    });
}


// Style items in the function window when clicked
$(document).on("click", ".functions-window-item", function () {
    let clicked_fn = $(this);
    $(".functions-window-item").removeAttr("style");
    $(".functions-window-item").children("span").removeAttr("style");
    $(clicked_fn).css("outline", "1px dashed red");
    $(clicked_fn).css("background-color", "#087cd4");
    $(clicked_fn).children("span").css("color", "white");
});

// Display subreddit when double clicked from functions window
$(document).on("dblclick", ".functions-window-item", function (event) {
    retrieve_subreddit($(event.target).text());
});


$(document).ready(function () {
    populateFunctionsWindow();
    $("#rightcol").scroll(function () {
        // repositionLeaderLines();
        $('.asm-box').each(function (i, el) {
            if ($(this).isInViewport()) {
                // console.log('content block is in viewport.', $(this).text())
                repositionTileLeaderLine($(this).data("obj"));
            }
        })
    });
});