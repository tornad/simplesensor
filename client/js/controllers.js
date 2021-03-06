'use strict';

angular.module('controllers', [])

  .controller('CountCtrl', function (Sensor, socket, $scope, $timeout) {

      $scope.count = [];
      $scope.count['OK'] = 0;
      $scope.count['NOK'] = 0;
      $scope.count['Missing'] = 0;

      $scope.showEvents = false;
      $scope.newEvents = "";

      function countStatus (status) {

        Sensor.count({where: {status: status}}).$promise.then(function (data) {
          $scope.count[status] = data.count;
        });
      }

      socket.on('newEvent', function (object) {

        $scope.highDate = new Date(object[0].loggedAt).getTime();
        $scope.eventTime = Date.now();
        $scope.newEvents = object.length + " new events since ";
        $scope.showEvents = true;

        countStatus("OK");
        countStatus("NOK");
        countStatus("Missing");

        $timeout(function (){
          $scope.showEvents = false;
          $scope.newEvents = "";
          }
          , 10000
        );
      });

      countStatus("OK");
      countStatus("NOK");
      countStatus("Missing");

  })

  .controller('ListCtrl', function (Sensor, $scope, $filter){

      $scope.sensors = [];
      $scope.filteredItems = [];

      var counter = 0;
      var anyMore = true;

      $scope.moreSensors = function(){

        $scope.loading = true;

        Sensor.find({
          filter: {
            limit: 50
            , offset: counter
            , order: 'status ASC'
          }
        }).$promise.then(function (data){

            for (var i = 0; i < data.length; i++) {
              $scope.sensors.push(data[i]);
            }
            $scope.loading = false;
            counter += 50;
        });
        if (counter > $scope.sensors.length) {
          anyMore = false;
        }
      };

      if (anyMore) {
        $scope.moreSensors();
      }

      var searchMatch = function (haystack, needle) {
        if (!needle) {
          return true;
        }
        return haystack.toLowerCase().indexOf(needle.toLowerCase()) !== -1;
      };

      $scope.search = function () {
        $scope.filteredItems = $filter('filter')($scope.filteredItems, function (item) {
          for(var attr in item) {
            if (searchMatch(item[attr], $scope.searchText)) {
              return true;
            }
          }
          return false;
        });
        $scope.sensors = $scope.filteredItems;
      };
    })

  .controller('EditCtrl', function (Sensor, $stateParams, $scope) {
      var that = this;
      Sensor.findById({id: $stateParams.id}
        , function (data) {
          that.sensor = data;
        });
      $scope.SaveMod = function () {
        that.sensor.modifiedAt = Date.now();
        that.sensor.$save();
      };
    })

  .controller('DelCtrl', function (Sensor, $stateParams, $scope, $location) {

      var that = this;

      Sensor.findById({id: $stateParams.id}
        , function (data) {

        that.sensor = data;
      });

      $scope.deleteSensor = function () {

        that.sensor.$delete(null, $location.path('/list'));
      };
    })

  .controller('AddCtrl', function (Sensor, $scope, $location) {

      $scope.newSensor = function(){

        Sensor.create($scope.sensor, function () {
          $location.path('/list');
        });
      };
    })

  .controller('EventCtrl', function (Event, $timeout, $scope, $stateParams, socket){

      $scope.events = [];
      var counter = 0;
      var needMore = true;

      socket.on('newEvent', function (array){

        var tab = array.map(function (elm) {
          return elm.id;
        });

        Event.find({
          filter: {
            include: 'sensor'
            , where: {id: {inq: tab}}
            , order: 'loggedAt DESC'
          }
        }).$promise.then(function (obj) {

          obj.map(function (value) {
            value.isNew = true;
            return value;
          });

          $scope.events = obj.concat($scope.events);
          console.log($scope.events);
          $timeout(function () {
              obj.map(function (value){
                value.isNew = false;
              });
            }
            , 20000
          );
        });

      });

      $scope.moreEvents = function(){

        $scope.loading = true;

        Event.find({
          filter: {
            include: 'sensor'
            , limit: 50
            , offset: counter
            , order: 'loggedAt DESC'
          }
        }).$promise.then(function (data){

            for (var i = 0; i < data.length; i++) {
              $scope.events.push(data[i]);

              if (new Date($scope.events[i].loggedAt).getTime() >= +$stateParams.date && $stateParams.date !== null) {
                $scope.events[i].isNew = true;

                $timeout(function () {
                  $scope.events[i].isNew = false;
                  }
                  ,20000
                );
              }
            }
            $scope.loading = false;
            counter += 50;
        });
        if (counter > $scope.events.length) {
          needMore = false;
        }
      };
      if (needMore) {
        $scope.moreEvents();
      }
  });
