$(document).ready(function(){
    
    var dataSource = [  {'key': '1', 'value': 'Menu Item', 'color' : '#EE4266'},
                        {'key': '2', 'value': 'Menu Item', 'color': '#29335C'},
                        {'key': '3', 'value': 'Menu Item', 'color': '#F3A712'},
                        {'key': '4', 'value': 'Menu Item', 'color': '#3CBBB1'}
                     ];
    var pie = new Pie.Menu('popUp', dataSource); 
    pie.showMenu(event);                
});

(function (Pie) {

	//-----------------------------------------
	//	Holds the TEXT data that will be used during drawing on ARC
	//-----------------------------------------

    var arcText = (function () {
        function arcText(x,y, value, angle) {
            this.x = x; //Text position in X Axis
            this.y = y; //Text position in Y Axis
            this.value = value; //The character to be displayed
            this.angle = angle; //The angle at, the character has to be drawn
        }

        return arcText;
    })();

    Pie.ArcText = arcText;
	
	//-----------------------------------------
	//	Holds the ARC data that will be used during drawing to the canvas
	//-----------------------------------------
    var arc = (function () {        
        function arc(sAngle, eAngle, id, color) {
            this.sAngle = sAngle; //Start Angle in Radians
            this.eAngle = eAngle; //End Angle in Radians
            this.dataSourceId = id; //Id of the datasource passed to the menu.
            this.color = color; //Background color of the Arc
            this.arcText = []; //Array of Characters
            this.isSelected = false; //Is selected flag, not leveraging currently
        }
        return arc;
    })();
    Pie.Arc = arc;

    	//-----------------------------------------
	//	Holds the Menu Object
	//----------------------------------------- 
    var menu = (function () {

	//-----------------------------------------
	//	Menu constructor
	//	Also registers click and move events.
	//----------------------------------------- 
        function menu(canvasContainer, dataSource) {
            this.canvasContainer = canvasContainer;
            this.dataSource = dataSource;
            this.isMultiTrack = false;
            this.arcs = [];
            this.width = 0;
            this.height = 0;
            this.radius = 0;
            this.thickness = 50;
            this.isOpen = false;
            this.center = 0;
            this.canTriggerMouseOver = false;
            var pie = this;
            var canvas = $('#' + this.canvasContainer + ' canvas')[0];//document.getElementById(this.canvasElement);
            canvas.addEventListener('click', function (event) {
                var pos = findPos(this);
                var x = event.pageX - pos.x;
                var y = event.pageY - pos.y;
                var vX = x - pie.center;
                var vY = y - pie.center;
                var tR = Math.sqrt(vX * vX + vY * vY) //r * r = x * x + y * y
                if (tR >= 60 - pie.thickness / 2 && tR <= 60 + pie.thickness / 2) {
                    var degRad = Math.atan2(vY, vX); //Convert point to angle
                    if (degRad < 0) {
                        degRad = 2 * Math.PI + degRad;
                    }
                    for (var i = 0; i < pie.arcs.length; i++) {
                        var arc = pie.arcs[i];
                        var tmpStartRad = arc.sAngle;
                        var tmpEndRad = arc.eAngle;
                        if (tmpStartRad < 0)
                            tmpStartRad = 2 * Math.PI + tmpStartRad;
                        if (tmpEndRad < 0)
                            tmpEndRad = 2 * Math.PI + tmpEndRad;
                        if (degRad >= tmpStartRad && degRad <= tmpEndRad) {
                            pie.callback(pie.dataSource[i]);
                            break;
                        }
                    }
                }

            });

            canvas.addEventListener('mousemove', function (event) {
                if (pie.canTriggerMouseOver) {
                    var pos = findPos(this);
                    var x = event.pageX - pos.x;
                    var y = event.pageY - pos.y;
                    var vX;
                    var vY;
                    vX = x - pie.center;
                    vY = y - pie.center;
                    var tR = Math.sqrt(vX * vX + vY * vY)
                    var canvas = $('#popUp' + ' canvas')[0];
                    if (tR >= 120 - pie.thickness / 2 && tR <= 120 + pie.thickness / 2) {
                        canvas.style.cursor = "pointer";
                    } else {
                        canvas.style.cursor = "default";
                    }
                }
            });
        }

        menu.prototype.showMenu = function () {
            if (this.isOpen === true) {
                var popCtl = $('#popUp');
                popCtl.css('display', 'none');
                this.isOpen = !this.isOpen;
            } else {
                this.isOpen = !this.isOpen;
                var popCtl = $('#popUp');
                popCtl.css('display', 'block');
                var elem = $('#showRound');
                var position = elem.position();
                popCtl.css("top", position.top);
                popCtl.css("left", position.left + elem.width());
                this.measure();
                this.draw();
            }
        };

	//-----------------------------
	// This function accepts function pointer and holds in a variable that will be executed during click
	//------------------------------	
        menu.prototype.click = function (f) {
            this.callback = f;
        }

	//-----------------------------
	// For more details http://blog.stannard.net.au/2010/05/22/find-the-position-of-an-element-with-javascript/
	//------------------------------
        function findPos(obj) {
            var curleft = 0, curtop = 0;
            if (obj.offsetParent) {
                do {
                    curleft += obj.offsetLeft;
                    curtop += obj.offsetTop;
                } while (obj = obj.offsetParent);
                return { x: curleft, y: curtop };
            }
            return undefined;
        }


	//-----------------------------------------
	//	This helper function does 
	//		1) convert given text to array of characters
	//		2) Find position of each character
	//		3) Find the Angle at which the character has to be drawn relative to arc.
	//----------------------------------------- 
       function generateArcText(sAngleDeg, eAngleDeg, value, radius, trackThickness, center) {
            var strArr = value.split('').reverse();
            var charAngle = 5;
            var angleDeg = (eAngleDeg - sAngleDeg - strArr.length * charAngle) / 2;
            var archTextArr = [];
            for (var i = 0; i < strArr.length; i++) {
                // var angleRad = (sAngleDeg + angleDeg * i )* Math.PI / 180;
                var angleRad = (sAngleDeg + angleDeg ) * Math.PI / 180;
                var x = center + Math.cos(angleRad) * (radius );
                var y = center + Math.sin(angleRad) * (radius );
                var arcText = new Pie.ArcText(x, y, strArr[i], 180 - 90 - (sAngleDeg + angleDeg));
                archTextArr.push(arcText);
                angleDeg += charAngle;
            }
            return archTextArr;
        }

	//--------------------------------------------------------------
	// This function does the required calculations that will be leveraged during drawing.
	//	1) Find number of arcs to be drawn based on datasource.
	//	2) Find position of arcs
	//	3) Find positions of Text on Arc
	//--------------------------------------------------------------
        menu.prototype.measure = function () {
            var c = canvas = $('#popUp' + ' canvas')[0];
            this.width = c.width;
            this.height = this.width;
            this.radius = this.width / 2.5;
            var t = this.thickness;
            this.center = this.width / 2;
            var r = this.radius;
            
            var count = this.dataSource.length;
            
            var angle = 360 / count; //Each arc Angle
            for (var i = 0 ; i < count; i++) {
                var dSource = this.dataSource[i];
                var sAngleDeg = angle * i; //Angle of Arc's starting point in Deg
                var eAngleDeg = angle * (i + 1); //Angle of Arcs's end point in Deg
                var sAngleRad = sAngleDeg * Math.PI / 180; //Angle of Arc's starting point in Radian
                var endAngleRad = eAngleDeg * Math.PI / 180; //Angle of Arcs's end point in Radian
                var tArc = new Pie.Arc(sAngleRad, endAngleRad, dSource.key, dSource.color);
                tArc.arcText = generateArcText(sAngleDeg, eAngleDeg+20, dSource.value, this.radius, this.thickness, this.width / 2);
                this.arcs.push(tArc);
                
            }
            this.canTriggerMouseOver = true;
        }

	//--------------------------------------------------------------
	// This function does drawing of Text on Arc
	//--------------------------------------------------------------
        function drawText(ctx, arc) {
            var arcTextArr = arc.arcText;
            ctx.font = "14px 'Trebuchet MS'";
            ctx.fillStyle = "black";
            for (var i = 0; i < arcTextArr.length ; i++) {
                ctx.save();
                var tmArcText = arcTextArr[i];
                ctx.translate(tmArcText.x, tmArcText.y);
                ctx.rotate(-tmArcText.angle * Math.PI / 180);
               
                ctx.fillText(tmArcText.value, 0, 3);
                ctx.restore();
            }
        };

	//--------------------------------------------------------------
	// This function does drawing of Arc on Canvas
	//--------------------------------------------------------------
        menu.prototype.draw = function () {
            var canvas = $('#popUp' + ' canvas')[0];
            var ctx = canvas.getContext('2d');
            for (var i = 0; i < this.arcs.length; i++) {
                var tArc = this.arcs[i];
                ctx.beginPath();
                ctx.arc(this.width / 2, this.height / 2, this.radius, tArc.sAngle, tArc.eAngle);
                if (tArc.isSelected) {
                    ctx.lineWidth = this.thickness + 5;
                } else {
                    ctx.lineWidth = this.thickness;
                }
                ctx.strokeStyle = tArc.color;
                ctx.stroke();
                ctx.closePath();
                drawText(ctx, tArc);
               
            }
            
        };
        return menu;
    })();
    Pie.Menu = menu;
})(window.Pie || (window.Pie = {}));
