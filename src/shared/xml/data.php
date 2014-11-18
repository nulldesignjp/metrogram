<?php
header("Content-type: text/xml; charset=utf-8");

#	エラー処理
error_reporting(E_ALL & ~E_NOTICE);

#	APIデータの整形用配列
$data = array();

#	基本クラス
class station{
	var $name;
	var $english;
	var $line;
	var $id;
	var $connection = array();
	var $lat;
	var $long;
}

#	出力用の文字列用変数
$gzip = '';

#	路線情報
$colors = array(
	'tozai'			=>	array(	'id' => 'tozai',		'name' => '東西線',		'color' => '0ba2c7' ),
	'yurakucho'		=>	array(	'id' => 'yurakucho',	'name' => '有楽町線',		'color' => 'ce9a40' ),
	'marunouchibranch'	=>	array(	'id' => 'marunouchibranch',	'name' => '丸ノ内線',		'color' => 'fe0d09' ),
	'marunouchi'	=>	array(	'id' => 'marunouchi',	'name' => '丸ノ内線',		'color' => 'fe0d09' ),
	'hibiya'		=>	array(	'id' => 'hibiya',		'name' => '日比谷線',		'color' => 'c6b8a1' ),
	'chiyoda'		=>	array(	'id' => 'chiyoda',		'name' => '千代田線',		'color' => '33a34a' ),
	'hanzomon'		=>	array(	'id' => 'hanzomon',		'name' => '半蔵門線',		'color' => '8664ae' ),
	'ginza'			=>	array(	'id' => 'ginza',		'name' => '銀座線',		'color' => 'fd8319' ),
	'namboku'		=>	array(	'id' => 'namboku',		'name' => '南北線',		'color' => '00947b' ),
	'fukutoshin'	=>	array(	'id' => 'fukutoshin',	'name' => '副都心線',		'color' => '89411f' ),
	'oedo'			=>	array(	'id' => 'oedo',			'name' => '大江戸線',		'color' => 'b6007a' ),
	'yamanote'		=>	array(	'id' => 'yamanote',		'name' => '山手線',		'color' => '068a0f' )
);

#	乗り換え先イレギュラー対応表
$stationExchangeList = array(
	"赤坂見附"	=>	"永田町",
	"国会議事堂前"	=>	"溜池山王",
	"日比谷"		=>	"有楽町",
	"新御茶ノ水"	=>	"淡路町",
	"仲御徒町"	=>	"上野広小路",
	"永田町"		=>	"赤坂見附",
	"溜池山王"	=>	"国会議事堂前",
	"有楽町"		=>	"日比谷",
	"淡路町"		=>	"新御茶ノ水",
	"上野広小路"	=>	"仲御徒町"
);

#	駅ナンバリングシステムのソート用関数
function cmp($a, $b)
{
    if ($a->id == $b->id) { return 0; }
    else return ($a->id < $b->id) ? -1 : 1;
}

#	API
$api = 'https://api.tokyometroapp.jp/api/v2/';

#	metrogram token
$accessToken = 'accessToken';

$url = $api.'datapoints?rdf:type=odpt:Station&acl:consumerKey='.$accessToken;

# ファイルからJSONを読み込み
$json = file_get_contents( $url );

# 文字化けするかもしれないのでUTF-8に変換
$json = mb_convert_encoding($json, 'UTF8', 'ASCII,JIS,UTF-8,EUC-JP,SJIS-WIN');

# オブジェクト毎にパース
# trueを付けると連想配列として分解して格納してくれます。
$obj = json_decode( $json, true );

