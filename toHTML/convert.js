// js jmvcdoc/toHTML/convert.js jmvc\docs docs

var path = _args[0], 
	docsLocation = _args[1],
	jmvcRoot;

if (!path) {
	print("Please pass the docs directory into the script");
	quit();
}

if(!docsLocation){
	docsLocation = path+"/docs";
	docsLocation = docsLocation.replace("\\", "/");
}

// cookbook/test/docs --> ../../..
var nbrDirs = docsLocation.split("/").length, jmvcRootArr = [];
for (var i = 0; i < nbrDirs; i++) {
	jmvcRootArr.push('..')
}
jmvcRoot = jmvcRootArr.join("/")+"/"

load('steal/rhino/steal.js')

steal.plugins('steal/generate').then('//jmvcdoc/resources/helpers', function(steal){
		
	ToHTML = {
		searchData: {},
		// takes a path to a docs directory and gets all files in the directory, calling renderPage on each
		getFiles: function(path){
			var searchDataText = readFile(path+"/searchData.json")
			this.searchData = eval( searchDataText );
			var dir = new java.io.File(path), 
				children = dir.list(), i, script, child, htmlFilePath, bodyHTML, sidebarHTML, fullPageHTML;
			for (i = 0; i < children.length; i++) {
				child = ""+children[i];
				if (child === "searchData.json" ||
					child === "keep.me" || 
					(new java.io.File(path+"/"+child)).isDirectory()) {
					continue;
				}
				script = readFile(path+"/"+child);
				json = eval( script );
				htmlFilePath = docsLocation+"/"+child.replace(/\.json$/, ".html");
				sidebarHTML = this.renderSidebar(json, child);
				bodyHTML = this.renderPage(json, child);
				title = json.name.replace(/\.static|\.prototype/, "").replace(/\./g," ");
				fullPageHTML = this.renderLayout(bodyHTML, sidebarHTML, title, child);
				this.saveHTML(fullPageHTML, htmlFilePath);				
			}
		},
		// saves html to a file
		saveHTML: function(html, filePath){
			new steal.File( filePath ).save( html );
		},
		renderLayout: function(bodyHTML, sidebarHTML, title, fileName){
			var template = readFile( "jmvcdoc/toHTML/page.ejs" );
			html = new steal.EJS({ text : template }).render( {
				body: bodyHTML,
				sidebar: sidebarHTML,
				title: title,
				jmvcRoot: jmvcRoot
			} ); 
			
			return html;				
		},		
		// creates the body's html
		renderPage: function(json, fileName){
			var name = json.shortName.toLowerCase(),
				topTemplate = readFile( "jmvcdoc/views/top.ejs" ),
				templateName = "jmvcdoc/views/"+json.shortName.toLowerCase()+".ejs",
				template = readFile( templateName ), html;
			
			print("TEMPLATE: " + fileName);
			json.isFavorite = false;
			html = new steal.EJS({ text : topTemplate }).render( json, this.helpers );
			html += new steal.EJS({ text : template }).render( json, this.helpers ); 
			return html;				
		},
		// creates the sidebar's html
		renderSidebar: function(json, fileName){
			var html, data, selected = [],
				sidebar = readFile( "jmvcdoc/toHTML/results.ejs" );
			Search.setData( ToHTML.searchData );
				
			//print("TEMPLATE: " + fileName)
        	if (json.children && json.children.length) { //we have a class or constructor
				selected.push(json);
				var list = jQuery.makeArray(json.children).sort(Search.sortFn);
				data = {list: list, selected: selected, hide: false};
			} else {
				data = {list: Search.find(""), selected: selected, hide: false}
			}				
			 
			html = new steal.EJS({ text : sidebar })
				.render( data, this.helpers );			 
			return html;				
		},			
		// creates docs/html directory
		createDir: function(path){
			new steal.File(docsLocation).mkdir()
		},
		helpers:  steal.extend(DocumentationHelpers, {
			link : function(content, dontReplace){
				return content.replace(/\[\s*((?:['"][^"']*["'])|[^\|\]\s]*)\s*\|?\s*([^\]]*)\s*\]/g, function(match, first, n){
					//need to get last
					//need to remove trailing whitespace
					if(/^["']/.test(first)){
						first = first.substr(1, first.length-2)
					}
					var url = ToHTML.searchData.list[first] ? first : null;
					if(url){
						if(!n){
							n = dontReplace ? first : first.replace(/\.prototype|\.static/,"")
						}
						return "<a href='"+url+".html'>"+n+"</a>"
					}else if(typeof first == 'string' && first.match(/^https?|www\.|#/)){
						return "<a href='"+first+"'>"+(n || first)+"</a>"
					}
					return  match;
				})
			},
		    linkTags : function(tags){
		        var res = [];
		        for(var i =0; i < tags.length; i++)
		            res.push( "<a href='"+tags[i]+"'>"+tags[i]+"</a>"   )
		        return res.join(" ");
		    },
		    linkOpen : function(addr){
		        return "<a href='"+addr+".html'>"+addr+"</a>"  
		    }
		})
	}
	
	
	// callback function
	var C = function( json ) {
		return json;
	}
	
	jQuery = {
		String: {
			underscore: function(s){
				var regs = {
					undHash: /_|-/,
					colons: /::/,
					words: /([A-Z]+)([A-Z][a-z])/g,
					lowerUpper: /([a-z\d])([A-Z])/g,
					dash: /([a-z\d])([A-Z])/g
				};
				return s.replace(regs.colons, '/').replace(regs.words, '$1_$2').replace(regs.lowerUpper, '$1_$2').replace(regs.dash, '_').toLowerCase()
			}
		},
		isFunction: function( obj ) {
			return toString.call(obj) === "[object Function]";
		},		
		merge: function( first, second ) {
			var i = first.length, j = 0;
	
			if ( typeof second.length === "number" ) {
				for ( var l = second.length; j < l; j++ ) {
					first[ i++ ] = second[ j ];
				}
			
			} else {
				while ( second[j] !== undefined ) {
					first[ i++ ] = second[ j++ ];
				}
			}
	
			first.length = i;
	
			return first;
		},		
		makeArray: function( array, results ) {
			var ret = results || [];
	
			if ( array != null ) {
				// The window, strings (and functions) also have 'length'
				// The extra typeof function check is to prevent crashes
				// in Safari 2 (See: #3039)
				if ( array.length == null || typeof array === "string" || jQuery.isFunction(array) || (typeof array !== "function" && array.setInterval) ) {
					push.call( ret, array );
				} else {
					jQuery.merge( ret, array );
				}
			}
	
			return ret;
		}		
		
	}
	
	Search = {
	    setData : function(data){
			this._data = data;
	        return arguments;
	    },
	    find: function(val){
	        var valWasEmpty, level = 2;
	        var val = val.toLowerCase();
	        
	        if (!val || val === "*") {
				val = "home"; // return the core stuff
				valWasEmpty = true;
			}
	        
	        if(val == "favorites")
				return Favorites.findAll()
	        
	        var current = this._data;
	        for(var i =0; i < level; i++){
	            if(val.length <= i || !current) break;
	            var letter = val.substring(i, i+1);
	            current = current[letter];
	        }
	        var list = [];
	        if(current && val.length > level){
	            //make sure everything in current is ok
	            var lookedup = this.lookup(current.list);
	            for(var i =0; i < lookedup.length; i++){
	                if(this.matches(lookedup[i],val, valWasEmpty) ) 
	                    list.push(lookedup[i])
	            }
	        }else if(current){
	            list = this.lookup(current.list);
	        }
			return list.sort(this.sortFn);
	    },
	    matches : function(who, val, valWasEmpty){
	        if(!valWasEmpty && who.name.toLowerCase().indexOf(val) > -1) return true;
	        if(who.tags){
	            for(var t=0; t< who.tags.length; t++){
	                 if(who.tags[t].toLowerCase().indexOf(val) > -1) return true;
	            }
	        }
	        return false;
	    },
	    sortFn :  function(a, b){
			//if equal, then prototype, prototype properties go first
	        var aname = (a.title? a.title : a.name).replace(".prototype",".000AAAprototype").replace(".static",".111BBBstatic");
			var bname = (b.title? b.title : b.name).replace(".prototype",".000AAAprototype").replace(".static",".111BBBstatic");
			 
			
			if(aname < bname) 
				return -1
			else aname > bname
				return 1
			return 0;
		},
	    sortJustStrings : function(aname, bname){
	        var aname = aname.replace(".prototype",".000AAAprototype").replace(".static",".111BBBstatic");
			var bname = bname.replace(".prototype",".000AAAprototype").replace(".static",".111BBBstatic");
			 
			
			if(aname < bname) 
				return -1
			else aname > bname
				return 1
			return 0;
	    },
	    lookup : function(names){
	        var res = [];
	        for(var i =0; i < names.length; i++){
	            res.push( this._data.list[names[i]]  )
	        }
	        return res;
	    }
	}
	
	ToHTML.createDir(path);
	ToHTML.getFiles(path);
	
});
