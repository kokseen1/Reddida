const DOMAIN = "http://www.reddit.com";

var clicked_title;
var subreddit_save;
var messagebox_active = false;


// Function to retrieve posts from given subreddit and display in the main canvas
function retrieve_subreddit(subreddit) {
    let subreddit_url = DOMAIN + "/r/" + subreddit + "/.json";
    subreddit_save = $("#rightcol").html();
    $("#rightcol").empty();
    $.getJSON(subreddit_url, function (data) {
        $.each(data.data.children, function (i, item) {
            $("<div/>", {
                class: "asm-box"
            })
                .append($("<div/>", {
                    class: "asm-toolbar"
                }))
                .append($("<div/>", {
                    class: "asm-content",
                    html: `<p class='asm-title' data-permalink='${item.data.permalink}'>${item.data.title}</p><span class='asm-var'>Score</span>= dword ptr  <span class='asm-var'>${item.data.score.toString(16).toUpperCase()}h</span><br><span class='asm-var'>Comments</span>= dword ptr  <span class='asm-var'>${item.data.num_comments.toString(16).toUpperCase()}h</span>`
                }))
                .appendTo("#rightcol");
        });
    });
};

// Function to close the message box
function close_messagebox() {
    $("#messagebox").hide();
    $("#messagebox-input").val("");
    messagebox_active = false;
}

// Populate the functions window with 50 subreddits from the frontpage
$.getJSON("http://www.reddit.com/.json?limit=50", function (data) {
    var comments_arr = [];
    $.each(data.data.children, function (i, item) {
        comments_arr.push(DOMAIN + item.data.permalink + ".json");
        $("<div/>", {
            class: "functions-window-item"
        })
            .append($("<div/>", {
                class: "function-icon"
            }))
            .append($("<span/>", {
                class: "function_item_text",
                text: item.data.subreddit
            }))
            .appendTo("#functionswindow");
    });
});

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

// Grey the selected title when clicked
$(document).on("click", ".asm-head", function () {
    $(clicked_title).css("background-color", "transparent");
    clicked_title = $(this);
    $(clicked_title).css("background-color", "#e5e5e5");
});

$(document).on("dblclick", ".asm-head", function (event) {
    retrieve_subreddit($(event.target).text());
});

// Grey the selected title when clicked
$(document).on("click", ".asm-title", function () {
    $(clicked_title).css("background-color", "transparent");
    clicked_title = $(this);
    $(clicked_title).css("background-color", "#e5e5e5");
});

// Retrieve comments of selected post when double clicked
$(document).on("dblclick", ".asm-title", function () {
    dblclicked_title = $(this);
    let comments_url = DOMAIN + $(this).data("permalink") + ".json";
    $(clicked_title).css("background-color", "transparent");
    subreddit_save = $("#rightcol").html();
    $("#rightcol").empty();
    $.getJSON(comments_url, function (data) {
        $.each(data[1].data.children, function (i, item) {
            $('<div/>', { class: "asm-box" })
                .append($("<div/>", {
                    class: "asm-toolbar"
                }))
                .append($("<div/>", {
                    class: "asm-content",
                    html: `<p class='asm-head'>${item.data.author}</p><span class='asm-var'>Score</span>= dword ptr  <span class='asm-var'>${item.data.score.toString(16).toUpperCase()}h</span><p class='asm-title' data-permalink='${item.data.permalink}'>${item.data.body}</p>`
                }))
                .appendTo("#rightcol");
        });
    });
});

// Style box toolbars when selected and reset style for other boxes
$(document).on("click", ".asm-box", function () {
    $("#rightcol").children().each(function (i, element) {
        $(element).children("div").first().css("background-color", "transparent");
        // if (!clicked_title || clicked_title.is($(element).find(".asm-title"))) return;
        // $(element).find(".asm-title").css("background-color", "transparent");
    });
    let clicked_box = $(this);
    $(clicked_box).children().first().css("background-color", "#a0cfcf");
});

// Check for Esc keypress to return to previous page
$(document).keydown(function (e) {
    if (e.key === "Escape") {
        if (messagebox_active) {
            close_messagebox();
            return;
        }
        if (subreddit_save) {
            $("#rightcol").empty();
            $("#rightcol").html(subreddit_save);
        }
    }
});

// Check for g keypress to open search for subreddit
$(document).keyup(function (e) {
    if (e.key === "g") {
        $("#messagebox").show();
        $("#messagebox-input").focus();
        messagebox_active = true;
    }
});

// Check for Enter keypress to submit search
$(document).keyup(function (e) {
    if (e.key === "Enter") {
        if (messagebox_active) {
            let subreddit_query = $("#messagebox-input").val();
            retrieve_subreddit(subreddit_query);
            close_messagebox();
        }
    }
});

// Insert and display initial box
$(document).ready(function () {
    console.log(window.innerHeight)
    $("<div/>", {
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



r/<span class="asm-head" style="width:calc(100% - 18px);display:inline-block;">all</p></span>`
        }))
        .appendTo("#rightcol");
});