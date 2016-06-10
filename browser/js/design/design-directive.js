app.directive('designView', function (SockFactory, $state) {
	return {
		restrict: 'E',
		templateUrl: 'js/design/design-view.html',
		// scope: {
		// 	theSock: '='
		// },
		link: function (scope, element, attrs) {
			var title = scope.title;
			var description = scope.description;
			var tags = scope.tags;
			var canvas = element.find('canvas')[0];
			scope.saveDesign = function (title, description, tags) {
				var tagsArr = SockFactory.prepareTags(tags)
				console.log('TAGS:', tagsArr);
				var dataURL = canvas.toDataURL()
				// console.log(description)
				var newSockDataObj = {
					title: title,
					description: description,
					tags: tagsArr,
					image: dataURL
				};
				return SockFactory.saveDesign(newSockDataObj)
				.then(function (result) {
					$state.go('user', {userId: result.data.userId})
				})
			};


			var color = $(".selected").css("background-color");
			var context = $("canvas")[0].getContext("2d");
			var $canvas = $("canvas");
			var lastEvent;
			var mouseDown = false;

			var background = new Image();

			// context.fillStyle = '#f8f8ff';
			// context.opacity = 0;
			// context.fill()

			// function generateSockURL(){
			//   function generateRandomNumber() {
			//     return Math.floor(Math.random() * 3) + 1;
			//   }
			//   var num = generateRandomNumber();

			//   if (num === 1) return '/sock-bg/' + num + '.png'
			//   else return '/sock-bg/' + num + '.jpg';
			// }

			background.src = '/sock-bg/1.png';

			background.onload = function() {
			  context.drawImage(background, 0, 0);
			};

			//When clicking on control list items
			  $(".controls").on("click", "li" , function(){
			     //Deslect sibling elements
			     $(this).siblings().removeClass("selected");
			     //Select clicked element
			     $(this).addClass("selected");
			     //store the color
			     color = $(this).css("background-color");
			  });

			//When "Add Color" button is pressed
			  $("#revealColorSelect").click(function() {
			  //Show color select or hide the color select
			    changeColor();
			  	$("#colorSelect").toggle();
			  });

			//Update the new color span
			function changeColor(){
				var r = $("#red").val();
				var g = $("#green").val();
				var b = $("#blue").val();
				$("#newColor").css("background-color", "rgb(" + r + ", " + g + ", " + b + ")");
			  //When color sliders change


			}

			$("input[type=range]").on("input", changeColor);

			//when "Add Color" is pressed
			$("#addNewColor").click(function(){
			  //append the color to the controls ul
			  var $newColor = $("<li></li>");
			  $newColor.css("background-color", $("#newColor").css("background-color"));
			  $(".controls ul").append($newColor);
			  $(".controls li").siblings().removeClass("selected");
			  $(".controls li").last().addClass("selected");
			  color = $("#newColor").css("background-color");
			  //when added, restore sliders and preview color to default
			  $("#colorSelect").hide();
				var r = $("#red").val(0);
				var g = $("#green").val(0);
				var b = $("#blue").val(0);
				$("#newColor").css("background-color", "rgb(" + r + ", " + g + ", " + b + ")");

			})

			//On mouse events on the canvas
			$canvas.mousedown(function(e){
			  lastEvent = e;
			  mouseDown = true;
			}).mousemove(function(e){
			  //draw lines
			  if (mouseDown){
			    context.beginPath();
			    context.moveTo(lastEvent.offsetX,lastEvent.offsetY);
			    context.lineTo(e.offsetX, e.offsetY);
			    context.strokeStyle = color;
			    context.stroke();
			    context.lineCap = 'round';
			    context.lineWidth = 20;

			    lastEvent = e;
			  }
			}).mouseup(function(){
			    mouseDown = false;
			}).mouseleave(function(){
			    $canvas.mouseup();
			});




			// var sketch = element.find('#sketch');
			// console.log(sketch);
			// var sketchStyle = getComputedStyle(sketch)
		    // canvas.width = parseInt(sketchStyle.getPropertyValue('width'));
		    // canvas.height = parseInt(sketchStyle.getPropertyValue('height'));



	    	// var color = 'black';
		    // scope.changeColor = function (chosenColor) {
		    // 	color = chosenColor;
		    // 	console.log('COLOR', color)
		    // }		    

		    // var ctx = canvas.getContext('2d');

		    // ctx.lineWidth = 20;
		    // ctx.lineJoin = 'round';
		    // ctx.lineCap = 'round';

		    // var currentMousePosition = {
		    //     x: 0,
		    //     y: 0
		    // };

		    // var lastMousePosition = {
		    //     x: 0,
		    //     y: 0
		    // };

		    // var drawing = false;

		    // canvas.addEventListener('mousedown', function (e) {
		    //     drawing = true;
		    //     currentMousePosition.x = e.offsetX;
		    //     currentMousePosition.y = e.offsetY;
		    // });

		    // canvas.addEventListener('mouseup', function () {
		    //     drawing = false;
		    // });

		    // canvas.addEventListener('mousemove', function (e) {
		    //     if (!drawing) return;

		    //     lastMousePosition.x = currentMousePosition.x;
		    //     lastMousePosition.y = currentMousePosition.y;

		    //     currentMousePosition.x = e.offsetX;
		    //     currentMousePosition.y = e.offsetY;

		    //     console.log('POSITION', currentMousePosition)

		    //     draw(lastMousePosition, currentMousePosition, color, true);

		    // });

		    // var draw = function (start, end, strokeColor) {

		    //     // Draw the line between the start and end positions
		    //     // that is colored with the given color.
		    //     ctx.beginPath();
		    //     ctx.strokeStyle = strokeColor || 'black';
		    //     ctx.moveTo(start.x, start.y);
		    //     ctx.lineTo(end.x, end.y);
		    //     ctx.closePath();
		    //     ctx.stroke();

		    // };

		}
	}
})