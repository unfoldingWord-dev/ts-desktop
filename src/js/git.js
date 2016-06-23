'use strict';

var NodeGit,
    path = require('path'),
    utils = require('../js/lib/utils'),
    _ = require('lodash');

try {
    NodeGit = require('nodegit');
} catch(e) {
    if(process.env.NODE_ENV !== 'test') {
        throw e;
    }
}

function createTagName(datetime) {
    return 'R2P/' +
        datetime.getFullYear().toString() + '-' +
        utils.padZero(datetime.getMonth()+1) + '-' +
        utils.padZero(datetime.getDate()) + '/' +
        utils.padZero(datetime.getHours()) + '.' +
        utils.padZero(datetime.getMinutes()) + '.' +
        utils.padZero(datetime.getSeconds());
}

function GitManager() {

    var logr = utils.logr;
    var toJSON = _.partialRight(JSON.stringify, null, '\t');

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

        merge: function (user, localPath, remotePath, favor) {
            var mythis = this;
            var localManifestPath = path.join(localPath, 'manifest.json');
            var remoteManifestPath = path.join(remotePath, 'manifest.json');
            var mergedManifest = {};
            var remoteName = 'tempremote';
            var remoteHead = 'refs/remotes/' + remoteName + '/HEAD';
            var remoteMaster = 'refs/remotes/' + remoteName + '/master';
            var masterBranch = 'master';
            var tempBranch = 'temp';

            return Promise.all([utils.fs.readFile(localManifestPath), utils.fs.readFile(remoteManifestPath)])
                .then(function (fileData) {
                    var localManifest = JSON.parse(fileData[0]);
                    var remoteManifest = JSON.parse(fileData[1]);
                    mergedManifest = localManifest;
                    mergedManifest.translators = _.union(localManifest.translators, remoteManifest.translators);
                    mergedManifest.finished_chunks = _.union(localManifest.finished_chunks, remoteManifest.finished_chunks);
                })
                .then(function () {
                    return NodeGit.Repository.open(localPath);
                })
                .then(function (repo) {
                    return repo.checkoutBranch(masterBranch).then(utils.ret(repo));
                })
                .then(function (repo) {
                    return NodeGit.Remote.delete(repo, remoteName).then(utils.ret(repo))
                        .catch(utils.ret(repo));
                })
                .then(function (repo) {
                    return repo.getBranch(tempBranch).then(function (branch) {
                        return NodeGit.Branch.delete(branch).then(utils.ret(repo));
                    }).catch(utils.ret(repo));
                })
                .then(function (repo) {
                    NodeGit.Remote.create(repo, remoteName, remotePath);
                    return repo;
                })
                .then(function (repo) {
                    return repo.fetch(remoteName).then(utils.ret(repo));
                })
                .then(function (repo) {
                    return NodeGit.Reference.symbolicCreate(repo, remoteHead, remoteMaster, 1, 'symbolic-ref').then(utils.ret(repo));
                })
                .then(function (repo) {
                    return repo.getReference(remoteHead).then(function (ref) {
                        return repo.createBranch(tempBranch, ref.target()).then(utils.ret(repo));
                    })
                })
                .then(function (repo) {
                    return repo.checkoutBranch(tempBranch).then(utils.ret(repo));
                })
                .then(function (repo) {
                    return repo.getBranchCommit(masterBranch).then(function (master) {
                        return {repo: repo, master: master};
                    });
                })
                .then(function (data) {
                    return data.repo.getBranchCommit(tempBranch).then(function (temp) {
                        data.temp = temp;
                        return data;
                    });
                })
                .then(function (data) {
                    return NodeGit.Merge.commits(data.repo, data.master, data.temp, {fileFavor: favor}).then(function (index) {
                        data.index = index;
                        return data;
                    });
                })
                .then(function (data) {
                    return data.index.writeTreeTo(data.repo).then(function (merge) {
                        data.merge = merge;
                        return data;
                    });
                })
                .then(function (data) {
                    var sig = data.repo.defaultSignature();
                    var parents = [data.master, data.temp];
                    return data.repo.createCommit('refs/heads/' + masterBranch, sig, sig, 'Merging...', data.merge, parents).then(utils.ret(data));
                })
                .then(function (data) {
                    return data.repo.checkoutBranch(masterBranch);
                })
                .then(function () {
                    return utils.fs.outputFile(localManifestPath, toJSON(mergedManifest));
                })
                .then(function () {
                    return mythis.commitAll(user, localPath);
                })
                .catch(function (err) {
                    throw "Error while merging projects: " + err;
                })
                .then(utils.logr("Finished merging"));
        },

        push: function (user, dir, repo, opts) {
            opts = opts || {};

            let localrepo,
                isSSH = !!user.reg;

            return NodeGit.Repository.open(dir)
                .then(function(repoResult) {
                    localrepo = repoResult;
                    return localrepo.openIndex();
                })
                .then(function() {
                    return localrepo.getHeadCommit();
                })
                .then(function(commit) {
                    let tagName = createTagName(new Date()),
                        tagMessage = '';

                    return opts.requestToPublish ? localrepo.createTag(commit.id(), tagName, tagMessage) : null;
                })
                .then(function(tag) {
                    let remoteUrl = isSSH ? repo.ssh_url : repo.html_url;

                    return NodeGit.Remote.createAnonymous(localrepo, remoteUrl).then(function(remote) {
                        return {tag: tag, remote: remote};
                    });
                })
                .then(function(data) {
                    let refSpecs = ['refs/heads/master:refs/heads/master'],
                        tagRefSpec = data.tag ? 'refs/tags/' + data.tag.name() + ':refs/tags/' + data.tag.name() : '';

                    if (tagRefSpec) {refSpecs.push(tagRefSpec);}
                    return data.remote.push(refSpecs, {
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

        clone: function (repoUrl, localPath) {
            var repoName = repoUrl.replace(/\.git/, '').split('/').pop();
            var savePath = localPath.includes(repoName) ? localPath : path.join(localPath, repoName);

            return NodeGit.Clone(repoUrl, savePath, {
                checkoutBranch: 'master',

                fetchOpts: {
                    callbacks: {
                        certificateCheck: function () {
                            return 1;
                        }
                    }
                }
            });
        },

        pull: function() {
            throw 'Not implemented';
        }

    };
}

module.exports.GitManager = GitManager;
