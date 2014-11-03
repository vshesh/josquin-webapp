selecteddata = [0, 0, 1., 1., 1., 1., 1., 1., 0.5, 0.666667, 0.5, 0.5];
originaldata = [0,0,1.,0.5,0,0,0,0,0,0,0.5,0,0,1.,0.5,0,0,0,0,0,1.,0.5,1.,0,0,1.,0,1.,0,0,0,0,1.,0,0,1.,1.,0,0,1.,0,0,1.,0.4,0,0,0.5,0.333333,0,0,0,0,0,1.,0,1.,0,0,0,0,0,1.,0,0,0,0,0,0.5,1.,0,0,1.,0,0,0,1.,0,0.5,0,0,1.,0,0,0,0,0,0,0,0.5,1.,0,0,0,0,0.666667,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.5,0,0,0,0,0,0,0,0,0,0,0,0,0,0.833333,0.8,0,1.,0,1.,0,1.,0,0,0.5,0,0,0,0,0,0,0,0,0,1.,0,0,1.,0,0,0,0.5,0,0,0,0,0.5,0.5,0,0,0,0,0,0,0,0,1.,0,0,0,0,0,0.5,0,0,0,0,0,0.5,0,0.333333,0.333333,0,0,0.333333,0,0,0,1.,0,1.,1.,0,0,0,0.5,0,0,0,0,1.,0,0,0.6,0,0,0.25,0,0,1.,1.,1.,0,1.,0,0,0,0,1.,0,0,0,0,0,1.,1.,0,0,0,0.5,1.,0,0,0,0,0,0,0,0,0,0,0,1.,0,0,0,0,0.5,0,0,0,0,0,0,0,0.5,0,1.,1.,0,0,0.25,0,0,0,0,0,0,0.5,0,1.,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.333333,0,0,0,1.,0,0,1.,0.25,0,0,0,0,0,1.,0,0,0,0,0,0,0,0,1.,0,0,0,0,0,0,0,0,0,0,0,0]

_.mixin({
  average: function(arr) {
    return _.reduce(arr, function(memo, num){ return memo + num; }, 0) / arr.length;
  }
});

angular.module('josquin-dataviz', [])

.factory('selectednodes', function() {
  var nodes = {};
  return {
    toggle: function(nid) {
      var rvalue = true;
      if (nid in nodes) {
        rvalue = false;
        delete nodes[nid];
      } else {
        nodes[nid] = true;
      }
      return rvalue;
    },
    clear: function() {nodes = {};},
    get: function() {return nodes;}
  }
})

