#!/usr/bin/env node
 
let fs = require('fs')
let path = require('path')
let program = require('commander')
let util = require('util')
let sass = require('node-sass')
let _ = require('lodash')
let { parse, stringify } = require('scss-parser') 
let createQueryWrapper = require('./query-ast')
let writeStyles = require('./scss-template.js')
let handlebars = require('handlebars')
let open = require('open')
let Candidates = require('./candidates')

// 
/**
 * Hello, CLI.
 */

program
	.version(require('./package.json').version)
	.usage('[options] <file>')
	.option('-m, --hdm', 'HDM file shortcuts')
	.option('-e, --edit', 'HDM Edit UI file shortcuts')
	.option('-d --demo', 'Display demo of sample scss variable file')
	.option('-b, --bench', 'measure and output timing data')
	.parse(process.argv);


/**
 * Read input.
 */
let file = ''

if(program.hdm) {
		file = path.resolve(`${program.args[0]}/media-platform/fre-hdm/sites/${program.args[1]}/assets/scss/_variables.scss`)
} else if(program.edit) {
		file = path.resolve(`${program.args[0]}/media-platform/edit/assets/scss/_constants.scss`) 
} else if(program.demo) {
		file = path.resolve(path.join(__dirname, 'demos/sample.scss'));
} else {
	file = path.resolve(program.args[0]);  
}

// The file must exist!
if(!fs.existsSync(file)) {
		console.error(`Couldn't load '${file}'.`);
		process.exit(1);
}

let ast = parse(fs.readFileSync(file, 'utf-8'));
let stuff = new Candidates(ast)
let mapVars = stuff.maps()
let colorVars = stuff.colors()
let borderVars = stuff.borders()
let final = {}

let test = (css, map) => {
		
	final = {}
	
	for (let val in map) {
			if(css.search(val) != -1) {   
					final[val.substr(1)] = map[val]
			}
	}
	
	return final
}

let styleData = (maps, colors, borders) => {
	data = { maps, colors, borders }
}


let deps = []

if(program.hdm) {

	deps = [
		path.resolve(`${program.args[0]}/media-platform/mp-bower-assets/scss/_utils.scss`),
		path.resolve(`${program.args[0]}/media-platform/mp-bower-assets/scss/_system.scss`),
		path.resolve(`${program.args[0]}/media-platform/fre-hdm/assets/scss/_variables.scss`),
		path.resolve(`${program.args[0]}/media-platform/fre-hdm/sites/${program.args[1]}/assets/scss/_variables.scss`)
	]

	} else if(program.edit) {

		deps = [
			path.resolve(`${program.args[0]}/media-platform/mp-bower-assets/scss/_utils.scss`),
			path.resolve(`${program.args[0]}/media-platform/mp-bower-assets/scss/_system.scss`),
			path.resolve(`${program.args[0]}/media-platform/mp-bower-assets/scss/_animations.scss`),
			path.resolve(`${program.args[0]}/media-platform/mp-bower-assets/scss/_breakpoint-events.scss`),
			path.resolve(`${program.args[0]}/media-platform/edit/assets/scss/_constants.scss`)   
		]

	} else if(program.demo) {
		deps.push(file)
	
	} else {
		deps = program.args.slice(1)
		deps.push(program.args[0])
}
		
writeStyles(mapVars, colorVars, borderVars, deps)
		
fs.readFile(path.join(__dirname, 'demos/styles.scss'), 'utf8', (err, contents) => {
	
	sass.render({
		data: contents,
	}, (err, result) => {

		if(err) {
				console.log("Check if scss files and import order are valid")
		}

		let cssString = result.css.toString()
		let mapData = test(cssString, mapVars)
		let colorData = test(cssString, colorVars)
		let borderData = test(cssString, borderVars)

		_.forIn(colorData, (val, key) => { // TO DO: Separate border classes from color classes
			if(borderData[key]) {
				delete colorData[key]
			}
		})

		styleData(mapData, colorData, borderData)
		fs.writeFile(path.join(__dirname, 'public/css/styles.css'), cssString, function(err) {
				
			if(err) {
				return console.log(err);
			}
		}); 

		fs.readFile(path.join(__dirname, 'demos/demo-template.html'), 'utf-8', (error, source) => {
				
			handlebars.registerHelper('append', (key) => {
					
				key = '$' + key.replace(/-stylejam-/g, ' : ')
				return key
			})

			handlebars.registerHelper('prepend', (key) => {
				
				key = '$' + key
				return key
			})

			let template = handlebars.compile(source)
			let html = template(data)
				
			fs.writeFile(path.join(__dirname, 'public/index.html'), html, function(err) {
				if(err) {
					return console.log(err);
				}
			})

			open(path.join(__dirname, 'public/index.html'))
		})
	})
})

/**
 * Parse into an AST!
 */
if(program.bench) {
		console.time('stylejam');
}


if(program.bench) {
		console.timeEnd('stylejam');
}
