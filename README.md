**Introduction**

KeenParse is a module for bootstrapping your own templating engine without needing to fuss with regular expressions. It presently supports one-to-one tag replacement as well as code evaluation between tags. It is speedy, easy to use, and implements callbacks for asynchronous usage.

**Basic Usage**

KeenParse presently exposes only two functions: parseString() and parseFile():

```javascript
parseString(string, data, callback);

parseFile(fileName, data, callback);
```

Both will call callback() upon completion and pass it the parsed text as the sole argument.

**Example**
```javascript
var fs = require('fs'); //for parseFile example

//If config argument is omitted, defaults to {{ }} for interpolation, and {{= }} for evaluation
var kp = require('keenparse')(/*config:*/{
  delimeters:[
    {
      name: 'interpolate', //name, presently unused
      type: 'repl', //replacement; 'eval' for code evaluation
      open: '<%', //change from default {{
      close: '%>' //change from default }}
    },
    {
      name: 'code',
      type: 'eval',
      open: '<%=',
      close: '%>'
    }
  ]
});

var unparsedString = '<% val_1 %> <%= a() + 10 + \' \' + b(val_1) %>';

//Call parseString, passing replacement values and data in the second argument.
//Functions can be passed to the evaluator as well.
kp.parseString(unparsedString, 
                { 
                  val_1: 'Hello world!', 
                  a: function(){ return 10; }, 
                  b: function(string){ return string; }
                }, 
                function(result){
  //result contains the parsed string
  console.log(result); //Hello world! 20 Hello world!
});

//test.txt contents: <% val_1 %>
kp.parseFile('test.txt', 
              {
              	val_1: 'This is an example file replacement!'
              }, 
              function(result){
  //result contains the parsed string
  fs.writeFile('test_parsed.txt', result, function(err){
  	//test_parsed.txt now contains "This is an example file replacement!"
  	//Done!
  });
});
```
