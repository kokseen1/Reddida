const DOMAIN = "http://www.reddit.com"

$.getJSON("http://www.reddit.com/.json?limit=50", function (data) {
    var comments_arr = [];
    $.each(data.data.children, function (i, item) {
        comments_arr.push(DOMAIN + item.data.permalink + ".json");
        $('<div/>', { class: "functions_window_item" }).append($("<div/>", { class: "function_icon" })).append($('<span/>', {
            class: "function_item_text",
            text: item.data.subreddit
        })).appendTo('#functionswindow');
    });
    // $.getJSON(comments_arr[0], function(data) {
    //     let comments = data[1].data.children;
    //     $.each(comments, function(i, item) {
    //         $('<div/>', {
    //             text: "username: " + item.data.author
    //         }).appendTo('#functionswindow');
    //     })
    // })
});
$(document).on('click', '.functions_window_item', function () {
    $(".functions_window_item").removeAttr("style")
    $(".functions_window_item").children("span").removeAttr("style")
    let clicked_fn = $(this);
    $(clicked_fn).css("border", "1px dashed red")
    $(clicked_fn).css("background-color", "#087cd4")
    $(clicked_fn).children("span").css("color", "white")
    console.log(clicked_fn);
});
$(document).on('dblclick', '.functions_window_item', function () {
    alert($(this).text())
});