.directive('forcegraph', function(selectednodes) {
  return {
    scope: {adjacencylist: "@"},
    link: function(scope, element, attrs) {
      var adjacencies = JSON.parse(scope.adjacencylist);
      var nodes = _.map(d3.range(_.max(_.flatten(adjacencies))), function(e){return {name: e};});

      var links = _.map(adjacencies, function(e){return {source: e[0]-1, target: e[1]-1}; });

      var w = 700,
          h = 700;

      var svg = d3.select(element[0]).append("svg:svg")
        .attr("width", w)
        .attr("height", h);

      var force = d3.layout.force()
        .nodes(nodes)
        .links(links)
        .size([w-30, h-30])
        .charge(-175)
        .start();

      var link = svg.selectAll("line.link")
      .data(links)
      .enter().append("svg:line");

      var node = svg.selectAll("circle.node")
        .data(nodes)
        .enter().append("svg:circle")
        .attr("r", 5)
        .attr("class", 'node');

      force.on("tick", function() {
        link.attr("x1", function(d) { return d.source.x+15; })
        .attr("y1", function(d) { return d.source.y+15; })
        .attr("x2", function(d) { return d.target.x+15; })
        .attr("y2", function(d) { return d.target.y+15; });

        node.attr("cx", function(d) { return d.x+15; })
        .attr("cy", function(d) { return d.y+15; });
      });

      node.on("click", function(d,i) {
        var t = d3.select(this);
        scope.$apply(function() {
          if (selectednodes.toggle(d.name)) {
            t.classed("selected", true);
          } else {
            t.classed("selected", false);
          }
        });
      });

      svg
      .on( "mousedown", function() {
        if( !d3.event.ctrlKey) {
          d3.selectAll( 'g.selected').classed( "selected", false);
        }

        var p = d3.mouse( this);

        svg.append( "rect")
        .attr({
          rx      : 6,
          ry      : 6,
          class   : "selection",
          x       : p[0],
          y       : p[1],
          width   : 0,
          height  : 0
        })
      })
      .on( "mousemove", function() {
        var s = svg.select( "rect.selection");

        if( !s.empty()) {
          var p = d3.mouse( this),
              d = {
                x       : parseInt( s.attr( "x"), 10),
                y       : parseInt( s.attr( "y"), 10),
                width   : parseInt( s.attr( "width"), 10),
                height  : parseInt( s.attr( "height"), 10)
              };

          if(p[0] < d.x) {
            d.width -= d.x-p[0];
            d.x = p[0];
          } else {
            d.width = p[0] - d.x;
          }

          if(p[1] < d.y) {
            d.height = d.y-p[1];
            d.y = p[1];
          } else {
            d.height = p[1] - d.y;
          }

          s.attr(d);
        }
      })
      .on( "mouseup", function() {
        var s = svg.select( "rect.selection")[0][0];
        var box = {x: s.x.animVal.value,
                   y: s.y.animVal.value,
                   width: s.width.animVal.value,
                   height: s.height.animVal.value};

        // remove previous selected objects.
        d3.selectAll('.node.selected').classed('selected', false);
        selectednodes.clear();

        d3.selectAll('.node').each (function(node,i) {
          var x = this.cx.animVal.value,
              y = this.cy.animVal.value;
          if(// inside selection frame
             x>=box.x && x<=box.x+box.width &&
             y>=box.y && y<=box.y+box.height) {

            d3.select(this).classed('selected', true);
            selectednodes.toggle(node.name);
          }
        });
        // remove selection frame
        svg.selectAll( "rect.selection").remove();
        scope.$apply();
      })
      .on( "mouseout", function() {
        // remove selection frame
        svg.selectAll( "rect.selection").remove();
        // remove temporary selection marker class
        d3.selectAll( '.node.selection').classed( "selection", false);
      });
    }
  }
})

.directive('smoothhistogram', function() {
  return {
    link: function(scope, element, attrs) {
      var originaldata = JSON.parse(attrs["originaldata"]),
          selecteddata = JSON.parse(attrs["selecteddata"]);
      var w = 400,
          h = 200,
          x = d3.scale.linear().domain([0, d3.max(selecteddata)*1.5]).range([30, w]),
          y = d3.scale.linear().domain([0, 3]).range([h-20, 0]),
          skde = science.stats.kde().sample(selecteddata),
          okde = science.stats.kde().sample(originaldata);

      var xaxis = d3.svg.axis().scale(x).orient("bottom");
      var yaxis = d3.svg.axis().scale(y).orient("left");

      var svg = d3.select(element[0])
        .append("svg")
        .attr("width", w)
        .attr("height", h);

      svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0,"+(h-20)+")")
        .call(xaxis);

      svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate("+30+",0)")
        .call(yaxis);

      var area = d3.svg.area()
        .x(function(d) { return x(d[0]);})
        .y0(h-20)
        .y1(function(d){ return y(d[1]);});

      var line = d3.svg.line()
        .x(function(d) { return x(d[0]); })
        .y(function(d) { return y(d[1]); });

      var sdist = svg.selectAll("g.skde")
        .data([d3.values(science.stats.bandwidth)[0] ])
        .enter().append("g");

      sdist.append("path").attr("class", "skde")
        .attr("d", function(h) {
           return line(skde.bandwidth(h)(d3.range(0, d3.max(selecteddata)*1.5, .01)));
        });

      sdist.append("path")
        .attr("class", "skde-fillarea")
        .attr("d", function(h) {
          return area(skde.bandwidth(h)(d3.range(0, d3.max(selecteddata)*1.5, .01)));
        });

      var odist = svg.selectAll("g.okde")
        .data([d3.values(science.stats.bandwidth)[0] ])
        .enter().append("g");

      odist.append("path").attr("class", "okde")
        .attr("d", function(h) {
          return line(okde.bandwidth(h)(d3.range(0, d3.max(selecteddata)*1.5, .01)));
        });

      odist.append("path")
        .attr("class", "okde-fillarea")
        .attr("d", function(h) {
          return area(okde.bandwidth(h)(d3.range(0, d3.max(selecteddata)*1.5, .01)));
        });
    }
  }
})
.directive('featurehistogram', function(selectednodes) {
  return {
    link: function(scope, element, attrs, ctrl) {
      scope.$watch(selectednodes.get, function(newVal) {
        console.log(newVal);
        if (newVal === []) return;
        scope.selected = _.flatten(_.values(_.pick(scope.clusters, _.keys(newVal))));
        scope.selectedmeans = _.map(_.rest(_.zip.apply(_, _.values(_.pick(scope.features, scope.selected)))),
                                    function(d) {return _.average(d);});
        scope.meandiffs = _.sortBy(_.map(_.zip(scope.selectedmeans, scope.featuremeans, scope.featurerange),
                                         function(d, i) { return [i, Math.abs(d[0]-d[1])/d[2], d[0], d[1], d[2]];}),
                                   function(d){ return -d[1];});
      }, true);
    },
    template: '<table>' +
      '<tr ng-repeat="f in meandiffs"><td>{{f[0]}}</td>' +
      '<td>{{getname(f[0]+1)}}</td>' +
      '<td>{{f[1]}}</td>' +
      '<td>{{f[2]}}</td>' +
      '<td>{{f[3]}}</td>' +
      '</tr></table>'
  }
})

