# Mollie Payment plugin for Evershop

Mollie payment extension for Evershop. Mollie extension is already build in for 

## Installation

1. Add config file with extension

Example ./config/production.json
```json
{
    "shop": {
        "homeUrl": "https://dev.evercamps.io"
    },
    "system": {
        "extensions": [
            {
                "name": "mollie",
                "resolve": "@evercamps/evercamps_mollie",
                "enabled": true,
                "priority": 10
            }
        ]
    }
}
```

- *homeUrl*: Important for mollie to redirect you back to your own website
- *system.extensions*: Add mollie payment provider from npm package.



