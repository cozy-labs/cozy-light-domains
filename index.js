var fs = require('fs');
var path = require('path');
var serveStatic = require('serve-static');


/*
 * Returns proper config file to handle domain attributes.
 */
var getConfig = function () {
  var config = module.config;

  if (config.domains === undefined) {
    config.domains = {};
  }

  return config;
};


var configHelpers = {

  /*
   * Add a key/value domain/appName to the domains config attribute.
   * @param domain The domain to link.
   * @param app The app to link to given domain.
   */
  addDomain: function (domain, app) {
    var config = getConfig();
    config.domains[domain] = app;
    fs.writeFileSync(
      module.configPath, JSON.stringify(config, null, 2));
  },

  /*
   * Remove a key/value domain/appName to the domains config attribute.
   * @param domain The domain to unlink.
   */
  removeDomain: function (domain) {
    var config = getConfig();
    delete config.domains[domain];
    fs.writeFileSync(
      module.configPath, JSON.stringify(config, null, 2));
  }
}



var commands = {
  /*
   * Add a key/value domain/appName to the domains attribute of the config
   * file.
   * @param domain The domain to link.
   * @param app The app to link to given domain.
   */
  addDomainToConfig: function (domain, app) {
    configHelpers.addDomain(domain, app);
    console.log(domain + ' configured.');
  },


  /*
   * Remove a key/value domain/appName to the domains attribute of the config
   * file.
   * @params domain The domain to unlink.
   */
  removeDomainFromConfig: function (domain) {
    configHelpers.removeDomain(domain);
    console.log(domain + ' removed from configuration.');
  }
};


module.exports = {

  // Serve static pages from a HTML5 app when the domain is link to that HTML5
  // app.
  configureAppServer: function(app, config, routes, callback) {
    var config = getConfig();
    var home = module.home;

    app.use(function (req, res, next) {
      isHandled = false;
      var domain = req.headers.host;

      if (domain !== undefined) {
        var appName = config.domains[domain];

        if (appName !== undefined) {
          var app = config.apps[appName];

          isHandled = true;
          if (app.type === "static") {
            var appPath = path.join(home, 'node_modules', app.name);
            var serve = serveStatic(
              appPath, {'index': ['index.html', 'index.htm']});

            serve(req, res, function() {});
          } else {
            var appName = app.name;
            var port = routes[appName];
            if (port !== null) {
              module.proxy.web(req, res, { target: "http://localhost:" + port });
            } else {
              res.send(404);
            }
          };
        }
      };

      if (!isHandled) {
        next();
      };
    });
    callback();
  },

  // Set commands on the Cozy Light program.
  configure: function (options, config, program) {
    module.config = config;
    module.home = options.home;
    module.configPath = options.config_path;
    module.proxy = options.proxy;

    program
      .command('link-domain <domain> <app>')
      .description('Link given domain to given app. Access to Cozy Light '
                   + 'through this domain will lead directly to the app. ')
      .action(commands.addDomainToConfig);

    program
      .command('unlink-domain <domain>')
      .description('Remove the link between a domain and an app.')
      .action(commands.removeDomainFromConfig);
  }
};
