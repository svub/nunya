## Maintainer Only

Note applicable if you do not maintain the repository.

### Setup Github SSH Keys
* Generate Github SSH keys on remote machine. Copy the output to Github SSH Keys https://github.com/settings/keys
```bash
apt-get install -y xclip && \
ssh-keygen -y -t rsa -f ~/.ssh/id_rsa -P "" && \
cat ~/.ssh/id_rsa.pub
```

### Remove Gitsubmodule

* Remove submodule from ./.git/config
* Other changes
```bash
git rm -r --cached ./packages/relayer
rm -rf ./.git/modules/
rm -rf ./packages/relayer/
rm ./.gitmodules
git restore --staged .gitmodules
git ls-files --stage | grep 160000
```

### Setup Gitsubmodule

* Note: The path argument must match the output of `git ls-files --stage | grep 160000`, and it should include the repository name at the end

```bash
git config --local --add checkout.defaultRemote origin
git config status.submodulesummary 1
git submodule add -b nunya --name relayer -- git@github.com:ltfschoen/SecretPath.git packages/relayer/SecretPath
git submodule status
git ls-files --stage | grep 160000
```