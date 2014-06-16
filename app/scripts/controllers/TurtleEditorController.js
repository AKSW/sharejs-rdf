angular.module('app').controller('TurtleEditorController',
                                ['$scope', 'AlertService', function($scope, AlertService) {

  var editor;

  // Properties:

  $scope.serverUrl = 'http://localhost:4000/channel#test';
  $scope.turtleContents = '';

  $scope.editorOptions = {
    lineNumbers: true
  };


  // Methods:

  $scope.codemirrorLoaded = function(_editor) {
    editor = _editor;
  };

  $scope.connect = function() {
    var serverUrl = $scope.serverUrl.split('#')[0];
    var docName = $scope.serverUrl.split('#')[1];

    if (!docName) {
      return AlertService.danger('No document name given. Append to server URL as "#<doc name>".');
    }

    var options = {
      // authentication: '1234567',
      origin: serverUrl
    };

    sharejs.open(docName, 'text', options, function(error, doc) {
      if (error) {
        return AlertService.danger(error);
      }

      doc.attach_cm(editor);
    });
  };

}]);
