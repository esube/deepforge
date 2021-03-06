/*jshint node:true, mocha:true*/

'use strict';
var testFixture = require('../../globals');

describe('ExecuteJob', function () {
    var gmeConfig = testFixture.getGmeConfig(),
        expect = testFixture.expect,
        logger = testFixture.logger.fork('ExecuteJob'),
        PluginCliManager = testFixture.WebGME.PluginCliManager,
        projectName = 'testProject',
        pluginName = 'ExecuteJob',
        manager = new PluginCliManager(null, logger, gmeConfig),
        project,
        gmeAuth,
        storage,
        commitHash;

    before(function (done) {
        this.timeout(10000);
        testFixture.clearDBAndGetGMEAuth(gmeConfig, projectName)
            .then(function (gmeAuth_) {
                gmeAuth = gmeAuth_;
                // This uses in memory storage. Use testFixture.getMongoStorage to persist test to database.
                storage = testFixture.getMemoryStorage(logger, gmeConfig, gmeAuth);
                return storage.openDatabase();
            })
            .then(function () {
                var importParam = {
                    projectSeed: testFixture.path.join(testFixture.DF_SEED_DIR, 'devProject', 'devProject.webgmex'),
                    projectName: projectName,
                    branchName: 'master',
                    logger: logger,
                    gmeConfig: gmeConfig
                };

                return testFixture.importProject(storage, importParam);
            })
            .then(function (importResult) {
                project = importResult.project;
                commitHash = importResult.commitHash;
                return project.createBranch('test', commitHash);
            })
            .nodeify(done);
    });

    after(function (done) {
        storage.closeDatabase()
            .then(function () {
                return gmeAuth.unload();
            })
            .nodeify(done);
    });

    it('should verify activeNode is "Job"', function (done) {
        var pluginConfig = {},
            context = {
                project: project,
                commitHash: commitHash,
                branchName: 'test',
                activeNode: '/1'
            };

        manager.executePlugin(pluginName, pluginConfig, context, function (err, pluginResult) {
            expect(err).to.equal('Cannot execute FCO (expected Job)');
            expect(typeof pluginResult).to.equal('object');
            expect(pluginResult.success).to.equal(false);
            done();
        });
    });

    ////////// Helper Functions //////////
    var plugin,
        node,
        preparePlugin = function(done) {
            var context = {
                project: project,
                commitHash: commitHash,
                branchName: 'test',
                activeNode: '/K/R/p'  // hello world job
            };

            return manager.initializePlugin(pluginName)
                .then(plugin_ => {
                    plugin = plugin_;
                    return manager.configurePlugin(plugin, {}, context);
                })
                .then(() => node = plugin.activeNode)
                .nodeify(done);
        };

    ////////// END Helper Functions //////////

    // Race condition checks w/ saving...
    describe('get/set', function() {
        beforeEach(preparePlugin);

        it('should get correct attribute after set', function() {
            plugin.setAttribute(node, 'status', 'queued');
            var attrValue = plugin.getAttribute(node, 'status');
            expect(attrValue).to.equal('queued');
        });

        it('should get correct attribute before updating nodes', function(done) {
            // Run setAttribute on some node
            plugin.setAttribute(node, 'status', 'queued');

            // Check that the value is correct before applying node changes
            var updateNodes = plugin.updateNodes;
            plugin.updateNodes = function() {
                var attrValue = plugin.getAttribute(node, 'status');
                expect(attrValue).to.equal('queued');
                return updateNodes.apply(this, arguments);
            };
            plugin.save().nodeify(done);
        });

        it('should get correct attribute (from new node) before updating nodes', function(done) {
            // Run setAttribute on some node
            var graphTmp = plugin.createNode('pipeline.Graph', node),
                newVal = 'testGraph',
                id = 'testId';

            // Get the 
            plugin.setAttribute(graphTmp, 'name', newVal);
            plugin._metadata[id] = graphTmp;
            plugin.createIdToMetadataId[graphTmp] = id;

            // Check that the value is correct before applying node changes
            var updateNodes = plugin.updateNodes;
            plugin.updateNodes = function() {
                var graph = plugin._metadata[id],
                    attrValue = plugin.getAttribute(graph, 'name');

                expect(attrValue).to.equal(newVal);
                return updateNodes.apply(this, arguments);
            };
            plugin.save().nodeify(done);
        });

        it('should get correct attribute after save', function(done) {
            // Run setAttribute on some node
            plugin.setAttribute(node, 'status', 'queued');

            // Check that the value is correct before applying node changes
            plugin.save()
                .then(() => {
                    var attrValue = plugin.getAttribute(node, 'status');
                    expect(attrValue).to.equal('queued');
                })
                .nodeify(done);
        });

        it('should get correct attribute while applying node changes', function(done) {
            // Run setAttribute on some node
            plugin.setAttribute(node, 'status', 'queued');

            // Check that the value is correct before applying node changes
            var oldApplyChanges = plugin._applyNodeChanges;
            plugin._applyNodeChanges = function() {
                var attrValue = plugin.getAttribute(node, 'status');
                expect(attrValue).to.equal('queued');
                return oldApplyChanges.apply(this, arguments);
            };
            plugin.save().nodeify(done);
        });
    });

    describe('createNode', function() {
        beforeEach(preparePlugin);

        it('should update _metadata after applying changes', function(done) {
            // Run setAttribute on some node
            var graphTmp = plugin.createNode('pipeline.Graph', node),
                id = 'testId';

            plugin._metadata[id] = graphTmp;
            plugin.createIdToMetadataId[graphTmp] = id;

            // Check that the value is correct before applying node changes
            var applyModelChanges = plugin.applyModelChanges;
            plugin.applyModelChanges = function() {
                return applyModelChanges.apply(this, arguments)
                    .then(() => {
                        var graph = plugin._metadata[id];
                        expect(graph).to.not.equal(graphTmp);
                    });
            };
            plugin.save().nodeify(done);
        });

        it('should update _metadata in updateNodes', function(done) {
            var id = 'testId';

            plugin._metadata[id] = node;
            node.old = true;
            plugin.updateNodes()
                    .then(() => {
                        var graph = plugin._metadata[id];
                        expect(graph.old).to.not.equal(true);
                    })
                    .nodeify(done);
        });

        // Check that it gets the correct value from a newly created node after
        // it has been saved/created
        it('should get changed attribute', function(done) {
            // Run setAttribute on some node
            var graphTmp = plugin.createNode('pipeline.Graph', node),
                id = 'testId';

            plugin._metadata[id] = node;
            plugin.createIdToMetadataId[graphTmp] = id;

            plugin.setAttribute(graphTmp, 'name', 'firstName');

            // Check that the value is correct before applying node changes
            plugin.save()
                .then(() => {
                    var graph = plugin._metadata[id],
                        val = plugin.getAttribute(graph, 'name');
                    expect(val).to.equal('firstName');
                })
                .nodeify(done);
        });

        it('should get inherited attribute', function(done) {
            // Run setAttribute on some node
            var graphTmp = plugin.createNode('pipeline.Graph', node),
                id = 'testId',
                val;

            // Check that the value is correct before applying node changes
            plugin._metadata[id] = node;
            plugin.createIdToMetadataId[graphTmp] = id;

            val = plugin.getAttribute(graphTmp, 'name');
            expect(val).to.equal('Graph');

            plugin.save()
                .then(() => {
                    var graph = plugin._metadata[id];

                    val = plugin.getAttribute(graph, 'name');

                    expect(val).to.equal('Graph');
                })
                .nodeify(done);
        });
    });

    // Canceling
    describe('cancel', function() {
        beforeEach(preparePlugin);

        it('should stop the job if the execution is canceled', function(done) {
            var job = node,
                hash = 'abc123',
                exec = {
                    cancelJob: jobHash => expect(jobHash).equal(hash)
                };

            plugin.setAttribute(node, 'secret', 'abc');
            plugin.isExecutionCanceled = () => true;
            plugin.onOperationCanceled = () => done();
            plugin.watchOperation(exec, hash, job, job);
        });

        it('should stop the job if a job is canceled', function(done) {
            var job = node,
                hash = 'abc123',
                exec = {
                    cancelJob: jobHash => expect(jobHash).equal(hash)
                };

            plugin.setAttribute(job, 'secret', 'abc');
            plugin.canceled = true;
            plugin.onOperationCanceled = () => done();
            plugin.watchOperation(exec, hash, job, job);
        });

        it('should set exec to running', function(done) {
            var job = node,
                execNode = plugin.core.getParent(job);

            // Set the execution to canceled
            plugin.setAttribute(execNode, 'status', 'canceled');
            plugin.prepare = () => {
                var status = plugin.getAttribute(execNode, 'status');
                expect(status).to.not.equal('canceled');
                return {then: () => done()};
            };
            plugin.main();
        });
    });

    describe('exec files', function() {
        describe('attribute file', function() {
            var boolString = /['"](true|false)['"]/g;

            beforeEach(preparePlugin);

            it('should not quote true (s) boolean values', function() {
                var files = {},
                    content,
                    matches;

                plugin.setAttribute(node, 'debug', 'true');
                plugin.createAttributeFile(node, files);
                content = files['attributes.lua'];
                matches = content.match(boolString);
                expect(matches).to.equal(null);
            });

            it('should not quote true boolean values', function() {
                var files = {},
                    content,
                    matches;

                plugin.setAttribute(node, 'debug', true);
                plugin.createAttributeFile(node, files);
                content = files['attributes.lua'];
                matches = content.match(boolString);
                expect(matches).to.equal(null);
            });

            it('should not quote false (s) boolean values', function() {
                var files = {},
                    content,
                    matches;

                plugin.setAttribute(node, 'debug', 'false');
                plugin.createAttributeFile(node, files);
                content = files['attributes.lua'];
                matches = content.match(boolString);
                expect(matches).to.equal(null);
            });

            it('should not quote false boolean values', function() {
                var files = {},
                    content,
                    matches;

                plugin.setAttribute(node, 'debug', false);
                plugin.createAttributeFile(node, files);
                content = files['attributes.lua'];
                matches = content.match(boolString);
                expect(matches).to.equal(null);
            });
        });
    });
});
