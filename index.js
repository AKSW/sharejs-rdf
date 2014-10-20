angular.module('rdfshare', [])
  .run(['Namespaces', function(Namespaces) {

    var nsElements = document.querySelectorAll('script[type="x-rdfshare/namespaces"]');

    for (var i = 0; i < nsElements.length; i++) {
      var element = nsElements[i];
      var elementContent = element.innerText;

      Namespaces.registerByText(elementContent);
    }

  }]
);
