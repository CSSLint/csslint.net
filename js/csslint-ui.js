// JavaScript Document
 $(document).ready(function(){
 		var errorLines = [];
		$('#in button').removeAttr('disabled');
	/*
	 * Views
	 */
		function toggleView(view) {
			switch (view) {
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
			var css = $('#input').val(),
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
					len,
					errorCount = 0, 
					warningCount = 0,
					type, 
					tr = document.createElement('tr'), 
					tbody = document.createElement('tbody');
					results = CSSLint.verify(document.getElementById('input').value);
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
				tbody.innerHTML += "<tr class='L" + messages[i].line + "'><td>" + type + "</td><td>" + messages[i].line + "</td><td>" + messages[i].col + "</td><td>" + "messages[i].title" + "</td><td>" + messages[i].message + "<pre>" + messages[i].evidence + "</pre></td><td>" + "messages[i].browser" + "</td></tr>";
			}
			// set text summaries of warnings and errors
			$('.errorCount').text(errorCount);
			$('.warningCount').text(warningCount);
			$('#errors').html(tbody.innerHTML);
			errorTableInit();
			highlightCSS();
		}
		/*
		 * Making "in" play nice w arrays
		 */
		function eachOfArray(a)
		{
			var o = {};
			for(var i=0;i<a.length;i++)
			{
				o[a[i]]='';
			}
			return o;
		}

	/*
	 * set up error table 
	 */
 
	function errorTableInit(){
		var errorTable = $('#errorView').dataTable({
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
				lineAnchor;
	 	//get css & instantiate highlighter
	 	css = $('#input').val();
		if (css.length < 15000) { // no code view if more than 15000 css
			highlighter = new Sunlight.Highlighter();
			context = highlighter.highlight(css, 'css');
			nodes = context.getNodes();
			
			// convert nodes to an HTML string
			dummyElement = document.createElement('div');
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
			tableBody = document.createElement('tbody');
			// insert into template
			
			for (i=0; i < cssByLine.length; i++){
				lineCode = cssByLine[i];
				lineNum = i+1; // unnecessary
				if (lineNum in eachOfArray(errorLines)){ 
					cssClass = " class='error L" + lineNum +"' title='error'"; 
				}
				lineAnchor = "id='L" + lineNum + "'";
				tableRow = "<tr" + cssClass + " " + lineAnchor + ">\n	<th>" + lineNum + "</th>\n	<td>" + lineCode + "</td>\n</tr>";
				tableBody.innerHTML += tableRow;
				cssClass = '';
			}
			document.getElementById('tableBody').innerHTML = tableBody.innerHTML;
		};
	 };
	});