.controller("DistributionsCtrl", function($scope, $http) {
  $http.get('/data/clusters.json')
    .success(function(data) {
      $scope.clusters = data;
      console.log('loaded clusters');
    })
    .error(function(data, status) {
      console.log(status);
    });

  $http.get('/data/features.csv')
    .success(function(data) {
      var alldata = _.map(_.filter(data.split('\n'), function(s){ return s.length > 0;}), function(e) {
        return _.map(e.split(','), function(d) { return d.trim();});
      });
      $scope.featurenames = alldata[0];
      $scope.features = _.map(alldata.slice(1), function(e) {
        return _.flatten([e[0] ,_.map(e.slice(1), parseFloat)]);
      });
      features = $scope.features;
      $scope.featuresT = _.zip.apply(_, $scope.features);
      var mean_range = _.zip.apply(_, _.map(_.rest($scope.featuresT),
                                   function(a) { return [_.average(a), _.max(a)-_.min(a)];}));

      $scope.featurerange = mean_range[1];
      $scope.featuremeans = mean_range[0];
    });
  $scope.originaldata = originaldata;
  $scope.selecteddata = selecteddata;
  $scope.adjacencies = [[1, 22], [1, 27], [2, 22], [2, 23], [2, 25], [2, 26], [2, 30], [2, 34], [3, 26], [3, 35], [4, 23], [4, 34], [5, 30], [5, 31], [6, 22], [7, 24], [7, 33], [13, 26], [13, 32], [13, 38], [14, 28], [14, 34], [14, 39], [15, 26], [15, 27], [15, 32], [15, 33], [16, 27], [16, 32], [16, 34], [16, 37], [17, 24], [17, 25], [18, 27], [18, 28], [18, 34], [19, 28], [19, 29], [19, 32], [19, 35], [22, 52], [23, 53], [23, 65], [24, 50], [25, 49], [25, 51], [26, 51], [26, 53], [27, 46], [27, 50], [27, 61], [28, 59], [28, 62], [28, 64], [29, 67], [30, 49], [30, 54], [30, 58], [30, 64], [31, 46], [31, 53], [33, 56], [34, 56], [34, 62], [35, 56], [35, 60], [36, 54], [36, 55], [37, 55], [37, 67], [37, 69], [38, 50], [38, 62], [39, 58], [44, 73], [79, 89], [81, 87], [81, 88], [82, 88], [83, 87], [83, 88], [84, 87], [84, 88], [84, 89], [85, 87], [85, 88], [87, 90], [88, 90], [89, 91]];

  $scope.getname = function(id) { return $scope.featurenames[id];};

});









