app.directive('designView', function (SockFactory, $state, $http) {
	return {
		restrict: 'E',
		templateUrl: 'js/design/design-view.html',
		link: function (scope, element, attrs, designViewCtrl) {

			var title = scope.title;
			var description = scope.description;
			var tags = scope.tags;
			var canvas = element.find('canvas')[0];
			var displayError = false;

			scope.preventSubmission = function (){
				return displayError;
			}

			var invalidSubmission = function(title, description, tags) {
				if (title === undefined) {
					displayError = true;
					scope.errorMessage = "Your socks need a title!";
					return true;
				} else if (description === undefined) {
					displayError = true;
					scope.errorMessage = "Your socks need a description!";
					return true;
				} else if (tags === undefined) {
					displayError = true;
					scope.errorMessage = "Your socks need some tags!";
					return true;
				}
			}

			scope.saveDesign = function (title, description, tags) {

				if (invalidSubmission(title, description, tags)) {
					return invalidSubmission(title, description, tags);
				}

				var tagsArr = SockFactory.prepareTags(tags);

        var newSockDataObj = {
          title: title,
          description: description,
          tags: tagsArr
        };

        // return SockFactory.saveDesign(newSockDataObj)
        // .then(function(result) {
        // 	$state.go('user', {userId: result.data.userId})
        // })

        function dataURItoBlob(dataURI) {
          var binary = atob(dataURI.split(',')[1]);
          var array = [];
          for(var i = 0; i < binary.length; i++) {
            array.push(binary.charCodeAt(i));
          }
          return new Blob([new Uint8Array(array)], {type: 'image/png'});
        }

        var dataUrl = canvas.toDataURL("image/png");
        var blobData = dataURItoBlob(dataUrl);

        SockFactory.getUnsignedURL()
          .then(function(res){
            var imageUrl = res.url.split('?')[0];

            $http.put(res.url, blobData,
              {headers: {
              'Content-Type': 'image/png',
                Key : 'ani_ben.png'
            }})
              .then(function(res){
                newSockDataObj.image = imageUrl;
                SockFactory.saveDesign(newSockDataObj)
                .then(function (result) {
                  $state.go('user', {userId: result.data.userId})
                })
              })
          })
			 };


			var color = $(".selected").css("background-color");
			var context = $("canvas")[0].getContext("2d");
			var $canvas = $("canvas");
			var lastEvent;
			var mouseDown = false;

			var background = new Image();

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


		}
	}
})
