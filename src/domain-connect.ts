import dns from 'dns';
import axios, { AxiosError } from 'axios';
const Resolver = dns.promises.Resolver;
const resolver = new Resolver();

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

export class DomainConnect {
    private readonly domain: string;
    private readonly dnsProviderSettings: Promise<DnsProviderSettings>;

    constructor(domain: string) {
        this.domain = domain;
        this.dnsProviderSettings = this.discoverDnsProvider(domain).catch((reason) => {
            throw new Error(`Domain ${domain} is not supported by domain-connect, reason: ${reason}`);
        });
    }

    async getDnsProviderSettings(): Promise<DnsProviderSettings> {
        return this.dnsProviderSettings;
    }

    async discoverDnsProvider(domain: string): Promise<DnsProviderSettings> {
        const queryDomain = `_domainconnect.${domain}`;
        const records = await resolver.resolveTxt(queryDomain);
        const dnsProvider = records?.[0]?.[0];
        if (!dnsProvider) {
            throw new Error(`No TXT record found for ${queryDomain}`);
        }
        return (await axios.get<DnsProviderSettings>(`https://${dnsProvider}/v2/${domain}/settings`)).data;
    }

    async querySupportTemplate(serviceProviderId: string, serviceId: string): Promise<null | TemplateSupportResponse> {
        const settings = await this.dnsProviderSettings;
        return axios
            .get<TemplateSupportResponse>(
                `${settings.urlAPI}/v2/domainTemplates/providers/${serviceProviderId}/services/${serviceId}`,
            )
            .then((res) => res.data)
            .catch((reason: AxiosError) => {
                if (reason.response && reason.response.status === 404) {
                    return null;
                }
                throw reason;
            });
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
