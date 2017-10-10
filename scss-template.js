'use strict'

let fs = require('fs')

let path = require('path')

let _ = require('lodash')

module.exports = (mapVars, colorVars, borderVars, deps) => {

	let scssString = ''

	let mapRules = () => {
		if(deps) {
			deps.forEach((dep) => {
				scssString += fs.readFileSync(dep, "utf-8")
			})
		}
		for (let value in mapVars) {
			scssString +=
	`
	@if (type-of(${mapVars[value]}) == color) {
		${value} {
	  	background-color: ${mapVars[value]};

	  	button:before {
	  		content: quote(${mapVars[value]});
	  	}
	  }
	}

	`
		}

		colorRules()	
	}

	let colorRules = () => {
		for (let value in colorVars) {
			scssString +=
	`@if (type-of(${colorVars[value]}) == color) {
		${value} {
	  	background-color: ${colorVars[value]};

	  	button:before {
	  		content: quote(${colorVars[value]});
	  	}
	  }
	}

	`
		}	

		borderRules()
	}

	let borderRules = () => {
		scssString += 
	`@function borderwidth($input) {
	  @each $part in $input {
	    @if type-of($part) == number {
	      @return true;
	    }
	  }
	  @return false;
	}

	@function bordercolor($input) {
	  @each $part in $input {
	    @if type-of($part) == color {
	      @return true;
	    }
	  }
	  @return false;
	}

	`

		for (let value in borderVars) {
			scssString +=
	`@if bordercolor(${borderVars[value]}) and borderwidth(${borderVars[value]}) {
	  ${value} {
	  	border: ${borderVars[value]};

	  	button:before {
	  		content: quote(${borderVars[value]});
	  	}
	  }
	}

	`
		}
		
		fs.writeFile(path.join(__dirname, 'demos/styles.scss'), scssString, function(err) {
			if(err) {
			    return console.log(err);
			}

			console.log("The file was saved!");
		}); 	
	}

	return mapRules()
}

