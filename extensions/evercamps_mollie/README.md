# Mollie Payment plugin for Evershop

Mollie payment extension for Evershop. Extension works for Evershop. Tested with version 2.0.1.

## Installation

### Step 1: Install the extension package

```javascript
npm install @evercamps/evershop-mollie
```

### Register the extension by adding it to the config file
As the extension needs to know your domain name, also add the homeUrl to the config file.

```javascript
{
    ...,
    "shop": {
        "homeUrl": "https://yourdomain"
    },
    ...,
    "system": {
        "extensions": [
            ...,
            {
                "name": "mollie",
                "resolve": "@evercamps/evershop-mollie",
                "enabled": true,
                "priority": 10
            }
        ]
    }
}
```