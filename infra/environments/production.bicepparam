using '../main.bicep'
param environment = 'production'
param location = 'centralindia'
param staticLocation = 'eastasia'
param postgresAdminPassword = readEnvironmentVariable('POSTGRES_ADMIN_PASSWORD')
param postgresRuntimePassword = readEnvironmentVariable('POSTGRES_RUNTIME_PASSWORD')
param jwtSigningKey = readEnvironmentVariable('JWT_SIGNING_KEY')
