import os
import re
import shutil
import sys

# pip3 install GitPython
from git import Repo

class PACKAGE(object):
    def __init__(self, l):
        self.name = l[0][l[0].find('[') + 1 : l[0].find(']')]
        self.repo = l[0][l[0].find('(') + 1 : l[0].find(')')] + '.git'
        self.branch = l[1]
        self.developer = l[2]
        self.function = l[3]
        self.type = l[4]
        self.date = l[5]
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
            
            # 获取分支
            repository = Repo.clone_from(repo, path)
            
            # 切换指定分支
            repository.git.checkout(self.branch)
            
            # 获取分支更新信息
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
            if entry.is_dir() and entry.path != path and not entry.name.startswith('.') and entry.name not in ['doc', 'previews']:
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
        if self.date is None:
            # B3: 拉取/切换失败，保留旧目录与旧日期，避免产生缺包提交
            print("!! %s: 拉取失败，保留旧版本" % self.name)
            return
        dirList = []
        if self.type == 'multi':
            if self.name == 'luci-app-store': # 特殊处理
                tmp += '/luci'
            dirList = self.__ListDir(tmp)
        else:
            self.__RemoveDir(tmp)
            dirList.append(tmp)
        
        if not dirList:
            # B3: 上游仓库结构异常（未取到任何包目录），保留旧目录
            print("!! %s: 未取到包目录，保留旧版本" % self.name)
            return
        
        for dir in dirList:
            package = path + dir[dir.rfind('/'):]
            if os.path.exists(package):
                shutil.rmtree(package)
            shutil.move(dir, path + '/')
        '''
        # 重命名 quectel_cm_5G，解决编译问题
        if os.path.exists(path + '/quectel_cm_5G'):
            os.rename(path + '/quectel_cm_5G', path + '/quectel_cm')
        '''


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
    # B1: feed 引用章节中的仓库地址，CI 环境下自动填充为真实仓库
    repo = os.environ.get('GITHUB_REPOSITORY', 'YOUR_GITHUB_USERNAME/OpenWrt-Packages')
    if os.path.exists(fileName):
        os.remove(fileName)
    
    with open(fileName, 'a') as f:
        f.write("# OpenWrt-Packages\n")
        f.write("常用 ImmortalWrt 软件包收集\n")
        f.write("\n")
        f.write("## 注意事项\n")
        f.write("\n")
        f.write("1. 适用于 ImmortalWrt 24.10 版本。\n")
        f.write("\n")
        f.write("## 作为 Feed 引用（推荐）\n")
        f.write("\n")
        f.write("在 ImmortalWrt 源码根目录 `feeds.conf`（或 `feeds.conf.default`）**开头**插入一行：\n")
        f.write("\n")
        f.write("    src-git zz_openwrtpackages https://github.com/%s.git;openwrt-24.10\n" % repo)
        f.write("\n")
        f.write("然后执行：\n")
        f.write("\n")
        f.write("    ./scripts/feeds update zz_openwrtpackages\n")
        f.write("    ./scripts/feeds install -a\n")
        f.write("\n")
        f.write("之后即可在 `make menuconfig` 中按包名选择安装。\n")
        f.write("\n")
        f.write("### Feed 使用注意事项\n")
        f.write("\n")
        f.write("1. 必须使用与分支对应的 ImmortalWrt 版本编译（本分支对应 24.10）。\n")
        f.write("2. 本 feed 部分包与 ImmortalWrt 的 packages/luci feed 同名（如 golang、smartdns、mosdns、xray-core、luci-theme-argon、luci-app-smartdns 等），`feeds install` 对同名包按 `feeds.conf` 行序先到先得，本行必须放在官方 feeds **之前**才能让本 feed 版本生效；feed 名只能使用 `[A-Za-z0-9_]`（勿加连字符），`zz_` 前缀可保证多 feed 并存时构建扫描也排在官方之后。\n")
        f.write("3. ImmortalWrt 的 packages / luci / routing feed 必须保留，`luci-*` 等包依赖 `luci-base`。\n")
        f.write("4. 本地调试可用 `src-link` 直连本仓库：`src-link zz_openwrtpackages /本地路径/OpenWrt-Packages`。\n")
        f.write("\n")
        f.write("## 软件清单\n")
        f.write("\n")
        f.write("|软件|分支|作者|功能|包类型|更新日期|\n")
        f.write("|:-|:-|:-|:-|:-|:-|\n")
        for package in packageList:
            f.write("|[%s](%s)|%s|%s|%s|%s|%s|\n"%(package.name, package.repo[:-4], package.branch, package.developer, package.function, package.type, package.date))
    


def Entry():
    pwd = os.getcwd()
    tmp = pwd + '/tmp'
    if not os.path.exists(tmp):
        os.mkdir(tmp)

    # B3: 不再全局删除包目录，改为逐包更新——clone/切换成功后才覆盖旧目录，
    # 单个包拉取失败时保留旧版本，避免产生缺包提交。
    packageList = GetPackageList(pwd + '/README.md')
    for package in packageList:
        package.update(tmp, pwd)

    CreatReadme(pwd + '/README.md', packageList)
    
    if os.path.exists(tmp):
        shutil.rmtree(tmp)

if __name__ == '__main__':
    Entry()