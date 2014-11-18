/*
	engine.js
	copyright 2014 nulldesign.jp ALL RIGHTS RESERVED.
*/
(function(){
	window.onload = function()
	{
		var _canvas0, _ctx0;
		var _canvas1, _ctx1;
		var _canvas2, _ctx2;
		var _canvas3, _ctx3;
		var _canvas4, _ctx4;
		var _clist = {};
		var _trainList = [];
		var _scale = 12000;
		var _fps = 60;
		var _worldStartTime = '04:55';
		var _speedRate = 0.02;
		var _zoom = _scale / 12000;
		var _frameCount = ( parseInt( _worldStartTime.split(':')[0] ) * 60 + parseInt( _worldStartTime.split(':')[1] ) ) / _speedRate;
		var _resetTime = _frameCount;
		var _timeCount = 0;
		var _timeChecker = false;
		var _intervalKey;
		var _filterKey;
		var _blur = 0;
		var _blurCount = 0;
		var _fontSize = 10;

		var _sname = $('#sname');
		var _sename = $('#sename');
		var _stime = $('#stime');

		//	RANDOMTYPO
		var _typo01 = new randomtypo( _sname, '', 300 );
		var _typo02 = new randomtypo( _sename, '', 400 );
		var _typo03 = new randomtypo( _stime, '',500 );


		//	DISPLAY
		var _w = $( window ).width();
		var _h = $( window ).height();

		//	KOKYO[CENTER].
		var _aveX = 139.752799;
		var _aveY = 35.685175;

		var _isSp = false;
		var _ua = getUA();
		var _isSp = false;
		if( _ua.iphone || _ua.android )
		{
			$('body').addClass('sp');
			_isSp = true;
		}
		var _div = 60;
		var _stations = [];

		function _blurIn()
		{
			_blur = easeInOutSine( _blurCount, 0, 8, 30 );
			document.getElementById('siteBody').style.webkitFilter = "blur("+_blur+"px)";

			if( _blurCount >= 30 )
			{
				clearInterval( _filterKey );
			}

			_blurCount++;
		}

		function loadXML()
		{
			$.ajax({
				url: './shared/xml/stationlist.xml',
				type: 'GET',
				dataType: 'XML',
				success: function( _xml )
				{
					var _plist = {};
					$( _xml ).find('line').each(function(){
						var _lineName = $( this ).attr('id');
						var _color = $( this ).attr('color');
						var _rlist = [];
						$( this ).find('item').each(function(){
							var _x = parseFloat( $( this ).find('location longitude').eq(0).text() );
							var _y = parseFloat( $( this ).find('location latitude').eq(0).text() );

							if( _plist[ $( this ).attr('id') ] )
							{
								_x = _plist[ $( this ).attr('id') ].x;
								_y = _plist[ $( this ).attr('id') ].y;
							}

							var _t = $( this ).find('connection').eq(0).text();
							if( _t != '' )
							{
								var _l = $( this ).find('connection').eq(0).text().split(',');
								var leng = _l.length;
								for( var ii = 0; ii < leng; ii++ )
								{
									if( _plist[_l[ii]] == undefined )
									{
										_plist[_l[ii]] = {x:_x,y:_y}	
									}
								}
							}

							var _name = $( this ).find('name').eq(0).text();
							var _ename = $( this ).find('english').eq(0).text();
							var _sdat = {name: _name,english: _ename, x: _x, y: _y}
							_rlist.push( _sdat );

							if( _lineName != 'yamanote' && _lineName != 'oedo' )
							{
								_stations.push({x:_x,y:_y,name:_name,english:_ename,color:_color});
							}
						});

						var _data = {};
						_data.id = $( this ).attr('id');
						_data.color = $( this ).attr('color');
						_data.name = $( this ).attr('name');
						_data.rlist = _rlist;
						_data.dlist = [];
						_data.dlist[0] = SplineCurve( _rlist, _div );
						_data.dlist[1] = SplineCurve( _rlist, _div ).reverse();
						_data.schdule = _schdule[ $( this ).attr('id') ];
						_data.pointerlist = [];
						_data.pointerlist[0] = [];
						_data.pointerlist[1] = [];

						var len = _data.schdule.length;
						for( var i = 0; i < len; i++ )
						{
							var len1 = _data.schdule[i].length;
							for( var j = 0; j < len1; j++ )
							{
								_data.pointerlist[i][j] = 0;
								var len2 = _data.schdule[0][i].length;
								for( var k = 0; k < len2; k++ )
								{
									if( _data.schdule[i][j][k] != '-' )
									{
										var _t = _data.schdule[i][j][k].split(':');
										var _h = parseInt( _t[0] );
										var _m = parseInt( _t[1] );
										var _time = _h * 60 + _m;
										_data.schdule[i][j][k] = _time;
									}
								}
							}
						}
						_clist[_data.id] = _data;
					});

					eventSetup();
					start();
					randomViewChanger();
					addBtnAbout();

					//	all fadeIn
					$('#siteBody').addClass('a0');

					//
					setTimeout( function(){
						$('#siteBody').removeClass('a0').addClass('fadeIn');
						$('#timer').addClass('timeIn');
					},500 );
					setTimeout( function(){
						$( _canvas1 ).removeClass().addClass('fadeIn');
						$( _canvas2 ).removeClass().addClass('fadeIn');
					},2000 );
					setTimeout( function(){
						$( _canvas4 ).removeClass().addClass('fadeIn');
					},2600 )
					setTimeout( function(){
						$( _canvas3 ).removeClass().addClass('fadeIn');
					},3200 );

					

				}, error: function( e )
				{
					console.log( e );
				}
			});

		}

		function eventSetup()
		{
			//	リサイズと画面レイアウト
			$( window ).on("resize",_resize);
			_w = $( window ).width();
			_h = $( window ).height();
			if( _isSp )
			{
				_w *= 2;
				_h *= 2;
			}
			resize(_w,_h);
		}

		function start()
		{
			pause();
			_intervalKey = setInterval( _loop, 1000 / _fps );
		}

		function pause()
		{
			clearInterval( _intervalKey );
		}

		function randomViewChanger()
		{
			setTimeout( function(){
				setInterval( function(){
					var _no = floor( Math.random() * _stations.length );
					_aveX = _stations[_no].x;
					_aveY = _stations[_no].y;
					_scale = floor( Math.random() * 8 ) * 3000 + 12000;
					_zoom = _scale / 12000;

					// _sname.text(_stations[_no].name);
					// _sename.text(_stations[_no].english);
					// _stime.text( $('#timer').text() );

					if( _scale < 12000 )
					{
						_aveX = 139.752799;
						_aveY = 35.685175;
						_sname.text('');
						_sename.text('');
						_stime.text('');
					} else {
						_typo01.setText( _stations[_no].name );
						_typo02.setText( _stations[_no].english );
						_typo03.setText( $('#timer').text() );

						_sname.text('');
						_sename.text('');
						_stime.text('');

						_typo01.start();
						_typo02.start();
						_typo03.start();
					}

					draw();
				}, 1000 * 8.0 );
			},4200);
		}

		function addBtnAbout()
		{
			$('#btnAbout a').on('click', function(){
				if( !$('#aboutWrapper').hasClass('show') )
				{
					$('#aboutWrapper').addClass('show');
					$('#about').addClass('fadeIn2About');
					_blurCount = 0;
					clearInterval( _filterKey );
					_filterKey = setInterval( _blurIn, 1000 / _fps );
				} else {
					$('#aboutWrapper').removeClass('show');
					clearInterval( _filterKey );
					document.getElementById('siteBody').style.webkitFilter = "blur(0px)";
				}
			}).attr('href','javascript:void(0);');

			//	close about contents.
			$('#aboutWrapper').on( 'click', function(e){
				$( this ).removeClass();
				clearInterval( _filterKey );
				document.getElementById('siteBody').style.webkitFilter = "blur(0px)";
				return false;
			});
			$( window ).on('scroll',function(e){e.preventDefault();})
		}
		
		function createCanvas()
		{
			//	CREATE CANVAS ELEMENT
			_canvas1 = document.createElement("canvas");
			_ctx1 = _canvas1.getContext("2d");
			$("#siteBody").append(_canvas1);

			_canvas3 = document.createElement("canvas");
			_ctx3 = _canvas3.getContext("2d");
			$("#siteBody").append(_canvas3);

			_canvas2 = document.createElement("canvas");
			_ctx2 = _canvas2.getContext("2d");
			$("#siteBody").append(_canvas2);

			_canvas4 = document.createElement("canvas");
			_ctx4 = _canvas4.getContext("2d");
			$("#siteBody").append(_canvas4);

			$( _canvas1 ).addClass('a0');
			$( _canvas2 ).addClass('a0');
			$( _canvas3 ).addClass('a0');
			$( _canvas4 ).addClass('a0');
		}

		var _past = 0;
		function _loop()
		{
			//	COUNTUP
			_frameCount++;
			_timeCount = floor( _frameCount * _speedRate );
			_timeChecker = _past==_timeCount?true:false;
			_past = _timeCount;

			//	TIME COUNT
			var _h = ( floor( _timeCount / 60 ) % 24 ) + 100;
			var _m = _timeCount % 60 + 100;
			var _s = floor( _frameCount * _speedRate * 60 ) % 60 + 100;
			_h = String( '' + _h ).substr( 1,2 );
			_m = String( '' + _m ).substr( 1,2 );
			_s = String( '' + _s ).substr( 1,2 );
			document.getElementById('timer').innerHTML = _h + ':' + _m + ':' + _s;

			if( !_timeChecker )
			{
				_pointerUpdate();
			}
			
			//	DRAW
			//draw();
			drawtrain();

			//	RESET TIMER
			if( _frameCount > _resetTime + 1440 / _speedRate )
			{
				reset();
			}

			//	SCROLL MESURE
			$('#siteBody').css('backgroundPosition', '-100px ' + floor( - _frameCount * 3 * _zoom ) + 'px');
		}

		function _pointerUpdate()
		{
			for( var l in _clist )
			{
				var _schdule = _clist[l].schdule;
				var _pointerlist = _clist[l].pointerlist;
				var len3 = _schdule.length;
				for( var k = 0 ; k < len3; k++ )
				{
					var len = _schdule[k].length;
					for( var i = 0 ; i < len-1; i++ )
					{
						var _index = _getIndex( i, _pointerlist[k][i], k, _clist[l].id );
						var _next = _getNext( i, _index, k, _clist[l].id );

						if( _timeCount == _schdule[k][i][_index] )
						{
							//	移動開始
							var _startTime = _schdule[k][i][_index];
							var _endTime = _schdule[k][i][_next];
							var _dir = k;
							var _train = {
								id: _clist[l].id,
								color: _clist[l].color,
								startIndex: _index,
								endIndex: _next,
								start: _startTime,
								end: _endTime,
								dir: _dir
							}

							_pointerlist[k][i] = _next;

							if( _schdule[k][i].length > _pointerlist[k][i] )
							{
								_trainList.push( _train );
							}

						}
					}
				}
			}
		}

		//	リサイズ
		function _resize(e)
		{
			_w = $( window ).width();
			_h = $( window ).height();

			if( _isSp )
			{
				_w *= 2;
				_h *= 2;
			}
			resize( _w, _h );
		}

		function resize( __w, __h )
		{
			_canvas1.width = __w;
			_canvas1.height = __h;
			_canvas2.width = __w;
			_canvas2.height = __h;
			_canvas3.width = __w;
			_canvas3.height = __h;
			_canvas4.width = __w;
			_canvas4.height = __h;
			draw();
		}

		function draw()
		{
			var __w = _w * 0.5;
			var __h = _h * 0.5;
			var _txtPast = [];

			_ctx1.beginPath();
			_ctx1.clearRect( 0, 0, _w, _h );

			_ctx3.beginPath();
			_ctx3.clearRect( 0, 0, _w, _h );

			_ctx4.beginPath();
			_ctx4.clearRect( 0, 0, _w, _h );
			_ctx4.fillStyle = 'rgba(0,0,0,0.6)';

			for( var j in _clist )
			{
				var _dlist = _clist[j].dlist;
				var _rlist = _clist[j].rlist;
				var len = _dlist[0].length;
				var _isMetoro = true;

				//	LINE
				_ctx1.beginPath();
				_ctx1.strokeStyle = 'rgba(0,0,0,0.1)';
				_ctx1.lineWidth = 3 * _zoom;


				if( _clist[j].id == 'yamanote' || _clist[j].id == 'oedo' )
				{
					_ctx1.lineWidth = 1 * _zoom;
				}
				
				_ctx1.moveTo( ( _dlist[0][0].x - _aveX ) * _scale + __w, - ( _dlist[0][0].y - _aveY ) * _scale + __h );
				for( var i = 1; i < len; i++ )
				{
					_ctx1.lineTo( ( _dlist[0][i].x - _aveX ) * _scale + __w, - ( _dlist[0][i].y - _aveY ) * _scale + __h );
				}
				_ctx1.stroke();

				//	ARC
				_ctx3.beginPath();
				_ctx3.strokeStyle = 'rgba(0,0,0,0.6)';
				_ctx3.lineWidth = 4 * _zoom;
				_ctx3.fillStyle = '#FFFFFF';

				var len = _rlist.length;
				var _rad = 2.5 * _zoom;


				if( _clist[j].id == 'yamanote' || _clist[j].id == 'oedo' )
				{
					_ctx3.strokeStyle = 'rgba(0,0,0,0.2)';
					_rad = 1.5 * _zoom;
				}

				for( var i = 0; i < len; i++ )
				{
					_ctx3.moveTo( ( _rlist[i].x - _aveX ) * _scale + _rad + __w, - ( _rlist[i].y - _aveY ) * _scale + __h );
					_ctx3.arc( ( _rlist[i].x - _aveX ) * _scale + __w, - ( _rlist[i].y - _aveY ) * _scale + __h, _rad, 0, Math.PI * 2 );

    				_ctx4.font = Math.floor( _fontSize * _zoom ) + 'px Arial';

    				//	typo
					var _x = round((_rlist[i].x - _aveX ) * _scale + __w + 8 * _zoom);
					var _y = round( - ( _rlist[i].y - _aveY ) * _scale + __h + 5 );

					var __len = _txtPast.length;
					var _isWrite = true;
					while( __len )
					{
						__len--;
						var _p = _txtPast[ __len ];
						if( _p.x == _x && _p.y == _y )
						{
							_isWrite = false;
							break;
						}
					}

					//	reigai
					if( _clist[j].id == 'yamanote' || _clist[j].id == 'oedo' )
					{
						_isWrite = false;
					}

					if( _isWrite )
					{
						_txtPast.push({x:_x, y:_y})
						_ctx4.fillText( _rlist[i].name, _x, _y )
					}
				}
				_ctx3.stroke();
				_ctx3.fill();
				_ctx4.fill();
			}
		}

		function drawtrain()
		{
			_ctx2.beginPath();
			_ctx2.clearRect( 0, 0, _w, _h );
			//_ctx2.fillStyle = '#CC0000';
			var __w = _w * 0.5;
			var __h = _h * 0.5;

			//	current
			var len = _trainList.length;
			while( len )
			{
				len--;
				var _tr = _trainList[len];
				var _id = _tr.id;
				var _dlist = _clist[ _id ].dlist;
				var _duration = _tr.end - _tr.start;
				var _start = _tr.startIndex;
				var _end = _tr.endIndex;
				var _dir = _tr.dir;
				var _way = _dlist[_dir].slice( _start * _div, _end * _div + 1 );

				_duration /= _speedRate;
				_startFrame = _tr.start / _speedRate;

				if( _timeCount >= _tr.end )
				{
					_trainList.splice( len, 1 );
					continue;
				}

				var _dt = floor( easeInOutSine(_frameCount - _startFrame,0,_way.length,_duration) );
				var _r = 3;
				var _rd = 1;
				if( _end - _start > 1 )
				{
					_r = 6;
					_rd = 2;
				}

				_r *= _zoom;

				var _color = _clist[ _id ].color;
				_ctx2.beginPath();
				_ctx2.fillStyle = '#' + _color;

				var _x = _way[_dt].x;
				var _y = _way[_dt].y;
				_ctx2.moveTo( ( _x - _aveX ) * _scale + __w, - ( _y - _aveY ) * _scale + __h );
				_ctx2.arc( ( _x - _aveX ) * _scale + __w, - ( _y - _aveY ) * _scale + __h, _r, 0, 6.3 );
				_ctx2.fill();
			}

			//	alpha
			len = _trainList.length;
			while( len )
			{
				len--;
				var _tr = _trainList[len];
				var _id = _tr.id;
				var _dlist = _clist[ _id ].dlist;
				var _duration = _tr.end - _tr.start;
				var _start = _tr.startIndex;
				var _end = _tr.endIndex;
				var _dir = _tr.dir;
				var _way = _dlist[_dir].slice( _start * _div, _end * _div + 1 );

				_duration /= _speedRate;
				_startFrame = _tr.start / _speedRate;

				if( _timeCount >= _tr.end )
				{
					_trainList.splice( len, 1 );
					continue;
				}
				var _dt = floor( easeInOutSine(_frameCount - _startFrame,0,_way.length,_duration) );
				var _color = parseInt( _clist[ _id ].color, 16 );
				var _r = _color >> 16 & 0xFF;
				var _g = _color >> 8 & 0xFF;
				var _b = _color & 0xFF;

				_ctx2.beginPath();
				_ctx2.fillStyle = 'rgba('+_r+','+_g+','+_b+',0.16)';
				
				var _rr = 12 * _zoom;
				var _x = _way[_dt].x;
				var _y = _way[_dt].y;
				_ctx2.moveTo( ( _x - _aveX ) * _scale + __w, - ( _y - _aveY ) * _scale + __h );
				_ctx2.arc( ( _x - _aveX ) * _scale + __w, - ( _y - _aveY ) * _scale + __h, _rr, 0, 6.3 );
				_ctx2.fill();
			}
		}

		function _getIndex( i, _index, k, _id )
		{
			var _schdule = _clist[_id].schdule;
			if( _schdule[k][i].length < _index )
			{
				return _schdule[k][i].length - 1;
			}

			if( _schdule[k][i][_index] == '-' )
			{
				return _getIndex( i, _index + 1, k, _id )
			}

			return _index;
		}

		function _getNext( i, _index, k, _id )
		{
			var _schdule = _clist[_id].schdule;
			var _next = _index + 1;
			if( _schdule[k][i].length < _next )
			{
				return _schdule[k][i].length - 1;
			}

			if( _schdule[k][i][_next] == '-' )
			{
				return _getNext( i, _next, k, _id );
			}

			return _next;
		}

		function reset()
		{
			for( var i in _clist )
			{
				var len = _clist[i].pointerlist[0].length;
				for( var j = 0; j < len; j++ )
				{
					_clist[i].pointerlist[0][j] = 0;
				}
				var len = _clist[i].pointerlist[1].length;
				for( var j = 0; j < len; j++ )
				{
					_clist[i].pointerlist[1][j] = 0;
				}
			}

			_trainList = [];
			_frameCount = ( parseInt( _worldStartTime.split(':')[0] ) * 60 + parseInt( _worldStartTime.split(':')[1] ) ) / _speedRate;
			_timeCount = 0;
			_timeChecker = false;
		}

		createCanvas();
		loadXML();
	}
})();


