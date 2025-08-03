#!/bin/bash
echo "开始卸载 MySQL..."

# 停止服务
brew services stop mysql 2>/dev/null
sudo /usr/local/mysql/support-files/mysql.server stop 2>/dev/null

# 卸载 Homebrew MySQL
brew uninstall mysql 2>/dev/null
brew uninstall mysql@8.0 2>/dev/null
brew uninstall mysql@5.7 2>/dev/null
brew cleanup

# 删除文件和目录
sudo rm -rf /usr/local/mysql*
sudo rm -rf /usr/local/var/mysql
sudo rm -rf /etc/mysql
sudo rm -f /etc/my.cnf
sudo rm -f /usr/local/etc/my.cnf
sudo rm -rf /Library/StartupItems/MySQLCOM
sudo rm -rf /Library/PreferencePanes/My*
sudo rm -f /Library/LaunchDaemons/com.oracle.oss.mysql.mysqld.plist
sudo rm -f /Library/LaunchAgents/com.oracle.oss.mysql.mysqld.plist
rm -rf ~/Library/LaunchAgents/homebrew.mxcl.mysql.plist
rm -rf ~/.mysql_history

# 删除用户和组
sudo dscl . -delete /Users/_mysql 2>/dev/null
sudo dscl . -delete /Groups/_mysql 2>/dev/null

echo "MySQL 卸载完成！"
echo "请手动检查并删除 ~/.bash_profile 或 ~/.zshrc 中的 MySQL PATH 设置"
