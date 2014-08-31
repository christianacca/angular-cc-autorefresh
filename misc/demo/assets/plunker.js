angular.module('plunker', [])

  .factory('plunkGenerator', function ($document) {

    return function (ngVersion, bsVersion, version, module, content) {

      var form = angular.element('<form style="display: none;" method="post" action="http://plnkr.co/edit/?p=preview" target="_blank"></form>');
      var addField = function (name, value) {
        var input = angular.element('<input type="hidden" name="' + name + '">');
        input.attr('value', value);
        form.append(input);
      };

      var indexContent = function (content, version) {
        return '<!doctype html>\n' +
          '<html ng-app="<%=meta.ns%>.demo">\n' +
          '  <head>\n' +
          '    <script src="//ajax.googleapis.com/ajax/libs/angularjs/'+ngVersion+'/angular.js"></script>\n' +
          '    <script src="//ajax.googleapis.com/ajax/libs/angularjs/'+ngVersion+'/angular-mocks.js"></script>\n' +
          '    <script src="//christianacca.github.io/angular-cc-autorefresh/<%=filename%>-tpls-'+version+'.js"></script>\n' +
          '    <script src="example.js"></script>\n' +
          '    <script src="exampleBootstrap.js"></script>\n' +
          '    <link href="//netdna.bootstrapcdn.com/bootstrap/'+bsVersion+'/css/bootstrap.min.css" rel="stylesheet">\n' +
          '  </head>\n' +
          '  <body>\n\n' +
          content + '\n' +
          '  </body>\n' +
          '</html>\n';
      };

      var exampleJs = function(content) {
        return "angular.module('<%=meta.ns%>.demo', ['<%=meta.ns%>', 'ngMockE2E']);" + "\n" + content;
      };

      addField('description', 'http://christianacca.github.io/<%=pkg.name%>/');
      addField('files[index.html]', indexContent(content.markup, version));
      addField('files[example.js]', exampleJs(content.javascript));
      addField('files[exampleBootstrap.js]', content.bootstrapjs);

      $document.find('body').append(form);
      form[0].submit();
      form.remove();
    };
  })

  .controller('PlunkerCtrl', function ($scope, plunkGenerator) {

    $scope.content = {};

    $scope.edit = function (ngVersion, bsVersion, version, module) {
      plunkGenerator(ngVersion, bsVersion, version, module, $scope.content);
    };
  })

  .directive('plunkerContent', function () {
    return {
      link:function (scope, element, attrs) {
        scope.content[attrs.plunkerContent] = element.text().trim();
      }
    }
  });
