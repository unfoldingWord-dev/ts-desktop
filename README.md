translationStudio Desktop
========================

A tool to translate Bible stories into your own language  https://distantshores.org/translationStudio


##Environment Setup
Once you've cloned the repo you'll need to do some setting up before begining development. 

* Navigate to the root of the project directory.
* run ```yo node-webkit``` this will begin an interactive session asking you questions.
 * What do you want to call your app? **leave default**
 * A little description for your app? **leave default**
 * Would you mind telling me your username on Github? **leave default**
 * Do you want to install one of the node-webkit examples? **N**
 * Do you want to download node-webkit? **Y**
 * Please specify which version of node-webkit you want to download: **v0.11.6**
 * Which platform do you wanna support? **Choose any platform(s) you want**

After answering these questions Yeoman will create some directories and download the version of node-webkit you requested. Then it will ask you if you want to overwrite existing files. Choose **n** for all of the overwrite confirmations.

That's it!! Yeoman will run ```bower install``` and ```npm install``` to finish loading dependencies for the project.