foreach ( $obj as $key => $value )
{
	$s = new station();
	$s->name = $value['dc:title'];
	$s->english = explode( ".", $value['owl:sameAs'] )[3];
	$s->line = mb_strtolower( explode( ".", $value['owl:sameAs'] )[2] );
	$s->id = $value['odpt:stationCode'];
	$s->connection = $value['odpt:connectingRailway'];
	$s->lat = $value['geo:lat'];
	$s->long = $value['geo:long'];

  if( $s->line == 'marunouchibranch' && $s->id == 'M06')
  {
    $s->id = 'm06';
  }

	# 不必要な連結の削除
	foreach ( $s->connection as $i => $valueStr )
	{
		if( strpos( $valueStr, "odpt.Railway:TokyoMetro." ) === FALSE )
		{
			unset($s->connection[$i]);
		} else {
			$s->connection[$i] = explode( ".", $valueStr )[2];
		}
	}

	if( !array_key_exists( $s->line, $data ) )
	{
		$data[$s->line] = array();
	}

	#	push
  $data[$s->line][] = $s;
}


#	exchange connection
foreach ( $data as $key1 => $line )
{
	#	line
	foreach( $line as $key2 => $st )
	{
		$stnam = $st->name;	//myname
		foreach( $st->connection as $index => $value )
		{
			$boolVal = FALSE;
			foreach( $data[ mb_strtolower($value)] as $index2 => $st2 )
			{
				if( $st2->name == $stnam )
				{
					$st->connection[$index] = $st2->id;
					$boolVal = TRUE;
					break;
				}
			}

			if( $boolVal == FALSE )
			{
				foreach( $data[ mb_strtolower($value)] as $index2 => $st2 )
				{
					if( array_key_exists( $stnam, $stationExchangeList ) )
					{
						if( $st2->name == $stationExchangeList[$stnam] )
						{
							$st->connection[$index] = $st2->id;
							break;
						}
					}
				}
			}
		}
	}
}

//$nakano = array_pop($data['marunouchibranch']);
//array_unshift( $data['marunouchibranch'], $nakano );

$head = <<< EOM
<?xml version="1.0" encoding="UTF-8"?>
<stations>
EOM;

$gzip = $gzip.$head;

foreach ( $data as $key1 => $value1 )
{

$colorObj = $colors[$key1];
$id = $colorObj["id"];
$name = $colorObj["name"];
$color = $colorObj["color"];

$lineHead = <<< EOM

	<line id="$id" name="$name" color="$color">
EOM;

$gzip = $gzip.$lineHead;

usort($value1, "cmp");



foreach ( $value1 as $key => $value )
{
$connection = implode( ',', $value->connection );
$body = <<< EOM

		<item id="$value->id">
			<name>$value->name</name>
			<english>$value->english</english>
			<railway>$value->line</railway>
			<location>
				<latitude>$value->lat</latitude>
				<longitude>$value->long</longitude>
			</location>
			<connection>$connection</connection>
		</item>
EOM;

$gzip = $gzip.$body;
}

$lineFoot = <<< EOM

	</line>
EOM;

$gzip = $gzip.$lineFoot;
}



