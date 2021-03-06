steal('jquery/controller',
	'jquery/lang/observe/delegate',
	'jmvcdoc/models/search.js',function($){

/**
 * @class Jmvcdoc.Search
 */
$.Controller('Jmvcdoc.Search',
/* @Static */
{
	defaults : {
	
	}
},
/* @Prototype */
{
	setup:function(el,options){
		this.input = $(el);
		this.input.wrap("<div>");
		
		var parent = this.input.parent();
		this.remove = $("<span title='clear term' class='remove'></span>").appendTo(parent);
		
		this._super(parent,options);
	},
	init : function(){
		this.input.attr('disabled', false)
	},
	"input keyup" : function(el, ev){
		if(ev.keyCode != 9){
			clearTimeout(this.searchTimer);
			this.searchTimer = setTimeout(this.callback('search'),200)
		}
	},
	search : function(){
		$.route.attrs({
			search: this.input.val()
		}, true);
	},
	"{clientState} search set" : function(clientState, ev, newVal){
		this.input.val(newVal);
		
		if(newVal && newVal != ""){
			this.remove.show();
		} else {
			this.remove.hide();
		}
	},
	".remove click":function(el, events){
		$.route.attrs({
			search: ""
		}, true);
	},
	focusin : function(){
		this.focused = true;
	},
	focusout : function(){
		this.focused = false;
	}
})

});