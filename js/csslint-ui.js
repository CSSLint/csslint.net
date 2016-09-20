// JavaScript Document
/* global CSSLint:true, Sunlight:true */

$(function() {
    "use strict";

    var errorLines = [],
        errorView,
        options,
        worker = null;

    function htmlEscape(text) {
        var htmlEscapes = {
            "<": "&lt;",
            ">": "&gt;",
            "&": "&amp;",
            "\"": "&quot;"
        };

        return text.replace(/[<>"&]/g, function(c) {
            return htmlEscapes[c];
        });
    }


    $(".groupSelectAll").click(function() {
        $(this).parent().parent().siblings(".optionsList").find("input[type=checkbox]").prop("checked", true);
    });
    $(".groupSelectNone").click(function() {
        $(this).parent().parent().siblings(".optionsList").find("input[type=checkbox]").prop("checked", false);
    });
    $(".globalSelectAll").click(function() {
        $(".btnDrop").find("input[type=checkbox]").prop("checked", true);
    });
    $(".globalSelectNone").click(function() {
        $(".btnDrop").find("input[type=checkbox]").prop("checked", false);
    });

    if (typeof Worker !== "undefined") {

        // if being run locally, some browsers barf, so double-check
        try {

            worker = new Worker("js/csslint-worker.js");

            worker.onmessage = function(event) {
                outputResults(JSON.parse(event.data));
            };

        } catch (ex) {
            // sigh, just don't use the worker
        }
    }

    // if there's a hash, auto-fill checkboxes from it
    if (location.hash && location.hash !== "results") {

        $("input[type=checkbox]").prop("checked", false);

        $.each(location.hash.substring("warnings=".length + 1).split(","), function(i, value) {
            $("input[name=" + value + "]").prop("checked", true);
        });


        // always be open when a hash is present
        $("#options").toggleClass("open");

    } else if (window.localStorage) {   // otherwise, pull from localStorage

        if (localStorage.getItem("rules")) {
            options = $.parseJSON(localStorage.getItem("rules"));
            $("input[type=checkbox]").each(function(index, checkbox) {
                checkbox.checked = options[checkbox.name] === 1;
            });
        }

        if (localStorage.getItem("open")) {
            $("#options").toggleClass("open");
        }

    }

    // when a checkbox change, update the hash
    $("input[type=checkbox]").live("click", updateHash);

    /*
     * set up options menu
     */

    $("#showOptions").click(function() {
        $("#options").toggleClass("open");

        if (window.localStorage) {
            localStorage.setItem("open", $("#options").hasClass("open") ? "1" : "");
        }

        return false;
    });


    function updateHash() {
        var ruleset = gatherRules(),
            rules = [];

        $.each(ruleset, function(key) {
            rules.push(key);
        });

        location.hash = "warnings=" + rules.join(",");
    }

    /*
     * Views
     */
    function toggleView(view) {
        $("html").removeClass("resultsPage settingsPage loadingPage");

        switch (view) {
            case "results":
                $("html").addClass("resultsPage");
                break;
            case "setting":
                $("html").addClass("settingsPage");
                break;
            case "loading":
                $("html").addClass("loadingPage");
                break;
            default:
                $("html").addClass("");
        }
    }

    /*
     * Form: Sumbit css to be linted and highlighted
     */
    $("#lint").click(function() {
        lintCSS();
        return false;
    });

    $("#restart-btn").click(function() {
        // toggleView('');
        history.back();
        return false;
    });


    /*
     * Lint: lints css
     */
    function lintCSS() {
        var css = $("#input").val(),
            rules = gatherRules();

        errorLines = [];
        toggleView("loading");
        if (worker) {
            worker.postMessage(JSON.stringify({ text: css, ruleset: rules }));
        } else {
            outputResults(CSSLint.verify(css, rules));
        }
    }

    function gatherRules() {
        var ruleset = {};

        $("input:checked").each(function(index, checkbox) {
            ruleset[checkbox.name] = 1;
        });

        // store in localStorage for later usage
        if (window.localStorage) {
            localStorage.setItem("rules", $.toJSON(ruleset));
        }

        return ruleset;
    }


    function outputResults(results) {
        var i,
            messages,
            len,
            errorCount = 0,
            warningCount = 0,
            tbody = document.getElementById("errors"),
            fragment = document.createDocumentFragment(),
            tr,
            type;

        // for back button support
        location.hash = "results";

        if (errorView) {
            errorView.fnClearTable();
        }

        toggleView("results");
        messages = results.messages;

        // output results to table
        for (i = 0, len = messages.length; i < len; i++) {
            if (messages[i].type === "error") {
                errorCount++;
                type = "<img alt='error' src='img/error.png' width='16px' height='16px'>";
                errorLines.push(messages[i].line);
            } else if (messages[i].type === "warning") {
                warningCount++;
                type = "<img title='warning' alt='warning' src='img/warn.png' width='15px' height='15px'>";
                errorLines.push(messages[i].line);
            }

            tr = document.createElement("tr");
            tr.className = "L" + messages[i].line;
            tr.insertCell(0);
            tr.cells[0].innerHTML = type;
            tr.insertCell(1);
            tr.cells[1].innerHTML = typeof messages[i].line === "number" ? messages[i].line : "(rollup)";
            tr.insertCell(2);
            tr.cells[2].innerHTML = typeof messages[i].col === "number" ? messages[i].col : "(rollup)";
            tr.insertCell(3);
            tr.cells[3].innerHTML = htmlEscape(messages[i].rule.name);
            tr.insertCell(4);
            tr.cells[4].innerHTML = htmlEscape(messages[i].message) + (messages[i].evidence ? "<pre>" + messages[i].evidence + "</pre>" : "");
            tr.insertCell(5);
            tr.cells[5].innerHTML = messages[i].rule.browsers;

            fragment.appendChild(tr);
        }

        tbody.appendChild(fragment);
        errorTableInit();

        // set text summaries of warnings and errors
        $(".errorCount").text(errorCount);
        $(".warningCount").text(warningCount);

        if (errorCount === 0 && warningCount === 0) {
            $("#fix-it").hide();
        } else {
            $("#fix-it").show();
        }

        errorTableEvents();
        highlightCSS();
    }
    /*
     * Making "in" play nice w arrays
     */
    function eachOfArray(a) {
        var o = {};

        for (var i = 0; i < a.length; i++) {
            o[a[i]] = "";
        }
        return o;
    }

    /*
     * set up error table
     */
    function errorTableInit() {
        errorView = $("#errorView").dataTable({
            "bDestroy": true,
            "bPaginate": false,
            "bLengthChange": false,
            "bFilter": true,
            "bSort": true,
            "bInfo": false,
            "bAutoWidth": false,
            "aoColumns": [
                { "sType": "string" },
                { "sType": "numeric" },
                { "sType": "numeric" },
                { "sType": "string" },
                { "sType": "string" },
                null
            ]
        });

    }

    function errorTableEvents() {
        // setup events on error table row click - goes to code view line number
        $(".results tbody tr").each(function() {
            $(this).click(function() {
                // collect the line number
                var line = $(this).children("td")[1].innerHTML;

                // link to the other table
                location.href = "#L" + line;
            });
        });
    }


    /*
     * Setup query string based view changes -when query string updates - change to code view
     */
    $(function() {
        // Hash changed
        $(window).hashchange(function() {
            var hash = location.hash.substring(1);

            if (hash !== "results") {
                toggleView("");
            }
        });
    });

    /*
     *    set up code view table
     */
    function highlightCSS() {
        var css,
            dummyElement,
            rawHtml,
            cssByLine,
            lineCount,
            i,
            cssClass,
            lineNum,
            lineCode,
            tableRow,
            tableBody,
            fragment;

        // get css & instantiate highlighter
        css = $("#input").val();

        if (css.length < 15000) {       // no code view if more than 15000 css
            var highlighter = new Sunlight.Highlighter();
            var context = highlighter.highlight(css, "css");
            var nodes = context.getNodes();

            // convert nodes to an HTML string
            dummyElement = document.createElement("pre");
            for (i = 0; i < nodes.length; i++) {
                dummyElement.appendChild(nodes[i]);
            }
            rawHtml = dummyElement.innerHTML;
            // split based by row - on \n
            cssByLine = rawHtml.split("\n");
            lineCount = cssByLine.length;
            $(".lineCount").text(lineCount);

            // create template
            cssClass = "";

            // insert into template
            tableBody = document.getElementById("tableBody");

            // clear existing content
            while (tableBody.rows.length) {
                tableBody.deleteRow(0);
            }

            fragment = document.createDocumentFragment();

            for (i = 0; i < cssByLine.length; i++) {
                lineCode = cssByLine[i];
                lineNum = i + 1; // unnecessary

                if (lineNum in eachOfArray(errorLines)) {
                    cssClass = " error L" + lineNum;
                } else {
                    cssClass = "";
                }

                tableRow = document.createElement("tr");
                tableRow.id = "L" + lineNum;
                tableRow.className = cssClass;
                tableRow.appendChild(document.createElement("th"));
                tableRow.cells[0].innerHTML = lineNum;
                tableRow.insertCell(1);
                tableRow.cells[1].innerHTML = lineCode;
                fragment.appendChild(tableRow);
            }
            tableBody.appendChild(fragment);
        }
    }
});
