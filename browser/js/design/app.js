// $(function() {

// console.log($("canvas"));

// var color = $(".selected").css("background-color");
// var context = $("canvas")[0].getContext("2d");
// var $canvas = $("canvas");
// var lastEvent;
// var mouseDown = false;

// var background = new Image();

// function generateSockURL(){
//   function generateRandomNumber() {
//     return Math.floor(Math.random() * 3) + 1;
//   }
//   return './js/sock-bg/' + generateRandomNumber() + '.png';
// }

// background.src = generateSockURL();

// background.onload = function() {
//   context.drawImage(background, 0, 0);
// };

// //When clicking on control list items
//   $(".controls").on("click", "li" , function(){
//      //Deslect sibling elements
//      $(this).siblings().removeClass("selected");
//      //Select clicked element
//      $(this).addClass("selected");
//      //store the color
//      color = $(this).css("background-color");
//   });

// //When "Add Color" button is pressed
//   $("#revealColorSelect").click(function() {
//   //Show color select or hide the color select
//     changeColor();
//   	$("#colorSelect").toggle();
//   });

// //Update the new color span
// function changeColor(){
// 	var r = $("#red").val();
// 	var g = $("#green").val();
// 	var b = $("#blue").val();
// 	$("#newColor").css("background-color", "rgb(" + r + ", " + g + ", " + b + ")");
//   //When color sliders change


// }

// $("input[type=range]").on("input", changeColor);

// //when "Add Color" is pressed
// $("#addNewColor").click(function(){
//   //append the color to the controls ul
//   var $newColor = $("<li></li>");
//   $newColor.css("background-color", $("#newColor").css("background-color"));
//   $(".controls ul").append($newColor);
//   $(".controls li").siblings().removeClass("selected");
//   $(".controls li").last().addClass("selected");
//   color = $("#newColor").css("background-color");
//   //when added, restore sliders and preview color to default
//   $("#colorSelect").hide();
// 	var r = $("#red").val(0);
// 	var g = $("#green").val(0);
// 	var b = $("#blue").val(0);
// 	$("#newColor").css("background-color", "rgb(" + r + ", " + g + ", " + b + ")");

// })

// //On mouse events on the canvas
// $canvas.mousedown(function(e){
//   lastEvent = e;
//   mouseDown = true;
// }).mousemove(function(e){
//   //draw lines
//   if (mouseDown){
//     context.beginPath();
//     context.moveTo(lastEvent.offsetX,lastEvent.offsetY);
//     context.lineTo(e.offsetX, e.offsetY);
//     context.strokeStyle = color;
//     context.stroke();
//     context.lineCap = 'round';
//     context.lineWidth = 20;

//     lastEvent = e;
//   }
// }).mouseup(function(){
//     mouseDown = false;
// }).mouseleave(function(){
//     $canvas.mouseup();
// });

// })


