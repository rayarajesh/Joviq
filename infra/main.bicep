targetScope = 'resourceGroup'

@allowed(['dev', 'production'])
param environment string
param location string = resourceGroup().location
param staticLocation string = 'eastasia'
param namePrefix string = 'joviq'
param enableReleaseSlot bool = false
@allowed(['Free', 'Standard'])
param staticWebAppSku string = 'Free'
param frontendOrigin string = ''
param additionalFrontendOrigins array = []
param integrationSettings array = []
@secure()
param postgresAdminPassword string
@secure()
param postgresRuntimePassword string
@secure()
param jwtSigningKey string
@secure()
param seedAdminPassword string = ''
param seedAdminEmail string = ''
param alertEmail string = ''
param monthlyBudget int = 150
param budgetStartDate string = utcNow('yyyy-MM-01')
param budgetCurrencyDescription string = 'Budget uses the subscription billing currency, not necessarily INR.'

var production = environment == 'production'
var suffix = uniqueString(resourceGroup().id)
var baseName = '${namePrefix}-${environment}-${suffix}'
var storageName = take('${namePrefix}${environment}${suffix}', 24)
var vaultName = take('kv-${baseName}', 24)
var databaseName = 'joviq'
var databaseHost = '${baseName}.postgres.database.azure.com'
var tags = { application: 'joviq', environment: environment, managedBy: 'bicep' }
var origin = empty(frontendOrigin) ? 'https://${frontend.properties.defaultHostname}' : frontendOrigin
var origins = union([origin, 'https://${frontend.properties.defaultHostname}'], additionalFrontendOrigins)

resource runtimeIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: '${baseName}-runtime'
  location: location
  tags: tags
}

