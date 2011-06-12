// JavaScript Document
 $(document).ready(function(){
 
 
 
 		var errorLines = [],
            errorView;
		$('#in button').removeAttr('disabled');
	/*
	 * Views
	 */
		function toggleView(view) {
			switch (view) {
            
                //NCZ: Generally, you want to avoid duplicate code
                //Below you have $('html').addClass() three times
                //but only the class name has changed. You can
                //just store the class name in a variable and then
                //use addClass() once.
            
				case 'results': $('html').addClass('resultsPage')
					break;
				case 'setting': $('html').addClass('settingsPage')
					break;
				default: $('html').addClass('')	
			}			
		}
		
		/*
		 * Form: Sumbit css to be linted and highlighted 
		 */
		$('#in').submit(function() {
			var css,
					results,
					myCssLength,
					messages;
			lintCSS(); 
			toggleView('results');
			return false;
		});
		/*
		 * Lint: lints css 
		 */
		function lintCSS(){
            var i,
                results,
                messages,
                len,
                errorCount = 0, 
                warningCount = 0,
                type;
                
            errorTableInit();
			css = $('#input').val();
			results = CSSLint.verify(css);
			messages = results.messages;
			
			// output results to table
			for (i=0, len=messages.length; i < len; i++){
				if(messages[i].type == 'error'){
					errorCount ++;
					type = "<img alt='error' src='img/error.png' />";
					errorLines.push(messages[i].line);
				} else if(messages[i].type == 'warning'){
					warningCount ++;
					type = "<img title='warning' alt='warning' src='img/warn.png' />";
					errorLines.push(messages[i].line);
				} 
                errorView.fnAddData([
                    type,
                    messages[i].line,
                    messages[i].col,
                    messages[i].rule.name,
                    messages[i].message + "<pre>" + messages[i].evidence + "</pre>",
                    messages[i].rule.browsers                
                ]);
				//tbody.innerHTML += "<tr class='L" + messages[i].line + "'><td>" + type + "</td><td>" + messages[i].line + "</td><td>" + messages[i].col + "</td><td>" + messages[i].rule.name + "</td><td>" + messages[i].message + "<pre>" + messages[i].evidence + "</pre></td><td>" + messages[i].rule.browsers + "</td></tr>";
				//tr = document.createElement("tr");
                //tr.className = "L" + messages[i].line;
                //tr.innerHTML = "<td>" + type + "</td><td>" + messages[i].line + "</td><td>" + messages[i].col + "</td><td>" + messages[i].rule.name + "</td><td>" + messages[i].message + "<pre>" + messages[i].evidence + "</pre></td><td>" + messages[i].rule.browsers + "</td>"
                //$('#errors').append(tr);
			}
			// set text summaries of warnings and errors
			$('.errorCount').text(errorCount);
			$('.warningCount').text(warningCount);
			//$('#errors').html(tbody.innerHTML);
			errorTableEvents();
			highlightCSS();
		}
		/*
		 * Making "in" play nice w arrays
		 */
		function eachOfArray(a){
			var o = {};
			for(var i=0;i<a.length;i++) {
				o[a[i]]='';
			}
			return o;
		}

	/*
	 * set up error table 
	 */
 
	function errorTableInit(){
		errorView = $('#errorView').dataTable({
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
		
    function errorTableEvents(){
	 // setup events on error table row click - goes to code view line number
	 $('.results tbody tr').each(function(index) {
	 	$(this).click(function(event){
			// collect the line number
			var line = $(this).children('td')[1].innerHTML;
			// link to the other table
			location.href = "#L" + line;		
	 	});
	 });
	}	
	
	 
	 /*
	 	* Setup query string based view changes -when query string updates - change to code view
		*/

	 $(function(){

  // Hash changed
		$(window).hashchange( function(){
			//get #hash
			var curr = window.location.hash.substring(1);
			if(curr){
				//highlight current row
				$('.highlight').removeClass('highlight');
				$('.' + curr).addClass('highlight');
			};
		})
		// Trigger the event (on page load).
		$(window).hashchange();
	});
	 
	 /* 
	 	*	set up code view table
		*/
	 function highlightCSS(){
	 	var css, 
            dummyElement, 
            rawHtml, 
            cssByLine, 
            lineErr, 
            lineCount,
            i,
            cssClass, 
            lineNum, 
            lineCode, 
            tableRow, 
            tableRows,
            tableBody,
            fragment,
            lineAnchor;
	 	//get css & instantiate highlighter
	 	css = $('#input').val();
		if (css.length < 15000) { // no code view if more than 15000 css
			highlighter = new Sunlight.Highlighter();
			context = highlighter.highlight(css, 'css');
			nodes = context.getNodes();
			
			// convert nodes to an HTML string
			dummyElement = document.createElement('pre');
			for (i = 0; i < nodes.length; i++) {
				dummyElement.appendChild(nodes[i]);
			}
			rawHtml = dummyElement.innerHTML;
			// split based by row - on \n
			cssByLine = rawHtml.split('\n');
			lineCount = cssByLine.length;
			$('.lineCount').text(lineCount);
			
			// create template
			lineErr = false;
			cssClass = "";
			//tableBody = document.createElement('tbody');
			// insert into template
            tableBody = document.getElementById('tableBody');
			fragment = document.createDocumentFragment();
            
			for (i=0; i < cssByLine.length; i++){
				lineCode = cssByLine[i];
				lineNum = i+1; // unnecessary
				if (lineNum in eachOfArray(errorLines)){ 
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
				//lineAnchor = "id='L" + lineNum + "'";
				//tableRow = "<tr" + cssClass + " " + lineAnchor + ">\n	<th>" + lineNum + "</th>\n	<td>" + lineCode + "</td>\n</tr>";
				//tableBody.innerHTML += tableRow;
			}
            tableBody.appendChild(fragment);
			//document.getElementById('tableBody').innerHTML = tableBody.innerHTML;
		};
	 };
	});