$more = <<< EOM


  <line id="oedo" name="大江戸線" color="b6007a">
    <item id="E01">
      <name>新宿西口</name>
      <english>Shinjukunishiguchi</english>
      <location>
        <latitude>35.690081</latitude>
        <longitude>139.702369</longitude>
      </location>
      <connection>E28</connection>
    </item>
    <item id="E02">
      <name>東新宿</name>
      <english>HigashiShinjuku</english>
      <location>
        <latitude>35.694686</latitude>
        <longitude>139.710764</longitude>
      </location>
      <connection/>
    </item>
    <item id="E03">
      <name>若松河田</name>
      <english>Wakamatsukawada</english>
      <location>
        <latitude>35.695984</latitude>
        <longitude>139.7214</longitude>
      </location>
      <connection/>
    </item>
    <item id="E04">
      <name>牛込柳町</name>
      <english>Ushigomeyanagicho</english>
      <location>
        <latitude>35.696284</latitude>
        <longitude>139.728244</longitude>
      </location>
      <connection/>
    </item>
    <item id="E05">
      <name>牛込神楽坂</name>
      <english>UshigomeKagurazaka</english>
      <location>
        <latitude>35.697617</latitude>
        <longitude>139.73902</longitude>
      </location>
      <connection/>
    </item>
    <item id="E06">
      <name>飯田橋</name>
      <english>Iidabashi</english>
      <location>
        <latitude>35.698831</latitude>
        <longitude>139.748234</longitude>
      </location>
      <connection/>
    </item>
    <item id="E07">
      <name>春日</name>
      <english>Kasuga</english>
      <location>
        <latitude>35.706403</latitude>
        <longitude>139.756481</longitude>
      </location>
      <connection/>
    </item>
    <item id="E08">
      <name>本郷三丁目</name>
      <english>Hongo3chome</english>
      <location>
        <latitude>35.703437</latitude>
        <longitude>139.763134</longitude>
      </location>
      <connection/>
    </item>
    <item id="E09">
      <name>上野御徒町</name>
      <english>Uenookachimachi</english>
      <location>
        <latitude>35.704203</latitude>
        <longitude>139.777853</longitude>
      </location>
      <connection/>
    </item>
    <item id="E10">
      <name>新御徒町</name>
      <english>Shinokachimachi</english>
      <location>
        <latitude>35.70382</latitude>
        <longitude>139.785162</longitude>
      </location>
      <connection/>
    </item>
    <item id="E11">
      <name>蔵前</name>
      <english>Kuramae</english>
      <location>
        <latitude>35.7</latitude>
        <longitude>139.794154</longitude>
      </location>
      <connection/>
    </item>
    <item id="E12">
      <name>両国</name>
      <english>Ryogoku</english>
      <location>
        <latitude>35.692887</latitude>
        <longitude>139.795737</longitude>
      </location>
      <connection/>
    </item>
    <item id="E13">
      <name>森下</name>
      <english>Morishita</english>
      <location>
        <latitude>35.684723</latitude>
        <longitude>139.800265</longitude>
      </location>
      <connection/>
    </item>
    <item id="E14">
      <name>清澄白河</name>
      <english>KiyosumiShirakawa</english>
      <location>
        <latitude>35.678867</latitude>
        <longitude>139.802073</longitude>
      </location>
      <connection/>
    </item>
    <item id="E15">
      <name>門前仲町</name>
      <english>MonzenNakacho</english>
      <location>
        <latitude>35.668745</latitude>
        <longitude>139.799009</longitude>
      </location>
      <connection>T12</connection>
    </item>
    <item id="E16">
      <name>月島</name>
      <english>Tsukishima</english>
      <location>
        <latitude>35.661631</latitude>
        <longitude>139.787453</longitude>
      </location>
      <connection>Y21</connection>
    </item>
    <item id="E17">
      <name>勝どき</name>
      <english>Kachidoki</english>
      <location>
        <latitude>35.655267</latitude>
        <longitude>139.779662</longitude>
      </location>
      <connection/>
    </item>
    <item id="E18">
      <name>築地市場</name>
      <english>Tsukijishijo</english>
      <location>
        <latitude>35.661656</latitude>
        <longitude>139.770134</longitude>
      </location>
      <connection/>
    </item>
    <item id="E19">
      <name>汐留</name>
      <english>Shiodome</english>
      <location>
        <latitude>35.659551</latitude>
        <longitude>139.763066</longitude>
      </location>
      <connection/>
    </item>
    <item id="E20">
      <name>大門</name>
      <english>Daimon</english>
      <location>
        <latitude>35.653545</latitude>
        <longitude>139.757878</longitude>
      </location>
      <connection/>
    </item>
    <item id="E21">
      <name>赤羽橋</name>
      <english>Akabanebashi</english>
      <location>
        <latitude>35.651767</latitude>
        <longitude>139.746859</longitude>
      </location>
      <connection/>
    </item>
    <item id="E22">
      <name>麻布十番</name>
      <english>AzabuJuban</english>
      <location>
        <latitude>35.651442</latitude>
        <longitude>139.740267</longitude>
      </location>
      <connection/>
    </item>
    <item id="E23">
      <name>六本木</name>
      <english>Roppongi</english>
      <location>
        <latitude>35.659598</latitude>
        <longitude>139.734659</longitude>
      </location>
      <connection>H04</connection>
    </item>
    <item id="E24">
      <name>青山一丁目</name>
      <english>Aoyama1chome</english>
      <location>
        <latitude>35.669528</latitude>
        <longitude>139.727375</longitude>
      </location>
      <connection/>
    </item>
    <item id="E25">
      <name>国立競技場</name>
      <english>KokuritsuKyogijo</english>
      <location>
        <latitude>35.676823</latitude>
        <longitude>139.717342</longitude>
      </location>
      <connection/>
    </item>
    <item id="E26">
      <name>代々木</name>
      <english>Yoyogi</english>
      <location>
        <latitude>35.679826</latitude>
        <longitude>139.705256</longitude>
      </location>
      <connection />
    </item>
    <item id="E27">
      <name>新宿</name>
      <english>Shinjuku</english>
      <location>
        <latitude>35.687686</latitude>
        <longitude>139.703472</longitude>
      </location>
      <connection>M08</connection>
    </item>
    <item id="E28">
      <name>都庁前</name>
      <english>Tochomae</english>
      <location>
        <latitude>35.687317</latitude>
        <longitude>139.695784</longitude>
      </location>
      <connection>E01</connection>
    </item>
    <item id="E29">
      <name>西新宿五丁目</name>
      <english>NishiShinjuku5chome</english>
      <location>
        <latitude>35.686564</latitude>
        <longitude>139.687517</longitude>
      </location>
      <connection/>
    </item>
    <item id="E30">
      <name>中野坂上</name>
      <english>NakanoSakaue</english>
      <location>
        <latitude>35.694687</latitude>
        <longitude>139.686123</longitude>
      </location>
      <connection/>
    </item>
    <item id="E31">
      <name>東中野</name>
      <english>HigashiNakano</english>
      <location>
        <latitude>35.702998</latitude>
        <longitude>139.689056</longitude>
      </location>
      <connection />
    </item>
    <item id="E32">
      <name>中井</name>
      <english>Nakai</english>
      <location>
        <latitude>35.711834</latitude>
        <longitude>139.690478</longitude>
      </location>
      <connection/>
    </item>
    <item id="E33">
      <name>落合南長崎</name>
      <english>Ochiaiminaminagasaki</english>
      <location>
        <latitude>35.720378</latitude>
        <longitude>139.686517</longitude>
      </location>
      <connection/>
    </item>
    <item id="E34">
      <name>新江古田</name>
      <english>Shinegota</english>
      <location>
        <latitude>35.729309</latitude>
        <longitude>139.673867</longitude>
      </location>
      <connection/>
    </item>
    <item id="E35">
      <name>練馬</name>
      <english>Nerima</english>
      <location>
        <latitude>35.734592</latitude>
        <longitude>139.656778</longitude>
      </location>
      <connection/>
    </item>
    <item id="E36">
      <name>豊島園</name>
      <english>Toshimaen</english>
      <location>
        <latitude>35.738829</latitude>
        <longitude>139.652322</longitude>
      </location>
      <connection/>
    </item>
    <item id="E37">
      <name>練馬春日町</name>
      <english>Nerimakasugacho</english>
      <location>
        <latitude>35.747909</latitude>
        <longitude>139.64427</longitude>
      </location>
      <connection/>
    </item>
    <item id="E38">
      <name>光が丘</name>
      <english>Hikarigaoka</english>
      <location>
        <latitude>35.755301</latitude>
        <longitude>139.631814</longitude>
      </location>
      <connection/>
    </item>
  </line>
  <line id="yamanote" name="山手線" color="068a0f">
    <item id="Ya00">
      <name>東京</name>
      <english>Tokyo</english>
      <location>
        <latitude>35.6825145</latitude>
        <longitude>139.7661485</longitude>
      </location>
      <connection>Ya28,T09</connection>
    </item>
    <item id="Ya01">
      <name>有楽町</name>
      <english>Yurakucho</english>
      <location>
        <latitude>35.675072</latitude>
        <longitude>139.76333</longitude>
      </location>
      <connection>Y18</connection>
    </item>
    <item id="Ya02">
      <name>新橋</name>
      <english>shinbashi</english>
      <location>
        <latitude>35.6661435</latitude>
        <longitude>139.75907</longitude>
      </location>
      <connection>G08</connection>
    </item>
    <item id="Ya03">
      <name>浜松町</name>
      <english>hamamatsucho</english>
      <location>
        <latitude>35.655417</latitude>
        <longitude>139.7570405</longitude>
      </location>
      <connection/>
    </item>
    <item id="Ya04">
      <name>田町</name>
      <english>tamachi</english>
      <location>
        <latitude>35.645719</latitude>
        <longitude>139.746818</longitude>
      </location>
      <connection/>
    </item>
    <item id="Ya05">
      <name>品川</name>
      <english>shinagawa</english>
      <location>
        <latitude>35.6298135</latitude>
        <longitude>139.740837</longitude>
      </location>
      <connection/>
    </item>
    <item id="Ya06">
      <name>大崎</name>
      <english>osaki</english>
      <location>
        <latitude>35.619748</latitude>
        <longitude>139.728609</longitude>
      </location>
      <connection/>
    </item>
    <item id="Ya07">
      <name>五反田</name>
      <english>gotanda</english>
      <location>
        <latitude>35.626804</latitude>
        <longitude>139.723863</longitude>
      </location>
      <connection/>
    </item>
    <item id="Ya08">
      <name>目黒</name>
      <english>Meguro</english>
      <location>
        <latitude>35.634434</latitude>
        <longitude>139.71526</longitude>
      </location>
      <connection>N01</connection>
    </item>
    <item id="Ya09">
      <name>恵比寿</name>
      <english>Ebisu</english>
      <location>
        <latitude>35.6469435</latitude>
        <longitude>139.710418</longitude>
      </location>
      <connection>H02</connection>
    </item>
    <item id="Ya10">
      <name>渋谷</name>
      <english>Shibuya</english>
      <location>
        <latitude>35.6582445</latitude>
        <longitude>139.7000375</longitude>
      </location>
      <connection>Z01,G01,F16</connection>
    </item>
    <item id="Ya11">
      <name>原宿</name>
      <english>harajyuku</english>
      <location>
        <latitude>35.670133</latitude>
        <longitude>139.702599</longitude>
      </location>
      <connection>C03,F15</connection>
    </item>
    <item id="Ya12">
      <name>代々木</name>
      <english>yoyogi</english>
      <location>
        <latitude>35.682524</latitude>
        <longitude>139.7011045</longitude>
      </location>
      <connection/>
    </item>
    <item id="Ya13">
      <name>新宿</name>
      <english>shinjyuku</english>
      <location>
        <latitude>35.6909005</latitude>
        <longitude>139.7001605</longitude>
      </location>
      <connection>M08,E27,Cu10</connection>
    </item>
    <item id="Ya14">
      <name>新大久保</name>
      <english>shinokubo</english>
      <location>
        <latitude>35.701612</latitude>
        <longitude>139.7013185</longitude>
      </location>
      <connection/>
    </item>
    <item id="Ya15">
      <name>高田馬場</name>
      <english>Takadanobaba</english>
      <location>
        <latitude>35.711498</latitude>
        <longitude>139.7041715</longitude>
      </location>
      <connection>T03</connection>
    </item>
    <item id="Ya16">
      <name>目白</name>
      <english>mejiro</english>
      <location>
        <latitude>35.7215935</latitude>
        <longitude>139.7068865</longitude>
      </location>
      <connection/>
    </item>
    <item id="Ya17">
      <name>池袋</name>
      <english>Ikebukuro</english>
      <location>
        <latitude>35.7290265</latitude>
        <longitude>139.7106585</longitude>
      </location>
      <connection>Y09,M25</connection>
    </item>
    <item id="Ya18">
      <name>大塚</name>
      <english>otsuka</english>
      <location>
        <latitude>35.7310095</latitude>
        <longitude>139.7286875</longitude>
      </location>
      <connection/>
    </item>
    <item id="Ya19">
      <name>巣鴨</name>
      <english>sugamo</english>
      <location>
        <latitude>35.733698</latitude>
        <longitude>139.7391555</longitude>
      </location>
      <connection/>
    </item>
    <item id="Ya20">
      <name>駒込</name>
      <english>Komagome</english>
      <location>
        <latitude>35.737347</latitude>
        <longitude>139.74897</longitude>
      </location>
      <connection/>
    </item>
    <item id="Ya21">
      <name>田端</name>
      <english>tabashi</english>
      <location>
        <latitude>35.737712</latitude>
        <longitude>139.760733</longitude>
      </location>
      <connection/>
    </item>
    <item id="Ya22">
      <name>西日暮里</name>
      <english>NishiNippori</english>
      <location>
        <latitude>35.7315435</latitude>
        <longitude>139.7650775</longitude>
      </location>
      <connection>C16</connection>
    </item>
    <item id="Ya23">
      <name>日暮里</name>
      <english>nippori</english>
      <location>
        <latitude>35.7278895</latitude>
        <longitude>139.7713875</longitude>
      </location>
      <connection/>
    </item>
    <item id="Ya24">
      <name>鶯谷</name>
      <english>uguisudani</english>
      <location>
        <latitude>35.7218655</latitude>
        <longitude>139.7784465</longitude>
      </location>
      <connection/>
    </item>
    <item id="Ya25">
      <name>上野</name>
      <english>Ueno</english>
      <location>
        <latitude>35.7143235</latitude>
        <longitude>139.777123</longitude>
      </location>
      <connection>H17,G16</connection>
    </item>
    <item id="Ya26">
      <name>御徒町</name>
      <english>okachimachi</english>
      <location>
        <latitude>35.706892</latitude>
        <longitude>139.7741755</longitude>
      </location>
      <connection/>
    </item>
    <item id="Ya27">
      <name>秋葉原</name>
      <english>Akihabara</english>
      <location>
        <latitude>35.698822</latitude>
        <longitude>139.774292</longitude>
      </location>
      <connection>H15,So01</connection>
    </item>
    <item id="Ya28">
      <name>神田</name>
      <english>Kanda</english>
      <location>
        <latitude>35.692071</latitude>
        <longitude>139.7706875</longitude>
      </location>
      <connection>Ya00,G13,Cu01</connection>
    </item>
    <item id="Ya29">
      <name>東京</name>
      <english>Tokyo</english>
      <location>
        <latitude>35.68251450001</latitude>
        <longitude>139.76614850001</longitude>
      </location>
      <connection>Ya28,T09</connection>
    </item>
  </line>
EOM;

$gzip = $gzip.$more;

$foot = <<< EOM

</stations>
EOM;

#	XML書き出し
$gzip = $gzip.$foot;
echo $gzip;

#	ここからgzip書き出し（バックアップ込み）
if( file_exists('stationlist.xml.gz') )
{
	if( !file_exists('backup') )
	{
		mkdir('backup');
		chmod('backup', 0755);
	}
	rename('stationlist.xml.gz', 'backup/'.date(Y.m.d.H.i.s).'stationlist.xml.gz');
}

$fp = fopen("stationlist.xml.gz", "w");
$gzdata = gzencode( $gzip, 9 );
fwrite($fp, $gzdata);
fclose($fp);

?>
