var Cerobee = require('clerobee'),
	io = require('socket.io-client'),
	_ = require('lodash');

var UP = 'up';
var DOWN = 'down';

function SocketClient( options ){
	this.clerobee = new Cerobee( options.idLength || 16 );
	this.name = options.name || 'Client';

	this.host = options.host || 'http://localhost:8080/';
	if( this.host.charAt( this.host.length-1 ) !== '/' )
		this.host = this.host.concat( '/' );
	this.channel = options.channel || 'api';
	this.event = options.event || 'rester';
}

var socketClient = SocketClient.prototype;

socketClient.connect = function(callback){
	var self = this;
	self.socket = io( self.host + self.channel );
	self.socket.on('connect', function(){
		self.status = UP;
		self.socket.on('disconnect', function(){
			self.status = DOWN;
		});
		self.socket.on('reconnect', function(){
			self.status = UP;
		});
		if( callback )
			callback();
	});
};

socketClient.send = function(){
	var self = this;

	var recipient = arguments[ 0 ];

	var hasCallback = _.isFunction( arguments[ arguments.length-1 ] );
	var params = [].slice.call(arguments, 1, hasCallback ? arguments.length-1 : arguments.length );
	var callback = hasCallback ? arguments[ arguments.length-1 ] : null;

	var callbackID = this.clerobee.generate();

	if( callback )
		this.socket.on( callbackID, function ( data ) {
			callback( data.error ? new Error(data.error) : null, data.response );
		});
	this.socket.emit( self.event, { sender: self.name, callbackID: callbackID, recipient: recipient, parameters: params } );
};

socketClient.disconnect = function( callback ){
	this.socket.close();
};

module.exports = SocketClient;
