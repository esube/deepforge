// DO NOT EDIT THIS FILE
// This file is automatically generated from the webgme-setup-tool.
'use strict';


var config = require('webgme/config/config.default'),
    validateConfig = require('webgme/config/validator');


// The paths can be loaded from the webgme-setup.json
config.plugin.basePaths.push('src/plugins');
config.plugin.basePaths.push('node_modules/webgme-simple-nodes/src/plugins');
config.visualization.layout.basePaths.push('node_modules/webgme-chflayout/src/layouts');
config.visualization.decoratorPaths.push('src/decorators');
config.visualization.decoratorPaths.push('node_modules/webgme-easydag/src/decorators');
config.seedProjects.basePaths.push('src/seeds/nn');
config.seedProjects.basePaths.push('src/seeds/devTests');
config.seedProjects.basePaths.push('src/seeds/devUtilTests');
config.seedProjects.basePaths.push('src/seeds/pipeline');
config.seedProjects.basePaths.push('src/seeds/devPipelineTests');
config.seedProjects.basePaths.push('src/seeds/demo');
config.seedProjects.basePaths.push('src/seeds/project');



config.visualization.panelPaths.push('node_modules/webgme-fab/src/visualizers/panels');
config.visualization.panelPaths.push('node_modules/webgme-breadcrumbheader/src/visualizers/panels');
config.visualization.panelPaths.push('node_modules/webgme-autoviz/src/visualizers/panels');
config.visualization.panelPaths.push('node_modules/webgme-easydag/src/visualizers/panels');
config.visualization.panelPaths.push('src/visualizers/panels');


// Visualizer descriptors
config.visualization.visualizerDescriptors.push('./src/visualizers/Visualizers.json');
// Add requirejs paths
config.requirejsPaths = {
  'EllipseDecorator': 'node_modules/webgme-easydag/src/decorators/EllipseDecorator',
  'EasyDAG': 'panels/EasyDAG/EasyDAGPanel',
  'AutoViz': 'panels/AutoViz/AutoVizPanel',
  'BreadcrumbHeader': 'panels/BreadcrumbHeader/BreadcrumbHeaderPanel',
  'FloatingActionButton': 'panels/FloatingActionButton/FloatingActionButtonPanel',
  'CHFLayout': 'node_modules/webgme-chflayout/src/layouts/CHFLayout',
  'SimpleNodes': 'node_modules/webgme-simple-nodes/src/plugins/SimpleNodes',
  'panels': './src/visualizers/panels',
  'widgets': './src/visualizers/widgets',
  'panels/EasyDAG': './node_modules/webgme-easydag/src/visualizers/panels/EasyDAG',
  'widgets/EasyDAG': './node_modules/webgme-easydag/src/visualizers/widgets/EasyDAG',
  'panels/AutoViz': './node_modules/webgme-autoviz/src/visualizers/panels/AutoViz',
  'widgets/AutoViz': './node_modules/webgme-autoviz/src/visualizers/widgets/AutoViz',
  'panels/BreadcrumbHeader': './node_modules/webgme-breadcrumbheader/src/visualizers/panels/BreadcrumbHeader',
  'widgets/BreadcrumbHeader': './node_modules/webgme-breadcrumbheader/',
  'panels/FloatingActionButton': './node_modules/webgme-fab/src/visualizers/panels/FloatingActionButton',
  'widgets/FloatingActionButton': './node_modules/webgme-fab/src/visualizers/widgets/FloatingActionButton'
};

config.visualization.layout.default = 'CHFLayout';
config.mongo.uri = 'mongodb://127.0.0.1:27017/deepforge';
validateConfig(config);
module.exports = config;
