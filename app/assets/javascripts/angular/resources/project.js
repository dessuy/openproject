timelinesApp.factory('Project', ['$resource', '$q', 'APIDefaults', function($resource, $q, APIDefaults) {

  Project = $resource(
    APIDefaults.apiPrefix + '/projects/:id.json',
    {id: '@projectId'},
    {
      get: {
        // Explicit specification needed because of API reponse format
        method: 'GET',
        transformResponse: function(data) {
          return new Project(angular.fromJson(data).project);
        }
      },
      query: {
        method: 'GET',
        isArray: true,
        transformResponse: function(data) {
          // Angular resource expects a json array and would return json
          // Work around as the API does not return an array.
          wrapped = angular.fromJson(data);
          angular.forEach(wrapped.projects, function(item, idx) {
            // transform JSON into resource object
            wrapped.projects[idx] = new Project(item);
          });
          return wrapped.projects;
        }
      }
    });

  // Query that returns a promise instead of an array
  Project.getQueryPromise = function(params) {
    deferred = $q.defer();

    Project.query(params, function(projects){
      deferred.resolve(projects);
    });

    return deferred.promise;
  };

  // Query returning an array extended with a promise yielding results
  Project.getCollection = function(params) {
    queryResults = [];

    queryPromise = Project.getQueryPromise(params);
    angular.extend(queryResults, {promise: queryPromise});

    queryPromise.then(function(results){
      angular.forEach(results, function(child){
        queryResults.push(child);
      });
    });

    return queryResults;
  };

  Project.prototype.getReportingsPromise = function() {
    if(this.reportings) {
      return $q.when(this.reportings);
    }

    self = this;

    return this.$promise
      .then(function(project){
        return Reporting.getQueryPromise({projectId: project.identifier, only_via: 'target'});
      })
      .then(function(reportings) {
        // Memoization callback
        self.reportings = reportings;
        return reportings;
      });
  };

  Project.prototype.getReportingProjectsPromise = function() {
    if(this.reportingProjects) {
      return $q.when(this.reportingProjects);
    } else {
      self = this;

      return this.getReportingsPromise()
        .then(function(reportings) {
          reportingProjects = reportings.map(function(reporting){
            return reporting.getProjectResource();
          });
          self.reportingProjects = reportingProjects; // Memoize reporting projects
          return reportingProjects;
        });
      }
  };

  Project.prototype.getSelfAndReportingProjectsPromise = function () {
    self = this;

    return this.getReportingProjectsPromise()
      .then(function(reportingProjects){
        return reportingProjects.concat([self]);
      });
  };

  Project.prototype.getRelatedProjectIdsPromise = function () {
    projectIds = [this.id];

    return this.getReportingsPromise()
      .then(function(reportings){
        angular.forEach(reportings, function(reporting){
          projectIds.push(reporting.getProjectId());
        });
        return projectIds;
      });
  };

  Project.prototype.getAllPlanningElementsPromise = function () {
    return this.getRelatedProjectIdsPromise()
      .then(function(projectIds){
        ids = projectIds.join(',');
        return PlanningElement.getQueryPromise({projectId: ids});
      });
  };

  // TODO Fix
  Project.prototype.getSelfAndReportingProjects = function () {
    selfAndReportingProjects = [];

    this.getSelfAndReportingProjectsPromise()
      .then(function(projects){
        angular.forEach(projects, function(project) {
          selfAndReportingProjects.push(project);
        });
      });

    return selfAndReportingProjects;
  };

  Project.prototype.getParent = function() {
    if(!this.parent) return null;

    if(!this.parentProject) {
      this.parentProject = Project.get({id: this.parent.id});
    }
    return this.parentProject;
  };

  Project.prototype.getChildren = function() {
    if (this.children === undefined) {
      this.children = Project.getCollection({parent_id: this.id});
    }
    return this.children;
  };

  Project.prototype.getReportings = function () {
    if (this.reportings) return this.reportings;

    reportings = [];

    this.getReportingsPromise().then(function(results){
      angular.forEach(results, function(result){
        reportings.push(result);
      });
    });

    return reportings;
  };



  return Project;
}]);
