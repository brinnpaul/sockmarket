app.controller('DesignController', function ($scope) {

  var bucket = new AWS.S3({params: {Bucket: 'myBucket'}});
  bucket.listObjects(function (err, data) {
    if (err) {
      document.getElementById('status').innerHTML =
        'Could not load objects from S3';
    } else {
      document.getElementById('status').innerHTML =
        'Loaded ' + data.Contents.length + ' items from S3';
      for (var i = 0; i < data.Contents.length; i++) {
        document.getElementById('objects').innerHTML +=
          '<li>' + data.Contents[i].Key + '</li>';
      }
    }
  });
  $scope.hi = "hi";

});
