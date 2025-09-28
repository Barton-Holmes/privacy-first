"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./Card";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { Copy, Users, Key } from "lucide-react";

interface AccountSwitcherProps {
  currentAddress?: string;
  onSwitchAccount?: () => void;
}

export function AccountSwitcher({ currentAddress, onSwitchAccount }: AccountSwitcherProps) {
  // Hardhat默认账户
  const defaultAccounts = [
    {
      address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      privateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
      role: "部署者/教师",
      description: "默认授权的教师账户",
    },
    {
      address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      privateKey: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
      role: "授权教师",
      description: "已授权的教师账户",
    },
    {
      address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      privateKey: "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
      role: "学生",
      description: "学生测试账户",
    },
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("已复制到剪贴板");
  };

  const currentAccount = defaultAccounts.find(
    acc => acc.address.toLowerCase() === currentAddress?.toLowerCase()
  );

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>账户管理</span>
        </CardTitle>
        <CardDescription>
          切换到不同角色的测试账户
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* 当前账户 */}
        {currentAccount && (
          <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-md">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">当前账户</span>
              <Badge variant="outline">{currentAccount.role}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-1">{currentAccount.description}</p>
            <p className="text-xs font-mono">{currentAccount.address}</p>
          </div>
        )}

        {/* 可用账户列表 */}
        <div className="space-y-3">
          <h4 className="font-medium">可用测试账户</h4>
          {defaultAccounts.map((account) => (
            <div
              key={account.address}
              className={`p-3 border rounded-md ${
                account.address.toLowerCase() === currentAddress?.toLowerCase()
                  ? "border-primary bg-primary/5"
                  : "border-border"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={account.role.includes("教师") ? "default" : "secondary"}
                  >
                    {account.role}
                  </Badge>
                  {account.address.toLowerCase() === currentAddress?.toLowerCase() && (
                    <Badge variant="success">当前</Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(account.privateKey)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground mb-2">{account.description}</p>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">地址:</span>
                  <span className="text-xs font-mono">{account.address}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">私钥:</span>
                  <span className="text-xs font-mono">
                    {account.privateKey.slice(0, 10)}...{account.privateKey.slice(-6)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-start space-x-2">
            <Key className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800">使用说明</p>
              <p className="text-yellow-700 mt-1">
                1. 点击私钥旁的复制按钮复制私钥<br/>
                2. 在MetaMask中导入账户<br/>
                3. 刷新页面重新连接
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

