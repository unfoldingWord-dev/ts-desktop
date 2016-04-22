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

            var remoteName = 'superman';
            var remoteBranch = 'master';
            var remoteHeadRef = 'refs/remotes/' + remoteName + '/HEAD';
            var remoteMasterRef = 'refs/remotes/' + remoteName + '/master';
            var ourBranchName = 'master';
            var newBranchName = 'wonderwoman';
            var cleanBranchName = 'lex';


            return Promise.all([utils.fs.readFile(mergeToManifest), utils.fs.readFile(mergeFromManifest)])
                .then(function (manifestDataArray) {
                    var mergeToManifestJson = JSON.parse(manifestDataArray[0].toString());
                    var mergeFromManifestJson = JSON.parse(manifestDataArray[1]);
                    mergedManifest = mergeToManifestJson;
                    mergedManifest.translators = _.union(mergeToManifestJson.translators, mergeFromManifestJson.translators);
                    mergedManifest.finished_chunks = _.union(mergeToManifestJson.finished_chunks, mergeFromManifestJson.finished_chunks);
                })
                .then(function () {
                    console.log("Step 1");
                    return NodeGit.Repository.open(mergeToPath);
                })
                .then(function (repo) {
                    return repo.checkoutBranch(ourBranchName).then(utils.ret(repo));
                })
                .then(function (repo) {
                    console.log("Step 2");
                    return NodeGit.Remote.delete(repo, remoteName).then(utils.ret(repo))
                        .catch(utils.ret(repo));
                })
                .then(function (repo) {
                    console.log("Step 3");
                    return repo.getBranch(newBranchName).then(function (branch) {
                        return NodeGit.Branch.delete(branch).then(utils.ret(repo));
                    }).catch(utils.ret(repo));
                })
                .then(function (repo) {
                    console.log("Step 3");
                    return repo.getBranch(cleanBranchName).then(function (branch) {
                        return NodeGit.Branch.delete(branch).then(utils.ret(repo));
                    }).catch(utils.ret(repo));
                })
                .then(function (repo) {
                    console.log("Step 4");
                    NodeGit.Remote.create(repo, remoteName, mergeFromPath);
                    return repo;
                })
                .then(function (repo) {
                    console.log("Step 5");
                    return repo.fetch(remoteName).then(utils.ret(repo));
                })
                .then(function (repo) {
                    console.log("Step 6");
                    return NodeGit.Reference.symbolicCreate(repo, remoteHeadRef, remoteMasterRef, 1, 'symbolic-ref').then(utils.ret(repo));
                })
                .then(function (repo) {
                    console.log("Step 7");
                    return repo.getReference(remoteHeadRef).then(function (ref) {
                        return repo.createBranch(newBranchName, ref.target()).then(utils.ret(repo));
                    })
                })
                .then(function (repo) {
                    console.log("Step 9");
                    return repo.getBranchCommit(ourBranchName).then(function (ours) {
                        return {repo: repo, ours: ours};
                    });
                })
                .then(function (data) {
                    console.log("Step 10");
                    return data.repo.getBranchCommit(newBranchName).then(function (theirs) {
                        data.theirs = theirs;
                        return data;
                    });
                })
                .then(function (data) {
                    console.log("Step 11");
                    return NodeGit.Merge.commits(data.repo, data.ours, data.theirs, {
                        fileFavor: NodeGit.Merge.FILE_FAVOR.THEIRS
                    }).then(function (index) {
                        data.index = index;
                        return data;
                    });
                })
                .then(function (data) {
                    console.log("Step 12");
                    if (data.index.hasConflicts()) {
                        data.index.conflictCleanup();
                    }
                    //data.index.write();
                    return data.index.writeTreeTo(data.repo).then(function (oid) {
                        data.mergeCommit = oid;
                        return data;
                    });
                })
                .then(function (data) {
                    console.log("Step 13");
                    return data.repo.getMasterCommit().then(function (commit) {
                        return data.repo.createBranch(cleanBranchName, commit, true, data.repo.defaultSignature(), "Clean branch").then(utils.ret(data));
                    });
                })
                .then(function (data) {
                    console.log("Step 14");
                    var sig = data.repo.defaultSignature();
                    var parents = [data.ours, data.theirs];
                    return data.repo.createCommit('refs/heads/' + cleanBranchName, sig, sig, 'Merging to clean...', data.mergeCommit, parents);
                })
                .then(utils.logr("Finished merging"));


/*
            function createBranch(repo, newBranchName, remoteName, remoteBranch) {
                var remoteRefBase = 'refs/remotes/' + remoteName;
                var remoteRefName = remoteRefBase + '/' + remoteBranch;
                var remoteRefHead = remoteRefBase + '/' + 'HEAD';

                return NodeGit.Reference.symbolicCreate(repo, remoteRefHead, remoteRefName, 1, 'Setting HEAD')
                    .then(function () {
                        return repo.getReference(remoteRefName);
                    })
                    .then(function (remoteRef) {
                        // Create new branch based on the remote ref
                        return repo.createBranch(newBranchName, remoteRef.target());
                    })
                    .then(function (branchRef) {
                        // checkout branch to update working directory
                        return repo.checkoutBranch(branchRef);
                    });
            }

            return Promise.all([utils.fs.readFile(mergeToManifest), utils.fs.readFile(mergeFromManifest)])
                .then(function (manifestDataArray) {
                    var mergeToManifestJson = JSON.parse(manifestDataArray[0].toString());
                    var mergeFromManifestJson = JSON.parse(manifestDataArray[1]);
                    mergedManifest = mergeToManifestJson;
                    mergedManifest.translators = _.union(mergeToManifestJson.translators, mergeFromManifestJson.translators);
                    mergedManifest.finished_chunks = _.union(mergeToManifestJson.finished_chunks, mergeFromManifestJson.finished_chunks);
                })
                .then(function () {
                    console.log("start open repo");
                    return NodeGit.Repository.open(mergeToPath).then(function (repo) {
                        return {target: repo};
                    });
                })
                .then(function (repos) {
                    return NodeGit.Remote.delete(repos.target, "new").then(utils.ret(repos))
                        .catch(utils.ret(repos));
                })
                .then(function (repos) {
                    return repos.target.getBranch("superman").then(function (branch) {
                        return NodeGit.Branch.delete(branch).then(utils.ret(repos));
                    }).catch(utils.ret(repos));
                })
                .then(function (repos) {
                    console.log('start create remote');
                    NodeGit.Remote.create(repos.target, "new", mergeFromPath);
                    return repos;
                })
                .then(function (repos) {
                    var repo = repos.target;
                    return repo.fetchAll().then(function () {
                        return createBranch2(repo, 'superman', 'new', 'master').catch(utils.ret(true));
                    }).then(function () {
                        return repo.mergeBranches('master', 'new/master');
                    }).then(function () {
                        return repo.checkoutBranch('master');
                    }).then(function () {
                        console.log("final merge");
                        return repo.mergeBranches('superman', 'master');
                    })
                })
                .then(utils.logr("Finished merging"));*/

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
                    return remote.push(['refs/heads/master:refs/heads/master'], {
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
