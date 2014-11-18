/*
	utils.js
	http://nulldesign.jp/
	https://github.com/nulldesignjp/
*/

function round( v )
{
	return ( v * 2 | 0 ) - ( v | 0 );
}
function max( v1, v2 )
{
	return ( v1 > v2 ) ? v1 : v2;
}
function min( v1, v2 )
{
	return ( v1 < v2 ) ? v1 : v2;
}
function abs( v )
{
	return ( v ^ (v >> 31 ) ) - ( v >> 31 );
}
function floor( v )
{
	return v << 0;
}
function ciel( v )
{
	return ( v == v >> 0 ) ? v : ( v + 1 ) >> 0;
}
function sin( a )
{
	return round( Math.sin( a ) * 100000 ) * .00001;
}
function cos( a )
{
	return round( Math.cos( a ) * 100000 ) * .00001;
}
function asin( e )
{
	return Math.asin( e );
}
function scos( e )
{
	return Math.acos( e );
}
function degree2rad( e )
{
	return e * Math.PI / 180;
}
function rad2degree( e )
{
	return e * 180 / Math.PI;
}
function random()
{
	return Math.random();
}

//	Array
function shuffle( arr )
{
	var l = arr.length;
	var newArr = arr;
	while(l){
		var m = Math.floor(Math.random()*l);
		var n = newArr[--l];
		newArr[l] = newArr[m];
		newArr[m] = n;
	}
	return newArr;
}

function easeInOutSine(t,b,c,d)
{
	return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
}

/*
	getUA.js
*/
function getUA()
{
	var ua =
	{
		'msie'	:	false,
		'msie6'	:	false,
		'msie7'	:	false,
		'msie8'	:	false,
		'msie9'	:	false,
		'msie10'	:	false,
		'msie11'	:	false,
		'safari'	:	false,
		'firefox'	:	false,
		'chrome'	:	false,
		'opera'	:	false,

		'android'	:	false,
		'androidTablet'	:	false,

		'iphone'	:	false,
		'iphone4'	:	false,
		'iphone5'	:	false,
		'iphone6'	:	false,
		'ipad'	:	false,
		'ipod'	:	false,
		'iphoneos5'	:	false,
		'iphoneos6'	:	false,
		'iphoneos7'	:	false,
		'iphoneos8'	:	false,
		'android2.2'	:	false,
		'android2.3'	:	false,
		'android4.0'	:	false,
		'android4.1'	:	false,
		'android4.2'	:	false,
		'android4.3'	:	false,
		'android4.4'	:	false,

		'blackberry'	:	false,
		'windowsMobile'	:	false
	};
	var _ua = navigator.userAgent.toLowerCase();
	_ua = _ua.replace(/ /g, "");
	for( var i in ua )
	{
		if( _ua.indexOf( i ) != -1 )
		{
			ua[i] = true;
		}

		//	msie11
		if( i == 'msie11' )
		{
			if( _ua.indexOf( 'rv:11.0' ) != -1 )
			{
				ua[i] = true;
			}
		}
	}

	//	DEVICE
	if( ua.iphone && screen.height == 568 )
	{
		ua.iphone5 = true;
	} else {
		ua.iphone4 = true;
	}

	//	another ua....
	if( ua.android )
	{
		//	android
		ua.android = ( ( _ua.indexOf( 'android' ) != -1 && _ua.indexOf( 'mobile' ) != -1 ) && _ua.indexOf( 'sc-01c' ) == -1 )?	true:false;

		//	androidTablet:SC-01C
		ua.androidTablet = ( _ua.indexOf( 'android' ) != -1 && ( _ua.indexOf( 'mobile' ) == -1 || _ua.indexOf( 'sc-01c' ) != -1 ) )?	true:false;
	}

	//	Nexus7
	ua.isNexus7 = ( _ua.indexOf( 'nexus7' ) != -1 && ua.android );

	//	SOL23 Xperia Z1
	ua.sol23 = ( _ua.indexOf( 'sol23' ) != -1 && ua.android );

	//	SO-04D Xperia GX
	ua.so04d = ( _ua.indexOf( 'so-04d' ) != -1 && ua.android );

	//	SO-03D Xperia GX
	ua.so03d = ( _ua.indexOf( 'so-03d' ) != -1 && ua.android );


	//	windows mobile
	ua.windowsMobile = ( _ua.indexOf( 'IEMobile' ) != -1 )?	true:false;

	ua.toString = function()
	{
		return navigator.userAgent;
	}

	return ua;
}