# domain-connect

## Local Installation 

### Install Dependencies

```bash
npm install
```

### Publish as Local Package

```bash
npm run build
npm link
```

### Test

```bash
DOMAIN="$testDomain" \
NODE_PATH="$yourLocalPublishPath" \
node -e 'const DomainConnect = require("domain-connect").default; new DomainConnect(process.env.DOMAIN).getDnsProviderSettings().then(d => console.log(d));'
```

## Support
Only *synchronous flow* is supported for now.

## Protocol Specification
* [DNS Provider Discover](https://github.com/Domain-Connect/spec/blob/master/Domain%20Connect%20Spec%20Draft.adoc#3-dns-provider-discovery)
* [Synchronous Flow](https://github.com/Domain-Connect/spec/blob/master/Domain%20Connect%20Spec%20Draft.adoc#42-synchronous-flow)


