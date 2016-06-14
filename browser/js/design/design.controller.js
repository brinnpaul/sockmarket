app.controller('DesignController', function ($scope) {

    // See the Configuring section to configure credentials in the SDK
  AWS.config.update =({accessKey: 'AKIAIIE4D3RS5VQRJ23Q', secretAccessKey:'iJ/1kQCPxXlR6GxWZLoedHHARQsyHwUkJlVa4iU5'});

  // Configure your region
  AWS.config.region = 'us-east-1';
  console.log("JUSTTEXT");

  var bucket = new AWS.S3({params: {Bucket: 'myBucket'}});
  bucket.listObjects(function (err, data) {
    console.log("AMAMAZING", bucket);
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
