import os
import re
import shutil
import json
import sys

# pip3 install GitPython
from git import Repo

class PACKAGE(object):
    def __init__(self, l):
        self.name = l[0][l[0].find('[') + 1 : l[0].find(']')]
        self.repo = l[0][l[0].find('(') + 1 : l[0].find(')')] + '.git'
        self.developer = l[1]
        self.function = l[2]
        self.type = l[3]
        self.date = l[4]
        self.isUpdate = False

    def __Download(self, repo, path):
        def gitlog(log):
            if log:
                l = log.split('\n')
            for item in l:
                if item.startswith('Date:'):
                    return item[item.rfind(" ") + 1: ]
            return None
        try:
            print('\n', repo)
            if os.path.exists(path):
                shutil.rmtree(path)
            repository = Repo.clone_from(repo, path)
            if repo.find("5G-Modem-Support") > 0:
                repository.git.checkout("819f697")
            log = repository.git.log(date='format:%Y%m%d', max_count=1)
            print(log)
            commint_date = gitlog(log)
            return commint_date
        except Exception as e:
            print("%s.%s: %s" % (self.__class__.__name__, sys._getframe().f_code.co_name, e))
            return None


    def __ListDir(self, path):
        dirList = []
        for entry in os.scandir(path):
            if entry.is_dir() and entry.path != path and not entry.name.startswith('.') and entry.name not in ['sms-tool']:
                dirList.append(entry.path)
        return dirList

    def __RemoveDir(self, path):
        for entry in os.scandir(path):
            if entry.is_dir() and entry.name.startswith('.'):
                shutil.rmtree(entry.path)

    def update(self, tmp, path):
        tmp = '%s/%s'%(tmp, self.name)
        if os.path.exists(tmp):
            shutil.rmtree(tmp)
        
        self.date = self.__Download(self.repo, tmp)
        dirList = []
        if self.type == 'multi':
            if self.name == 'luci-app-store': # 特殊处理
                tmp += '/luci'
            dirList = self.__ListDir(tmp)
        else:
            self.__RemoveDir(tmp)
            dirList.append(tmp)
        
        for dir in dirList:
            package = path + dir[dir.rfind('/'):]
            if os.path.exists(package):
                shutil.rmtree(package)
            shutil.move(dir, path + '/')


def GetPackageList(fileName):
    packageList = []
    with open(fileName, "r") as f:
        for line in f:
            line = line.replace('\r', '').replace('\n', '')
            if line.find('|')==0 and line.rfind('|')==len(line)-1:
                l = list(map(lambda x: x.strip(), line[1:].split('|')))
                if l[0].find('(') > 0 and l[0].find(')') > 0 and len(l) > 4:
                    url = l[0][l[0].find('(')+1:l[0].find(')')]
                    matchObj1 = re.match('(http|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?', url)
                    if matchObj1:
                        packageList.append(PACKAGE(l))
    return packageList

def CreatReadme(fileName, packageList):
    if os.path.exists(fileName):
        os.remove(fileName)
    
    with open(fileName, 'a') as f:
        f.write("# OpenWrt-Packages\n")
        f.write("常用 OpenWrt 软件包收集\n")
        f.write("\n")
        f.write("|软件|作者|功能|包类型|更新日期|\n")
        f.write("|:-|:-|:-|:-|:-|\n")
        for package in packageList:
            f.write("|[%s](%s)|%s|%s|%s|%s|\n"%(package.name, package.repo[:-4], package.developer, package.function, package.type, package.date))
    


def Entry():
    pwd = os.getcwd()
    tmp = pwd + '/tmp'
    if not os.path.exists(tmp):
        os.mkdir(tmp)

    # 删除所有目录，强制同步最新源码
    for entry in os.scandir(pwd):
        if entry.is_dir() and entry.path != pwd and not entry.name.startswith('.'):
            shutil.rmtree(entry.path)

    packageList = GetPackageList(pwd + '/README.md')
    for package in packageList:
        package.update(tmp, pwd)

    CreatReadme(pwd + '/README.md', packageList)
    
    if os.path.exists(tmp):
        shutil.rmtree(tmp)

if __name__ == '__main__':
    Entry()