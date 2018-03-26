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
		
		scssString += 

		`
		@function get-content($inputs...) {
			@if(length($inputs) == 1) {
				@return quote(inspect(nth($inputs, 1)))
			} @else {
				@return ''
			}
		}	

		@function color-test($inputs...) {
			@if length($inputs) == 1 and type-of(nth($inputs, 1)) == color {
				@return true;
			}
			@return false;
		}
		`
		for (let value in mapVars) {
			scssString +=
		
		`
		@if (color-test(${mapVars[value]})) {
			${value} {

				.stylejam-tile {
					background-color: ${mapVars[value]};
				}

				.value:before {
					content: get-content(${mapVars[value]});
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
			
			`
			@if (color-test(${colorVars[value]})) {
				${value} {

					.stylejam-tile {
						background-color: ${colorVars[value]};
					}

					.value:before {
						content: get-content(${colorVars[value]});
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

					&.stylejam-tile-container {
						border: ${borderVars[value]};
					}

					.value:before {
						content: get-content(${borderVars[value]});
					}
				}
			}
			`
		}

		fs.writeFile(path.join(__dirname, 'demos/styles.scss'), scssString, function(err) {
			if(err) {
				return console.log(err);
			}
		}); 	
	}

	return mapRules()
}


