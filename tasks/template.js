/**
 * Pass the Fabricator views through Handlebars
 */

'use strict';

// modules
var fs = require('fs');
var path = require('path');
var Handlebars = require('handlebars');
var through = require('through2');

/**
 * Contents of data.json
 * @type {Object}
 */
var data;


/**
 * Register partials with Handlebars
 */
var registerPartials = function () {

	var partials = fs.readdirSync('src/toolkit/views/partials'),
		html;

	for (var i = partials.length - 1; i >= 0; i--) {
		html = fs.readFileSync('src/toolkit/views/partials/' + partials[i], 'utf-8');
		Handlebars.registerPartial(partials[i].replace(/.html/, ''), html);
	}

};


/**
 * Template standard views (e.g. components, structures, documentation)
 */
var templateFabricator = function (file, enc, cb) {

	// augment data object
	data.fabricator = true;

	// template pages
	var source = file.contents.toString(),
		template = Handlebars.compile(source),
		html = template(data);

	// save as file buffer
	file.contents = new Buffer(html);

	this.push(file);

	cb();

};


/**
 * Template prototype views
 */
var templatePrototype = function (file, enc, cb) {

	// augment data object
	data.fabricator = false;

	// use the filename as the key value lookup in the data.json object
	var key = path.basename(file.path, '.html').replace(/-/g, '');

	// define comment blocks to wrap the prototype code
	var comments = {
			start: '\n\n<!-- Start ' + data.prototypes[key].name + ' prototype -->\n\n',
			end: '\n\n<!-- /End ' + data.prototypes[key].name + ' prototype -->\n\n'
		};

	// concat file contents
	var source = '{{> intro}}' +
				comments.start +
				data.prototypes[key].content +
				comments.end +
				'{{> outro}}';

	// template
	var template = Handlebars.compile(source),
		html = template(data);

	// save as file buffer
	file.contents = new Buffer(html);

	this.push(file);

	cb();

};

module.exports = function (opts) {
	data = JSON.parse(fs.readFileSync(opts.data));
	registerPartials();
	return through.obj((opts.prototype) ? templatePrototype : templateFabricator);
};
