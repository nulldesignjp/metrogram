

		//	スプライン曲線の中心処理
		function SplineCurve(p, interpolate)
		{
			var num = p.length;
			var l = [];
			var _A = [];
			var _B = [];
			var _C = [];

			for (i=0; i < num-1; i++) {
				var p0 = p[i];
				var p1 = p[i+1];
				l[i] = Math.sqrt((p0.x - p1.x) * (p0.x - p1.x) + (p0.y - p1.y) * (p0.y - p1.y));
			}

			_A[0] = [0, 1, 0.5];
			_B[0] = {
				x:(3 / (2 * l[0])) * (p[1].x - p[0].x),
				y:(3 / (2 * l[0])) * (p[1].y - p[0].y)
			};
			_A[num-1] = [1, 2, 0];
			_B[num-1] = {
				x:(3 / l[num - 2]) * (p[num - 1].x - p[num - 2].x),
				y:(3 / l[num - 2]) * (p[num - 1].y - p[num - 2].y)
			};

			for (i=1; i < num-1; i++) {
				var a = l[i-1];
				var b = l[i];
				_A[i] = [b, 2.0 * (b + a), a];
				_B[i] = {
					x:(3.0 * (a * a * (p[i + 1].x - p[i].x)) + 3.0 * b * b * (p[i].x - p[i - 1].x)) / (b * a),
					y:(3.0 * (a * a * (p[i + 1].y - p[i].y)) + 3.0 * b * b * (p[i].y - p[i - 1].y)) / (b * a)
				};
			}
			for (i=1; i < num; i++) {
				var d = _A[i-1][1] / _A[i][0];

				_A[i] = [0, _A[i][1]*d-_A[i-1][2], _A[i][2]*d];
				_B[i].x = _B[i].x * d - _B[i - 1].x;
				_B[i].y = _B[i].y * d - _B[i - 1].y;

				_A[i][2] /= _A[i][1];
				_B[i].x /= _A[i][1];
				_B[i].y /= _A[i][1];
				_A[i][1] = 1;
			}

			_C[num-1] = {x:_B[num-1].x, y:_B[num-1].y};
			for (j=num-1; j > 0; j--) {
				_C[j-1] = {
					x:_B[j - 1].x-_A[j - 1][2] * _C[j].x,
					y:_B[j - 1].y-_A[j - 1][2] * _C[j].y
				};
			}

			var out = [];
			count = 0;
			for (i=0; i < num-1; i++) {
				var a = l[i];
				var _00 = p[i].x;
				var _01 = _C[i].x;
				var _02 = (p[i + 1].x - p[i].x) * 3 / (a * a) - (_C[i + 1].x + 2 * _C[i].x) / a;
				var _03 = (p[i + 1].x - p[i].x) * (-2/(a * a * a)) + (_C[i + 1].x + _C[i].x) * (1 / (a * a));
				var _10 = p[i].y;
				var _11 = _C[i].y;
				var _12 = (p[i + 1].y - p[i].y) * 3 / (a * a) - (_C[i + 1].y + 2 * _C[i].y) / a;
				var _13 = (p[i + 1].y - p[i].y) * (-2/(a * a * a)) + (_C[i + 1].y + _C[i].y) * (1 / (a * a));

				var t = 0;
				for (j=0; j < interpolate; j++) {
					out[count] = {
						x:((_03 * t + _02) * t + _01) * t + _00,
						y:((_13 * t + _12) * t + _11) * t + _10
					};
					count++;
					t += a / interpolate;
				}
			}
			out[count] = {
				x:p[num-1].x,
				y:p[num-1].y
			};

			return out;
		}