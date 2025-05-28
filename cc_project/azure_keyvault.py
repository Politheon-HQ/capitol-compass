import os
from azure.identity import ManagedIdentityCredential, ClientSecretCredential
from azure.keyvault.secrets import SecretClient

# Fetch the vault URL from env 
KEY_VAULT_URL = os.getenv("KEY_VAULT_URL")
if not KEY_VAULT_URL:
    raise Exception("KEY_VAULT_URL is not set")

# Authenticate using Managed Identity, Environment Credentials, or Azure CLI
client_id = os.getenv("KEYVAULT_CLIENT_ID")
cred = ManagedIdentityCredential(client_id=client_id)

# Create a SecretClient
client = SecretClient(vault_url=KEY_VAULT_URL, credential=cred)

def get_secret(secret_name):
    return client.get_secret(secret_name).value 

