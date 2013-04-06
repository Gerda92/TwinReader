﻿modules["Alignment"] = (function(){

    var id1 = null, id2 = null;
    var mark_id1 = null, mark_id2 = null;

    var twin = 1; //(/\/([0-9]+)/g).exec(href)[1];
    var bindings = null;

    var highlight = "rgb(160, 222, 238)";

    var pre = function () {
        bindings = jQuery.parseJSON($("#alignments").text());
        draw_table(bindings);
        rebind();

        $(document).mousedown(function (e) {
            if (e.which == 3) {
                $("#sent-" + id1).css("background", "");
                id1 = null;
            }
        });
    };

    pre.call();

    function draw_table(marks) {

        $("#align-table").html("");

        var lc = 0;
        var l_sents = $("#rawtext .left-twin .sentence");
        while (l_sents[lc].id != marks[0].BookmarkId1) lc++;

        var rc = 0;
        var r_sents = $("#rawtext .right-twin .sentence");
        while (r_sents[rc].id != marks[0].BookmarkId2) rc++;

        for (var i = 0; i < marks.length - 1; i++) {
            var l_html = "";
            for (; l_sents[lc].id != marks[i + 1].BookmarkId1; lc++) {
                l_html += stringSentenceSpan(l_sents[lc]);
            }
            var r_html = "";
            for (; r_sents[rc].id != marks[i + 1].BookmarkId2; rc++) {
                r_html += stringSentenceSpan(r_sents[rc]);
            }
            $("#align-table").append(stringTableRaw(marks[i], l_html, r_html));
        }
        var l_html = "";
        for (; lc < l_sents.length; lc++) {
            l_html += stringSentenceSpan(l_sents[lc]);
        }
        var r_html = "";
        for (; rc < r_sents.length; rc++) {
            r_html += stringSentenceSpan(r_sents[rc]);
        }
        $("#align-table").append(stringTableRaw(marks[marks.length - 1], l_html, r_html));
    }

    function rebind() {

        $(".table-sent").click(function () {

            if (id1 == null) {
                id1 = (/sent-(.+)/g).exec(this.id)[1];
                $(this).css("background", highlight);
            } else {
                id2 = (/sent-(.+)/g).exec(this.id)[1];
                $(this).css("background", highlight);

                // if same language
                if ($("#sent-" + id1).parents('.left-cell').length == 0 ||
                    $("#sent-" + id2).parents('.right-cell').length == 0) {

                    $("#sent-" + id1).css("background", "");
                    $(this).css("background", highlight);
                    id1 = id2;
                    return;
                }

                // if right then left
                if ($("#sent-" + id1).parents('.left-cell').length == 0) {
                    var c = id2; id2 = id1; id1 = c;
                }

                previewRealign(id1, id2);
                addBookmarkBinding(id1, id2);

                id1 = null
            }
            return false;
        });

    }

    function addBookmarkBinding(id1, id2) {
        $.ajax({
            url: "http://localhost:1600/Alignment/CreateBookmark/" + twin + "/" + id1 + "/" + id2,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            cache: false,
            success: function (data) {
                bindings = data;
                draw_table(bindings);
                rebind();
                newMarkHighlight(id1);
            },
            error: function () {
                alert('Some kind of error');
                $(".mark-info").removeClass('loading')
                    .css("visibility", "");

                $("#sent-" + id1).css("background", "");
                $("#sent-" + id2).css("background", "");

                id1 = null;
            },
            complete: function () {
            }
        });
    }

    function previewRealign(id1, id2) {

        var mark_id1 = (/mark-(.+)/g).exec(
            $("#sent-" + id1).parents(".mark").attr('id'))[1];
        var mark_id2 = (/mark-(.+)/g).exec(
            $("#sent-" + id2).parents(".mark").attr('id'))[1];

        var ll = 0;
        while (bindings[ll].Id != mark_id1) ll++;
        var rr = 0;
        while (bindings[rr].Id != mark_id2) rr++;

        var j = (ll < rr ? ll : rr);
        var min_j = j;
        var max_j = (ll > rr ? ll : rr);

        for (; j <= max_j; j++) {
            $("#mark-" + bindings[j].Id + " .mark-info").addClass("loading");
        }
    }

    function newMarkHighlight(id1) {
        // mark hightlight
        var mark = $.grep(bindings, function (el, i) { return el.BookmarkId1 == id1 })[0];

        $("#mark-" + mark.Id + " .twins")
            .animate({ backgroundColor: "rgb(73, 202, 73)" }, 200)
            .animate({ backgroundColor: "rgb(255, 255, 255)" }, 1200);
    }

    function stringTableRaw(mark, left, right) {
        return '<tr id="mark-' + mark.Id + '" class="mark">' +
            '<td class="twins left-cell">' + left + "</td>" +
            '<td class="twins right-cell">' + right + "</td>" +
            '<td class="mark-info ' + (mark.Type == 1 ? "user" : "aligner") + '-made">' +
            //(mark.Type == 1 ? "User" : "Aligner") +
            "</td>" +
        '</tr>';
    }

    function stringSentenceSpan(sent) {
        return '<span class="table-sent" id="sent-' + sent.id +
            '">' + $(sent).html() + '</span>'
    }

});