resource network 'Microsoft.Network/virtualNetworks@2024-05-01' = {
  name: '${baseName}-vnet'
  location: location
  tags: tags
  properties: {
    addressSpace: { addressPrefixes: ['10.20.0.0/16'] }
    subnets: [
      {
        name: 'app'
        properties: {
          addressPrefix: '10.20.1.0/24'
          delegations: [{ name: 'app', properties: { serviceName: 'Microsoft.Web/serverFarms' } }]
        }
      }
      {
        name: 'database'
        properties: {
          addressPrefix: '10.20.2.0/24'
          delegations: [{ name: 'postgres', properties: { serviceName: 'Microsoft.DBforPostgreSQL/flexibleServers' } }]
          serviceEndpoints: [{ service: 'Microsoft.Storage' }]
        }
      }
    ]
  }
}
resource privateDns 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: '${environment}.private.postgres.database.azure.com'
  location: 'global'
  tags: tags
}
resource dnsLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: privateDns
  name: 'app-network'
  location: 'global'
  properties: { registrationEnabled: false, virtualNetwork: { id: network.id } }
}
resource postgres 'Microsoft.DBforPostgreSQL/flexibleServers@2024-08-01' = {
  name: baseName
  location: location
  tags: tags
  sku: { name: 'Standard_B1ms', tier: 'Burstable' }
  properties: {
    administratorLogin: 'joviq_migrator'
    administratorLoginPassword: postgresAdminPassword
    version: '16'
    storage: { storageSizeGB: 32 }
    backup: { backupRetentionDays: production ? 14 : 7, geoRedundantBackup: 'Disabled' }
    highAvailability: { mode: 'Disabled' }
    network: {
      delegatedSubnetResourceId: '${network.id}/subnets/database'
      privateDnsZoneArmResourceId: privateDns.id
      publicNetworkAccess: 'Disabled'
    }
    authConfig: { passwordAuth: 'Enabled', activeDirectoryAuth: 'Disabled' }
  }
  dependsOn: [dnsLink]
}
resource database 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2024-08-01' = {
  parent: postgres
  name: databaseName
  properties: { charset: 'UTF8', collation: 'en_US.utf8' }
}
resource postgresExtensions 'Microsoft.DBforPostgreSQL/flexibleServers/configurations@2024-08-01' = {
  parent: postgres
  name: 'azure.extensions'
  properties: { value: 'PGCRYPTO', source: 'user-override' }
}
resource storage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageName
  location: location
  tags: tags
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
  properties: {
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
    allowBlobPublicAccess: false
    allowSharedKeyAccess: false
    publicNetworkAccess: 'Enabled'
  }
}
resource blobs 'Microsoft.Storage/storageAccounts/blobServices@2023-05-01' = {
  parent: storage
  name: 'default'
  properties: {
    isVersioningEnabled: true
    deleteRetentionPolicy: { enabled: true, days: production ? 14 : 7 }
    containerDeleteRetentionPolicy: { enabled: true, days: 14 }
    cors: {
      corsRules: [{
        allowedOrigins: origins
        allowedMethods: ['PUT', 'GET', 'HEAD', 'OPTIONS']
        allowedHeaders: ['content-type', 'x-ms-blob-type', 'x-ms-version', 'x-ms-client-request-id']
        exposedHeaders: ['ETag', 'Content-Length', 'Content-Type', 'Accept-Ranges', 'Content-Range']
        maxAgeInSeconds: 3600
      }]
    }
  }
}
resource containers 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = [for name in ['assets', 'system']: {
  parent: blobs
  name: name
  properties: { publicAccess: 'None' }
}]
resource vault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: vaultName
  location: location
  tags: tags
  properties: {
    tenantId: tenant().tenantId
    sku: { family: 'A', name: 'standard' }
    enableRbacAuthorization: true
    enableSoftDelete: true
    enablePurgeProtection: true
    softDeleteRetentionInDays: 90
    publicNetworkAccess: 'Enabled'
  }
}
resource protectionKey 'Microsoft.KeyVault/vaults/keys@2023-07-01' = {
  parent: vault
  name: 'data-protection'
  properties: { kty: 'RSA', keySize: 2048, keyOps: ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey'] }
}
var secretValues = [
  { name: 'database-runtime', value: 'Host=${databaseHost};Database=${databaseName};Username=joviq_app;Password=${postgresRuntimePassword};SSL Mode=VerifyFull' }
  { name: 'database-migration', value: 'Host=${databaseHost};Database=${databaseName};Username=joviq_migrator;Password=${postgresAdminPassword};SSL Mode=VerifyFull' }
  { name: 'jwt-signing-key', value: jwtSigningKey }
  { name: 'seed-admin-password', value: seedAdminPassword }
]
resource secrets 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = [for secret in secretValues: {
  parent: vault
  name: secret.name
  properties: { value: empty(secret.value) ? 'DISABLED' : secret.value }
}]
resource blobRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storage.id, runtimeIdentity.id, 'blob-contributor')
  scope: storage
  properties: {
    principalId: runtimeIdentity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'ba92f5b4-2d11-453d-a403-e96b0029c9fe')
  }
}
resource secretRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(vault.id, runtimeIdentity.id, 'secrets-user')
  scope: vault
  properties: {
    principalId: runtimeIdentity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6')
  }
}
resource cryptoRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(vault.id, runtimeIdentity.id, 'crypto-user')
  scope: vault
  properties: {
    principalId: runtimeIdentity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '12338af0-0e69-4776-bea7-57ae8d297424')
  }
}
resource logs 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: '${baseName}-logs'
  location: location
  tags: tags
  properties: { retentionInDays: 30, sku: { name: 'PerGB2018' }, workspaceCapping: { dailyQuotaGb: json('0.1') } }
}
resource insights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${baseName}-insights'
  location: location
  kind: 'web'
  tags: tags
  properties: { Application_Type: 'web', WorkspaceResourceId: logs.id }
}
resource frontend 'Microsoft.Web/staticSites@2023-12-01' = {
  name: '${baseName}-web'
  location: staticLocation
  tags: tags
  sku: { name: staticWebAppSku, tier: staticWebAppSku }
  properties: { provider: 'Custom', allowConfigFileUpdates: true }
}
resource plan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: '${baseName}-plan'
  location: location
  tags: tags
  kind: 'linux'
  sku: { name: enableReleaseSlot ? 'S1' : 'B1', tier: enableReleaseSlot ? 'Standard' : 'Basic', capacity: 1 }
  properties: { reserved: true }
}
var apiSettings = [
  { name: 'ASPNETCORE_ENVIRONMENT', value: 'Production' }
  { name: 'AZURE_CLIENT_ID', value: runtimeIdentity.properties.clientId }
  { name: 'Hosting__AzureAppService', value: 'true' }
  { name: 'Assets__Provider', value: 'AzureBlob' }
  { name: 'Assets__AzureBlob__ServiceUri', value: storage.properties.primaryEndpoints.blob }
  { name: 'Assets__AzureBlob__ContainerName', value: 'assets' }
  { name: 'Assets__AzureBlob__PublicBaseUrl', value: 'https://${baseName}-api.azurewebsites.net' }
  { name: 'DataProtection__BlobUri', value: '${storage.properties.primaryEndpoints.blob}system/data-protection.xml' }
  { name: 'DataProtection__KeyIdentifier', value: '${vault.properties.vaultUri}keys/data-protection' }
  { name: 'Jwt__SigningKey', value: '@Microsoft.KeyVault(SecretUri=${vault.properties.vaultUri}secrets/jwt-signing-key)' }
  { name: 'Jwt__Issuer', value: 'https://${baseName}-api.azurewebsites.net' }
  { name: 'ConnectionStrings__DefaultConnection', value: '@Microsoft.KeyVault(SecretUri=${vault.properties.vaultUri}secrets/database-runtime)' }
  { name: 'ConnectionStrings__MigrationConnection', value: '@Microsoft.KeyVault(SecretUri=${vault.properties.vaultUri}secrets/database-migration)' }
  { name: 'Cors__AllowedOrigins__0', value: origins[0] }
  { name: 'Cors__AllowedOrigins__1', value: origins[length(origins) > 1 ? 1 : 0] }
  { name: 'Cors__AllowedOrigins__2', value: origins[length(origins) > 2 ? 2 : 0] }
  { name: 'Cors__AllowedOrigins__3', value: origins[length(origins) > 3 ? 3 : 0] }
  { name: 'Cors__AllowedOrigins__4', value: origins[length(origins) > 4 ? 4 : 0] }
  { name: 'Cors__AllowedOrigins__5', value: origins[length(origins) > 5 ? 5 : 0] }
  { name: 'ExternalAuth__FrontendCallbackUrl', value: '${origin}/auth/google/callback' }
  { name: 'Payments__FrontendBaseUrl', value: origin }
  { name: 'Payments__PublicBaseUrl', value: 'https://${baseName}-api.azurewebsites.net' }
  { name: 'Payments__CashfreeEnvironment', value: production ? 'production' : 'sandbox' }
  { name: 'Database__SeedCatalog', value: 'true' }
  { name: 'Database__SeedDemoContent', value: production ? 'false' : 'true' }
  { name: 'SeedAdmin__Email', value: seedAdminEmail }
  { name: 'SeedAdmin__Password', value: empty(seedAdminEmail) ? '' : '@Microsoft.KeyVault(SecretUri=${vault.properties.vaultUri}secrets/seed-admin-password)' }
  { name: 'SeedAdmin__ResetPassword', value: 'false' }
  { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: insights.properties.ConnectionString }
  { name: 'SCM_DO_BUILD_DURING_DEPLOYMENT', value: 'false' }
  { name: 'WEBJOBS_STOPPED', value: '0' }
  { name: 'WEBSITE_SKIP_RUNNING_KUDUAGENT', value: 'false' }
]
resource api 'Microsoft.Web/sites@2023-12-01' = {
  name: '${baseName}-api'
  location: location
  tags: tags
  kind: 'app,linux'
  identity: { type: 'UserAssigned', userAssignedIdentities: { '${runtimeIdentity.id}': {} } }
  properties: {
    serverFarmId: plan.id
    httpsOnly: true
    keyVaultReferenceIdentity: runtimeIdentity.id
    virtualNetworkSubnetId: '${network.id}/subnets/app'
    // WebJobs is supported by ARM but absent from the published Bicep SiteConfig type.
    siteConfig: any({
      linuxFxVersion: 'DOTNETCORE|10.0'
      appCommandLine: 'dotnet Joviq.Lms.Api.dll'
      alwaysOn: true
      vnetRouteAllEnabled: true
      webJobsEnabled: true
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      healthCheckPath: '/health/ready'
      appSettings: concat(apiSettings, integrationSettings)
    })
  }
  dependsOn: [database, postgresExtensions, containers, secretRole, blobRole, cryptoRole, secrets, protectionKey]
}
resource releaseSlot 'Microsoft.Web/sites/slots@2023-12-01' = if (enableReleaseSlot) {
  parent: api
  name: 'release'
  location: location
  kind: 'app,linux'
  identity: { type: 'UserAssigned', userAssignedIdentities: { '${runtimeIdentity.id}': {} } }
  properties: {
    serverFarmId: plan.id
    httpsOnly: true
    keyVaultReferenceIdentity: runtimeIdentity.id
    virtualNetworkSubnetId: '${network.id}/subnets/app'
    siteConfig: any({
      linuxFxVersion: 'DOTNETCORE|10.0'
      appCommandLine: 'dotnet Joviq.Lms.Api.dll'
      alwaysOn: true
      vnetRouteAllEnabled: true
      webJobsEnabled: true
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      healthCheckPath: '/health/ready'
      appSettings: concat(apiSettings, integrationSettings)
    })
  }
}
resource alerts 'Microsoft.Insights/actionGroups@2023-01-01' = if (!empty(alertEmail)) {
  name: '${baseName}-alerts'
  location: 'global'
  tags: tags
  properties: {
    groupShortName: 'joviq-alerts'
    enabled: true
    emailReceivers: [{ name: 'owner', emailAddress: alertEmail, useCommonAlertSchema: true }]
  }
}
resource apiErrors 'Microsoft.Insights/metricAlerts@2018-03-01' = if (!empty(alertEmail)) {
  name: '${baseName}-api-errors'
  location: 'global'
  tags: tags
  properties: {
    description: 'API has at least five server errors in five minutes.'
    severity: 2
    enabled: true
    scopes: [api.id]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [{ name: 'server-errors', metricNamespace: 'Microsoft.Web/sites', metricName: 'Http5xx', operator: 'GreaterThanOrEqual', threshold: 5, timeAggregation: 'Total', criterionType: 'StaticThresholdCriterion' }]
    }
    actions: [{ actionGroupId: alerts!.id }]
  }
}
resource apiHealth 'Microsoft.Insights/metricAlerts@2018-03-01' = if (!empty(alertEmail)) {
  name: '${baseName}-api-health'
  location: 'global'
  tags: tags
  properties: {
    description: 'App Service health checks report the API unhealthy.'
    severity: 1
    enabled: true
    scopes: [api.id]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [{ name: 'health', metricNamespace: 'Microsoft.Web/sites', metricName: 'HealthCheckStatus', operator: 'LessThanOrEqual', threshold: 0, timeAggregation: 'Average', criterionType: 'StaticThresholdCriterion' }]
    }
    actions: [{ actionGroupId: alerts!.id }]
  }
}
resource budget 'Microsoft.Consumption/budgets@2023-11-01' = {
  name: '${namePrefix}-${environment}-monthly'
  properties: {
    category: 'Cost'
    amount: monthlyBudget
    timeGrain: 'Monthly'
    timePeriod: { startDate: budgetStartDate, endDate: '2035-01-01' }
    notifications: empty(alertEmail) ? {} : {
      Actual80: { enabled: true, operator: 'GreaterThanOrEqualTo', threshold: 80, contactEmails: [alertEmail], thresholdType: 'Actual' }
      Actual100: { enabled: true, operator: 'GreaterThanOrEqualTo', threshold: 100, contactEmails: [alertEmail], thresholdType: 'Actual' }
    }
  }
}
output apiName string = api.name
output apiUrl string = 'https://${api.properties.defaultHostName}'
output frontendName string = frontend.name
output frontendUrl string = 'https://${frontend.properties.defaultHostname}'
output vaultName string = vault.name
output storageAccountName string = storage.name
output postgresName string = postgres.name
output runtimeIdentityId string = runtimeIdentity.id
output budgetNote string = budgetCurrencyDescription
output useReleaseSlot bool = enableReleaseSlot
