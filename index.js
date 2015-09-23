var fs = require('fs');

//RegExp escape utility function
RegExp.escape = function(text){
	return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

//Execute string as function
var executeAsFunction = function(args, code){
	var fn = 'try{ \n' + 
				  'return ' + code + '\n' + 
				'} catch(err) { \n' +
					'throw err; \n' +
				'}';

	var argNames = [];
	var argValues = [];

	for(var arg in args){
		argNames.push(arg);
		argValues.push(args[arg])
	}

	var argString = argNames.join(', ');

	fn = new Function(argString, fn);
	return fn.apply(null, argValues);
}

var keenparse = (function(config){
	'use strict';

	function ParseObject(parsedText, textToTags){
		this.parsedText = parsedText;
		this.textToTags = textToTags;
	}

	function KeenParse(config){
		//Make this available over all member scopes
		var self = this;

		//Set default config
		self.config = {
			delimeters: [
				{ 
				  	name: 'interpolate', 
				  	open: '{{',
				  	close: '}}',
				  	type: 'repl' 
				},
				{
					name: 'code',
					open: '{{=',
					close: '}}',
					type: 'eval'
				}
			]
		};

		var applyConfig = function(){
			var escOpen = '';
			var escClose = '';

			var regExps = {};
			for(var i = 0; i < self.config.delimeters.length; i++){
				escOpen = RegExp.escape(self.config.delimeters[i].open);
				escClose = RegExp.escape(self.config.delimeters[i].close);

				regExps[self.config.delimeters[i].name] = {regex: new RegExp(escOpen  + (self.config.delimeters[i].type == 'repl' ? '([\\s\\w]+?)' : '([\\s\\S]+?)') + escClose, 'g'), type: self.config.delimeters[i].type, open: self.config.delimeters[i].open, close: self.config.delimeters[i].close};
			}

			return regExps;
		};

		self.setDelimeter = function(name, open, close, type){
			var lType = type.toLowerCase();	

			if(lType !== 'repl' || lType !== 'code'){
				throw 'Delimeter must of type "repl" or "code".';
			}

			for(del in self.config.delimeters){
				if(self.config.delimeters[del].name === name){
					throw 'Delimeter "' + name + '" already exists.';
				}

				self.config.delimeters.push({name: name, open: open, close: close, type: lType});
			}
		}

		if(typeof config !== 'undefined' && typeof config['delimeters'] !== 'undefined'){
			for(var del in config.delimeters){
				if(typeof config.delimeters[del].type !== 'undefined' && typeof config.delimeters[del].open !== 'undefined'
					&& typeof config.delimeters[del].close !== 'undefined' && typeof config.delimeters[del].name !== 'undefined'){
					self.config.delimeters[del] = config.delimeters[del];
				} else {
					throw 'Unable to add delimeter... missing one or more of the following: name, open, close, and type.';
				}
			}
		}

		//Apply our config settings
		var tagRegExp = applyConfig();

		var parseString = function(body, data){
			//Set equal to body initially. All valid tags will be replaced with SOMETHING
			var parsedText = body;	

			for(var del in tagRegExp){
				var matches = body.match(tagRegExp[del].regex);
				var textToTag = [];

				//If no matches, not interested.
				if (matches === null) { continue; }

				//Replace 
				for(i = 0; i < matches.length; i++){
					var tag = matches[i].replace(tagRegExp[del].open,'')
										.replace(tagRegExp[del].close,'');

					//Strip spaces ONLY from interpolations
					if(tagRegExp[del].type === 'repl') 
						tag = tag.replace(/\s/g, '');

					var tagText = matches[i];

	 				var found = false;
	 				for(j = 0; j < textToTag.length; j++){
	 					if(textToTag[j].tag == tag){
	 						found = j;
	 						break;
	 					}
	 				}

	 				//Does the tag exist? If so, push result to tagTexts, otherwise create new object.
	 				if(found !== false){
	 					textToTag[found].tagText.push(tagText);
	 				}
	 				else{
						textToTag.push({tag: tag, tagText: [tagText]});
	 				}
				} 

				//Are we dealing with executable code or interpolation? More to be added.
				switch(tagRegExp[del].type){
					case 'repl':
						for(var i = 0; i < textToTag.length; i++){
							for(var j = 0; j < textToTag[i].tagText.length; j++){
								var tag = textToTag[i].tagText[j];
								var tagName = textToTag[i].tag;
								parsedText = parsedText.replace(tag, (tagName in data) ? data[tagName] : '?');
							}
						}
						break;
					case 'eval':
						for(var i = 0; i < textToTag.length; i++){
							for(var j = 0; j < textToTag[i].tagText.length; j++){
								var tag = textToTag[i].tagText[j];
								var tagName = textToTag[i].tag;
								var result = '';
								parsedText = parsedText.replace(tag, typeof (result = executeAsFunction(data, tagName)) !== 'undefined' ? result : '?');
							}
						}
						break;
					default:
						break;
				}
			}
			return parsedText;
		}

		self.parseString = function(string, data, callback){
			setTimeout(function(){
				var parsed = parseString(string, data);
				callback(parsed);
			}, 0);
		}

		self.parseFile = function(file, data, callback){
			fs.readFile(file, 'utf8', function(err, fileContents){
				if (err) throw err;
				self.parseString(fileContents, data, function(text){
					callback(text);
				});
			});
		}
	}

	return new KeenParse(config);

});

module.exports = keenparse;