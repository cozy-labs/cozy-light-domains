var fs = require('fs');
var path = require('path');
var serveStatic = require ('serve-static');


var getConfig = function () {
  var config = module.config;

  if (config.domains === undefined) {
    config.domains = {};
  }

  return config;
};

var configHelpers = {
  addDomain: function (domain, app) {
    var config = getConfig();
    config.domains[domain] = app;
    fs.writeFileSync(
      module.configPath, JSON.stringify(config, null, 2));
  },

  removeDomain: function (domain) {
    var config = getConfig();
    delete config.domains[domain];
    fs.writeFileSync(
      module.configPath, JSON.stringify(config, null, 2));
  }
}


var addDomainToConfig = function (domain, app) {
  configHelpers.addDomain(domain, app);
  console.log(domain + ' configured.');
}


var removeDomainFromConfig = function (domain) {
  configHelpers.removeDomain(domain);
  console.log(domain + ' removed from configuration.');
}


module.exports = {

  configureAppServer: function(app, config, routes, callback) {
    var config = getConfig();
    var home = module.home;

    app.use(function (req, res, next) {
      var domain = req.headers.host;

      if (domain !== undefined) {
        var appName = config.domains[domain];

        if (appName !== undefined) {
          var app = config.apps[appName];

          if (app.type === "static") {
            var appPath = path.join(home, 'node_modules', app.name);
            var serve = serveStatic(
              appPath, {'index': ['index.html', 'index.htm']});

            return serve(req, res, function() {});
          };
        }
      };

      next();
    });
    callback();
  },


  configure = function (options, config, program) {
    module.config = config;
    module.home = options.home;
    module.configPath = options.config_path;

    program
      .command('link-domain <domain> <app>')
      .description('Make a link displaying target app.')
      .action(addDomainToConfig);

    program
      .command('unlink-domain <domain>')
        .description('Link a domain to an app.')
      .action(removeDomainFromConfig);
  }
};
