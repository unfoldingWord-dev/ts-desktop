'use strict';

var NodeGit,
    utils = require('../js/lib/utils'),
    path = require('path'),
    _ = require('lodash');

try {
    NodeGit = require('nodegit');
} catch(e) {
    if(process.env.NODE_ENV !== 'test') {
        throw e;
    }
}

function GitManager() {

    var logr = utils.logr;

    return {

        getHash: function (dir) {
            return NodeGit.Repository.open(dir).then(function (repo) {
                return repo.getCurrentBranch();
            }).then(function (ref) {
                return ref.target().toString();
            });
        },

        init: function (dir) {
            return utils.fs.readdir(dir).then(function (files) {
                var hasGitFolder = (files.indexOf('.git') >= 0);

                return !hasGitFolder ? NodeGit.Repository.init(dir, 0) : false;
            }).then(logr('Git is initialized'));
        },

        commitAll: function (user, dir) {
            let author = NodeGit.Signature.now(user.username || 'tsDesktop', user.email || 'you@example.com'),
                committer = author;

            let repo, index, oid;

            return NodeGit.Repository.open(dir)
                .then(function(repoResult) {
                    repo = repoResult;
                    return repo.openIndex();
                })
                .then(function(indexResult) {
                    index = indexResult;
                    return index.read(1);
                })
                .then(function() {
                    // Get all added files
                    return index.addAll();
                })
                .then(function() {
                    // Get all changed/deleted files
                    return index.updateAll();
                })
                .then(function() {
                    return index.write();
                })
                .then(function() {
                    return index.writeTree();
                })
                .then(function(oidResult) {
                    oid = oidResult;

                    return repo.getHeadCommit();
                })
                .then(function(head) {
                    let parents = head ? [head] : [];

                    return repo.createCommit('HEAD', author, committer, (new Date()).toString(), oid, parents);
                })
                .then(function(commitId) {
                    return commitId;
                })
                .then(logr('Files are staged'));
        },

        merge: function (mergeToPath, mergeFromPath) {
            var mergeToManifest = path.join(mergeToPath, 'manifest.json');
            var mergeFromManifest = path.join(mergeFromPath, 'manifest.json');
            var mergedManifest = {};

            return Promise.all([utils.fs.readFile(mergeToManifest), utils.fs.readFile(mergeFromManifest)])
                .then(function (manifestDataArray) {
                    console.log("start manifest merge");
                    //console.log(mergeToManifestData);
                    var mergeToManifestJson = JSON.parse(manifestDataArray[0].toString());
                    var mergeFromManifestJson = JSON.parse(manifestDataArray[1]);
                    mergedManifest = mergeToManifestJson;
                    mergedManifest.translators = _.union(mergeToManifestJson.translators, mergeFromManifestJson.translators);
                    mergedManifest.finished_chunks = _.union(mergeToManifestJson.finished_chunks, mergeFromManifestJson.finished_chunks);
                    //mergedManifest.source_translations = _.union(mergeToManifestJson.source_translations, mergeFromManifestJson.source_translations);
                    console.log(mergedManifest);
                })
                .then(function () {
                    console.log("start open repo");
                    return NodeGit.Repository.open(mergeToPath);
                })
                .then(function (repo) {
                    console.log('start create remote');
                    var remote = NodeGit.Remote.createAnonymous(repo, mergeFromPath);
                    return {target: repo, remote: remote};
                })
                .then(function (repos) {
                    console.log("start create branch");
                    return repos.target.createBranch("new", repos.remote, true, repos.target.defaultSignature(), "good").then(utils.ret(repos));
                    //return NodeGit.Branch.create(repos.target, "new", repos.remote, true).then(utils.ret(repos));
                })
                .then(function (repos) {
                    console.log("start merge");
                    //NodeGit.Merge.merge(repos.target, repos.remote);
                    return repos.target.mergeBranches('master', 'new');
                });


//Joel's Android code is below for reference
            /*

            Manifest importedManifest = Manifest.generate(newDir);
            Repo repo = getRepo();

            // attach remote
            repo.deleteRemote("new");
            repo.setRemote("new", newDir.getAbsolutePath());
            FetchCommand fetch = repo.getGit().fetch();
            fetch.setRemote("new");
            FetchResult fetchResult = fetch.call();

            // create branch for new changes
            DeleteBranchCommand deleteBranch = repo.getGit().branchDelete();
            deleteBranch.setBranchNames("new");
            deleteBranch.setForce(true);
            deleteBranch.call();
            CreateBranchCommand branch = repo.getGit().branchCreate();
            branch.setName("new");
            branch.setStartPoint("new/master");
            branch.call();

            // perform merge
            MergeCommand merge = repo.getGit().merge();
            merge.setFastForward(MergeCommand.FastForwardMode.NO_FF);
            merge.include(repo.getGit().getRepository().getRef("new"));
            MergeResult result = merge.call();

            // merge manifests
            manifest.join(importedManifest.getJSONArray(FIELD_TRANSLATORS), FIELD_TRANSLATORS);
            manifest.join(importedManifest.getJSONArray(FIELD_FINISHED_CHUNKS), FIELD_FINISHED_CHUNKS);
            manifest.join(importedManifest.getJSONObject(FIELD_SOURCE_TRANSLATIONS), FIELD_SOURCE_TRANSLATIONS);

            // add missing parent draft status
            if((!manifest.has(FIELD_PARENT_DRAFT) || !Manifest.valueExists(manifest.getJSONObject(FIELD_PARENT_DRAFT), "resource_id"))
                && importedManifest.has(FIELD_PARENT_DRAFT)) {
                manifest.put(FIELD_PARENT_DRAFT, importedManifest.getJSONObject(FIELD_PARENT_DRAFT));
            }

            if (result.getMergeStatus().equals(MergeResult.MergeStatus.CONFLICTING)) {
                System.out.println(result.getConflicts().toString());
                return false;
            }
            return true;*/
        },

        push: function (user, dir, repo) {
            let localrepo,
                isSSH = !!user.reg;

            return NodeGit.Repository.open(dir)
                .then(function(repoResult) {
                    localrepo = repoResult;
                    return localrepo.openIndex();
                })
                .then(function() {
                    let remoteUrl = isSSH ? repo.ssh_url : repo.html_url;

                    return NodeGit.Remote.createAnonymous(localrepo, remoteUrl);
                })
                .then(function(remote) {
                    return remote.push(['+refs/heads/master:refs/heads/master'], {
                        callbacks: {
                            certificateCheck: function () {
                                // no certificate check, let it pass thru
                                return true;
                            },
                            credentials: function (url, username) {
                                if (isSSH) {
                                    return NodeGit.Cred.sshKeyNew(
                                        username,
                                        user.reg.paths.publicKeyPath,
                                        user.reg.paths.privateKeyPath,
                                        ''
                                    );
                                }

                                return NodeGit.Cred.userpassPlaintextNew(user.username, user.password);
                            }
                        }
                    });
                })
                .then(logr('Files are pushed', repo));
        },

        clone: function() {
            throw 'Not implemented';
        },

        pull: function() {
            throw 'Not implemented';
        }

    };
}

module.exports.GitManager = GitManager;
