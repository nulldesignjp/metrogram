/*
	randomtypo.js
*/

var randomtypo = (function(){
	var _randomtypo = function( _dom, _text, _delay )
	{
		this.dom = _dom;
		this.text = _text;
		this.intevalKey;
		this.count = 0;
		this.delay = _delay

		// var _this = this;
		// this.dom.on('mouseover', function(){
		// 	_this.start()
		// })
	}
	_randomtypo.text = '_ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
	_randomtypo.fps = 60;

	_randomtypo.prototype = 
	{
		start	:	function()
		{
			this._start();
		},
		_draw	:	function()
		{
			var len = this.text.length;
			var _str = '';

			if( len == 0 )
			{
				_str = this.text;
				this._fixed();
				return;
			}

			var _delay = _randomtypo.fps * ( this.delay / 1000 );
			var _strCount = Math.floor( ( this.count - _delay ) * 0.25 );
			_strCount = _strCount<0?0:_strCount;

			if( len < _strCount )
			{
				_str = this.text;
				this._fixed();
				return;
			} else {
				_str = this.text.substr( 0, _strCount );

				var len2 = len - _strCount;

				for( var i = 0; i < len2; i++ )
				{
					_str += _randomtypo.text.charAt( Math.floor( Math.random() * _randomtypo.text.length ) );
				}
			}

			this.dom.text( _str );

			this.count ++;
		},
		_fixed	:	function()
		{
			var _this = this;
			clearInterval( _this.intevalKey );
			_this.count = 0;
		},
		_start	:	function()
		{
			var _this = this;
			clearInterval( _this.intevalKey );
			_this.intevalKey = setInterval( function(){_this._draw()}, 1000 / _randomtypo.fps );
		},
		_restart	:	function()
		{
			this.count = 0;
			this._start();
		},
		setText	:	function( _text )
		{
			this.text = _text;
		}
	};
	return _randomtypo;
})();