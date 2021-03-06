const REDDIT_URL = "https://www.reddit.com";

let clicked_title;
// let leaderLines = [];
const leaderLines = new Set()
let subreddit_save;
let active_tiles = [];

let messagebox_active = () => $("#messagebox").is(":visible");

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

function repositionTileLeaderLine(tileObj) {
    if (!tileObj) return;
    let leaderLineArr = tileObj.leaderLineArr;
    if (!leaderLineArr || leaderLineArr.length == 0) return;
    // console.log(leaderLineArr)
    leaderLineArr.forEach(function (lL) {
        lL.position();
    })
}

function onTileDrag() {
    // Laggy, could try https://github.com/anseki/anim-event?
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

function intToHex(i) {
    return i.toString(16).toUpperCase();
}

class Tile {
    constructor(rawJson, parentObj, customElem) {
        this.parent = parentObj;
        this.data = rawJson;
        this.leaderLineArr = [];
        this.customElem = customElem;

        this.generate();
    }

    insertToCanvas() {
        $("#rightcol").append(this.tileElem);

    }

    setAttributes() {
        this.tileElem.data("obj", this);
        this.tileElem.draggable({
            cancel: ".asm-content",
            // containment: "#rightcol", // doesnt work because margin is blocking
            drag: onTileDrag
        });
    }

    generate() {
        // Tile template
        this.tileElem = $('<div/>', {
            class: "asm-box"
        })
            .append($("<div/>", {
                class: "asm-toolbar"
            }));
        this.insertToCanvas();
        this.generateTiles();
        this.generateArrows();
        this.setAttributes();

        // Performance hit?
        // repositionVisibleLeaderLines();
    }

    generateArrows() {
        let startSocket = 'top';
        let endSocket = 'bottom';
        if (this.constructor.name == "Comment") {
            startSocket = 'left';
            endSocket = 'right';
        }

        if (this.parent) {
            let leaderLineObj = new LeaderLine($(this.tileElem)[0], $(this.parent.tileElem)[0], {
                startPlug: "arrow1",
                endPlug: "behind",
                startSocket: startSocket,
                endSocket: endSocket,
                startSocketGravity: 1,
                endSocketGravity: 1,
                path: "grid",
                color: "red",
                size: 1.5,
            });
            leaderLines.add(leaderLineObj);
            this.leaderLineArr.push(leaderLineObj);
            this.parent.leaderLineArr.push(leaderLineObj);
        }
    }
}
class Comment extends Tile {
    constructor(rawJson, parentObj) {
        super(rawJson, parentObj)
    }

    generateTiles() {
        let item = this.data.data;
        // let depthMargin = 0 + item.depth * 150;
        // Base width
        let parentWidth = 40;
        let parent = this.parent;
        while (parent) {
            parentWidth += $(parent.tileElem).width() + 100; // Incremental width
            parent = parent.parent;
        }
        let tileContent = $("<p/>", {
            class: "asm-title",
            html: `${marked.parse(item.body)}`
        });
        tileContent.find("a").each(function () {
            $(this).attr("target", "_blank")
        })
        this.tileElem
            .css("margin-top", `-${Boolean(item.depth) * 10}px`)
            // .css("margin-top", `-10px`)
            .css("margin-bottom", `10px`)
            .css("margin-left", `0px`)
            .css("left", `${parentWidth.toString()}px`)

            .append($("<div/>", {
                class: "asm-content",
                html: `<p class='asm-head'>${item.author}</p><span class='asm-var'>Score</span>= dword ptr  <span class='asm-var'>${intToHex(item.score)}h</span>`
            })
                .append(tileContent));

        // Massive hit on performance
        // Comment depth limit
        // if (item.depth >= 2) return;
        // Generate the comment tree recursively
        generateComments(item.replies, this);
    };
}

class Post extends Tile {

    constructor(jsonData, parentObj) {
        super(jsonData, parentObj);
    }

    generateTiles() {
        let item = this.data.data;
        this.tileElem
            .append($("<div/>", {
                class: "asm-content",
                html: `<p class='asm-head'>${item.author}</p><span class='asm-var'>Score</span>= dword ptr  <span class='asm-var'>${intToHex(item.score)}h</span><br><span class='asm-var'>Comments</span>= dword ptr  <span class='asm-var'>${intToHex(item.num_comments)}h</span><p class='asm-title'>${item.title}</p>`
            }));
    };
}

class CustomTile extends Tile {
    constructor(customElem) {
        super(null, null, customElem = customElem)
    }

    generateTiles() {
        // Quite a bad implementation
        // Re point tileElem to the new element
        this.tileElem.replaceWith(this.customElem);
        this.tileElem = this.customElem;
    }
}

// Check for g keypress to open search for subreddit
$(document).keyup(function (e) {
    if (e.key === "g") {
        $("#messagebox").show();
        $("#messagebox-input").focus();
    }
});


// Check for Enter keypress to submit search
$(document).keyup(function (e) {
    if (e.key === "Enter") {
        if (messagebox_active()) {
            let subreddit_query = $("#messagebox-input").val();
            if (subreddit_query == null || subreddit_query.trim() === '') return;
            retrieve_subreddit(subreddit_query);
            close_messagebox();
        }
    }
});


// Check for Esc keypress to return to previous page
$(document).keydown(function (e) {
    if (e.key === "Escape") {
        if (messagebox_active()) {
            close_messagebox();
            return;
        }
        // History yet to implement
        else if (active_tiles.length) {
            restoreCanvas();
        }
    }
});

// Function to close the message box
function close_messagebox() {
    $("#messagebox").hide();
    $("#messagebox-input").val("");
}


function restoreCanvas() {
    clearCanvas();
    let [prevObjsArr, scrollPosArr] = active_tiles.pop();
    prevObjsArr.forEach(e => {
        e.insertToCanvas();
        e.generateArrows();
        e.setAttributes();
    });

    // Restore scroll position
    $("#rightcol").scrollTop(scrollPosArr[0]);
    $("#rightcol").scrollLeft(scrollPosArr[1]);
    repositionAllLeaderLines();
}

function clearCanvas() {
    // Remove all active leaderlines
    for (let lL of leaderLines) {
        // leaderLines.forEach(lL => {
        lL.remove();
    };
    leaderLines.clear();
    $("#rightcol").empty();
    // $(".leader-line").remove();
}

function saveAndClearCanvas() {
    let objArr = [];
    $(".asm-box").each(function () {
        // console.log($(this).data("obj"))
        let obj = $(this).data("obj");
        // obj.leaderLineArr.forEach(function (lL) {
        //     // if (lL)
        //     try {
        //         lL.remove();
        //     }
        //     catch (e) {

        //     }
        // })
        if (!obj) return;
        obj.leaderLineArr = [];
        objArr.push(obj);
    })

    active_tiles.push([objArr, [$("#rightcol").scrollTop(), $("#rightcol").scrollLeft()]]);
    clearCanvas();
}


// Retrieve comments of selected post when double clicked
$(document).on("dblclick", ".asm-title", function () {
    let postObj = $(this).parent().parent().data("obj");
    let postCommentsUrl = getUrlFromPerma(postObj.data.data.permalink);
    saveAndClearCanvas();
    $.getJSON(postCommentsUrl, function (jsonData) {
        // $.getJSON("comment.json", function (jsonData) {
        // console.log(jsonData);
        generateComments(jsonData[1]);
        repositionAllLeaderLines();
    })
});


function retrieve_subreddit(subName) {
    saveAndClearCanvas();
    $.getJSON(getUrlFromSub(subName), function (jsonData) {
        // $.getJSON("sub.json", function (jsonData) {
        let postArr = jsonData.data.children;
        let parent;
        postArr.forEach(postData => {
            let postObj = new Post(postData, parent);
            parent = postObj
        });
    })
}

function generateComments(commentsDict, parentObj) {
    if (!commentsDict.data || !commentsDict.data.children) return;
    commentsDict.data.children.forEach(commentJson => {
        if (commentJson.kind == "more") return;
        let commentObj = new Comment(commentJson, parentObj);
    })
}

// Populate the functions window with 50 subreddits from the frontpage
function populateFunctionsWindow() {
    $.getJSON(getUrlFromPerma(""), function (jsonData) {
        // $.getJSON("home.json", function (jsonData) {
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


// Display subreddit when double clicked from functions window
$(document).on("dblclick", ".functions-window-item", function (event) {
    retrieve_subreddit($(event.target).text());
});

function insertMainTile() {
    let mainTile = $("<div/>", {
        class: "asm-box",
        css: {
            "display": "block",
            "max-width": "fit-content",
            "margin": "auto",
            "line-height": "80%",
            "font-family": "monospace"
        }
    })
        .append($("<div/>", {
            class: "asm-toolbar"
        }))
        .append($("<div/>", {
            class: "asm-content",
            css: {
                "padding-top": "0"
            },
            html: `<p style="margin-top:5px; color: #0000ff;">;

; +-------------------------------------------------------------------------+

; |        Browse Reddit using The Interactive Disassembler (IDA)           |

; |            Created by Kok Seen @ github.com/kokseen1, 2021              |

; |                          G to jump to sub                               |

; |                           Esc to go back                                |

; +-------------------------------------------------------------------------+

;

; Input SHA256 : 4AB2023B2F34C8C49FFD15A051B46B6BE13CB84775142EC85403A08C0D846C72

; Input MD5    : F015B845C2F85CD23271BC0BABF2E963

; Input CRC32  : 336C9566
            

; Format      : Portable executable for 80386 (PE)

; Imagebase   : 400000

; Timestamp   : 00000000 (Thu Jan 01 00:00:00 1970)

; Section 1. (virtual address 00001000)

; Virtual size                  : 00001648 (   5704.)

; Section size in file          : 00001800 (   6144.)

; Offset to raw data for section: 00000200

; Flags 60000020: Text Executable Readable

; Alignment     : default


.686p

.mmx

.model flat



<span class="asm-comment">; Segment type: Pure code</span>

<span class="asm-comment">; Segment permissions: Read/Execute</span>

_text segment para public 'CODE' use32

assume cs:_text

<span class="asm-comment">;org 401000h</span>

assume es:nothing, ss:nothing, ds:_data, fs:nothing, gs:nothing




<span class="asm-comment">; Attributes: bp-based frame</span>


`
        }));
    let mainTileObj = new CustomTile(mainTile);
    // $("#rightcol").append(mainTile);
}

function repositionAllLeaderLines() {
    $('.asm-box').each(function (i, el) {
        repositionTileLeaderLine($(this).data("obj"));
    })
}

function repositionVisibleLeaderLines() {
    $('.asm-box').each(function (i, el) {
        if ($(this).isInViewport()) {
            repositionTileLeaderLine($(this).data("obj"));
        }
    })
}


$(document).ready(function () {
    populateFunctionsWindow();
    $("#rightcol").scroll(function () {
        // repositionLeaderLines();
        repositionVisibleLeaderLines();
        // repositionAllLeaderLines();
    });
    insertMainTile();
});


// Visuals below

// Style items in the function window when clicked
$(document).on("click", ".functions-window-item", function () {
    let clicked_fn = $(this);
    $(".functions-window-item").removeAttr("style");
    $(".functions-window-item").children("span").removeAttr("style");
    $(clicked_fn).css("outline", "1px dashed red");
    $(clicked_fn).css("background-color", "#087cd4");
    $(clicked_fn).children("span").css("color", "white");
});


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