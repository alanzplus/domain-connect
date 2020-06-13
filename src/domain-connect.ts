import dns from 'dns';
const Resolver = dns.promises.Resolver;
import 'isomorphic-fetch';

type DnsProviderSettings = {
    providerId: string;
    providerName: string;
    providerDisplayName: string;
    urlSyncUX: string;
    urlAsyncUX: string;
    urlAPI: string;
    width: number;
    height: number;
    urlControlPanel: string;
    nameServers: string[];
};

type TemplateSupportResponse = {
    version: string;
};

type TemplateApplyProperties = {
    host?: string;
    redirect_uri: string;
    state?: string;
    providerName?: string;
    serviceName?: string;
    sig?: string;
    [templateVariables: string]: undefined | string;
};

async function discoverDnsProvider(domain: string): Promise<string | null> {
    const resolver = new Resolver();
    const queryDomain = `_domainconnect.${domain}`;
    try {
        return (await resolver.resolveTxt(queryDomain))?.[0]?.[0];
    } catch (e) {
        if (e?.errno === 'ENOTFOUND') {
            return null;
        }
        throw e;
    }
}

function getDnsProviderSettings(dnsProvider: string, domain: string): Promise<DnsProviderSettings> {
    return fetch(`https://${dnsProvider}/v2/${domain}/settings`).then((response) => {
        if (response.ok) {
            return response.json();
        }
        throw new Error(`status:${response.status}`);
    });
}

export default class DomainConnect {
    private readonly domain: string;
    private readonly dnsProviderSettings: Promise<DnsProviderSettings>;
    dnsProvider: Promise<string | null>;

    constructor(domain: string) {
        this.domain = domain;
        this.dnsProvider = discoverDnsProvider(domain);
        this.dnsProviderSettings = this.dnsProvider
            .then((provider) => {
                if (!provider) {
                    throw new Error('no dns provider');
                }
                return provider;
            })
            .then((provider) => getDnsProviderSettings(provider, domain));
    }

    async getDnsProviderSettings(): Promise<DnsProviderSettings> {
        return this.dnsProviderSettings;
    }

    async querySupportTemplate(serviceProviderId: string, serviceId: string): Promise<null | TemplateSupportResponse> {
        const settings = await this.dnsProviderSettings;
        return fetch(`${settings.urlAPI}/v2/domainTemplates/providers/${serviceProviderId}/services/${serviceId}`).then(
            (response) => {
                if (response.ok) {
                    return response.json();
                }
                return null;
            },
        );
    }

    async getApplyTemplateSyncUrl(
        serviceProviderId: string,
        serviceId: string,
        properties?: TemplateApplyProperties,
    ): Promise<string> {
        const settings = await this.dnsProviderSettings;
        const queryParams = new URLSearchParams({ ...properties, domain: this.domain } as Record<string, string>);
        return `${settings.urlSyncUX}/v2/domainTemplates/providers/${serviceProviderId}/services/${serviceId}/apply?${queryParams}`;
    }
}
